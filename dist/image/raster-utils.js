export const DEFAULT_MAX_PIXELS = 4 * 1024 * 1024;
export function integer(value, name, min = 0, max = 0x7fffffff) {
    if (!Number.isSafeInteger(value) || value < min || value > max) {
        throw new RangeError(`${name} must be an integer in [${min}, ${max}].`);
    }
    return value;
}
export function dimensions(width, height, maxPixels = DEFAULT_MAX_PIXELS) {
    integer(width, "Width", 1);
    integer(height, "Height", 1);
    integer(maxPixels, "Pixel limit", 1, Number.MAX_SAFE_INTEGER);
    if (!Number.isSafeInteger(width * height) || width * height > maxPixels) {
        throw new RangeError(`Image dimensions ${width}×${height} exceed the pixel limit ${maxPixels}.`);
    }
}
export function colorRGBA(color) {
    if ((!Array.isArray(color) && !(color instanceof Uint8Array)) || color.length !== 4) {
        throw new TypeError("Color must have four RGBA8 components.");
    }
    for (const component of color) {
        integer(component, "RGBA component", 0, 255);
    }
    return color;
}
export function validateRGBA(image, maxPixels = DEFAULT_MAX_PIXELS) {
    dimensions(image.width, image.height, maxPixels);
    if (!(image.rgba instanceof Uint8Array) || image.rgba.length !== image.width * image.height * 4) {
        throw new TypeError("RGBA must be an exact width × height × 4 Uint8Array.");
    }
}
//# sourceMappingURL=raster-utils.js.map