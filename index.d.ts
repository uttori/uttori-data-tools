declare module "data-buffer" {
    export = DataBuffer;
    class DataBuffer {
        static allocate(size: number): DataBuffer;
        constructor(input: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | number | string | Uint8Array | Uint32Array);
        data: Buffer | Uint8Array;
        length: number;
        next: any;
        prev: any;
        compare(input: DataBuffer, offset?: number): boolean;
        copy(): DataBuffer;
        slice(position: number, length?: number): DataBuffer;
    }
}
declare module "data-buffer-list" {
    export = DataBufferList;
    class DataBufferList {
        first: any;
        last: DataBuffer;
        totalBuffers: number;
        availableBytes: number;
        availableBuffers: number;
        copy(): DataBufferList;
        append(buffer: DataBuffer): number;
        moreAvailable(): boolean;
        advance(): boolean;
        rewind(): boolean;
        reset(): void;
    }
    import DataBuffer = require("data-buffer");
}
declare module "data-stream" {
    export = DataStream;
    class DataStream {
        static fromData(data: string | Buffer): DataStream;
        static fromBuffer(buffer: DataBuffer): DataStream;
        constructor(list: DataBufferList, options?: {
            size: number;
        });
        size: number;
        buf: ArrayBuffer;
        uint8: Uint8Array;
        int8: Int8Array;
        uint16: Uint16Array;
        int16: Int16Array;
        uint32: Uint32Array;
        int32: Int32Array;
        float32: Float32Array;
        float64: Float64Array;
        int64: BigInt64Array;
        uint64: BigUint64Array;
        nativeEndian: boolean;
        list: DataBufferList;
        localOffset: number;
        offset: number;
        compare(input: DataStream, offset?: number): boolean;
        next(input: number[] | Buffer): boolean;
        copy(): DataStream;
        available(bytes: number): boolean;
        availableAt(bytes: number, offset: number): boolean;
        remainingBytes(): number;
        advance(bytes: number): DataStream;
        rewind(bytes: number): DataStream;
        seek(position: number): DataStream;
        readUInt8(): any;
        peekUInt8(offset?: number): any;
        read(bytes: number, littleEndian?: boolean): Uint8Array;
        peek(bytes: number, offset?: number, littleEndian?: boolean): any;
        peekBit(position: number, length?: number, offset?: number): number;
        readInt8(): any;
        peekInt8(offset?: number): any;
        readUInt16(littleEndian?: boolean): any;
        peekUInt16(offset?: number, littleEndian?: boolean): any;
        readInt16(littleEndian?: boolean): any;
        peekInt16(offset?: number, littleEndian?: boolean): any;
        readUInt24(littleEndian?: boolean): any;
        peekUInt24(offset?: number, littleEndian?: boolean): any;
        readInt24(littleEndian?: boolean): any;
        peekInt24(offset?: number, littleEndian?: boolean): any;
        readUInt32(littleEndian?: boolean): any;
        peekUInt32(offset?: number, littleEndian?: boolean): any;
        readInt32(littleEndian?: boolean): any;
        peekInt32(offset?: number, littleEndian?: boolean): any;
        readFloat32(littleEndian?: boolean): any;
        peekFloat32(offset?: number, littleEndian?: boolean): any;
        readFloat48(littleEndian?: boolean): number;
        peekFloat48(offset?: number, littleEndian?: boolean): number;
        readFloat64(littleEndian?: boolean): any;
        peekFloat64(offset?: number, littleEndian?: boolean): any;
        readFloat80(littleEndian?: boolean): any;
        peekFloat80(offset?: number, littleEndian?: boolean): any;
        readBuffer(length: number): DataBuffer;
        peekBuffer(offset: number, length: number): DataBuffer;
        readSingleBuffer(length: number): DataBuffer;
        peekSingleBuffer(offset: number, length: number): DataBuffer;
        readString(length: number, encoding?: string): string;
        peekString(offset: number, length: number, encoding?: string): string;
        float48(): number;
        float80(): number;
        reset(): void;
        private decodeString;
    }
    import DataBufferList = require("data-buffer-list");
    import DataBuffer = require("data-buffer");
}
declare module "data-bitstream" {
    export = DataBitstream;
    class DataBitstream {
        static fromData(data: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | number | string | Uint8Array | Uint32Array): DataBitstream;
        static fromBytes(bytes: number[]): DataBitstream;
        constructor(stream: DataStream);
        stream: DataStream;
        bitPosition: number;
        copy(): DataBitstream;
        offset(): number;
        available(bits: number): boolean;
        advance(bits: number): void;
        rewind(bits: number): void;
        seek(offset: number): void;
        align(): void;
        read(bits: number, signed?: boolean, advance?: boolean): number;
        peek(bits: number, signed?: boolean): number;
        readLSB(bits: number, signed?: boolean, advance?: boolean): number;
        peekLSB(bits: number, signed?: boolean): number;
    }
    import DataStream = require("data-stream");
    import DataBuffer = require("data-buffer");
}
declare module "data-compression-lzw" {
    export = LZW;
    class LZW {
        static buildDictionary(depth: number): object;
        static stringToHexArray(string: string): number[];
        static compress(input: number[], depth?: number): number[];
        static decompress(input: number[], depth?: number): number[];
    }
}
declare module "data-hash-crc32" {
    export = CRC32;
    class CRC32 {
        static of(data: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | number | string | Uint8Array | Uint32Array): string;
        crc: number;
        update(buffer: DataBuffer): void;
    }
    import DataBuffer = require("data-buffer");
}
declare module "index" {
    export const CRC32: typeof import("data-hash-crc32");
    export const DataBitstream: typeof import("data-bitstream");
    export const DataBuffer: typeof import("data-buffer");
    export const DataBufferList: typeof import("data-buffer-list");
    export const DataStream: typeof import("data-stream");
    export const LZW: typeof import("data-compression-lzw");
}
