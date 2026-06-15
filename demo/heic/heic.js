class UnderflowError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnderflowError';
    this.stack = new Error(message).stack;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const float48 = uint8 => {
  let mantissa = 0;
  let exponent = uint8[0];
  if (exponent === 0) {
    return 0;
  }
  exponent = uint8[0] - 0x81;
  for (let i = 1; i <= 4; i++) {
    mantissa += uint8[i];
    mantissa /= 256;
  }
  mantissa += uint8[5] & 0x7F;
  mantissa /= 128;
  mantissa += 1;
  if (uint8[5] & 0x80) {
    mantissa = -mantissa;
  }
  const output = mantissa * 2 ** exponent;
  return Number.parseFloat(output.toFixed(4));
};
const float80 = uint8 => {
  const uint32 = new Uint32Array(uint8.buffer, uint8.byteOffset, uint8.byteLength / 4);
  const [high, low] = [...uint32];
  const a0 = uint8[9];
  const a1 = uint8[8];
  const sign = 1 - (a0 >>> 7) * 2;
  let exponent = (a0 & 0x7F) << 8 | a1;
  if (exponent === 0 && low === 0 && high === 0) {
    return 0;
  }
  if (exponent === 0x7FFF) {
    if (low === 0 && high === 0) {
      return sign * Number.POSITIVE_INFINITY;
    }
    return Number.NaN;
  }
  exponent -= 0x3FFF;
  let out = low * 2 ** (exponent - 31);
  out += high * 2 ** (exponent - 63);
  return sign * out;
};

class Myers {
  x = [];
  y = [];
  vf = [];
  vb = [];
  v0 = 0;
  xidx = [];
  yidx = [];
  resultVectorX = [];
  resultVectorY = [];
  equal;
  smin = 0;
  smax = 0;
  tmin = 0;
  tmax = 0;
  constructor(xidx, yidx, x0, y0, equal) {
    this.xidx = xidx;
    this.yidx = yidx;
    this.equal = equal;
    this.resultVectorX = Array.from({
      length: x0.length + 1
    }, () => false);
    this.resultVectorY = Array.from({
      length: y0.length + 1
    }, () => false);
    let smin = 0;
    let tmin = 0;
    let smax = x0.length;
    let tmax = y0.length;
    while (smin < smax && tmin < tmax && equal(x0[smin], y0[tmin])) {
      smin++;
      tmin++;
    }
    while (smax > smin && tmax > tmin && equal(x0[smax - 1], y0[tmax - 1])) {
      smax--;
      tmax--;
    }
    this.smin = smin;
    this.smax = smax;
    this.tmin = tmin;
    this.tmax = tmax;
    const N = smax - smin;
    const M = tmax - tmin;
    const diagonals = N + M;
    const vlen = 2 * diagonals + 3;
    const buf = new Array(2 * vlen).fill(0);
    this.x = x0;
    this.y = y0;
    this.vf = buf.slice(0, vlen);
    this.vb = buf.slice(vlen);
    this.v0 = diagonals + 1;
  }
  compare(smin, smax, tmin, tmax) {
    if (smin === smax) {
      for (let t = tmin; t < tmax; t++) {
        this.resultVectorY[this.yidx[t]] = true;
      }
    } else if (tmin === tmax) {
      for (let s = smin; s < smax; s++) {
        this.resultVectorX[this.xidx[s]] = true;
      }
    } else {
      const {
        s0,
        s1,
        t0,
        t1
      } = this.split(smin, smax, tmin, tmax);
      this.compare(smin, s0, tmin, t0);
      this.compare(s1, smax, t1, tmax);
    }
  }
  split(smin, smax, tmin, tmax) {
    const N = smax - smin;
    const M = tmax - tmin;
    const x = this.x;
    const y = this.y;
    const vf = this.vf;
    const vb = this.vb;
    const v0 = this.v0;
    const kmin = smin - tmax;
    const kmax = smax - tmin;
    const fmid = smin - tmin;
    const bmid = smax - tmax;
    let fmin = fmid;
    let fmax = fmid;
    let bmin = bmid;
    let bmax = bmid;
    const odd = (N - M) % 2 !== 0;
    vf[v0 + fmid] = smin;
    vb[v0 + bmid] = smax;
    for (let d = 1;; d++) {
      if (fmin > kmin) {
        fmin--;
        vf[v0 + fmin - 1] = Number.MIN_SAFE_INTEGER;
      } else {
        fmin++;
      }
      if (fmax < kmax) {
        fmax++;
        vf[v0 + fmax + 1] = Number.MIN_SAFE_INTEGER;
      } else {
        fmax--;
      }
      for (let k = fmin; k <= fmax; k += 2) {
        const k0 = k + v0;
        let s;
        if (vf[k0 - 1] < vf[k0 + 1]) {
          s = vf[k0 + 1];
        } else {
          s = vf[k0 - 1] + 1;
        }
        let t = s - k;
        const s0 = s;
        const t0 = t;
        while (s < smax && t < tmax && this.equal(x[s], y[t])) {
          s++;
          t++;
        }
        vf[k0] = s;
        if (odd && bmin <= k && k <= bmax && s >= vb[k0]) {
          return {
            s0: s0,
            s1: s,
            t0: t0,
            t1: t
          };
        }
      }
      if (bmin > kmin) {
        bmin--;
        vb[v0 + bmin - 1] = Number.MAX_SAFE_INTEGER;
      } else {
        bmin++;
      }
      if (bmax < kmax) {
        bmax++;
        vb[v0 + bmax + 1] = Number.MAX_SAFE_INTEGER;
      } else {
        bmax--;
      }
      for (let k = bmin; k <= bmax; k += 2) {
        const k0 = k + v0;
        let s;
        if (vb[k0 - 1] < vb[k0 + 1]) {
          s = vb[k0 - 1];
        } else {
          s = vb[k0 + 1] - 1;
        }
        let t = s - k;
        const s0 = s,
          t0 = t;
        while (s > smin && t > tmin && this.equal(x[s - 1], y[t - 1])) {
          s--;
          t--;
        }
        vb[k0] = s;
        if (!odd && fmin <= k && k <= fmax && s <= vf[v0 + k]) {
          return {
            s0: s,
            s1: s0,
            t0: t,
            t1: t0
          };
        }
      }
    }
  }
}

const Op = {
  Match: 0,
  Delete: 1,
  Insert: 2
};
function edits(x, y, eq = (a, b) => a === b) {
  const {
    rx,
    ry
  } = diff(x, y, eq);
  return createEdits(x, y, rx, ry);
}
function createEdits(x, y, rx, ry) {
  const edits = [];
  const n = rx.length - 1;
  const m = ry.length - 1;
  let s = 0,
    t = 0;
  while (s < n || t < m) {
    while (s < n && rx[s]) {
      edits.push({
        op: Op.Delete,
        x: x[s],
        y: x[s]
      });
      s++;
    }
    while (t < m && ry[t]) {
      edits.push({
        op: Op.Insert,
        x: y[t],
        y: y[t]
      });
      t++;
    }
    while (s < n && t < m && !rx[s] && !ry[t]) {
      edits.push({
        op: Op.Match,
        x: x[s],
        y: y[t]
      });
      s++;
      t++;
    }
  }
  return edits;
}
function diff(x, y, eq = (a, b) => a === b) {
  const x0 = [];
  const y0 = [];
  const xidx = [];
  const yidx = [];
  const counts = [];
  const elements = [];
  const findId = e => {
    for (let i = 0; i < elements.length; i++) {
      if (eq(elements[i], e)) {
        return i;
      }
    }
    const id = elements.length;
    elements.push(e);
    counts.push(0);
    return id;
  };
  for (let i = 0; i < x.length; i++) {
    const e = x[i];
    const id = findId(e);
    counts[id] = (counts[id] || 0) + 1;
    x0.push(id);
    xidx.push(i);
  }
  for (let i = 0; i < y.length; i++) {
    const e = y[i];
    const id = findId(e);
    counts[id] = (counts[id] || 0) + 1;
    y0.push(id);
    yidx.push(i);
  }
  const m = new Myers(xidx, yidx, x0, y0, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);
  return {
    rx: m.resultVectorX,
    ry: m.resultVectorY
  };
}

