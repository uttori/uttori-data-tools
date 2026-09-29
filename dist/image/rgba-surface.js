import { BitmapText, drawBitmapText } from "./bitmap-text.js";
/** The default maximum number of pixels for a surface. Size is 4MB. */
export const DEFAULT_MAX_PIXELS = 4 * 1024 * 1024;
/** Validate and normalize an RGBA color. */
export function colorRGBA(color) {
    if ((!Array.isArray(color) && !(color instanceof Uint8Array)) || color.length !== 4) {
        throw new TypeError("Color must have four RGBA8 components.");
    }
    for (const component of color) {
        if (!Number.isSafeInteger(component) || component < 0 || component > 255) {
            throw new RangeError(`RGBA component must be an integer in [0, 255].`);
        }
    }
    return color;
}
/** Validate an RGBA image. */
export function validateRGBA(image, maxPixels = DEFAULT_MAX_PIXELS) {
    // dimensions(image.width, image.height, maxPixels);
    if (!Number.isSafeInteger(image.width) || image.width < 1 || image.width > 0x7fffffff) {
        throw new RangeError(`width must be an integer in [1, 0x7fffffff].`);
    }
    if (!Number.isSafeInteger(image.height) || image.height < 1 || image.height > 0x7fffffff) {
        throw new RangeError(`height must be an integer in [1, 0x7fffffff].`);
    }
    if (!Number.isSafeInteger(maxPixels) || maxPixels < 1 || maxPixels > Number.MAX_SAFE_INTEGER) {
        throw new RangeError(`maxPixels must be an integer in [1, ${Number.MAX_SAFE_INTEGER}].`);
    }
    if (!Number.isSafeInteger(image.width * image.height) || image.width * image.height > maxPixels) {
        throw new RangeError(`Image dimensions ${image.width}x${image.height} exceed the pixel limit ${maxPixels}.`);
    }
    if (!(image.rgba instanceof Uint8Array) || image.rgba.length !== image.width * image.height * 4) {
        throw new TypeError(`RGBA must be an exact ${image.width}x${image.height}x4 Uint8Array.`);
    }
}
function littleEndian() {
    return new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 4;
}
/** Pure so the unused probe is not a bundler side effect. */
const LITTLE_ENDIAN = /* @__PURE__ */ littleEndian();
const wordView = (bytes) => bytes.byteOffset % 4 === 0
    ? new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4)
    : undefined;
function blend(destination, offset, r, g, b, a) {
    if (a === 0) {
        return;
    }
    if (a === 255) {
        destination[offset] = r;
        destination[offset + 1] = g;
        destination[offset + 2] = b;
        destination[offset + 3] = a;
        return;
    }
    const da = destination[offset + 3], inverse = 255 - a;
    const denominator = a * 255 + da * inverse;
    destination[offset] = Math.round((r * a * 255 + destination[offset] * da * inverse) / denominator);
    destination[offset + 1] = Math.round((g * a * 255 + destination[offset + 1] * da * inverse) / denominator);
    destination[offset + 2] = Math.round((b * a * 255 + destination[offset + 2] * da * inverse) / denominator);
    destination[offset + 3] = Math.round(denominator / 255);
}
/**
 * Mutable straight RGBA8 pixels. Geometry and buffer identity are immutable.
 * Fill/blit/line/text mutate and return this. Crop/flip/scale return owned new surfaces.
 * This module does not import PNG, Pako, Canvas, DOM, Node, or a font runtime.
 */
