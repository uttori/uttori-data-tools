/** Shared, browser-safe contracts. No Node or Canvas type dependency. */
export type RGBA = readonly [number, number, number, number];

export interface RgbaImage {
  readonly kind?: "rgba-image";
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
}

export interface IndexedPixels {
  readonly width: number;
  readonly height: number;
  readonly indexes: Uint8Array;
}
export interface IndexedInput extends IndexedPixels {
  readonly palette: readonly RGBA[];
}

export interface SurfaceOptions {
  readonly copy?: boolean;
  readonly maxPixels?: number;
}
export interface Rect {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}
export interface BlitOptions {
  readonly sx?: number;
  readonly sy?: number;
  readonly width?: number;
  readonly height?: number;
  readonly mode?: "copy" | "source-over";
}
export interface TextOptions {
  readonly scale?: number;
}
export interface TextMetrics {
  readonly width: number;
  readonly height: number;
  readonly advanceX: number;
  readonly advanceY: number;
  readonly lineHeight: number;
  readonly baseline: number;
  readonly lines: number;
}