let debug$1 = (..._) => {};
class DataBuffer {
  constructor(input) {
    this.writing = false;
    this.data = [];
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
      this.data = Buffer.from(input);
    } else if (typeof input === 'string') {
      this.data = Buffer.from(input);
    } else if (input instanceof Uint8Array) {
      this.data = input;
    } else if (input instanceof ArrayBuffer) {
      this.data = new Uint8Array(input);
    } else if (Array.isArray(input)) {
      this.data = new Uint8Array(input);
    } else if (typeof input === 'number') {
      this.data = new Uint8Array(input);
    } else if (input instanceof DataBuffer) {
      this.data = input.data;
    } else if (input && input.buffer && input.buffer instanceof ArrayBuffer) {
      this.data = new Uint8Array(input.buffer, input.byteOffset, input.length * input.BYTES_PER_ELEMENT);
    } else if (typeof input === 'undefined') {
      this.writing = true;
      this.data = new Uint8Array();
    } else {
      const error = `Unknown type of input for DataBuffer: ${typeof input}`;
      throw new TypeError(error);
    }
    this.lengthInBytes = this.data.length;
    this.next = null;
    this.prev = null;
    this.nativeEndian = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;
    this.offset = 0;
    this.buffer = [...this.data];
  }
  static allocate(size) {
    return new DataBuffer(size);
  }
  get length() {
    return this.data.length;
  }
  compare(input, offset = 0) {
    const buffer = new DataBuffer(input);
    const {
      length
    } = buffer;
    if (!length) {
      return false;
    }
    const local = this.slice(offset, length);
    const {
      data
    } = buffer;
    for (let i = 0; i < length; i++) {
      if (local.data[i] !== data[i]) {
        return false;
      }
    }
    return true;
  }
  diff(input, offset = 0) {
    const buffer = new DataBuffer(input);
    const x = Array.from(this.data.slice(offset));
    const y = Array.from(buffer.data);
    debug$1('diff: comparing', x.length, 'bytes against', y.length, 'bytes');
    return edits(x, y, (a, b) => a === b);
  }
  isNextBytes(input) {
    if (!input || typeof input.length !== 'number' || input.length === 0) {
      return false;
    }
    if (!this.available(input.length)) {
      debug$1(`isNextBytes: Insufficient Bytes: ${input.length} <= ${this.remainingBytes()}`);
      return false;
    }
    debug$1('isNextBytes: this.offset =', this.offset);
    for (let i = 0; i < input.length; i++) {
      const data = this.peekUInt8(this.offset + i);
      if (input[i] !== data) {
        debug$1('isNextBytes: first failed match at', i, ', where:', input[i], '!==', data);
        return false;
      }
    }
    return true;
  }
  copy() {
    return new DataBuffer(new Uint8Array(this.data.slice(0)));
  }
  slice(position, length = this.length) {
    if (position === 0 && length >= this.length) {
      return new DataBuffer(this.data);
    }
    return new DataBuffer(this.data.slice(position, position + length));
  }
  remainingBytes() {
    return this.length - this.offset;
  }
  available(bytes) {
    return this.writing || bytes <= this.remainingBytes();
  }
  availableAt(bytes, offset) {
    return this.writing || bytes <= this.length - offset;
  }
  advance(bytes) {
    if (!this.available(bytes)) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} <= ${this.remainingBytes()}`);
    }
    this.offset += bytes;
    debug$1('advance: offset', this.offset);
  }
  rewind(bytes) {
    if (bytes > this.offset) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} > ${this.offset}`);
    }
    this.offset -= bytes;
    debug$1('rewind: offset', this.offset);
  }
  seek(position) {
    debug$1(`seek: from ${this.offset} to ${position}`);
    if (position > this.offset) {
      this.advance(position - this.offset);
    }
    if (position < this.offset) {
      this.rewind(this.offset - position);
    }
    debug$1(`seek: offset is ${this.offset}`);
  }
  readUInt8() {
    if (!this.available(1)) {
      throw new UnderflowError('Insufficient Bytes: 1');
    }
    const output = this.data[this.offset];
    this.offset += 1;
    return output;
  }
  peekUInt8(offset = 0) {
    if (!this.availableAt(1, offset)) {
      throw new UnderflowError(`Insufficient Bytes: ${offset} + 1`);
    }
    return this.data[offset];
  }
  read(bytes, littleEndian = false) {
    const uint8 = new Uint8Array(bytes);
    if (littleEndian) {
      for (let i = bytes - 1; i >= 0; i--) {
        uint8[i] = this.readUInt8();
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        uint8[i] = this.readUInt8();
      }
    }
    return uint8;
  }
  peek(bytes, offset = 0, littleEndian = false) {
    const uint8 = new Uint8Array(bytes);
    if (littleEndian) {
      for (let i = 0; i < bytes; i++) {
        uint8[bytes - i - 1] = this.peekUInt8(offset + i);
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        uint8[i] = this.peekUInt8(offset + i);
      }
    }
    return uint8;
  }
  peekBit(position, length = 1, offset = 0) {
    if (Number.isNaN(position) || !Number.isInteger(position) || position < 0 || position > 7) {
      throw new Error(`peekBit position is invalid: ${position}, must be an Integer between 0 and 7`);
    }
    if (Number.isNaN(length) || !Number.isInteger(length) || length < 1 || length > 8) {
      throw new Error(`peekBit length is invalid: ${length}, must be an Integer between 1 and 8`);
    }
    const value = this.peekUInt8(offset);
    return (value << position & 0xFF) >>> 8 - length;
  }
  readInt8() {
    const uint8 = this.read(1);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt8(0);
  }
  peekInt8(offset = 0) {
    const uint8 = this.peek(1, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt8(0);
  }
  readUInt16(littleEndian) {
    const uint8 = this.read(2);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint16(0, littleEndian);
  }
  peekUInt16(offset = 0, littleEndian = false) {
    const uint8 = this.peek(2, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint16(0, littleEndian);
  }
  readInt16(littleEndian = false) {
    const uint8 = this.read(2);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt16(0, littleEndian);
  }
  peekInt16(offset = 0, littleEndian = false) {
    const uint8 = this.peek(2, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt16(0, littleEndian);
  }
  readUInt24(littleEndian = false) {
    if (littleEndian) {
      return this.readUInt16(true) + (this.readUInt8() << 16);
    }
    return (this.readUInt16() << 8) + this.readUInt8();
  }
  peekUInt24(offset = 0, littleEndian = false) {
    if (littleEndian) {
      return this.peekUInt16(offset, true) + (this.peekUInt8(offset + 2) << 16);
    }
    return (this.peekUInt16(offset) << 8) + this.peekUInt8(offset + 2);
  }
  readInt24(littleEndian = false) {
    if (littleEndian) {
      return this.readUInt16(true) + (this.readInt8() << 16);
    }
    return (this.readInt16() << 8) + this.readUInt8();
  }
  peekInt24(offset = 0, littleEndian = false) {
    if (littleEndian) {
      return this.peekUInt16(offset, true) + (this.peekInt8(offset + 2) << 16);
    }
    return (this.peekInt16(offset) << 8) + this.peekUInt8(offset + 2);
  }
  readUInt32(littleEndian = false) {
    const uint8 = this.read(4);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint32(0, littleEndian);
  }
  peekUInt32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint32(0, littleEndian);
  }
  readInt32(littleEndian = false) {
    const uint8 = this.read(4);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt32(0, littleEndian);
  }
  peekInt32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt32(0, littleEndian);
  }
  readFloat32(littleEndian = false) {
    const uint8 = this.read(4);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat32(0, littleEndian);
  }
  peekFloat32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat32(0, littleEndian);
  }
  readFloat48(littleEndian = false) {
    const uint8 = this.read(6, littleEndian || this.nativeEndian);
    return float48(uint8);
  }
  peekFloat48(offset = 0, littleEndian = false) {
    const uint8 = this.peek(6, offset, littleEndian || this.nativeEndian);
    return float48(uint8);
  }
  readFloat64(littleEndian = false) {
    const uint8 = this.read(8);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat64(0, littleEndian);
  }
  peekFloat64(offset = 0, littleEndian = false) {
    const uint8 = this.peek(8, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat64(0, littleEndian);
  }
  readFloat80(littleEndian = this.nativeEndian) {
    const uint8 = this.read(10, littleEndian);
    return float80(uint8);
  }
  peekFloat80(offset = 0, littleEndian = this.nativeEndian) {
    const uint8 = this.peek(10, offset, littleEndian);
    return float80(uint8);
  }
  readBuffer(length) {
    const to = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      to[i] = this.readUInt8();
    }
    return new DataBuffer(to);
  }
  peekBuffer(offset, length) {
    const to = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      to[i] = this.peekUInt8(offset + i);
    }
    return new DataBuffer(to);
  }
  readString(length, encoding = 'ascii') {
    return this.decodeString(this.offset, length, encoding, true);
  }
  peekString(offset, length, encoding = 'ascii') {
    return this.decodeString(offset, length, encoding, false);
  }
  decodeString(offset, length, encoding, advance) {
    encoding = encoding.toLowerCase();
    const nullEnd = length === null ? 0 : -1;
    if (!length) {
      length = this.remainingBytes();
    }
    const end = offset + length;
    let result = '';
    switch (encoding) {
      case 'ascii':
      case 'latin1':
        {
          while (offset < end) {
            const character = this.peekUInt8(offset++);
            if (character === nullEnd) {
              break;
            }
            result += String.fromCharCode(character);
          }
          break;
        }
      case 'utf8':
      case 'utf-8':
        {
          while (offset < end) {
            const b1 = this.peekUInt8(offset++);
            if (b1 === nullEnd) {
              break;
            }
            let b2;
            let b3;
            if ((b1 & 0x80) === 0) {
              result += String.fromCharCode(b1);
            } else if ((b1 & 0xE0) === 0xC0) {
              b2 = this.peekUInt8(offset++) & 0x3F;
              result += String.fromCharCode((b1 & 0x1F) << 6 | b2);
            } else if ((b1 & 0xF0) === 0xE0) {
              b2 = this.peekUInt8(offset++) & 0x3F;
              b3 = this.peekUInt8(offset++) & 0x3F;
              result += String.fromCharCode((b1 & 0x0F) << 12 | b2 << 6 | b3);
            } else if ((b1 & 0xF8) === 0xF0) {
              b2 = this.peekUInt8(offset++) & 0x3F;
              b3 = this.peekUInt8(offset++) & 0x3F;
              const b4 = this.peekUInt8(offset++) & 0x3F;
              const pt = ((b1 & 0x0F) << 18 | b2 << 12 | b3 << 6 | b4) - 0x10000;
              result += String.fromCharCode(0xD800 + (pt >> 10), 0xDC00 + (pt & 0x3FF));
            }
          }
          break;
        }
      case 'utf16-be':
      case 'utf16be':
      case 'utf16le':
      case 'utf16-le':
      case 'utf16bom':
      case 'utf16-bom':
        {
          let littleEndian;
          switch (encoding) {
            case 'utf16be':
            case 'utf16-be':
              {
                littleEndian = false;
                break;
              }
            case 'utf16le':
            case 'utf16-le':
              {
                littleEndian = true;
                break;
              }
            case 'utf16bom':
            case 'utf16-bom':
            default:
              {
                const bom = this.peekUInt16(offset);
                if (length < 2 || bom === nullEnd) {
                  if (advance) {
                    this.advance(offset += 2);
                  }
                  return result;
                }
                littleEndian = bom === 0xFFFE;
                offset += 2;
                break;
              }
          }
          let w1;
          while (offset < end && (w1 = this.peekUInt16(offset, littleEndian)) !== nullEnd) {
            offset += 2;
            if (w1 < 0xD800 || w1 > 0xDFFF) {
              result += String.fromCharCode(w1);
            } else {
              const w2 = this.peekUInt16(offset, littleEndian);
              if (w2 < 0xDC00 || w2 > 0xDFFF) {
                throw new Error('Invalid utf16 sequence.');
              }
              result += String.fromCharCode(w1, w2);
              offset += 2;
            }
          }
          if (w1 === nullEnd) {
            offset += 2;
          }
          break;
        }
      default:
        {
          throw new Error(`Unknown Encoding: ${encoding}`);
        }
    }
    if (advance) {
      this.advance(length);
    }
    return result;
  }
  readNullTerminatedString(encoding = 'ascii') {
    const result = this.decodeNullTerminatedString(this.offset, encoding, true);
    return result;
  }
  peekNullTerminatedString(offset, encoding = 'ascii') {
    const result = this.decodeNullTerminatedString(offset, encoding, false);
    return result;
  }
  decodeNullTerminatedString(offset, encoding, advance) {
    encoding = encoding.toLowerCase();
    let result = '';
    switch (encoding) {
      case 'ascii':
      case 'latin1':
        {
          while (offset < this.buffer.length) {
            const byte = this.peekUInt8(offset++);
            if (byte === 0x00) {
              break;
            }
            result += String.fromCharCode(byte);
          }
          break;
        }
      case 'utf8':
      case 'utf-8':
        {
          while (offset < this.buffer.length) {
            const b1 = this.peekUInt8(offset++);
            if (b1 === 0x00) {
              break;
            }
            let b2;
            let b3;
            if ((b1 & 0x80) === 0) {
              result += String.fromCharCode(b1);
            } else if ((b1 & 0xE0) === 0xC0) {
              if (offset >= this.buffer.length) break;
              b2 = this.peekUInt8(offset++);
              if (b2 === 0x00) break;
              result += String.fromCharCode((b1 & 0x1F) << 6 | b2 & 0x3F);
            } else if ((b1 & 0xF0) === 0xE0) {
              if (offset >= this.buffer.length) break;
              b2 = this.peekUInt8(offset++);
              if (b2 === 0x00) break;
              if (offset >= this.buffer.length) break;
              b3 = this.peekUInt8(offset++);
              if (b3 === 0x00) break;
              result += String.fromCharCode((b1 & 0x0F) << 12 | (b2 & 0x3F) << 6 | b3 & 0x3F);
            } else if ((b1 & 0xF8) === 0xF0) {
              if (offset >= this.buffer.length) break;
              b2 = this.peekUInt8(offset++);
              if (b2 === 0x00) break;
              if (offset >= this.buffer.length) break;
              b3 = this.peekUInt8(offset++);
              if (b3 === 0x00) break;
              if (offset >= this.buffer.length) break;
              const b4 = this.peekUInt8(offset++);
              if (b4 === 0x00) break;
              const pt = ((b1 & 0x0F) << 18 | (b2 & 0x3F) << 12 | (b3 & 0x3F) << 6 | b4 & 0x3F) - 0x10000;
              result += String.fromCharCode(0xD800 + (pt >> 10), 0xDC00 + (pt & 0x3FF));
            }
          }
          break;
        }
      case 'utf16-be':
      case 'utf16be':
        {
          while (offset < this.buffer.length - 1) {
            const b1 = this.peekUInt8(offset);
            const b2 = this.peekUInt8(offset + 1);
            if (b1 === 0x00 && b2 === 0x00) {
              break;
            }
            const codePoint = b1 << 8 | b2;
            if (codePoint === 0x0000) {
              break;
            }
            result += String.fromCharCode(codePoint);
            offset += 2;
          }
          break;
        }
      case 'utf16-le':
      case 'utf16le':
        {
          while (offset < this.buffer.length - 1) {
            const b1 = this.peekUInt8(offset);
            const b2 = this.peekUInt8(offset + 1);
            if (b1 === 0x00 && b2 === 0x00) {
              break;
            }
            const codePoint = b2 << 8 | b1;
            if (codePoint === 0x0000) {
              break;
            }
            result += String.fromCharCode(codePoint);
            offset += 2;
          }
          break;
        }
      default:
        {
          while (offset < this.buffer.length) {
            const byte = this.peekUInt8(offset++);
            if (byte === 0x00) {
              break;
            }
            result += String.fromCharCode(byte);
          }
          break;
        }
    }
    if (advance) {
      this.offset = offset;
    }
    return result;
  }
  reset() {
    this.offset = 0;
  }
  writeUInt8(data, offset = this.offset, advance = true) {
    this.buffer[offset] = data;
    if (advance) {
      this.offset++;
    }
  }
  writeUInt16(data, offset = this.offset, advance = true, littleEndian = false) {
    if (littleEndian) {
      this.buffer[offset] = data & 0xFF;
      this.buffer[offset + 1] = (data & 0xFF00) >> 8;
    } else {
      this.buffer[offset] = (data & 0xFF00) >> 8;
      this.buffer[offset + 1] = data & 0xFF;
    }
    if (advance) {
      this.offset += 2;
    }
  }
  writeUInt24(data, offset = this.offset, advance = true, littleEndian = false) {
    if (littleEndian) {
      this.buffer[offset] = data & 0x0000FF;
      this.buffer[offset + 1] = (data & 0x00FF00) >> 8;
      this.buffer[offset + 2] = (data & 0xFF0000) >> 16;
    } else {
      this.buffer[offset] = (data & 0xFF0000) >> 16;
      this.buffer[offset + 1] = (data & 0x00FF00) >> 8;
      this.buffer[offset + 2] = data & 0x0000FF;
    }
    if (advance) {
      this.offset += 3;
    }
  }
  writeUInt32(data, offset = this.offset, advance = true, littleEndian = false) {
    if (littleEndian) {
      this.buffer[offset] = data & 0x000000FF;
      this.buffer[offset + 1] = (data & 0x0000FF00) >> 8;
      this.buffer[offset + 2] = (data & 0x00FF0000) >> 16;
      this.buffer[offset + 3] = (data & 0xFF000000) >> 24;
    } else {
      this.buffer[offset] = (data & 0xFF000000) >> 24;
      this.buffer[offset + 1] = (data & 0x00FF0000) >> 16;
      this.buffer[offset + 2] = (data & 0x0000FF00) >> 8;
      this.buffer[offset + 3] = data & 0x000000FF;
    }
    if (advance) {
      this.offset += 4;
    }
  }
  writeBytes(data, offset = this.offset, advance = true) {
    for (let i = 0; i < data.length; i++) {
      this.buffer[offset + i] = data[i];
    }
    if (advance) {
      this.offset += data.length;
    }
  }
  writeString(string, offset = this.offset, encoding = 'ascii', advance = true) {
    const data = [];
    switch (encoding) {
      case 'ascii':
      case 'latin1':
        {
          for (let i = 0; i < string.length; i++) {
            data.push(string.charCodeAt(i) & 0xFF);
          }
          break;
        }
      case 'utf8':
      case 'utf-8':
        {
          for (let i = 0; i < string.length; i++) {
            let charcode = string.charCodeAt(i);
            if (charcode < 0x80) {
              data.push(charcode);
            } else if (charcode < 0x800) {
              data.push(0xC0 | charcode >> 6, 0x80 | charcode & 0x3F);
            } else if (charcode < 0xD800 || charcode >= 0xE000) {
              data.push(0xE0 | charcode >> 12, 0x80 | charcode >> 6 & 0x3F, 0x80 | charcode & 0x3F);
            } else {
              i++;
              charcode = 0x10000 + ((charcode & 0x3FF) << 10 | string.charCodeAt(i) & 0x3FF);
              data.push(0xF0 | charcode >> 18, 0x80 | charcode >> 12 & 0x3F, 0x80 | charcode >> 6 & 0x3F, 0x80 | charcode & 0x3F);
            }
          }
          break;
        }
      case 'utf16be':
      case 'utf16le':
      case 'utf16bom':
        {
          const littleEndian = encoding === 'utf16le';
          for (let i = 0; i < string.length; i++) {
            const charcode = string.charCodeAt(i);
            if (littleEndian) {
              data.push(charcode & 0xFF, charcode / 256 >>> 0);
            } else {
              data.push(charcode / 256 >>> 0, charcode & 0xFF);
            }
          }
          break;
        }
      default:
        {
          throw new Error(`Unknown Encoding: ${encoding}`);
        }
    }
    this.writeBytes(data, offset, advance);
  }
  commit() {
    this.data = new Uint8Array(this.buffer);
    this.writing = false;
  }
}