export class RgbaSurface {
    kind;
    width;
    height;
    rgba;
    maxPixels;
    constructor(width, height, rgba, options = {}) {
        const maxPixels = options.maxPixels ?? DEFAULT_MAX_PIXELS;
        if (!Number.isSafeInteger(width) || width < 1 || width > 0x7fffffff) {
            throw new RangeError("Width must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(height) || height < 1 || height > 0x7fffffff) {
            throw new RangeError("Height must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(maxPixels) || maxPixels < 1 || maxPixels > Number.MAX_SAFE_INTEGER) {
            throw new RangeError(`Pixel limit must be an integer in [1, ${Number.MAX_SAFE_INTEGER}].`);
        }
        if (!Number.isSafeInteger(width * height) || width * height > maxPixels) {
            throw new RangeError(`Image dimensions ${width}×${height} exceed the pixel limit ${maxPixels}.`);
        }
        if (rgba !== undefined) {
            validateRGBA({ width, height, rgba }, maxPixels);
        }
        let bytes;
        if (rgba === undefined) {
            bytes = new Uint8Array(width * height * 4);
        }
        else if (options.copy === false) {
            bytes = rgba;
        }
        else {
            bytes = Uint8Array.from(rgba);
        }
        this.kind = "rgba-image";
        this.width = width;
        this.height = height;
        this.rgba = bytes;
        this.maxPixels = maxPixels;
        // readonly is erased by TypeScript. Preserve the original runtime guarantee
        // that geometry and buffer identity cannot change, while pixels remain mutable.
        Object.defineProperties(this, {
            kind: { writable: false, configurable: false },
            width: { writable: false, configurable: false },
            height: { writable: false, configurable: false },
            rgba: { writable: false, configurable: false },
            maxPixels: { writable: false, configurable: false },
        });
    }
    static from(image, options) {
        return new RgbaSurface(image.width, image.height, image.rgba, options);
    }
    static fromIndexed(image, options) {
        const maxPixels = options?.maxPixels ?? DEFAULT_MAX_PIXELS;
        if (!Number.isSafeInteger(image.width) || image.width < 1 || image.width > 0x7fffffff) {
            throw new RangeError("Width must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(image.height) || image.height < 1 || image.height > 0x7fffffff) {
            throw new RangeError("Height must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(maxPixels) || maxPixels < 1 || maxPixels > Number.MAX_SAFE_INTEGER) {
            throw new RangeError(`Pixel limit must be an integer in [1, ${Number.MAX_SAFE_INTEGER}].`);
        }
        if (!Number.isSafeInteger(image.width * image.height) ||
            image.width * image.height > maxPixels) {
            throw new RangeError(`Image dimensions ${image.width}x${image.height} exceed the pixel limit ${maxPixels}.`);
        }
        if (!(image.indexes instanceof Uint8Array) ||
            image.indexes.length !== image.width * image.height) {
            throw new Error("Indexed buffer does not match dimensions.");
        }
        if (!Array.isArray(image.palette)) {
            throw new TypeError("Palette must be an array.");
        }
        if (image.palette.length < 1 || image.palette.length > 256) {
            throw new RangeError("Palette slots must be between 1 and 256.");
        }
        for (const color of image.palette) {
            colorRGBA(color);
        }
        const result = new RgbaSurface(image.width, image.height, undefined, options);
        for (let i = 0, offset = 0; i < image.indexes.length; i++, offset += 4) {
            const color = image.palette[image.indexes[i]];
            if (!color) {
                throw new Error(`Missing palette slot ${image.indexes[i]}.`);
            }
            result.rgba[offset] = color[0];
            result.rgba[offset + 1] = color[1];
            result.rgba[offset + 2] = color[2];
            result.rgba[offset + 3] = color[3];
        }
        return result;
    }
    clone() {
        return new RgbaSurface(this.width, this.height, this.rgba, { maxPixels: this.maxPixels });
    }
    /** Copy-mode fill, including RGB under alpha zero. Rectangles are clipped, not resized. */
    fill(color, rect = {}) {
        colorRGBA(color);
        const x = rect.x ?? 0;
        if (!Number.isSafeInteger(x) || x < -0x7fffffff || x > 0x7fffffff) {
            throw new RangeError("Fill x must be an integer in [-2147483647, 2147483647].");
        }
        const y = rect.y ?? 0;
        if (!Number.isSafeInteger(y) || y < -0x7fffffff || y > 0x7fffffff) {
            throw new RangeError("Fill y must be an integer in [-2147483647, 2147483647].");
        }
        const width = rect.width ?? this.width;
        if (!Number.isSafeInteger(width) || width < 0 || width > 0x7fffffff) {
            throw new RangeError("Fill width must be an integer in [0, 2147483647].");
        }
        const height = rect.height ?? this.height;
        if (!Number.isSafeInteger(height) || height < 0 || height > 0x7fffffff) {
            throw new RangeError("Fill height must be an integer in [0, 2147483647].");
        }
        const left = Math.max(0, x);
        const top = Math.max(0, y);
        const right = Math.min(this.width, x + width);
        const bottom = Math.min(this.height, y + height);
        if (left >= right || top >= bottom) {
            return this;
        }
        const words = wordView(this.rgba);
        if (words) {
            const value = LITTLE_ENDIAN
                ? color[0] | (color[1] << 8) | (color[2] << 16) | (color[3] << 24)
                : color[3] | (color[2] << 8) | (color[1] << 16) | (color[0] << 24);
            for (let row = top; row < bottom; row++) {
                words.fill(value, row * this.width + left, row * this.width + right);
            }
        }
        else {
            for (let row = top; row < bottom; row++) {
                for (let offset = (row * this.width + left) * 4, end = (row * this.width + right) * 4; offset < end; offset += 4) {
                    this.rgba[offset] = color[0];
                    this.rgba[offset + 1] = color[1];
                    this.rgba[offset + 2] = color[2];
                    this.rgba[offset + 3] = color[3];
                }
            }
        }
        return this;
    }
    /** Clip against source and destination. Snapshot aliased buffers before the first write. */
    blit(source, x, y, options = {}) {
        validateRGBA(source, this.maxPixels);
        if (!Number.isSafeInteger(x) || x < -0x7fffffff || x > 0x7fffffff) {
            throw new RangeError("Blit x must be an integer in [-2147483647, 2147483647].");
        }
        if (!Number.isSafeInteger(y) || y < -0x7fffffff || y > 0x7fffffff) {
            throw new RangeError("Blit y must be an integer in [-2147483647, 2147483647].");
        }
        const sx = options.sx ?? 0;
        if (!Number.isSafeInteger(sx) || sx < -0x7fffffff || sx > 0x7fffffff) {
            throw new RangeError("Source x must be an integer in [-2147483647, 2147483647].");
        }
        const sy = options.sy ?? 0;
        if (!Number.isSafeInteger(sy) || sy < -0x7fffffff || sy > 0x7fffffff) {
            throw new RangeError("Source y must be an integer in [-2147483647, 2147483647].");
        }
        const width = options.width ?? source.width;
        if (!Number.isSafeInteger(width) || width < 0 || width > 0x7fffffff) {
            throw new RangeError("Blit width must be an integer in [0, 2147483647].");
        }
        const height = options.height ?? source.height;
        if (!Number.isSafeInteger(height) || height < 0 || height > 0x7fffffff) {
            throw new RangeError("Blit height must be an integer in [0, 2147483647].");
        }
        const mode = options.mode ?? "copy";
        if (!["copy", "source-over"].includes(mode)) {
            throw new Error("Blit mode must be copy or source-over.");
        }
        const left = Math.max(0, -sx, -x);
        const top = Math.max(0, -sy, -y);
        const right = Math.min(width, source.width - sx, this.width - x);
        const bottom = Math.min(height, source.height - sy, this.height - y);
        if (left >= right || top >= bottom) {
            return this;
        }
        const rowLength = (right - left) * 4;
        const rows = bottom - top;
        let bytes = source.rgba;
        let stride = source.width * 4;
        let start = ((sy + top) * source.width + sx + left) * 4;
        if (bytes.buffer === this.rgba.buffer) {
            const snapshot = new Uint8Array(rows * rowLength);
            for (let row = 0; row < rows; row++) {
                snapshot.set(bytes.subarray(start + row * stride, start + row * stride + rowLength), row * rowLength);
            }
            bytes = snapshot;
            stride = rowLength;
            start = 0;
        }
        for (let row = 0; row < rows; row++) {
            let destination = ((y + top + row) * this.width + x + left) * 4;
            const input = start + row * stride;
            if (mode === "copy") {
                this.rgba.set(bytes.subarray(input, input + rowLength), destination);
            }
            else {
                for (let i = input; i < input + rowLength; i += 4, destination += 4) {
                    blend(this.rgba, destination, bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
                }
            }
        }
        return this;
    }
    /** Strict in-bounds crop; invalid or zero dimensions are errors rather than implicit padding. */
    crop(x, y, width, height) {
        if (!Number.isSafeInteger(x) || x < 0 || x > 0x7fffffff) {
            throw new RangeError("Crop x must be an integer in [0, 2147483647].");
        }
        if (!Number.isSafeInteger(y) || y < 0 || y > 0x7fffffff) {
            throw new RangeError("Crop y must be an integer in [0, 2147483647].");
        }
        if (!Number.isSafeInteger(width) || width < 1 || width > 0x7fffffff) {
            throw new RangeError("Width must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(height) || height < 1 || height > 0x7fffffff) {
            throw new RangeError("Height must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(this.maxPixels) ||
            this.maxPixels < 1 ||
            this.maxPixels > Number.MAX_SAFE_INTEGER) {
            throw new RangeError(`Pixel limit must be an integer in [1, ${Number.MAX_SAFE_INTEGER}].`);
        }
        if (!Number.isSafeInteger(width * height) || width * height > this.maxPixels) {
            throw new RangeError(`Image dimensions ${width}×${height} exceed the pixel limit ${this.maxPixels}.`);
        }
        if (x + width > this.width || y + height > this.height) {
            throw new RangeError("Crop rectangle exceeds surface bounds.");
        }
        return new RgbaSurface(width, height, undefined, { maxPixels: this.maxPixels }).blit(this, 0, 0, { sx: x, sy: y, width, height });
    }
    /** Flip the surface horizontally or vertically. */
    flip({ horizontal = false, vertical = false } = {}) {
        if (typeof horizontal !== "boolean" || typeof vertical !== "boolean") {
            throw new TypeError("Flip flags must be booleans.");
        }
        const result = new RgbaSurface(this.width, this.height, undefined, {
            maxPixels: this.maxPixels,
        });
        const inputWords = wordView(this.rgba), outputWords = wordView(result.rgba);
        for (let y = 0; y < this.height; y++) {
            const sy = vertical ? this.height - y - 1 : y;
            if (!horizontal) {
                result.rgba.set(this.rgba.subarray(sy * this.width * 4, (sy + 1) * this.width * 4), y * this.width * 4);
            }
            else {
                for (let x = 0; x < this.width; x++) {
                    const input = sy * this.width + this.width - x - 1, output = y * this.width + x;
                    if (inputWords && outputWords) {
                        outputWords[output] = inputWords[input];
                    }
                    else {
                        for (let c = 0; c < 4; c++) {
                            result.rgba[output * 4 + c] = this.rgba[input * 4 + c];
                        }
                    }
                }
            }
        }
        return result;
    }
    /** Flip the surface horizontally. */
    flipX() {
        return this.flip({ horizontal: true });
    }
    /** Flip the surface vertically. */
    flipY() {
        return this.flip({ vertical: true });
    }
    /** Nearest neighbor with floor(x * sourceWidth / width), independently on each axis. */
    scaleNearest(width, height) {
        return this._resample(width, height);
    }
    /** Aspect fit with the original preview.ts shared-scale sampling convention. */
    fitNearest(maxEdge, { upscale = false } = {}) {
        if (!Number.isSafeInteger(maxEdge) || maxEdge < 1 || maxEdge > 0x7fffffff) {
            throw new RangeError("Maximum edge must be an integer in [1, 2147483647].");
        }
        if (typeof upscale !== "boolean") {
            throw new TypeError("upscale must be a boolean.");
        }
        const scale = Math.min(upscale ? Infinity : 1, maxEdge / Math.max(this.width, this.height));
        return this._resample(Math.max(1, Math.floor(this.width * scale)), Math.max(1, Math.floor(this.height * scale)), scale);
    }
    _resample(width, height, scale) {
        if (!Number.isSafeInteger(width) || width < 1 || width > 0x7fffffff) {
            throw new RangeError("Width must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(height) || height < 1 || height > 0x7fffffff) {
            throw new RangeError("Height must be an integer in [1, 2147483647].");
        }
        if (!Number.isSafeInteger(this.maxPixels) ||
            this.maxPixels < 1 ||
            this.maxPixels > Number.MAX_SAFE_INTEGER) {
            throw new RangeError(`Pixel limit must be an integer in [1, ${Number.MAX_SAFE_INTEGER}].`);
        }
        if (!Number.isSafeInteger(width * height) || width * height > this.maxPixels) {
            throw new RangeError(`Image dimensions ${width}×${height} exceed the pixel limit ${this.maxPixels}.`);
        }
        const result = new RgbaSurface(width, height, undefined, { maxPixels: this.maxPixels });
        const offsets = new Uint32Array(width), inputWords = wordView(this.rgba), outputWords = wordView(result.rgba);
        for (let x = 0; x < width; x++) {
            offsets[x] = Math.min(this.width - 1, Math.floor(scale === undefined ? (x * this.width) / width : x / scale));
        }
        for (let y = 0; y < height; y++) {
            const sy = Math.min(this.height - 1, Math.floor(scale === undefined ? (y * this.height) / height : y / scale));
            const sourceRow = sy * this.width, destinationRow = y * width;
            if (inputWords && outputWords) {
                for (let x = 0; x < width; x++) {
                    outputWords[destinationRow + x] = inputWords[sourceRow + offsets[x]];
                }
            }
            else {
                for (let x = 0; x < width; x++) {
                    const input = (sourceRow + offsets[x]) * 4, output = (destinationRow + x) * 4;
                    result.rgba[output] = this.rgba[input];
                    result.rgba[output + 1] = this.rgba[input + 1];
                    result.rgba[output + 2] = this.rgba[input + 2];
                    result.rgba[output + 3] = this.rgba[input + 3];
                }
            }
        }
        return result;
    }
    /** Inclusive 1px Bresenham line. Clip the segment first to bound work by visible dimensions. */
    line(x0, y0, x1, y1, color) {
        if (!Number.isSafeInteger(x0) || x0 < -0x7fffffff || x0 > 0x7fffffff) {
            throw new RangeError("Line x0 must be an integer in [-2147483647, 2147483647].");
        }
        if (!Number.isSafeInteger(y0) || y0 < -0x7fffffff || y0 > 0x7fffffff) {
            throw new RangeError("Line y0 must be an integer in [-2147483647, 2147483647].");
        }
        if (!Number.isSafeInteger(x1) || x1 < -0x7fffffff || x1 > 0x7fffffff) {
            throw new RangeError("Line x1 must be an integer in [-2147483647, 2147483647].");
        }
        if (!Number.isSafeInteger(y1) || y1 < -0x7fffffff || y1 > 0x7fffffff) {
            throw new RangeError("Line y1 must be an integer in [-2147483647, 2147483647].");
        }
        colorRGBA(color);
        const dx = x1 - x0;
        const dy = y1 - y0;
        let start = 0;
        let end = 1;
        for (const [p, q] of [
            [-dx, x0],
            [dx, this.width - 1 - x0],
            [-dy, y0],
            [dy, this.height - 1 - y0],
        ]) {
            if (p === 0) {
                if (q < 0) {
                    return this;
                }
                continue;
            }
            const ratio = q / p;
            if (p < 0) {
                start = Math.max(start, ratio);
            }
            else {
                end = Math.min(end, ratio);
            }
            if (start > end) {
                return this;
            }
        }
        x1 = Math.round(x0 + end * dx);
        y1 = Math.round(y0 + end * dy);
        x0 = Math.round(x0 + start * dx);
        y0 = Math.round(y0 + start * dy);
        if (x0 === x1) {
            return this.fill(color, {
                x: x0,
                y: Math.min(y0, y1),
                width: 1,
                height: Math.abs(y1 - y0) + 1,
            });
        }
        if (y0 === y1) {
            return this.fill(color, {
                x: Math.min(x0, x1),
                y: y0,
                width: Math.abs(x1 - x0) + 1,
                height: 1,
            });
        }
        const ax = Math.abs(x1 - x0), ay = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let error = ax + ay;
        while (true) {
            const offset = (y0 * this.width + x0) * 4;
            this.rgba[offset] = color[0];
            this.rgba[offset + 1] = color[1];
            this.rgba[offset + 2] = color[2];
            this.rgba[offset + 3] = color[3];
            if (x0 === x1 && y0 === y1) {
                break;
            }
            const doubled = error * 2;
            if (doubled >= ay) {
                error += ay;
                x0 += sx;
            }
            if (doubled <= ax) {
                error += ax;
                y0 += sy;
            }
        }
        return this;
    }
    measureText(text, options) {
        return BitmapText.measure(text, options);
    }
    drawText(text, x, y, color, options) {
        colorRGBA(color);
        drawBitmapText(this, text, x, y, color, options);
        return this;
    }
}
export default RgbaSurface;
//# sourceMappingURL=rgba-surface.js.map