declare module '@uttori/data-tools';

declare module "underflow-error" {
    export = UnderflowError;
    class UnderflowError extends Error {
        constructor(message: string);
        stack: string;
    }
}
declare module "data-helpers" {
    export function float48(uint8: Uint8Array): number;
    export function float80(uint8: Uint8Array): number;
}
declare module "data-buffer" {
    export = DataBuffer;
    class DataBuffer {
        static allocate(size: number): DataBuffer;
        constructor(input?: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array | undefined);
        writing: boolean;
        data: any[] | Buffer | Uint8Array;
        next: DataBuffer | null;
        prev: DataBuffer | null;
        nativeEndian: boolean;
        offset: number;
        buffer: number[];
        get length(): number;
        compare(input: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array | undefined, offset?: number): boolean;
        copy(): DataBuffer;
        slice(position: number, length?: number): DataBuffer;
        remainingBytes(): number;
        available(bytes: number): boolean;
        availableAt(bytes: number, offset: number): boolean;
        advance(bytes: number): void;
        rewind(bytes: number): void;
        seek(position: number): void;
        readUInt8(): number;
        peekUInt8(offset?: number): number;
        read(bytes: number, littleEndian?: boolean): Uint8Array;
        peek(bytes: number, offset?: number, littleEndian?: boolean): Uint8Array;
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
        readString(length: number, encoding?: string): string;
        peekString(offset: number, length: number, encoding?: string): string;
        private decodeString;
        reset(): void;
        writeUInt8(data: number, offset?: number, advance?: boolean): void;
        writeUInt16(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void;
        writeUInt24(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void;
        writeUInt32(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void;
        writeBytes(data: number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array, offset?: number, advance?: boolean): void;
        writeString(string: string, offset?: number, encoding?: string, advance?: boolean): void;
        commit(): void;
    }
}
declare module "data-buffer-list" {
    export = DataBufferList;
    class DataBufferList {
        constructor(buffers?: DataBuffer[]);
        first: DataBuffer | null;
        last: DataBuffer | null;
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
            size?: number;
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
        private decodeString;
        reset(): void;
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
declare module "data-formating" {
    export type HexTableFormater = {
        offset: Function;
        value: Function;
        ascii: Function;
    };
    export type HexTableHeader = {
        offset: string;
        value: string[];
        ascii: string;
    };
    export type HexTableDimensions = {
        columns: number;
        grouping: number;
        maxRows: number;
    };
    export function formatBytes(input: number, decimals?: number, bytes?: number, sizes?: string[]): string;
    export function formatASCII(value: number, asciiFlags: object, _data: DataBuffer | DataStream): any[];
    export function hexTable(input: DataBuffer | DataStream, offset?: number, dimensions?: HexTableDimensions, header?: HexTableHeader, format?: HexTableFormater): string;
    export namespace hexTableDimensions {
        const columns: number;
        const grouping: number;
        const maxRows: number;
    }
    export namespace hexTableHeader {
        const offset: string;
        const value: string[];
        const ascii: string;
    }
    export namespace hexTableFormaters {
        export function offset_1(value: any): any;
        export { offset_1 as offset };
        export function value_1(value: any): any;
        export { value_1 as value };
        export { formatASCII as ascii };
    }
    import DataBuffer = require("data-buffer");
    import DataStream = require("data-stream");
}
declare module "data-hash-crc32" {
    function calculate(data: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array): string;
    import DataBuffer = require("data-buffer");
    export { calculate as of };
}
declare module "encodings/shift-jis" {
    export type UttoriCharacterEncoding = {
        shiftjs: number;
        unicode: number;
        string: string;
        ascii: string;
        name: string;
    };
    export const characterEncoding: {
        [x: number]: UttoriCharacterEncoding;
    };
    export function parse(data: DataBuffer): string;
    import DataBuffer = require("data-buffer");
}
declare module "index" {
    export const CRC32: {
        of: (data: string | number | any[] | Uint8Array | ArrayBuffer | Uint32Array | import("data-buffer") | Buffer | Int8Array | Int16Array | Int32Array | Uint16Array) => string;
    };
    export const DataBitstream: typeof import("data-bitstream");
    const DataBuffer_1: typeof import("data-buffer");
    export { DataBuffer_1 as DataBuffer };
    export const DataBufferList: typeof import("data-buffer-list");
    export const DataStream: typeof import("data-stream");
    export const formatBytes: (input: number, decimals?: number, bytes?: number, sizes?: string[]) => string;
    export const hexTable: (input: import("data-buffer") | import("data-stream"), offset?: number, dimensions?: import("data-formating").HexTableDimensions, header?: import("data-formating").HexTableHeader, format?: import("data-formating").HexTableFormater) => string;
    export const UnderflowError: typeof import("underflow-error");
    export const ShiftJIS: typeof import("encodings/shift-jis");
}