let debug = (..._) => {};
class ImageHEIC extends DataBuffer {
  constructor(input) {
    super(input);
    this.width = 0;
    this.height = 0;
    this.brandMajor = '';
    this.compatibleBrands = [];
    this.meta = {};
    this.mdatChunks = [];
    this.boxes = [];
    this.pixels = undefined;
    this.parse();
  }
  static fromFile(data) {
    return new ImageHEIC(data);
  }
  static fromBuffer(buffer) {
    debug('fromBuffer:', buffer.length);
    return new ImageHEIC(buffer);
  }
  static isHeic(buffer) {
    debug('isHeic:', buffer.length);
    if (!buffer || buffer.length < 12) {
      return false;
    }
    try {
      const dataBuffer = new DataBuffer(buffer);
      dataBuffer.offset = 8;
      const brandMajor = dataBuffer.readString(4).replace('\0', ' ').trim();
      switch (brandMajor) {
        case 'mif1':
        case 'msf1':
        case 'heic':
        case 'heix':
        case 'hevc':
        case 'hevx':
        case 'heim':
        case 'heis':
        case 'hevm':
        case 'hevs':
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
  parse() {
    this.decodeHeader();
    while (this.remainingBytes() > 0) {
      const box = this.decodeBox();
      if (!box) {
        break;
      }
      if (this.remainingBytes() === 0) {
        break;
      }
    }
  }
  decodeHeader() {
    debug('decodeHeader: offset =', this.offset);
    if (this.offset !== 0) ;
    if (this.remainingBytes() < 8) {
      throw new Error('File too small to be a valid HEIC file');
    }
    const type = this.peek(4, 4).reduce((str, byte) => str + String.fromCharCode(byte), '');
    if (type !== 'ftyp') {
      throw new Error('Missing or invalid HEIC header: first box must be ftyp');
    }
    if (this.remainingBytes() >= 12) {
      const brandMajor = this.peek(4, 8).reduce((str, byte) => str + String.fromCharCode(byte), '').replace('\0', ' ').trim();
      if (!ImageHEIC.isHeic(this.data)) {
        throw new Error(`Missing or invalid HEIC header: brandMajor '${brandMajor}' is not a recognized HEIC brand`);
      }
    }
  }
  decodeBox() {
    debug('decodeBox: offset =', this.offset, 'remaining =', this.remainingBytes());
    if (this.remainingBytes() < 8) {
      return null;
    }
    const size = this.readUInt32();
    const type = this.readString(4);
    let boxSize = size;
    let boxData = null;
    if (size === 1) {
      if (this.remainingBytes() < 8) {
        throw new Error('Invalid Box: Extended size specified but insufficient data');
      }
      this.readUInt32();
      const sizeLow = this.readUInt32();
      boxSize = sizeLow;
    }
    if (boxSize < 8) {
      throw new Error(`Invalid Box Size: ${boxSize}, must be at least 8`);
    }
    const dataSize = boxSize - (size === 1 ? 16 : 8);
    if (dataSize > 0) {
      if (this.remainingBytes() < dataSize) {
        debug(`decodeBox: Insufficient data for box '${type}', expected ${dataSize}, got ${this.remainingBytes()}`);
        return null;
      }
      boxData = this.read(dataSize);
    }
    const box = {
      type,
      size: boxSize,
      data: boxData,
      offset: this.offset - boxSize
    };
    switch (type) {
      case 'ftyp':
        this.decodeFTYP(boxData);
        break;
      case 'meta':
        this.decodeMETA(boxData, box.offset);
        break;
      case 'mdat':
        this.decodeMDAT(boxData, box.offset, box.size);
        break;
    }
    this.boxes.push(box);
    return box;
  }
  decodeFTYP(boxData) {
    debug('decodeFTYP: boxData =', boxData.length);
    if (!boxData || boxData.length < 8) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    this.brandMajor = buffer.readString(4, 'ascii').replace('\0', ' ').trim();
    const minorVersion = buffer.readUInt32();
    this.compatibleBrands = [];
    while (buffer.remainingBytes() >= 4) {
      const brand = buffer.readString(4, 'ascii').replace('\0', ' ').trim();
      this.compatibleBrands.push(brand);
    }
    debug('decodeFTYP =', {
      brandMajor: this.brandMajor,
      minorVersion,
      compatibleBrands: this.compatibleBrands
    });
    if (!ImageHEIC.isHeic(this.data)) {
      throw new Error(`Invalid HEIC file: brandMajor '${this.brandMajor}' is not a recognized HEIC brand`);
    }
  }
  decodeMETA(boxData, boxAbsoluteOffset) {
    debug('decodeMETA: boxData =', boxData.length, 'boxAbsoluteOffset =', boxAbsoluteOffset);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    const metaDataStartOffset = boxAbsoluteOffset + 8;
    this.meta = {
      version,
      flags,
      nestedBoxes: [],
      absoluteOffset: boxAbsoluteOffset
    };
    while (buffer.remainingBytes() >= 8) {
      const nestedBox = this.decodeBoxFromBuffer(buffer);
      if (!nestedBox) {
        break;
      }
      this.meta.nestedBoxes.push(nestedBox);
      const nestedBoxAbsoluteOffset = metaDataStartOffset + nestedBox.offset;
      switch (nestedBox.type) {
        case 'ispe':
          this.decodeISPE(nestedBox.data);
          break;
        case 'hdlr':
          this.decodeHDLR(nestedBox.data);
          break;
        case 'dinf':
          this.decodeDINF(nestedBox.data);
          break;
        case 'pitm':
          this.decodePITM(nestedBox.data);
          break;
        case 'iinf':
          this.decodeIINF(nestedBox.data);
          break;
        case 'iref':
          this.decodeIREF(nestedBox.data);
          break;
        case 'iprp':
          this.decodeIPRP(nestedBox.data);
          break;
        case 'grpl':
          this.decodeGRPL(nestedBox.data);
          break;
        case 'idat':
          this.decodeIDAT(nestedBox.data, nestedBoxAbsoluteOffset, nestedBox.size);
          break;
        case 'iloc':
          this.decodeILOC(nestedBox.data);
          break;
        default:
          debug(`decodeMETA: ⚠️ unsupported nested box: '${nestedBox.type}'`);
          break;
      }
    }
    debug('decodeMETA =', {
      version,
      flags: Array.from(flags),
      nestedBoxCount: this.meta.nestedBoxes.length
    });
  }
  decodeBoxFromBuffer(buffer) {
    debug('decodeBoxFromBuffer: buffer =', buffer.remainingBytes());
    if (buffer.remainingBytes() < 8) {
      return null;
    }
    const startOffset = buffer.offset;
    const size = buffer.readUInt32();
    const type = buffer.readString(4, 'ascii');
    let boxSize = size;
    let boxData = null;
    if (size === 1) {
      if (buffer.remainingBytes() < 8) {
        return null;
      }
      buffer.readUInt32();
      const sizeLow = buffer.readUInt32();
      boxSize = sizeLow;
    }
    if (boxSize < 8) {
      return null;
    }
    const dataSize = boxSize - (size === 1 ? 16 : 8);
    if (dataSize > 0) {
      if (buffer.remainingBytes() < dataSize) {
        return null;
      }
      boxData = buffer.read(dataSize);
    }
    return {
      type,
      size: boxSize,
      data: boxData,
      offset: startOffset
    };
  }
  decodeISPE(boxData) {
    debug('decodeISPE: boxData =', boxData.length);
    if (!boxData || boxData.length < 12) {
      return undefined;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    const width = buffer.readUInt32();
    const height = buffer.readUInt32();
    this.width = width;
    this.height = height;
    const result = {
      version,
      flags: Array.from(flags),
      width,
      height
    };
    return result;
  }
  decodeIROT(boxData) {
    debug('decodeIROT: boxData =', boxData?.length);
    if (!boxData || boxData.length < 1) {
      return undefined;
    }
    const buffer = new DataBuffer(boxData);
    const byte = buffer.readUInt8();
    const reserved = byte >> 2 & 0x3F;
    const angle = byte & 0x03;
    if (reserved !== 0) {
      return undefined;
    }
    const result = {
      angle,
      angleDegrees: angle * 90
    };
    return result;
  }
  decodePIXI(boxData) {
    debug('decodePIXI: boxData =', boxData?.length);
    if (!boxData || boxData.length < 5) {
      return undefined;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    if (version !== 0) {
      return undefined;
    }
    if (buffer.remainingBytes() < 1) {
      return undefined;
    }
    const planeCount = buffer.readUInt8();
    if (planeCount < 1 || planeCount > 255) {
      return undefined;
    }
    if (buffer.remainingBytes() < planeCount) {
      return undefined;
    }
    const planeDepths = [];
    for (let i = 0; i < planeCount; i++) {
      const depth = buffer.readUInt8();
      planeDepths.push(depth);
      if (i > 0 && depth !== planeDepths[0]) {
        debug(`decodePIXI: unsupported mismatched plane depths [${depth} != ${planeDepths[0]}]`);
        return undefined;
      }
    }
    const result = {
      version,
      flags: Array.from(flags),
      planeCount,
      planeDepths
    };
    return result;
  }
  decodeCOLR(boxData) {
    debug('decodeCOLR: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return undefined;
    }
    const buffer = new DataBuffer(boxData);
    const colorType = buffer.readString(4, 'ascii');
    const result = {
      colorType,
      hasICC: false,
      hasNCLX: false
    };
    if (colorType === 'rICC' || colorType === 'prof') {
      const iccSize = buffer.remainingBytes();
      if (iccSize === 0) {
        return undefined;
      }
      result.iccSize = iccSize;
      result.hasICC = true;
    } else if (colorType === 'nclx') {
      if (buffer.remainingBytes() < 7) {
        return undefined;
      }
      const colorPrimaries = buffer.readUInt16();
      const transferCharacteristics = buffer.readUInt16();
      const matrixCoefficients = buffer.readUInt16();
      const rangeByte = buffer.readUInt8();
      const fullRangeFlag = rangeByte >> 7 & 0x01;
      const reserved = rangeByte & 0x7F;
      if (reserved !== 0) {
        return undefined;
      }
      result.colorPrimaries = colorPrimaries;
      result.transferCharacteristics = transferCharacteristics;
      result.matrixCoefficients = matrixCoefficients;
      result.fullRangeFlag = fullRangeFlag;
      result.range = fullRangeFlag ? 'full' : 'limited';
      result.hasNCLX = true;
    } else {
      return undefined;
    }
    return result;
  }
  decodeHVCC(boxData) {
    debug('decodeHVCC: boxData =', boxData?.length);
    if (!boxData || boxData.length < 23) {
      return undefined;
    }
    const buffer = new DataBuffer(boxData);
    const configurationVersion = buffer.readUInt8();
    const profileByte1 = buffer.readUInt8();
    const generalProfileSpace = profileByte1 >> 6 & 0x03;
    const generalTierFlag = profileByte1 >> 5 & 0x01;
    const generalProfileIdc = profileByte1 & 0x1F;
    const generalProfileCompatibilityFlags = buffer.readUInt32();
    const generalConstraintIndicatorFlags = buffer.read(6);
    const generalLevelIdc = buffer.readUInt8();
    const minSpatialSegmentationIdcBytes = buffer.readUInt16();
    const minSpatialSegmentationIdc = minSpatialSegmentationIdcBytes & 0x0FFF;
    const parallelismType = buffer.readUInt8();
    const chromaFormatByte = buffer.readUInt8();
    const chromaFormatIdc = chromaFormatByte & 0x03;
    const bitDepthLumaMinus8 = chromaFormatByte >> 2 & 0x07;
    const bitDepthChromaMinus8 = chromaFormatByte >> 5 & 0x07;
    let chromaFormat = '';
    switch (chromaFormatIdc) {
      case 0:
        chromaFormat = 'Monochrome 4:0:0';
        break;
      case 1:
        chromaFormat = 'YUV 4:2:0';
        break;
      case 2:
        chromaFormat = 'YUV 4:2:2';
        break;
      case 3:
        chromaFormat = 'YUV 4:4:4';
        break;
      default:
        chromaFormat = `Unknown (${chromaFormatIdc})`;
        break;
    }
    const avgFrameRate = buffer.readUInt16();
    const frameRateByte = buffer.readUInt8();
    const constantFrameRate = frameRateByte >> 2 & 0x03;
    const numTemporalLayers = frameRateByte >> 4 & 0x07;
    const temporalIdNested = frameRateByte >> 7 & 0x01;
    const lengthSizeMinusOne = buffer.readUInt8() & 0x03;
    if (buffer.remainingBytes() < 1) {
      return undefined;
    }
    const numOfArrays = buffer.readUInt8();
    const arrays = [];
    for (let i = 0; i < numOfArrays; i++) {
      if (buffer.remainingBytes() < 3) break;
      const arrayTypeByte = buffer.readUInt8();
      const arrayCompleteness = (arrayTypeByte & 0x01) !== 0;
      const reservedBit = (arrayTypeByte & 0x02) !== 0;
      const arrayType = arrayTypeByte >> 2 & 0x3F;
      const arrayTypeName = this.getHEVCArrayTypeName(arrayType);
      if (buffer.remainingBytes() < 2) break;
      const numNalus = buffer.readUInt16();
      const nalUnits = [];
      for (let j = 0; j < numNalus; j++) {
        if (buffer.remainingBytes() < 2) break;
        const nalUnitLength = buffer.readUInt16();
        if (buffer.remainingBytes() < nalUnitLength) break;
        nalUnits.push({
          length: nalUnitLength,
          data: buffer.read(nalUnitLength)
        });
      }
      arrays.push({
        arrayType,
        arrayTypeName,
        arrayCompleteness,
        reserved: reservedBit ? 1 : 0,
        numNalus,
        nalUnits
      });
    }
    const result = {
      configurationVersion,
      generalProfileSpace,
      generalTierFlag,
      generalProfileIdc,
      generalProfileCompatibilityFlags,
      generalConstraintIndicatorFlags: Array.from(generalConstraintIndicatorFlags),
      generalLevelIdc,
      minSpatialSegmentationIdc,
      parallelismType,
      chromaFormatIdc,
      chromaFormat,
      bitDepthLumaMinus8,
      bitDepthChromaMinus8,
      bitDepthLuma: bitDepthLumaMinus8 + 8,
      bitDepthChroma: bitDepthChromaMinus8 + 8,
      constantFrameRate,
      avgFrameRate,
      numTemporalLayers,
      temporalIdNested,
      lengthSizeMinusOne,
      numOfArrays,
      arrays,
      raw: new Uint8Array(boxData)
    };
    return result;
  }
  decodeAUXC(boxData) {
    debug('decodeAUXC: boxData =', boxData?.length);
    if (!boxData || boxData.length < 1) {
      return undefined;
    }
    const buffer = new DataBuffer(boxData);
    const auxiliaryType = buffer.readNullTerminatedString('utf8');
    const result = {
      auxiliaryType,
      isAlpha: auxiliaryType === 'urn:mpeg:hevc:2015:auxid:1' || auxiliaryType.includes('auxid:1')
    };
    return result;
  }
  getHEVCArrayTypeName(arrayType) {
    switch (arrayType) {
      case 32:
        return 'VPS';
      case 33:
        return 'SPS';
      case 34:
        return 'PPS';
      case 39:
        return 'SEI_PREFIX';
      case 40:
        return 'SEI_SUFFIX';
      default:
        return `Unknown (${arrayType})`;
    }
  }
  decodeHDLR(boxData) {
    debug('decodeHDLR: boxData =', boxData?.length);
    if (!boxData || boxData.length < 12) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    const preDefined = buffer.readUInt32();
    const handlerType = buffer.readString(4, 'ascii');
    if (!this.meta.hdlr) {
      this.meta.hdlr = [];
    }
    this.meta.hdlr.push({
      version,
      flags: Array.from(flags),
      preDefined,
      handlerType,
      isVideo: handlerType === 'vide',
      isAudio: handlerType === 'soun',
      isPicture: handlerType === 'pict'
    });
    debug('decodeHDLR =', {
      version,
      flags: Array.from(flags),
      preDefined,
      handlerType,
      isVideo: handlerType === 'vide',
      isAudio: handlerType === 'soun',
      isPicture: handlerType === 'pict'
    });
  }
  decodeDINF(boxData) {
    debug('decodeDINF: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    if (!this.meta.dinf) {
      this.meta.dinf = [];
    }
    const dinfInfo = {
      nestedBoxes: []
    };
    while (buffer.remainingBytes() >= 8) {
      const nestedBox = this.decodeBoxFromBuffer(buffer);
      if (!nestedBox) {
        break;
      }
      dinfInfo.nestedBoxes.push(nestedBox);
      switch (nestedBox.type) {
        case 'dref':
          this.decodeDREF(nestedBox.data);
          break;
        default:
          debug(`decodeDINF: ⚠️ unsupported nested box: '${nestedBox.type}'`);
          break;
      }
    }
    this.meta.dinf.push(dinfInfo);
    debug('decodeDINF =', {
      nestedBoxCount: dinfInfo.nestedBoxes.length
    });
  }
  decodeDREF(boxData) {
    debug('decodeDREF: boxData =', boxData?.length);
    if (!boxData || boxData.length < 8) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    if (buffer.remainingBytes() < 4) {
      return;
    }
    const entryCount = buffer.readUInt32();
    if (!this.meta.dref) {
      this.meta.dref = [];
    }
    const entries = [];
    for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
      if (buffer.remainingBytes() < 8) {
        break;
      }
      const entryBox = this.decodeBoxFromBuffer(buffer);
      if (!entryBox) {
        break;
      }
      const entry = this.decodeDataReferenceEntry(entryBox);
      if (entry) {
        entries.push(entry);
      }
    }
    this.meta.dref.push({
      version,
      flags: Array.from(flags),
      entryCount,
      entries
    });
    debug('decodeDREF =', {
      version,
      flags: Array.from(flags),
      entryCount,
      entriesCount: entries.length
    });
  }
  decodeDataReferenceEntry(entryBox) {
    debug('decodeDataReferenceEntry: type =', entryBox.type);
    if (!entryBox.data || entryBox.data.length < 4) {
      return null;
    }
    const buffer = new DataBuffer(entryBox.data);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    const entry = {
      type: entryBox.type,
      version,
      flags: Array.from(flags),
      flagsValue: flags[0] << 16 | flags[1] << 8 | flags[2],
      isSelfContained: (flags[2] & 0x01) === 0
    };
    if (entryBox.type === 'url ') {
      if (!entry.isSelfContained && buffer.remainingBytes() > 0) {
        entry.location = buffer.readNullTerminatedString('utf8');
      }
    } else if (entryBox.type === 'urn ') {
      if (buffer.remainingBytes() > 0) {
        entry.name = buffer.readNullTerminatedString('utf8');
      }
      if (buffer.remainingBytes() > 0) {
        entry.location = buffer.readNullTerminatedString('utf8');
      }
    }
    return entry;
  }
  decodePITM(boxData) {
    debug('decodePITM: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    if (this.meta.pitm) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    let primaryItemID;
    if (version === 0) {
      if (buffer.remainingBytes() < 2) {
        return;
      }
      primaryItemID = buffer.readUInt16();
    } else {
      if (buffer.remainingBytes() < 4) {
        return;
      }
      primaryItemID = buffer.readUInt32();
    }
    this.meta.pitm = {
      version,
      flags: Array.from(flags),
      primaryItemID
    };
    debug('decodePITM =', {
      version,
      flags: Array.from(flags),
      primaryItemID
    });
  }
  decodeIINF(boxData) {
    debug('decodeIINF: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    let entryCount;
    if (version === 0) {
      if (buffer.remainingBytes() < 2) {
        return;
      }
      entryCount = buffer.readUInt16();
    } else if (version === 1) {
      if (buffer.remainingBytes() < 4) {
        return;
      }
      entryCount = buffer.readUInt32();
    } else {
      return;
    }
    if (!this.meta.iinf) {
      this.meta.iinf = [];
    }
    const entries = [];
    for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
      if (buffer.remainingBytes() < 8) {
        break;
      }
      const infeBox = this.decodeBoxFromBuffer(buffer);
      if (!infeBox) {
        break;
      }
      if (infeBox.type !== 'infe') {
        debug(`decodeIINF: ⚠️ entry ${entryIndex} is not type 'infe', got '${infeBox.type}'`);
        break;
      }
      const infeEntry = this.decodeINFE(infeBox.data);
      if (infeEntry) {
        entries.push(infeEntry);
      }
    }
    this.meta.iinf.push({
      version,
      flags: Array.from(flags),
      entryCount,
      entries
    });
    debug('decodeIINF =', {
      version,
      flags: Array.from(flags),
      entryCount,
      entriesCount: entries.length
    });
  }
  decodeINFE(boxData) {
    debug('decodeINFE: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return null;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flagsBytes = buffer.read(3);
    const flags = flagsBytes[0] << 16 | flagsBytes[1] << 8 | flagsBytes[2];
    if (version !== 2 && version !== 3) {
      return null;
    }
    let itemID;
    if (version === 2) {
      if (buffer.remainingBytes() < 2) {
        return null;
      }
      itemID = buffer.readUInt16();
    } else {
      if (buffer.remainingBytes() < 4) {
        return null;
      }
      itemID = buffer.readUInt32();
    }
    if (buffer.remainingBytes() < 2) {
      return null;
    }
    const itemProtectionIndex = buffer.readUInt16();
    if (buffer.remainingBytes() < 4) {
      return null;
    }
    const itemType = buffer.readString(4, 'ascii');
    if (buffer.remainingBytes() === 0) {
      return null;
    }
    const itemName = buffer.readNullTerminatedString('utf8');
    let contentType = '';
    if (itemType === 'mime') {
      if (buffer.remainingBytes() === 0) {
        return null;
      }
      contentType = buffer.readNullTerminatedString('utf8');
    }
    const entry = {
      version,
      flags,
      itemID,
      itemProtectionIndex,
      itemType,
      itemName,
      contentType,
      isHidden: (flags & 1) === 1
    };
    debug('decodeINFE =', {
      version,
      flags,
      itemID,
      itemProtectionIndex,
      itemType,
      itemName,
      contentType,
      isHidden: entry.isHidden
    });
    return entry;
  }
  decodeIREF(boxData) {
    debug('decodeIREF: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    const idSize = version === 0 ? 2 : 4;
    if (!this.meta.iref) {
      this.meta.iref = [];
    }
    const references = [];
    while (buffer.remainingBytes() >= 8) {
      const refBox = this.decodeBoxFromBuffer(buffer);
      if (!refBox) {
        break;
      }
      const reference = this.decodeSingleItemReference(refBox, idSize);
      if (reference) {
        references.push(reference);
      }
    }
    this.meta.iref.push({
      version,
      flags: Array.from(flags),
      idSize,
      references
    });
    debug('decodeIREF =', {
      version,
      flags: Array.from(flags),
      idSize,
      referencesCount: references.length
    });
  }
  decodeSingleItemReference(refBox, idSize) {
    debug('decodeSingleItemReference: type =', refBox.type, 'idSize =', idSize);
    if (!refBox.data || refBox.data.length < idSize + 2) {
      return null;
    }
    const buffer = new DataBuffer(refBox.data);
    let fromItemID;
    if (idSize === 2) {
      fromItemID = buffer.readUInt16();
    } else {
      fromItemID = buffer.readUInt32();
    }
    if (buffer.remainingBytes() < 2) {
      return null;
    }
    const referenceCount = buffer.readUInt16();
    const toItemIDs = [];
    for (let i = 0; i < referenceCount; i++) {
      if (buffer.remainingBytes() < idSize) {
        break;
      }
      let toItemID;
      if (idSize === 2) {
        toItemID = buffer.readUInt16();
      } else {
        toItemID = buffer.readUInt32();
      }
      toItemIDs.push(toItemID);
    }
    const reference = {
      type: refBox.type,
      fromItemID,
      referenceCount,
      toItemIDs
    };
    debug('decodeSingleItemReference =', {
      type: reference.type,
      fromItemID: reference.fromItemID,
      referenceCount: reference.referenceCount,
      toItemIDs: reference.toItemIDs
    });
    return reference;
  }
  decodeIPRP(boxData) {
    debug('decodeIPRP: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    if (!this.meta.iprp) {
      this.meta.iprp = [];
    }
    if (buffer.remainingBytes() < 8) {
      return;
    }
    const ipcoBox = this.decodeBoxFromBuffer(buffer);
    if (!ipcoBox) {
      return;
    }
    if (ipcoBox.type !== 'ipco') {
      debug(`decodeIPRP: ⚠️ first box must be 'ipco', got '${ipcoBox.type}'`);
      return;
    }
    this.decodeIPCO(ipcoBox.data);
    const versionAndFlagsSeen = [];
    while (buffer.remainingBytes() >= 8) {
      const ipmaBox = this.decodeBoxFromBuffer(buffer);
      if (!ipmaBox) {
        break;
      }
      if (ipmaBox.type !== 'ipma') {
        debug(`decodeIPRP: ⚠️ box must be type 'ipma', got '${ipmaBox.type}'`);
        break;
      }
      const versionAndFlags = this.decodeIPMA(ipmaBox.data);
      if (versionAndFlags === null) {
        break;
      }
      if (versionAndFlagsSeen.includes(versionAndFlags)) {
        break;
      }
      versionAndFlagsSeen.push(versionAndFlags);
    }
    this.meta.iprp.push({
      ipcoProcessed: true,
      ipmaCount: versionAndFlagsSeen.length
    });
  }
  decodeIPCO(boxData) {
    debug('decodeIPCO: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    if (!this.meta.ipco) {
      this.meta.ipco = [];
    }
    const properties = [];
    while (buffer.remainingBytes() >= 8) {
      const propertyBox = this.decodeBoxFromBuffer(buffer);
      if (!propertyBox) {
        break;
      }
      let propertyData = null;
      switch (propertyBox.type) {
        case 'ispe':
          propertyData = this.decodeISPE(propertyBox.data);
          break;
        case 'irot':
          propertyData = this.decodeIROT(propertyBox.data);
          break;
        case 'pixi':
          propertyData = this.decodePIXI(propertyBox.data);
          break;
        case 'colr':
          propertyData = this.decodeCOLR(propertyBox.data);
          break;
        case 'hvcC':
          propertyData = this.decodeHVCC(propertyBox.data);
          break;
        case 'auxC':
          propertyData = this.decodeAUXC(propertyBox.data);
          break;
        default:
          debug(`decodeIPCO: ⚠️ unsupported property type: '${propertyBox.type}'`);
          break;
      }
      debug('decodeIPCO: propertyData =', propertyBox.type, '=', propertyData);
      properties.push({
        type: propertyBox.type,
        size: propertyBox.size,
        data: propertyData
      });
    }
    this.meta.ipco.push({
      properties,
      propertyCount: properties.length
    });
    debug('decodeIPCO =', {
      propertyCount: properties.length,
      propertyTypes: properties.map(p => p.type)
    });
  }
  decodeIPMA(boxData) {
    debug('decodeIPMA: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return null;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flagsBytes = buffer.read(3);
    const flags = flagsBytes[0] << 16 | flagsBytes[1] << 8 | flagsBytes[2];
    const versionAndFlags = version << 24 | flags;
    if (!this.meta.ipma) {
      this.meta.ipma = [];
    }
    let entryCount;
    if (version === 0) {
      if (buffer.remainingBytes() < 4) {
        return null;
      }
      entryCount = buffer.readUInt32();
    } else if (version === 1) {
      return versionAndFlags;
    } else {
      return null;
    }
    const associations = [];
    const itemIDSize = version === 0 ? 2 : 4;
    for (let i = 0; i < entryCount; i++) {
      const entryStartOffset = buffer.offset;
      if (buffer.remainingBytes() < itemIDSize) {
        debug(`decodeIPMA: insufficient data for item_ID ${i}, remaining=${buffer.remainingBytes()}, need=${itemIDSize}`);
        break;
      }
      let itemID;
      if (itemIDSize === 2) {
        itemID = buffer.readUInt16();
      } else {
        itemID = buffer.readUInt32();
      }
      if (buffer.remainingBytes() < 1) {
        debug(`decodeIPMA: insufficient data for association_count ${i}, remaining=${buffer.remainingBytes()}`);
        break;
      }
      const associationCount = buffer.readUInt8();
      if (i === 0) {
        const peekBytes = [];
        for (let p = 0; p < Math.min(8, buffer.remainingBytes()); p++) {
          peekBytes.push(buffer.peekUInt8(buffer.offset + p).toString(16).padStart(2, '0'));
        }
        debug(`decodeIPMA: entry[0] itemID=${itemID}, associationCount=${associationCount}, offset=${entryStartOffset}, remaining=${buffer.remainingBytes()}, next bytes=[0x${peekBytes.join(', 0x')}]`);
      }
      const flagsBit0 = flagsBytes[2] & 0x01;
      const propertyIndices = [];
      if (i === 0) {
        debug(`decodeIPMA: flags bit 0=${flagsBit0}, remaining=${buffer.remainingBytes()}`);
      }
      for (let j = 0; j < associationCount; j++) {
        const propertyIndexStartOffset = buffer.offset;
        let propertyIndex;
        let essential = false;
        if (flagsBit0 === 0) {
          if (buffer.remainingBytes() < 1) {
            debug(`decodeIPMA: insufficient data for property_index[${j}] entry[${i}], remaining=${buffer.remainingBytes()}, need=1`);
            break;
          }
          const rawValue1 = buffer.peekUInt8(buffer.offset);
          const essential1 = (rawValue1 >> 7 & 0x01) === 1;
          const propertyIndex1 = rawValue1 & 0x7F;
          if (propertyIndex1 >= 1 && propertyIndex1 <= 127) {
            buffer.readUInt8();
            propertyIndex = propertyIndex1;
            essential = essential1;
            if (j < 3 && i === 0) {
              debug(`decodeIPMA: entry[${i}] property[${j}] 1-byte: raw=0x${rawValue1.toString(16).padStart(2, '0')} (${rawValue1}), essential=${essential}, propertyIndex=${propertyIndex}, offset=${propertyIndexStartOffset}`);
            }
          } else {
            if (buffer.remainingBytes() < 2) {
              debug(`decodeIPMA: insufficient data for property_index[${j}] entry[${i}], remaining=${buffer.remainingBytes()}, need=2`);
              break;
            }
            const rawValue = buffer.readUInt16();
            essential = (rawValue >> 15 & 0x01) === 1;
            propertyIndex = rawValue & 0x7FFF;
            if (j < 3 && i === 0) {
              debug(`decodeIPMA: entry[${i}] property[${j}] 2-byte: raw=0x${rawValue.toString(16).padStart(4, '0')} (${rawValue}), essential=${essential}, propertyIndex=${propertyIndex}, offset=${propertyIndexStartOffset}`);
            }
          }
        } else {
          if (buffer.remainingBytes() < 4) {
            debug(`decodeIPMA: insufficient data for property_index[${j}] entry[${i}], remaining=${buffer.remainingBytes()}, need=4`);
            break;
          }
          const rawValue = buffer.readUInt32();
          essential = (rawValue >> 31 & 0x01) === 1;
          propertyIndex = rawValue & 0x7FFFFFFF;
          if (j < 3 && i === 0) {
            debug(`decodeIPMA: entry[${i}] property[${j}] 4-byte: raw=0x${rawValue.toString(16).padStart(8, '0')} (${rawValue}), essential=${essential}, propertyIndex=${propertyIndex}, offset=${propertyIndexStartOffset}`);
          }
        }
        propertyIndices.push({
          index: propertyIndex,
          essential
        });
      }
      associations.push({
        itemID,
        associationCount,
        propertyIndices
      });
    }
    this.meta.ipma.push({
      version,
      flags: Array.from(flagsBytes),
      versionAndFlags,
      entryCount,
      associations
    });
    debug('decodeIPMA =', {
      version,
      flags: Array.from(flagsBytes),
      entryCount,
      associationsCount: associations.length
    });
    return versionAndFlags;
  }
  decodeGRPL(boxData) {
    debug('decodeGRPL: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    if (!this.meta.grpl) {
      this.meta.grpl = [];
    }
    const groups = [];
    while (buffer.remainingBytes() >= 8) {
      const groupBox = this.decodeBoxFromBuffer(buffer);
      if (!groupBox) {
        break;
      }
      const group = this.decodeGroupingBox(groupBox);
      if (group) {
        groups.push(group);
      }
    }
    this.meta.grpl.push({
      groups,
      groupCount: groups.length
    });
    debug('decodeGRPL =', {
      groupCount: groups.length
    });
  }
  decodeGroupingBox(groupBox) {
    debug('decodeGroupingBox: type =', groupBox.type);
    if (!groupBox.data || groupBox.data.length < 12) {
      return null;
    }
    const buffer = new DataBuffer(groupBox.data);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    if (buffer.remainingBytes() < 4) {
      return null;
    }
    const groupID = buffer.readUInt32();
    if (buffer.remainingBytes() < 4) {
      return null;
    }
    const numEntitiesInGroup = buffer.readUInt32();
    const entityIDs = [];
    for (let i = 0; i < numEntitiesInGroup; i++) {
      if (buffer.remainingBytes() < 4) {
        break;
      }
      const entityID = buffer.readUInt32();
      entityIDs.push(entityID);
    }
    const group = {
      groupingType: groupBox.type,
      version,
      flags: Array.from(flags),
      groupID,
      numEntitiesInGroup,
      entityIDs
    };
    debug('decodeGroupingBox =', {
      groupingType: group.groupingType,
      version: group.version,
      groupID: group.groupID,
      numEntitiesInGroup: group.numEntitiesInGroup,
      entityIDsCount: group.entityIDs.length
    });
    return group;
  }
  decodeIDAT(boxData, boxAbsoluteOffset, boxSize) {
    debug('decodeIDAT: boxData =', boxData?.length, 'boxAbsoluteOffset =', boxAbsoluteOffset, 'boxSize =', boxSize);
    if (!boxData) {
      return;
    }
    if (!this.meta.idat) {
      this.meta.idat = [];
    }
    const dataStart = boxAbsoluteOffset + 8;
    const dataEnd = boxAbsoluteOffset + boxSize;
    this.meta.idat.push({
      data: boxData,
      start: dataStart,
      end: dataEnd
    });
    debug('decodeIDAT:', boxData.length, 'bytes stored, range:', dataStart, '-', dataEnd);
  }
  decodeILOC(boxData) {
    debug('decodeILOC: boxData =', boxData?.length);
    if (!boxData || boxData.length < 4) {
      return;
    }
    const buffer = new DataBuffer(boxData);
    const version = buffer.readUInt8();
    const flags = buffer.read(3);
    if (version > 2) {
      return;
    }
    const sizeByte1 = buffer.readUInt8();
    const offsetSize = sizeByte1 >> 4 & 0x0F;
    const lengthSize = sizeByte1 & 0x0F;
    const sizeByte2 = buffer.readUInt8();
    const baseOffsetSize = sizeByte2 >> 4 & 0x0F;
    let indexSize = 0;
    if (version === 1 || version === 2) {
      indexSize = sizeByte2 & 0x0F;
    }
    const validSizes = [0, 4, 8];
    if (!validSizes.includes(offsetSize) || !validSizes.includes(lengthSize) || !validSizes.includes(baseOffsetSize) || indexSize !== 0 && !validSizes.includes(indexSize)) {
      return;
    }
    let itemCount;
    if (version < 2) {
      if (buffer.remainingBytes() < 2) {
        return;
      }
      itemCount = buffer.readUInt16();
    } else {
      if (buffer.remainingBytes() < 4) {
        return;
      }
      itemCount = buffer.readUInt32();
    }
    if (!this.meta.iloc) {
      this.meta.iloc = [];
    }
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      const item = this.decodeILOCItem(buffer, version, offsetSize, lengthSize, baseOffsetSize, indexSize);
      if (!item) {
        break;
      }
      items.push(item);
    }
    this.meta.iloc.push({
      version,
      flags: Array.from(flags),
      offsetSize,
      lengthSize,
      baseOffsetSize,
      indexSize,
      itemCount,
      items
    });
    debug('decodeILOC =', {
      version,
      offsetSize,
      lengthSize,
      baseOffsetSize,
      indexSize,
      itemCount,
      itemsCount: items.length
    });
  }
  decodeILOCItem(buffer, version, offsetSize, lengthSize, baseOffsetSize, indexSize) {
    let itemID;
    if (version < 2) {
      if (buffer.remainingBytes() < 2) {
        return null;
      }
      itemID = buffer.readUInt16();
    } else {
      if (buffer.remainingBytes() < 4) {
        return null;
      }
      itemID = buffer.readUInt32();
    }
    let constructionMethod = 0;
    if (version === 1 || version === 2) {
      if (buffer.remainingBytes() < 2) {
        return null;
      }
      const reservedAndMethod = buffer.readUInt16();
      const reserved = reservedAndMethod >> 4 & 0x0FFF;
      constructionMethod = reservedAndMethod & 0x0F;
      if (reserved !== 0) {
        return null;
      }
      if (constructionMethod !== 0 && constructionMethod !== 1) {
        return null;
      }
    }
    if (buffer.remainingBytes() < 2) {
      return null;
    }
    const dataReferenceIndex = buffer.readUInt16();
    const baseOffset = this.readVariableSizeUInt(buffer, baseOffsetSize);
    if (buffer.remainingBytes() < 2) {
      return null;
    }
    const extentCount = buffer.readUInt16();
    const extents = [];
    for (let j = 0; j < extentCount; j++) {
      if ((version === 1 || version === 2) && indexSize > 0) {
        this.readVariableSizeUInt(buffer, indexSize);
      }
      const extentOffset = this.readVariableSizeUInt(buffer, offsetSize);
      const extentLength = this.readVariableSizeUInt(buffer, lengthSize);
      const offset = baseOffset + extentOffset;
      extents.push({
        offset,
        length: extentLength,
        extentOffset,
        extentLength
      });
    }
    return {
      itemID,
      constructionMethod,
      dataReferenceIndex,
      baseOffset,
      extentCount,
      extents,
      idatStored: constructionMethod === 1
    };
  }
  readVariableSizeUInt(buffer, size) {
    if (size === 0) {
      return 0;
    }
    if (size === 4) {
      if (buffer.remainingBytes() < 4) {
        throw new Error('Insufficient data for 4-byte integer');
      }
      return buffer.readUInt32();
    }
    if (size === 8) {
      if (buffer.remainingBytes() < 8) {
        throw new Error('Insufficient data for 8-byte integer');
      }
      const high = buffer.readUInt32();
      const low = buffer.readUInt32();
      return low + high * 0x100000000;
    }
    throw new Error(`Invalid size for variable-size integer: ${size}`);
  }
  decodeMDAT(boxData, boxAbsoluteOffset, boxSize) {
    debug('decodeMDAT: boxData =', boxData.length, 'boxAbsoluteOffset =', boxAbsoluteOffset, 'boxSize =', boxSize);
    if (!boxData) {
      return;
    }
    const dataStart = boxAbsoluteOffset + 8;
    const dataEnd = boxAbsoluteOffset + boxSize;
    debug('decodeMDAT:', boxData.length, 'bytes, range:', dataStart, '-', dataEnd);
    this.mdatChunks.push({
      data: boxData,
      start: dataStart,
      end: dataEnd
    });
  }
  getPixel(x, y) {
    if (!this.pixels) {
      throw new Error('Pixel data has not been decoded.');
    }
    if (!Number.isInteger(x) || x >= this.width || x < 0) {
      throw new Error(`x position out of bounds or invalid: ${x}`);
    }
    if (!Number.isInteger(y) || y >= this.height || y < 0) {
      throw new Error(`y position out of bounds or invalid: ${y}`);
    }
    const i = (y * this.width + x) * 4;
    return [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3]];
  }
  decodePixels() {
    if (this.mdatChunks.length === 0) {
      throw new Error('No mdat chunks to decode.');
    }
    const totalLength = this.mdatChunks.reduce((acc, chunk) => acc + chunk.data.length, 0);
    const combinedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.mdatChunks) {
      combinedData.set(chunk.data, offset);
      offset += chunk.data.length;
    }
    this.pixels = combinedData;
    debug('decodePixels: Extracted', combinedData.length, 'bytes of encoded data');
    const result = {
      width: this.width,
      height: this.height,
      data: combinedData,
      encoded: true
    };
    return result;
  }
  getEncodedData() {
    if (this.mdatChunks.length === 0) {
      return new Uint8Array(0);
    }
    const totalLength = this.mdatChunks.reduce((acc, chunk) => acc + chunk.data.length, 0);
    const combinedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.mdatChunks) {
      combinedData.set(chunk.data, offset);
      offset += chunk.data.length;
    }
    return combinedData;
  }
  buildIndex() {
    const index = {
      primaryItemID: null,
      itemsByID: new Map(),
      propertiesByIndex: new Map(),
      propertiesByItemID: new Map(),
      refsByFromID: new Map(),
      drefByIndex: new Map()
    };
    if (this.meta.pitm) {
      index.primaryItemID = this.meta.pitm.primaryItemID;
      debug('buildIndex: primaryItemID =', index.primaryItemID);
    }
    if (this.meta.iinf && Array.isArray(this.meta.iinf)) {
      for (const iinfBox of this.meta.iinf) {
        if (iinfBox.entries && Array.isArray(iinfBox.entries)) {
          for (const infeEntry of iinfBox.entries) {
            index.itemsByID.set(infeEntry.itemID, {
              itemType: infeEntry.itemType,
              itemName: infeEntry.itemName,
              contentType: infeEntry.contentType,
              protectionIndex: infeEntry.itemProtectionIndex,
              hidden: infeEntry.isHidden || false
            });
          }
        }
      }
      debug('buildIndex: itemsByID size =', index.itemsByID.size);
    }
    let globalPropertyIndex = 1;
    if (this.meta.ipco && Array.isArray(this.meta.ipco)) {
      for (const ipcoBox of this.meta.ipco) {
        if (ipcoBox.properties && Array.isArray(ipcoBox.properties)) {
          for (const property of ipcoBox.properties) {
            index.propertiesByIndex.set(globalPropertyIndex, property);
            globalPropertyIndex++;
          }
        }
      }
      debug('buildIndex: propertiesByIndex size =', index.propertiesByIndex.size, 'indices =', Array.from(index.propertiesByIndex.keys()).slice(0, 20));
    }
    if (this.meta.ipma && Array.isArray(this.meta.ipma)) {
      for (const ipmaBox of this.meta.ipma) {
        if (ipmaBox.associations && Array.isArray(ipmaBox.associations)) {
          for (const association of ipmaBox.associations) {
            const itemID = association.itemID;
            const propertyIndices = association.propertyIndices || [];
            const properties = [];
            for (const propertyIndexEntry of propertyIndices) {
              const propertyIndex = typeof propertyIndexEntry === 'object' ? propertyIndexEntry.index : propertyIndexEntry;
              const property = index.propertiesByIndex.get(propertyIndex);
              if (property) {
                properties.push(property);
              }
            }
            if (index.propertiesByItemID.has(itemID)) {
              const existing = index.propertiesByItemID.get(itemID);
              index.propertiesByItemID.set(itemID, [...existing, ...properties]);
            } else {
              index.propertiesByItemID.set(itemID, properties);
            }
          }
        }
      }
      debug('buildIndex: propertiesByItemID size =', index.propertiesByItemID.size);
      if (index.primaryItemID) {
        const primaryProps = index.propertiesByItemID.get(index.primaryItemID);
        debug('buildIndex: primary item', index.primaryItemID, 'has', primaryProps?.length || 0, 'properties');
        if (primaryProps) {
          debug('buildIndex: primary item property types:', primaryProps.map(p => p?.type).filter(Boolean));
        } else {
          console.log('buildIndex: ⚠️ primary item', index.primaryItemID, 'has no properties');
          for (const ipmaBox of this.meta.ipma || []) {
            if (ipmaBox.associations && Array.isArray(ipmaBox.associations)) {
              const primaryAssoc = ipmaBox.associations.find(a => a.itemID === index.primaryItemID);
              if (primaryAssoc) {
                console.log('buildIndex: found ipma association for primary item:', primaryAssoc);
              }
            }
          }
        }
      }
    } else {
      console.log('buildIndex: ⚠️ no ipma found');
    }
    if (this.meta.iref && Array.isArray(this.meta.iref)) {
      for (const irefBox of this.meta.iref) {
        if (irefBox.references && Array.isArray(irefBox.references)) {
          for (const reference of irefBox.references) {
            const fromItemID = reference.fromItemID;
            const refEntry = {
              type: reference.type,
              toItemIDs: reference.toItemIDs || []
            };
            if (index.refsByFromID.has(fromItemID)) {
              const existing = index.refsByFromID.get(fromItemID);
              existing.push(refEntry);
            } else {
              index.refsByFromID.set(fromItemID, [refEntry]);
            }
          }
        }
      }
      debug('buildIndex: refsByFromID size =', index.refsByFromID.size);
    }
    let globalDrefIndex = 1;
    if (this.meta.dref && Array.isArray(this.meta.dref)) {
      for (const drefBox of this.meta.dref) {
        if (drefBox.entries && Array.isArray(drefBox.entries)) {
          for (const entry of drefBox.entries) {
            const dataReferenceIndex = globalDrefIndex++;
            index.drefByIndex.set(dataReferenceIndex, {
              selfContained: entry.isSelfContained,
              location: entry.location || null,
              name: entry.name || null,
              type: entry.type
            });
          }
        }
      }
      debug('buildIndex: drefByIndex size =', index.drefByIndex.size, 'indices =', Array.from(index.drefByIndex.keys()));
    }
    this.index = index;
    debug('buildIndex: complete', {
      primaryItemID: index.primaryItemID,
      itemsCount: index.itemsByID.size,
      propertiesCount: index.propertiesByIndex.size,
      itemsWithProperties: index.propertiesByItemID.size,
      itemsWithRefs: index.refsByFromID.size,
      drefEntries: index.drefByIndex.size
    });
    return index;
  }
  getItemData(itemID) {
    if (!this.index) {
      this.buildIndex();
    }
    if (!this.index.itemsByID.has(itemID)) {
      throw new Error(`Item ${itemID} not found in index.`);
    }
    let ilocItem = null;
    if (this.meta.iloc && Array.isArray(this.meta.iloc)) {
      for (const ilocBox of this.meta.iloc) {
        if (ilocBox.items && Array.isArray(ilocBox.items)) {
          ilocItem = ilocBox.items.find(item => item.itemID === itemID);
          if (ilocItem) {
            break;
          }
        }
      }
    }
    if (!ilocItem) {
      throw new Error(`Item ${itemID} not found in iloc entries.`);
    }
    const dataReferenceIndex = ilocItem.dataReferenceIndex;
    debug('getItemData: drefByIndex keys =', Array.from(this.index.drefByIndex.keys()));
    debug('getItemData: drefByIndex size =', this.index.drefByIndex.size);
    if (dataReferenceIndex === 0) ; else {
      const drefEntry = this.index.drefByIndex.get(dataReferenceIndex);
      if (!drefEntry) {
        const availableIndices = Array.from(this.index.drefByIndex.keys()).sort((a, b) => a - b);
        throw new Error(`Data reference index ${dataReferenceIndex} not found in dref table for item ${itemID}. Available indices: ${availableIndices.join(', ') || 'none'}`);
      }
      if (!drefEntry.selfContained) {
        throw new Error(`Item ${itemID} uses external data reference (not self-contained). External data fetching not implemented.`);
      }
    }
    const dataChunks = [];
    for (const extent of ilocItem.extents) {
      const absoluteOffset = extent.offset;
      const length = extent.length;
      const endOffset = absoluteOffset + length;
      debug('getItemData: extent =', {
        absoluteOffset,
        length,
        endOffset,
        constructionMethod: ilocItem.constructionMethod
      });
      let extentData = null;
      if (ilocItem.constructionMethod === 0) {
        extentData = this.getDataFromMDAT(absoluteOffset, length);
      } else if (ilocItem.constructionMethod === 1) {
        extentData = this.getDataFromIDAT(absoluteOffset, length);
      } else {
        throw new Error(`Unsupported construction method ${ilocItem.constructionMethod} for item ${itemID}`);
      }
      if (!extentData) {
        throw new Error(`Failed to resolve extent at offset ${absoluteOffset}, length ${length} for item ${itemID}`);
      }
      dataChunks.push(extentData);
    }
    const totalLength = dataChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of dataChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  getDataFromMDAT(absoluteOffset, length) {
    const dataChunks = [];
    let remainingLength = length;
    let currentOffset = absoluteOffset;
    const sortedChunks = [...this.mdatChunks].sort((a, b) => a.start - b.start);
    for (const chunk of sortedChunks) {
      if (currentOffset >= chunk.end) {
        continue;
      }
      if (currentOffset < chunk.start && currentOffset + remainingLength <= chunk.start) {
        break;
      }
      const overlapStart = Math.max(currentOffset, chunk.start);
      const overlapEnd = Math.min(currentOffset + remainingLength, chunk.end);
      if (overlapStart < overlapEnd) {
        const offsetInChunk = overlapStart - chunk.start;
        const lengthInChunk = overlapEnd - overlapStart;
        const chunkData = chunk.data.slice(offsetInChunk, offsetInChunk + lengthInChunk);
        dataChunks.push(chunkData);
        remainingLength -= lengthInChunk;
        currentOffset = overlapEnd;
        if (remainingLength <= 0) {
          break;
        }
      }
    }
    if (remainingLength > 0) {
      return null;
    }
    if (dataChunks.length === 0) {
      return null;
    }
    if (dataChunks.length === 1) {
      return dataChunks[0];
    }
    const totalLength = dataChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of dataChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  getDataFromIDAT(relativeOffset, length) {
    if (!this.meta.idat || !Array.isArray(this.meta.idat) || this.meta.idat.length === 0) {
      return null;
    }
    const sortedChunks = [...this.meta.idat].sort((a, b) => a.start - b.start);
    const firstIdatChunk = sortedChunks[0];
    const absoluteOffset = firstIdatChunk.start + relativeOffset;
    debug('getDataFromIDAT: first idat chunk start =', firstIdatChunk.start, 'absoluteOffset =', absoluteOffset);
    const dataChunks = [];
    let remainingLength = length;
    let currentOffset = absoluteOffset;
    for (const chunk of sortedChunks) {
      if (currentOffset >= chunk.end) {
        continue;
      }
      if (currentOffset < chunk.start && currentOffset + remainingLength <= chunk.start) {
        break;
      }
      const overlapStart = Math.max(currentOffset, chunk.start);
      const overlapEnd = Math.min(currentOffset + remainingLength, chunk.end);
      if (overlapStart < overlapEnd) {
        const offsetInChunk = overlapStart - chunk.start;
        const lengthInChunk = overlapEnd - overlapStart;
        const chunkData = chunk.data.slice(offsetInChunk, offsetInChunk + lengthInChunk);
        dataChunks.push(chunkData);
        remainingLength -= lengthInChunk;
        currentOffset = overlapEnd;
        if (remainingLength <= 0) {
          break;
        }
      }
    }
    if (remainingLength > 0) {
      debug('getDataFromIDAT: available idat chunks:', sortedChunks.map(c => ({
        start: c.start,
        end: c.end,
        length: c.data.length
      })));
      return null;
    }
    if (dataChunks.length === 0) {
      debug('getDataFromIDAT: available idat chunks:', sortedChunks.map(c => ({
        start: c.start,
        end: c.end,
        length: c.data.length
      })));
      return null;
    }
    if (dataChunks.length === 1) {
      return dataChunks[0];
    }
    const totalLength = dataChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of dataChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  getPrimaryItemID() {
    if (!this.index) {
      this.buildIndex();
    }
    return this.index.primaryItemID;
  }
  getItemInfo(itemID) {
    if (!this.index) {
      this.buildIndex();
    }
    const itemInfo = this.index.itemsByID.get(itemID);
    if (!itemInfo) {
      return null;
    }
    return {
      itemType: itemInfo.itemType,
      name: itemInfo.itemName,
      contentType: itemInfo.contentType,
      hidden: itemInfo.hidden || false,
      protectionIndex: itemInfo.protectionIndex
    };
  }
  getItemProperties(itemID) {
    if (!this.index) {
      this.buildIndex();
    }
    const properties = this.index.propertiesByItemID.get(itemID);
    if (!properties || properties.length === 0) {
      console.log('getItemProperties: no properties found for', itemID);
      return {};
    }
    const result = {};
    for (const property of properties) {
      if (!property || !property.type) {
        continue;
      }
      const propertyType = property.type;
      const propertyData = property.data;
      if (result[propertyType]) {
        if (Array.isArray(result[propertyType])) {
          result[propertyType].push(propertyData);
        } else {
          result[propertyType] = [result[propertyType], propertyData];
        }
      } else {
        result[propertyType] = propertyData;
      }
    }
    return result;
  }
  getItemRefs(itemID) {
    if (!this.index) {
      this.buildIndex();
    }
    const references = this.index.refsByFromID.get(itemID);
    if (!references || references.length === 0) {
      return {};
    }
    const result = {};
    for (const ref of references) {
      if (!ref || !ref.type) {
        continue;
      }
      const refType = ref.type;
      const toItemIDs = ref.toItemIDs || [];
      if (result[refType]) {
        result[refType] = [...result[refType], ...toItemIDs];
      } else {
        result[refType] = [...toItemIDs];
      }
    }
    return result;
  }
  getHevcConfig(itemID) {
    console.log('getHevcConfig: itemID =', itemID);
    if (!this.index) {
      this.buildIndex();
    }
    const ipma = this.meta.ipma?.flatMap(x => x.associations) ?? [];
    const assoc = ipma.find(a => a.itemID === itemID);
    if (assoc) {
      const ipcoProps = this.meta.ipco?.[0]?.properties ?? [];
      for (const {
        index
      } of assoc.propertyIndices) {
        const p = ipcoProps[index - 1];
        if (p?.type === 'hvcC' && p.data) {
          return p.data;
        }
      }
    }
    const any = this.meta.ipco?.[0]?.properties?.find(p => p.type === 'hvcC' && p.data);
    return any?.data ?? null;
  }
  hevcLengthPrefixedToAnnexB(bytes, hvcc) {
    const naluLenSize = (hvcc.lengthSizeMinusOne ?? 3) + 1;
    const startCode = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
    const psetTypes = new Set([32, 33, 34]);
    const psets = [];
    for (const arr of hvcc.arrays || []) {
      if (!psetTypes.has(arr.nalUnitType)) continue;
      for (const n of arr.nalus || []) {
        const out = new Uint8Array(startCode.length + n.length);
        out.set(startCode, 0);
        out.set(n, startCode.length);
        psets.push(out);
      }
    }
    const chunks = [];
    let pos = 0;
    let insertedParamSets = false;
    const readLen = () => {
      if (pos + naluLenSize > bytes.length) throw new Error('Truncated NALU length');
      let len = 0;
      for (let i = 0; i < naluLenSize; i++) len = len << 8 | bytes[pos + i];
      pos += naluLenSize;
      return len >>> 0;
    };
    const peekNalType = nalu => {
      return nalu[0] >>> 1 & 0x3f;
    };
    while (pos < bytes.length) {
      const len = readLen();
      if (pos + len > bytes.length) throw new Error('Truncated NALU data');
      const nalu = bytes.subarray(pos, pos + len);
      pos += len;
      const nalType = peekNalType(nalu);
      const isIDR = nalType === 19 || nalType === 20;
      const isCRA = nalType === 21;
      if (!insertedParamSets && (isIDR || isCRA)) {
        for (const p of psets) chunks.push(p);
        insertedParamSets = true;
      }
      const out = new Uint8Array(startCode.length + nalu.length);
      out.set(startCode, 0);
      out.set(nalu, startCode.length);
      chunks.push(out);
    }
    if (!insertedParamSets && psets.length) {
      chunks.unshift(...psets);
    }
    const total = chunks.reduce((a, b) => a + b.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }
  async decodeHeifWithWebCodecs(options) {
    const {
      esAnnexB,
      hvccDescription,
      width,
      height,
      hvccParsed
    } = options;
    if (typeof VideoDecoder === 'undefined') {
      throw new Error('WebCodecs VideoDecoder not available');
    }
    const candidates = [this.rfc6381CodecFromHvcc(hvccParsed, 'hvc1'), this.rfc6381CodecFromHvcc(hvccParsed, 'hev1')];
    let chosen = null;
    for (const codec of candidates) {
      const config = {
        codec,
        description: hvccDescription.buffer.slice(hvccDescription.byteOffset, hvccDescription.byteOffset + hvccDescription.byteLength),
        hardwareAcceleration: 'prefer-hardware'
      };
      try {
        const sup = await VideoDecoder.isConfigSupported(config);
        if (sup?.supported) {
          chosen = config;
          break;
        }
      } catch {
      }
    }
    if (!chosen) {
      throw new Error('HEVC not supported by WebCodecs on this platform/browser');
    }
    let rgba = null;
    const decoder = new VideoDecoder({
      output: async frame => {
        try {
          rgba = new Uint8Array(width * height * 4);
          await frame.copyTo(rgba, {
            format: 'RGBA'
          });
        } finally {
          frame.close();
        }
      },
      error: e => {
        throw e;
      }
    });
    decoder.configure(chosen);
    const chunk = new EncodedVideoChunk({
      type: 'key',
      timestamp: 0,
      data: esAnnexB,
      duration: 0
    });
    decoder.decode(chunk);
    await decoder.flush();
    decoder.close();
    if (!rgba) throw new Error('Decode produced no frame');
    return {
      width,
      height,
      rgba
    };
  }
  rfc6381CodecFromHvcc(hvcc, sampleEntry = 'hvc1') {
    const profileSpace = hvcc.generalProfileSpace || 0;
    const profileSpaceChar = profileSpace === 0 ? '' : String.fromCharCode(64 + profileSpace);
    const profileIdc = hvcc.generalProfileIdc;
    let compat = hvcc.generalProfileCompatibilityFlags >>> 0;
    let compatHex;
    if (compat === 0) {
      compatHex = '0';
    } else {
      let reversed = 0;
      for (let i = 0; i < 32; i++) {
        if (compat & 1 << i) {
          reversed |= 1 << 31 - i;
        }
      }
      compatHex = reversed.toString(16).toUpperCase().replace(/^0+/, '') || '0';
    }
    debug('rfc6381CodecFromHvcc: compat raw =', compat.toString(16), 'hex =', compatHex);
    const tier = hvcc.generalTierFlag ? 'H' : 'L';
    const levelIdc = hvcc.generalLevelIdc;
    const constraintBytes = Array.from(hvcc.generalConstraintIndicatorFlags || []);
    let allZero = true;
    const nonZeroBytes = [];
    for (let i = 0; i < 6; i++) {
      const byte = constraintBytes[i];
      if (byte !== 0) {
        allZero = false;
        nonZeroBytes.push(byte);
      } else if (nonZeroBytes.length > 0) {
        break;
      }
    }
    let constraintsHex;
    if (allZero) {
      constraintsHex = '00';
    } else {
      constraintsHex = nonZeroBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
    }
    debug('rfc6381CodecFromHvcc: constraints bytes =', constraintBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '), 'hex =', constraintsHex);
    const profile = profileSpaceChar ? `${profileSpaceChar}${profileIdc}` : `${profileIdc}`;
    const codecString = `${sampleEntry}.${profile}.${compatHex}.${tier}${levelIdc}.${constraintsHex}`;
    return codecString;
  }
}

async function replaceHeicImg(img) {
  console.log('replaceHeicImg:', img);
  const url = img.getAttribute('src');
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const heic = ImageHEIC.fromFile(new Uint8Array(buf));
  heic.buildIndex();
  console.log('heic:', heic);
  const itemID = heic.getPrimaryItemID();
  console.log('getPrimaryItemID:', itemID);
  const itemBytes = heic.getItemData(itemID);
  console.log('itemBytes:', itemBytes);
  const hvcc = heic.getHevcConfig(itemID);
  console.log('hvcc:', hvcc);
  if (!hvcc) throw new Error('Missing hvcC for primary item');
  const properties = heic.getItemProperties(itemID);
  console.log('properties:', properties);
  const ispe = properties?.ispe;
  if (!ispe) throw new Error('Missing ispe');
  const {
    width,
    height
  } = ispe;
  const esAnnexB = heic.hevcLengthPrefixedToAnnexB(itemBytes, {
    lengthSizeMinusOne: hvcc.lengthSizeMinusOne,
    arrays: (hvcc.arrays || []).map(a => ({
      nalUnitType: a.arrayType,
      nalus: (a.nalUnits || []).map(u => u.data)
    }))
  });
  const hvccDescription = hvcc.raw instanceof Uint8Array ? hvcc.raw : new Uint8Array(hvcc.rawBytes || hvcc.bytes || []);
  console.log('hvccDescription:', heic.rfc6381CodecFromHvcc(hvcc, 'hvc1'));
  const {
    rgba
  } = await heic.decodeHeifWithWebCodecs({
    esAnnexB,
    hvccDescription,
    width,
    height,
    hvccParsed: {
      generalProfileIdc: hvcc.generalProfileIdc,
      generalProfileCompatibilityFlags: hvcc.generalProfileCompatibilityFlags >>> 0,
      generalTierFlag: hvcc.generalTierFlag ? 1 : 0,
      generalLevelIdc: hvcc.generalLevelIdc,
      generalConstraintIndicatorFlags: new Uint8Array(hvcc.generalConstraintIndicatorFlags)
    }
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {
    willReadFrequently: false
  });
  const imageData = new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), width, height);
  ctx.putImageData(imageData, 0, 0);
  const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const objectUrl = URL.createObjectURL(pngBlob);
  if (img.hasAttribute('width')) canvas.width = parseInt(img.getAttribute('width'), 10);
  if (img.hasAttribute('height')) canvas.height = parseInt(img.getAttribute('height'), 10);
  img.src = objectUrl;
  img.dataset.heicReplaced = 'true';
}
(async () => {
  if (typeof window.VideoDecoder === 'undefined') return;
  const imgs = Array.from(document.querySelectorAll('img[src$=".HEIC"]'));
  for (const img of imgs) {
    try {
      await replaceHeicImg(img);
    } catch (err) {
      console.error('HEIC replace failed:', err);
    }
  }
})();
