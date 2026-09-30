[![view on npm](https://img.shields.io/npm/v/@uttori/data-tools.svg)](https://www.npmjs.com/package/@uttori/data-tools)
[![npm module downloads](https://img.shields.io/npm/dt/@uttori/data-tools)](https://www.npmjs.com/package/@uttori/data-tools)
[![Coverage Status](https://coveralls.io/repos/uttori/uttori-data-tools/badge.svg?branch=master)](https://coveralls.io/r/uttori/uttori-data-tools?branch=master)
[![Tree-Shaking Support](https://badgen.net/bundlephobia/tree-shaking/@uttori/data-tools)](https://bundlephobia.com/result?p=@uttori/data-tools)
[![Dependency Count](https://badgen.net/bundlephobia/dependency-count/@uttori/data-tools)](https://bundlephobia.com/result?p=@uttori/data-tools)
[![Minified + GZip](https://badgen.net/bundlephobia/minzip/@uttori/data-tools)](https://bundlephobia.com/result?p=@uttori/data-tools)
[![Minified](https://badgen.net/bundlephobia/min/@uttori/data-tools)](https://bundlephobia.com/result?p=@uttori/data-tools)

# Uttori Data Tools

Tools for working with binary data.

- **CRC32** - CRC-32/ISO-HDLC (`of` hex, `compute` unsigned) and CRC-32C/Castagnoli (`crc32c`).
- **DataBuffer** - Cursor-based reader and writer for binary formats.
- **DataBitstream** - Read a DataBuffer as a stream of bits.
- **Diff / Myers** - Myers diff. `edits`, `diff`, and `hunks` compare sequences.
- **ImagePNG** - Decode a PNG and encode exact RGBA8, with no quantization.
- **ImageGIF** - Decode GIF87a/GIF89a and encode an exact indexed image.
- **GIFLZW** - Compress and decompress the GIF LZW variant.
- **RgbaSurface** - Mutable straight RGBA8 surface: fill, blit, crop, and bitmap text.
- **BitmapText** - 5×7 caption glyphs. `measure` and `drawBitmapText`.
- **AudioWAV** - Read and write RIFF WAVE and AIFF.
- **AudioMIDI** - Read and write Standard MIDI files.
- **IPS** - Build and apply IPS patches, including the truncate extension.


## Install

```bash
npm install --save @uttori/data-tools
```

* * *

## Examples

```js
import { CRC32 } from '@uttori/data-tools';

CRC32.of('The quick brown fox jumps over the lazy dog');
➜ '414FA339'
CRC32.compute('123456789');
➜ 0xCBF43926
CRC32.crc32c('123456789');
➜ 0xE3069283
```

```js
import { DataBuffer } from '@uttori/data-tools';

const buffer = new DataBuffer([0x34, 0x12]);
buffer.readUInt16(true);
➜ 0x1234
buffer.compare([0x34, 0x12]);
➜ true
```

```js
import { DataBitstream, DataBuffer } from '@uttori/data-tools';

const bits = new DataBitstream(new DataBuffer([0xfc, 0x08]));
bits.readLSB(4);
➜ 12
```

```js
import { edits } from '@uttori/data-tools';

// Op: 0 match, 1 delete, 2 insert
edits(['a', 'b', 'c'], ['a', 'x', 'c']).map((edit) => [edit.op, edit.x]);
➜ [[0, 'a'], [1, 'b'], [2, 'x'], [0, 'c']]
```

```js
import { ImagePNG } from '@uttori/data-tools';

const png = new ImagePNG(ImagePNG.encodeRGBA({
  width: 1,
  height: 1,
  rgba: new Uint8Array([255, 0, 0, 255]),
}));
png.getPixel(0, 0);
➜ [255, 0, 0, 255]
```

```js
import { ImageGIF } from '@uttori/data-tools';

const gif = new ImageGIF(ImageGIF.encodeIndexed({
  width: 1,
  height: 1,
  indexes: new Uint8Array([0]),
  palette: [[255, 0, 0, 255]],
}));
gif.header;
➜ 'GIF89a'
gif.getPixel(0, 0);
➜ [255, 0, 0, 255]
```

```js
import { GIFLZW } from '@uttori/data-tools';

const packed = new GIFLZW([1, 2, 2, 3]).compressBytes(2);
[...new GIFLZW(packed).decompressBytes(2)];
➜ [1, 2, 2, 3]
```

```js
import { BitmapText, RgbaSurface } from '@uttori/data-tools';

const surface = new RgbaSurface(6, 7);
surface.fill([0, 0, 0, 255]).drawText('A', 0, 0, [255, 255, 255, 255]);
surface.rgba[4];
➜ 255
BitmapText.measure('A').width;
➜ 5
```

```js
import { AudioWAV } from '@uttori/data-tools';

const fmt = AudioWAV.encodeFMT({ channels: 1, sampleRate: 8000, bitsPerSample: 8 });
const data = Buffer.alloc(9);
data.write('data', 0, 4, 'ascii');
data.writeUInt32LE(1, 4);
data[8] = 128;
const body = Buffer.concat([fmt, data]);
const wav = AudioWAV.fromFile(Buffer.concat([
  AudioWAV.encodeHeader({ size: body.length }),
  body,
]));
wav.chunks.find((chunk) => chunk.type === 'format').value.sampleRate;
➜ 8000
```

```js
import { AudioMIDI } from '@uttori/data-tools';

const midi = AudioMIDI.convertToMidi({
  bpm: 120,
  tracks: [{ notes: [{ midiNote: 60, ticks: 0, velocity: 100, length: 480 }] }],
});
midi.chunks[0].events[1].data;
➜ { note: 60, velocity: 100, length: 480 }
```

```js
import { DataBuffer, IPS } from '@uttori/data-tools';

const original = new DataBuffer([1, 2, 3, 4]);
const patch = IPS.createIPSFromDataBuffers(original, new DataBuffer([1, 9, 3, 4]));
[...patch.apply(original).data];
➜ [1, 9, 3, 4]
```

## Tree Shaking with ESM Modules

To enable tree-shaking with [RollUp](https://rollupjs.org/), you will likely want to use `replace()` of [@rollup/plugin-replace](https://www.npmjs.com/package/@rollup/plugin-replace) like the following example to get a clean output:

```js
rollup({
  input: './you-entry-file.js',
  plugins: [
    replace({
      'process.env.UTTORI_DATA_DEBUG': 'false',
    }),
  ],
});
```

* * *

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```bash
npm install
npm test
DEBUG=Uttori* npm test
```

## Contributors

- [Matthew Callis](https://github.com/MatthewCallis)

## License

- [MIT](LICENSE)
