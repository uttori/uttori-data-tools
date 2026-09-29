import { Inflate, deflate } from "pako";
import { computeBytes } from "../data-hash-crc32.js";
import { integer, dimensions } from "./raster-utils.js";
export { integer, dimensions } from "./raster-utils.js";
export const SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
export const PASSES = Object.freeze([
    [0, 0, 8, 8],
    [4, 0, 8, 8],
    [0, 4, 4, 8],
    [2, 0, 4, 4],
    [0, 2, 2, 4],
    [1, 0, 2, 2],
    [0, 1, 1, 2],
].map(Object.freeze));
export const DEFAULT_LIMITS = Object.freeze({
    maxInputBytes: 64 * 1024 * 1024,
    maxPixels: 4 * 1024 * 1024,
    maxInflatedBytes: 64 * 1024 * 1024,
    maxOutputBytes: 64 * 1024 * 1024,
    maxChunks: 16384,
});
const DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const SINGLE_PASS = [[0, 0, 1, 1]];
const ANIMATION = new Set(["acTL", "fcTL", "fdAT"]);
export function limits(options = {}) {
    const result = { ...DEFAULT_LIMITS };
    for (const key of Object.keys(result)) {
        if (options[key] !== undefined) {
            result[key] = integer(options[key], key, 1, Number.MAX_SAFE_INTEGER);
        }
    }
    return result;
}
export const passLength = (size, start, step) => size <= start ? 0 : Math.ceil((size - start) / step);
export const viewOf = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
export function checkSignature(bytes) {
    if (!(bytes instanceof Uint8Array) ||
        bytes.length < 8 ||
        !SIGNATURE.every((b, i) => bytes[i] === b)) {
        throw new Error("Missing or invalid PNG header.");
    }
}
export function readChunk(bytes, offset) {
    if (offset + 12 > bytes.length) {
        throw new Error("Truncated PNG chunk header.");
    }
    const view = viewOf(bytes);
    const length = view.getUint32(offset);
    if (length > 0x7fffffff || length > bytes.length - offset - 12) {
        throw new Error("Invalid PNG chunk length.");
    }
    const end = offset + length + 12;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) {
        throw new Error(`Invalid PNG chunk type '${type}'.`);
    }
    if (view.getUint32(end - 4) !== computeBytes(bytes.subarray(offset + 4, end - 4))) {
        throw new Error(`PNG ${type} CRC mismatch.`);
    }
    return {
        type,
        offset,
        end,
        length,
        data: bytes.subarray(offset + 8, end - 4),
        raw: bytes.subarray(offset, end),
        critical: (bytes[offset + 4] & 32) === 0,
        safeToCopy: (bytes[offset + 7] & 32) !== 0,
    };
}
export function readHeader(data, options = {}) {
    if (data.length !== 13) {
        throw new Error("PNG requires a 13-byte IHDR.");
    }
    const view = viewOf(data);
    const width = view.getUint32(0), height = view.getUint32(4);
    const bitDepth = data[8], colorType = data[9];
    dimensions(width, height, limits(options).maxPixels);
    if (!DEPTHS[colorType]?.includes(bitDepth)) {
        throw new Error(`Invalid PNG color type ${colorType} at ${bitDepth} bits.`);
    }
    if (bitDepth === 16 && options.allow16Bit === false) {
        throw new Error("16-bit PNG samples are disabled by caller policy.");
    }
    if (data[10] !== 0 || data[11] !== 0 || data[12] > 1) {
        throw new Error("Unsupported PNG compression, filter, or interlace method.");
    }
    return {
        width,
        height,
        bitDepth,
        colorType,
        colors: CHANNELS[colorType],
        alpha: colorType === 4 || colorType === 6,
        compressionMethod: 0,
        filterMethod: 0,
        interlaceMethod: data[12],
    };
}
export function readPhysical(data) {
    if (data.length !== 9 || data[8] > 1) {
        throw new Error("Invalid PNG pHYs chunk.");
    }
    const view = viewOf(data);
    return { width: view.getUint32(0), height: view.getUint32(4), unit: data[8] };
}
/** Container validation is performed once; chunk payloads are views of the owned/borrowed source. */
export function parsePNG(bytes, options = {}) {
    const bound = limits(options);
    checkSignature(bytes);
    if (bytes.length > bound.maxInputBytes) {
        throw new RangeError("PNG exceeds the input byte limit.");
    }
    if (options.animation !== undefined && !["reject", "default-image"].includes(options.animation)) {
        throw new Error("animation must be reject or default-image.");
    }
    let header, paletteSeen = false, trnsSeen = false, physSeen = false;
    let dataSeen = false, dataEnded = false, endSeen = false, animated = false;
    let palette = new Uint8Array(), transparency = new Uint8Array();
    let physical = { width: 0, height: 0, unit: 0 };
    const chunks = [], dataChunks = [];
    for (let offset = 8; offset < bytes.length;) {
        if (chunks.length >= bound.maxChunks) {
            throw new RangeError("PNG exceeds the chunk count limit.");
        }
        const chunk = readChunk(bytes, offset);
        const { type, length, data, end } = chunk;
        if (!header && type !== "IHDR") {
            throw new Error("PNG IHDR must be first.");
        }
        switch (type) {
            case "IHDR":
                if (header) {
                    throw new Error("PNG requires exactly one IHDR.");
                }
                header = readHeader(data, options);
                break;
            case "PLTE":
                if (paletteSeen ||
                    dataSeen ||
                    trnsSeen ||
                    [0, 4].includes(header.colorType) ||
                    !length ||
                    length % 3 ||
                    length > 768 ||
                    (header.colorType === 3 && length / 3 > 2 ** header.bitDepth)) {
                    throw new Error("Invalid PNG PLTE chunk.");
                }
                palette = data;
                paletteSeen = true;
                break;
            case "tRNS": {
                const type = header.colorType;
                if (trnsSeen ||
                    dataSeen ||
                    (type === 3 && (!paletteSeen || !length || length > palette.length / 3)) ||
                    (type === 0 && length !== 2) ||
                    (type === 2 && length !== 6) ||
                    ![0, 2, 3].includes(type)) {
                    throw new Error("Invalid PNG tRNS chunk.");
                }
                if (type !== 3) {
                    const view = viewOf(data), max = 2 ** header.bitDepth - 1;
                    for (let i = 0; i < length; i += 2) {
                        if (view.getUint16(i) > max) {
                            throw new Error("PNG tRNS sample exceeds bit depth.");
                        }
                    }
                }
                transparency = data;
                trnsSeen = true;
                break;
            }
            case "pHYs":
                if (physSeen || dataSeen) {
                    throw new Error("Invalid PNG pHYs placement.");
                }
                physical = readPhysical(data);
                physSeen = true;
                break;
            case "IDAT":
                if (dataEnded || (header.colorType === 3 && !paletteSeen)) {
                    throw new Error("PNG IDAT chunks must be contiguous and follow PLTE.");
                }
                dataSeen = true;
                dataChunks.push(data);
                break;
            case "IEND":
                if (!dataSeen || length || end !== bytes.length) {
                    throw new Error("Invalid PNG IEND chunk or trailing file bytes.");
                }
                endSeen = true;
                break;
            default:
                if (chunk.critical) {
                    throw new Error(`Unsupported critical PNG chunk '${type}'.`);
                }
                if (ANIMATION.has(type)) {
                    animated = true;
                    if (options.animation !== "default-image") {
                        throw new Error("Animated PNG is not supported; request animation: default-image explicitly.");
                    }
                }
        }
        chunks.push(chunk);
        if (dataSeen && type !== "IDAT") {
            dataEnded = true;
        }
        offset = end;
    }
    if (!header || !endSeen) {
        throw new Error("PNG is missing IHDR or IEND.");
    }
    const model = { ...header, palette, transparency, physical, chunks, dataChunks, animated };
    expectedBytes(model, bound);
    return model;
}
export function expectedBytes(image, bound = DEFAULT_LIMITS) {
    let expected = 0;
    for (const [sx, sy, dx, dy] of image.interlaceMethod ? PASSES : SINGLE_PASS) {
        const w = passLength(image.width, sx, dx), h = passLength(image.height, sy, dy);
        if (w && h) {
            expected += h * (1 + Math.ceil((w * image.colors * image.bitDepth) / 8));
        }
    }
    if (!Number.isSafeInteger(expected) || expected > bound.maxInflatedBytes) {
        throw new RangeError("PNG exceeds the inflated byte limit.");
    }
    return expected;
}
export function inflatePNG(image, options = {}) {
    const expected = expectedBytes(image, limits(options));
    const output = new Uint8Array(expected);
    const inflator = new Inflate({ windowBits: 15, chunkSize: 16 * 1024 });
    let written = 0;
    inflator.onData = (chunk) => {
        if (written + chunk.length > expected) {
            throw new Error("PNG inflated data exceeds declared dimensions.");
        }
        output.set(chunk, written);
        written += chunk.length;
    };
    // Feed IDAT views directly: no second, joined compressed buffer.
    // Do not force Z_FINISH: older Pako versions can finalize a truncated stream
    // without reporting an error. Require natural stream end (including Adler).
    for (let i = 0; i < image.dataChunks.length; i++) {
        const part = image.dataChunks[i];
        if (part.length === 0) {
            continue;
        } // Legal empty IDATs need not be pushed.
        if (inflator.ended) {
            if (part.length) {
                throw new Error("PNG has compressed data after the zlib stream.");
            }
            continue;
        }
        if (!inflator.push(part, false) || inflator.err) {
            throw new Error(`Invalid PNG image data: ${inflator.msg || "inflate failure"}.`);
        }
    }
    if (!inflator.ended || inflator.err || written !== expected) {
        throw new Error("Invalid PNG image data: incomplete zlib stream or scanline length mismatch.");
    }
    return output;
}
export function paeth(a, b, c) {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
}
/** Reconstruct an owned row in place. Previous-row storage is reset at each Adam7 pass. */
export function unfilterRow(row, previous, bpp, length, filter) {
    switch (filter) {
        case 0:
            break;
        case 1:
            for (let i = bpp; i < length; i++) {
                row[i] += row[i - bpp];
            }
            break;
        case 2:
            for (let i = 0; i < length; i++) {
                row[i] += previous[i];
            }
            break;
        case 3:
            for (let i = 0; i < length; i++) {
                row[i] += ((i < bpp ? 0 : row[i - bpp]) + previous[i]) >>> 1;
            }
            break;
        case 4:
            for (let i = 0; i < length; i++) {
                row[i] += paeth(i < bpp ? 0 : row[i - bpp], previous[i], i < bpp ? 0 : previous[i - bpp]);
            }
            break;
        default:
            throw new Error(`Invalid PNG scanline filter ${filter}.`);
    }
}
/** One element per sample; packed indexes stay indexes, and 16-bit precision is retained. */
export function decodeSamples(image, data, options = {}) {
    if (data.length !== expectedBytes(image, limits(options))) {
        throw new Error("PNG scanline length mismatch.");
    }
    const { width, height, colors, bitDepth } = image;
    const samples = bitDepth === 16
        ? new Uint16Array(width * height * colors)
        : new Uint8Array(width * height * colors);
    const bpp = Math.max(1, Math.ceil((colors * bitDepth) / 8));
    const maxRowBytes = Math.ceil((width * colors * bitDepth) / 8);
    let current = new Uint8Array(maxRowBytes), previous = new Uint8Array(maxRowBytes), cursor = 0;
    for (const [sx, sy, dx, dy] of image.interlaceMethod ? PASSES : SINGLE_PASS) {
        const w = passLength(width, sx, dx), h = passLength(height, sy, dy);
        if (!w || !h) {
            continue;
        }
        const rowBytes = Math.ceil((w * colors * bitDepth) / 8);
        previous.fill(0, 0, rowBytes);
        for (let y = 0; y < h; y++) {
            const filter = data[cursor++];
            current.set(data.subarray(cursor, cursor + rowBytes));
            cursor += rowBytes;
            unfilterRow(current, previous, bpp, rowBytes, filter);
            let destination = ((sy + y * dy) * width + sx) * colors;
            if (bitDepth === 8 && dx === 1) {
                samples.set(current.subarray(0, rowBytes), destination);
            }
            else if (bitDepth < 8) {
                const mask = (1 << bitDepth) - 1;
                for (let x = 0, bit = 0; x < w; x++, bit += bitDepth, destination += dx) {
                    samples[destination] = (current[bit >>> 3] >>> (8 - bitDepth - (bit & 7))) & mask;
                }
            }
            else {
                let source = 0;
                for (let x = 0; x < w; x++, destination += dx * colors) {
                    for (let c = 0; c < colors; c++) {
                        samples[destination + c] =
                            bitDepth === 16 ? (current[source++] << 8) | current[source++] : current[source++];
                    }
                }
            }
            const temporary = previous;
            previous = current;
            current = temporary;
        }
    }
    if (image.colorType === 3) {
        const count = image.palette.length / 3;
        for (let i = 0; i < samples.length; i++) {
            if (samples[i] >= count) {
                throw new Error(`PNG palette index ${samples[i]} is out of range.`);
            }
        }
    }
    return samples;
}
export function paletteRGBA(image) {
    const palette = [];
    for (let i = 0; i < image.palette.length / 3; i++) {
        palette.push([
            image.palette[i * 3],
            image.palette[i * 3 + 1],
            image.palette[i * 3 + 2],
            image.transparency[i] ?? 255,
        ]);
    }
    return palette;
}
export function transparencyKey(image) {
    if (![0, 2].includes(image.colorType) || !image.transparency.length) {
        return [];
    }
    const result = [], view = viewOf(image.transparency);
    for (let i = 0; i < image.transparency.length; i += 2) {
        result.push(view.getUint16(i));
    }
    return result;
}
/** Writes straight RGBA8 without premultiplication, color management, or loss of hidden RGB. */
export function writeRGBA(image, pixel, output, offset, key = transparencyKey(image)) {
    const { pixels, colorType, colors, bitDepth, palette, transparency } = image;
    const source = pixel * colors, max = 2 ** bitDepth - 1;
    const scale = bitDepth === 8 ? 1 : 255 / max;
    if (colorType === 3) {
        const index = pixels[source];
        output[offset] = palette[index * 3];
        output[offset + 1] = palette[index * 3 + 1];
        output[offset + 2] = palette[index * 3 + 2];
        output[offset + 3] = transparency[index] ?? 255;
    }
    else if (colorType === 0 || colorType === 4) {
        const gray = Math.round(pixels[source] * scale);
        output[offset] = gray;
        output[offset + 1] = gray;
        output[offset + 2] = gray;
        output[offset + 3] =
            colorType === 4
                ? Math.round(pixels[source + 1] * scale)
                : pixels[source] === key[0]
                    ? 0
                    : 255;
    }
    else {
        output[offset] = Math.round(pixels[source] * scale);
        output[offset + 1] = Math.round(pixels[source + 1] * scale);
        output[offset + 2] = Math.round(pixels[source + 2] * scale);
        output[offset + 3] =
            colorType === 6
                ? Math.round(pixels[source + 3] * scale)
                : pixels[source] === key[0] &&
                    pixels[source + 1] === key[1] &&
                    pixels[source + 2] === key[2]
                    ? 0
                    : 255;
    }
}
export function join(parts, maxBytes = DEFAULT_LIMITS.maxOutputBytes) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    if (!Number.isSafeInteger(length) || length > maxBytes) {
        throw new RangeError("PNG exceeds the output byte limit.");
    }
    const output = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
        output.set(part, offset);
        offset += part.length;
    }
    return output;
}
export function makeChunk(type, data) {
    if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) {
        throw new Error("Invalid PNG chunk type.");
    }
    integer(data.length, "Chunk length");
    const output = new Uint8Array(data.length + 12), view = viewOf(output);
    view.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) {
        output[i + 4] = type.charCodeAt(i);
    }
    output.set(data, 8);
    view.setUint32(data.length + 8, computeBytes(output.subarray(4, data.length + 8)));
    return output;
}
export function makeHeader(width, height, depth, type) {
    const header = new Uint8Array(13), view = viewOf(header);
    view.setUint32(0, width);
    view.setUint32(4, height);
    header[8] = depth;
    header[9] = type;
    return header;
}
export function validatePalette(palette, bitDepth = 8) {
    if (!Array.isArray(palette)) {
        throw new TypeError("Palette must be an array of RGBA8 slots.");
    }
    integer(palette.length, "Palette slots", 1, Math.min(256, 2 ** bitDepth));
    for (const color of palette) {
        if (!Array.isArray(color) || color.length !== 4) {
            throw new Error("Palette entries require RGBA8.");
        }
        for (const value of color) {
            integer(value, "Palette component", 0, 255);
        }
    }
}
export function validateIndexed(image, bitDepth = 8, options = {}) {
    dimensions(image.width, image.height, limits(options).maxPixels);
    if (![1, 2, 4, 8].includes(bitDepth)) {
        throw new Error("Indexed bit depth must be 1, 2, 4, or 8.");
    }
    validatePalette(image.palette, bitDepth);
    if (!(image.indexes instanceof Uint8Array) ||
        image.indexes.length !== image.width * image.height) {
        throw new Error("Indexed buffer length does not match dimensions.");
    }
    for (let i = 0; i < image.indexes.length; i++) {
        if (image.indexes[i] >= image.palette.length) {
            throw new Error("PNG pixel index exceeds palette slots.");
        }
    }
}
/** None is the deterministic low-CPU default; adaptive is explicitly opt-in. */
export function encodeRows(width, height, rowBytes, bpp, fillRow, options = {}) {
    const bound = limits(options), length = height * (rowBytes + 1);
    if (length > bound.maxInflatedBytes) {
        throw new RangeError("PNG exceeds the scanline byte limit.");
    }
    const filter = options.filter ?? "none", level = options.level ?? 6;
    if (!["none", "sub", "adaptive"].includes(filter)) {
        throw new Error("Filter must be none, sub, or adaptive.");
    }
    integer(level, "Compression level", 0, 9);
    const rows = new Uint8Array(length);
    if (filter === "none") {
        for (let y = 0; y < height; y++) {
            fillRow(rows.subarray(y * (rowBytes + 1) + 1, (y + 1) * (rowBytes + 1)), y);
        }
    }
    else {
        let raw = new Uint8Array(rowBytes), previous = new Uint8Array(rowBytes);
        const candidate = new Uint8Array(rowBytes);
        for (let y = 0; y < height; y++) {
            raw.fill(0);
            fillRow(raw, y);
            let bestScore = Infinity;
            const offset = y * (rowBytes + 1);
            for (let type = filter === "sub" ? 1 : 0; type <= (filter === "sub" ? 1 : 4); type++) {
                let score = 0;
                for (let i = 0; i < rowBytes; i++) {
                    const a = i >= bpp ? raw[i - bpp] : 0, b = previous[i], c = i >= bpp ? previous[i - bpp] : 0;
                    const predictor = type === 0
                        ? 0
                        : type === 1
                            ? a
                            : type === 2
                                ? b
                                : type === 3
                                    ? (a + b) >>> 1
                                    : paeth(a, b, c);
                    const byte = (raw[i] - predictor) & 255;
                    candidate[i] = byte;
                    score += byte < 128 ? byte : 256 - byte;
                }
                if (score < bestScore) {
                    bestScore = score;
                    rows[offset] = type;
                    rows.set(candidate, offset + 1);
                }
            }
            const temporary = previous;
            previous = raw;
            raw = temporary;
        }
    }
    return deflate(rows, { level });
}
export function indexedData(image, depth, options = {}) {
    const stride = Math.ceil((image.width * depth) / 8);
    return encodeRows(image.width, image.height, stride, 1, (row, y) => {
        if (depth === 8) {
            row.set(image.indexes.subarray(y * image.width, (y + 1) * image.width));
        }
        else {
            for (let x = 0, bit = 0; x < image.width; x++, bit += depth) {
                row[bit >>> 3] |= image.indexes[y * image.width + x] << (8 - depth - (bit & 7));
            }
        }
    }, options);
}
export function paletteChunks(palette) {
    const rgb = new Uint8Array(palette.length * 3), alpha = new Uint8Array(palette.length);
    for (let i = 0; i < palette.length; i++) {
        rgb[i * 3] = palette[i][0];
        rgb[i * 3 + 1] = palette[i][1];
        rgb[i * 3 + 2] = palette[i][2];
        alpha[i] = palette[i][3];
    }
    return [makeChunk("PLTE", rgb), makeChunk("tRNS", alpha)];
}
export function encodeIndexed(image, options = {}) {
    const depth = options.bitDepth ?? 8;
    validateIndexed(image, depth, options);
    return join([
        SIGNATURE,
        makeChunk("IHDR", makeHeader(image.width, image.height, depth, 3)),
        ...paletteChunks(image.palette),
        makeChunk("IDAT", indexedData(image, depth, options)),
        makeChunk("IEND", new Uint8Array()),
    ], limits(options).maxOutputBytes);
}
export function encodeRGBA(image, options = {}) {
    dimensions(image.width, image.height, limits(options).maxPixels);
    if (!(image.rgba instanceof Uint8Array) || image.rgba.length !== image.width * image.height * 4) {
        throw new Error("RGBA buffer length does not match dimensions.");
    }
    const stride = image.width * 4;
    const compressed = encodeRows(image.width, image.height, stride, 4, (row, y) => row.set(image.rgba.subarray(y * stride, (y + 1) * stride)), options);
    return join([
        SIGNATURE,
        makeChunk("IHDR", makeHeader(image.width, image.height, 8, 6)),
        makeChunk("IDAT", compressed),
        makeChunk("IEND", new Uint8Array()),
    ], limits(options).maxOutputBytes);
}
/** Source has already been parsed and decoded. A caller must not supply a mutated model. */
export function rewriteIndexedModel(source, image, edit = {}, options = {}) {
    if (image.colorType !== 3) {
        throw new Error("PNG editing requires indexed pixels.");
    }
    const originalPalette = paletteRGBA(image), palette = edit.palette ?? originalPalette;
    const width = edit.dimensions?.width ?? image.width, height = edit.dimensions?.height ?? image.height;
    const resized = width !== image.width || height !== image.height;
    if (resized && !edit.indexes) {
        throw new Error("Resizing requires replacement indexed pixels.");
    }
    if (palette.length !== originalPalette.length) {
        throw new Error("Palette edit must preserve slot count.");
    }
    const indexes = edit.indexes ?? image.pixels;
    const next = { width, height, palette, indexes };
    validateIndexed(next, image.bitDepth, options);
    // Optional application policy, after intrinsic validation and before any output.
    if (options.validateIndexed !== undefined) {
        if (typeof options.validateIndexed !== "function") {
            throw new TypeError("validateIndexed must be a function.");
        }
        options.validateIndexed({ width, height, indexes });
    }
    const retained = new Set(edit.preserveChunks ?? []);
    for (const name of retained) {
        if (typeof name !== "string" ||
            !/^[a-z][A-Za-z][A-Z][A-Za-z]$/.test(name) ||
            ANIMATION.has(name)) {
            throw new Error(`Invalid preserved ancillary chunk '${name}'.`);
        }
    }
    const pixelsChanged = resized || indexes.some((value, i) => value !== image.pixels[i]);
    const paletteChanged = palette.some((color, i) => color.some((value, c) => value !== originalPalette[i][c]));
    if (!pixelsChanged && !paletteChanged) {
        if (source.length > limits(options).maxOutputBytes) {
            throw new RangeError("PNG exceeds the output byte limit.");
        }
        return Uint8Array.from(source);
    }
    if (image.animated) {
        throw new Error("Cannot rewrite an animated PNG through the static indexed editor.");
    }
    const compressed = pixelsChanged ? indexedData(next, image.bitDepth, options) : undefined;
    const parts = [SIGNATURE];
    let wrotePixels = false;
    for (const chunk of image.chunks) {
        const { type } = chunk;
        if (type === "IHDR" && pixelsChanged) {
            parts.push(makeChunk(type, makeHeader(width, height, image.bitDepth, 3)));
        }
        else if (type === "PLTE" && paletteChanged) {
            parts.push(...paletteChunks(palette));
        }
        else if (type === "tRNS" && paletteChanged) {
            /* Replaced immediately after PLTE. */
        }
        else if (type === "IDAT" && pixelsChanged) {
            if (!wrotePixels) {
                parts.push(makeChunk(type, compressed));
            }
            wrotePixels = true;
        }
        else if (["IHDR", "PLTE", "tRNS", "IDAT", "IEND"].includes(type) ||
            chunk.safeToCopy ||
            retained.has(type)) {
            parts.push(chunk.raw);
        }
    }
    return join(parts, limits(options).maxOutputBytes);
}
//# sourceMappingURL=png-codec.js.map