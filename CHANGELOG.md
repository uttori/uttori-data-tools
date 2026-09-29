# Change Log

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

## [Upcoming](https://github.com/uttori/uttori-data-tools/compare/v4.1.0...master)

- 🧰 Add `ImageHEIC` for parsing HEIC image metadata from iPhones

## [5.0.0](https://github.com/uttori/uttori-data-tools/compare/v4.1.0...v5.0.0) - 2026-09-24

- 💥 Now using TypeScript

CRC32:

- 💥 CRC32 now hashes `Buffer` inputs without copying; callers requiring snapshot behavior must copy or synchronize input data explicitly
- 💥 Internal slicing tables are snapshots; mutating exported lookup tables no longer changes checksum calculations
- 🧰 Add `CRC32.compute` for unsigned CRC-32 / ISO-HDLC and `CRC32.crc32c` for Castagnoli CRC-32C, optimize
- 🧰 Add `CRC32.computeBytes` & `CRC32.crc32cBytes` for already-normalized `Uint8Array` & `Buffer` inputs, skipping input conversion and runtime validation
- 🛠 Optimize CRC-32 / ISO-HDLC with slicing-by-8, private `Uint32Array` lookup tables, cached table references & loop lengths
- 🛠 Optimize CRC-32C / Castagnoli table lookups & loop bounds while preserving `zeroChecksum` handling without modifying input data
- 🛠 Avoid temporary `DataBuffer` instances for `Buffer`, `Uint8Array` & existing `DataBuffer` inputs, and reuse a lazily initialized `TextEncoder` for UTF-8 strings
- 🎁 Add regression tests for reference checksums, random inputs, slicing boundaries, nonzero-offset views, UTF-8 strings, invalid inputs, return formats & checksum zeroing

ImagePNG:

- 💥 Change `ImagePNG.pixels` to unpacked native samples: `Uint8Array` for 1 / 2 / 4 / 8-bit samples and palette indexes, `Uint16Array` for 16-bit samples
- 💥 Copy PNG input by default, use `copyInput: false` to explicitly borrow the original byte view
- 🧰 Add `ImagePNG.encodeIndexed` & `ImagePNG.createIndexedPng` for writing 1 / 2 / 4 / 8-bit indexed PNGs without palette reordering, quantization or duplicate color removal
- 🧰 Add `ImagePNG.encodeRGBA` for writing RGBA8 PNGs, with configurable compression levels and `none`, `sub` or `adaptive` filtering for both encoders
- 🧰 Add `ImagePNG.rewriteIndexed` & `ImagePNG.rewriteIndexedPng` for palette, pixel and canvas edits, preserving exact bytes for unchanged edits and original `IDAT` bytes, including Adam7, for palette-only changes
- 🧰 Preserve safe-to-copy ancillary chunks during indexed edits, with explicit retention available for unsafe chunks after caller validation
- 🧰 Add `ImagePNG.toIndexed`, `ImagePNG.toRGBA` & `ImagePNG.getPixelInto` for explicit indexed / RGBA conversion and reusable pixel output buffers
- 🧰 Add configurable input, pixel, inflated data, output and chunk count limits, with optional rejection of 16-bit input
- 🧰 Detect animated PNGs and reject them by default, with an explicit `animation: 'default-image'` option for reading the default image without decoding animation frames
- 🧰 Add `RgbaSurface` for RGBA fills, clipped copy and source-over blits, cloning, cropping, flipping, nearest-neighbor scaling in both directions and clipped line drawing, including overlapping buffer support
- 🧰 Add `BitmapText` and surface text methods for measurable 5×7 captions, multiline layout, integer scaling, ASCII lowercase mapping and unsupported character fallback
- 🛠 Cache decoded pixels with `_decoded`, add forced decoding and explicit invalidation, and reset metadata and cached pixels when parsing again
- 🛠 Reduce PNG allocations with reusable scanline buffers, IDAT payload views and bulk row copies, and calculate numeric CRCs without hexadecimal conversion
- 🛠 Keep PNG decoding, encoding and indexed editing in `ImagePNG`, reusing `DataBuffer` for binary reads, writes and cursor operations
- 🪲 Validate chunk CRCs, lengths, ordering, required chunks, palette references and color type / bit depth combinations instead of accepting malformed PNG data
- 🪲 Fix non-interlaced scanline destination offsets and unpack 1 / 2 / 4-bit grayscale samples and palette indexes without treating packed samples as whole bytes
- 🪲 Fix Adam7 sample placement and packed row handling, including tiny images, odd dimensions and empty passes
- 🪲 Fix 16-bit pixel conversion and grayscale / truecolor transparency, comparing native transparency keys before rounding samples to RGBA8
- 🪲 Reject invalid filters, truncated or oversized inflated data, incomplete zlib streams and trailing or concatenated compressed streams without exposing partially decoded pixels
- 🪲 Fix `pHYs` metadata to retain its original pixels-per-unit values instead of converting to inches while retaining the meter unit label
- 🧹 Update TypeScript types and JSDoc for the extended image APIs

DataBuffer:

- 🛠 Optimize `DataBuffer` numeric reads & peeks with a cached, bounded `DataView` that refreshes when the backing data changes
- 🛠 Optimize `compare()` with early range checks and fewer allocations, preserving non-empty region matching
- 🛠 Remove redundant byte copies from copy operations & `diff()`, and cache native endianness detection & the checksum brand once per module
- 🛠 Standardize case-insensitive encoding names & aliases across string reads, peeks & writes; unknown encodings now consistently throw
- 🪲 Fix bounds validation for negative, fractional, non-finite & unsafe offsets and lengths, preventing reads outside the supplied view
- 🪲 Fix reads bypassing committed-data bounds in writing mode while preserving growable writes & separate staging
- 🪲 Fix advancing writes to end at the supplied offset plus the number of bytes written, preserving the cursor when `advance` is `false`
- 🪲 Fix overlapping `writeBytes()` calls corrupting unread source values or indefinitely extending the staging array
- 🪲 Fix failed 24bit reads partially advancing the cursor; validate all three bytes before reading
- 🪲 Fix string length handling: zero reads nothing, omitted lengths read the remainder from the supplied offset, and `null` reads through the terminator
- 🪲 Fix string decoding crossing field boundaries or incorrectly advancing the cursor; failed decodes now leave the cursor unchanged
- 🪲 Fix malformed & incomplete UTF-8 decoding with `U+FFFD` replacement, and unpaired surrogate encoding consuming the next character
- 🪲 Fix UTF-16 BOM detection & writing, preserve the first character when no BOM is present, and consistently reject incomplete code units & invalid surrogate pairs when decoding
- 🪲 Fix large-string decoding exceeding argument limits by assembling output in bounded chunks
- 🪲 Fix `copy()`, `slice()`, `read()`, `peek()`, `readBuffer()` & `peekBuffer()` returning shared storage inconsistently between `Buffer` & `Uint8Array`
- 🪲 Fix Float48 reads ignoring explicit endianness and UInt32 writes staging a negative high byte
- 🪲 Fix `commit()` leaving `lengthInBytes` stale and release the cached numeric view when committed data is replaced
- 🪲 Reject invalid constructor sizes, spoofed typed-array inputs & invalid movement / write ranges before mutating state
- 🧹 Documentation & Types corrections for string lengths, copy ownership, staging, wider typed arrays & single-byte `peekBit()` behavior
- 🎁 Update existing test expectations & expand `DataBuffer` coverage including invalid ranges, malformed strings, overlapping writes, copy isolation, cache invalidation & staging compatibility

### CRC32 Benchmarks

Original implementation compared with the full optimized JavaScript implementation using the existing `compute` & `crc32c` APIs, not the new byte-only helpers.

Measured with Node.js v22 on Linux x64.

Per-call results are medians of nine samples. The 1 million-call result is a median of five samples. The 50 million-call result is one measured batch, not an extrapolation. Speedups are calculated before rounding.

| Operation / Input | Original | Optimized | Speedup |
| --- | ---: | ---: | ---: |
| `compute`, 32-byte `Buffer` | 1,707.6 ns/call | 33.0 ns/call | 51.7× |
| `compute`, 256-byte `Buffer` | 7,837.2 ns/call | 212.7 ns/call | 36.9× |
| `compute`, 1 KiB `Buffer` | 12,010.1 ns/call | 805.7 ns/call | 14.9× |
| `compute`, 4 KiB `Buffer` | 54,029.1 ns/call | 3,236.9 ns/call | 16.7× |
| `compute`, 64 KiB `Buffer` | 761,036.6 ns/call | 54,433.7 ns/call | 14.0× |
| `compute`, 32-byte ASCII string | 2,149.5 ns/call | 824.3 ns/call | 2.6× |
| `crc32c`, 32-byte `Buffer` | 1,067.2 ns/call | 34.1 ns/call | 31.3× |
| `crc32c`, 4 KiB `Buffer` | 8,946.9 ns/call | 4,020.1 ns/call | 2.2× |
| `crc32c`, 4 KiB `Buffer`, `zeroChecksum = true` | 9,423.9 ns/call | 3,548.8 ns/call | 2.7× |
| `compute`, 32-byte `Buffer`, 1 million calls | 1.320 s total | 0.037 s total | 36.1× |
| `compute`, 32-byte `Buffer`, 50 million calls | 72.872 s total | 1.959 s total | 37.2× |

### ImagePNG Benchmarks

Historical measurements from the initial implementation, before the later `ImagePNG` / `DataBuffer` revisions.

Median milliseconds per operation over 9 timed rounds after warm-up.

Measured with Node.js v22 on Linux x64, using Pako v1.0.11.

| Operation / Input | Original (ms) | Optimized (ms) | Speedup |
|---|---:|---:|---:|
| Decode RGBA8 64×64 tiles | 0.500 | 0.091 | 5.51× |
| Decode RGBA8 256×256 tiles | 7.516 | 0.789 | 9.52× |
| Decode RGBA8 512×512 noise | 34.327 | 7.756 | 4.43× |
| Decode indexed1 512×512 | 3.798 | 0.970 | 3.92× |
| Decode indexed4 512×512 | 4.536 | 1.060 | 4.28× |
| Decode indexed8 512×512 | 14.508 | 1.007 | 14.41× |
| Decode Adam7 indexed4 512×512 | 4.530 | 1.456 | 3.11× |
| Rewrite palette-only Adam7 512×512 | 9.292 | 3.779 | 2.46× |
| Rewrite unchanged Adam7 512×512 | 7.418 | 3.642 | 2.04× |
| Preview RGBA8 1024×512 → 256×128 | 3.150 | 1.735 | 1.82× |
| Surface fill 1024×512 | No baseline | 0.049 | — |
| Surface nearest downscale 1024×512 → 256×128 | No baseline | 0.069 | — |
| Surface nearest upscale 128×64 → 512×256 | No baseline | 0.267 | — |
| Surface self-blit 1024×512 | No baseline | 0.621 | — |
| Caption measure + draw | No baseline | 0.013 | — |

### DataBuffer Benchmarks

Measured with Node.js v22 on Linux x64

Median batch durations from five measured samples after three warmup batches, with separate processes for each implementation / workload and bounds validation enabled in the updated implementation.

The early-mismatch result reflects avoided wrapper construction, growing-array writes showed no meaningful improvement.

| Operation / Input | Operations per sample | Original | Optimized | Speedup |
| --- | ---: | ---: | ---: | ---: |
| UInt32 BE reads | 10,000,000 | 1,025.7 ms | 152.1 ms | 6.75× |
| UInt32 LE reads | 10,000,000 | 988.2 ms | 147.0 ms | 6.72× |
| Float64 LE reads | 10,000,000 | 986.2 ms | 117.1 ms | 8.42× |
| Equal 64-byte `Buffer` region comparisons | 1,000,000 | 1,507.2 ms | 102.5 ms | 14.71× |
| Equal 64-byte `DataBuffer` region comparisons | 1,000,000 | 1,291.2 ms | 97.4 ms | 13.25× |
| `Buffer` comparison, first byte differs | 1,000,000 | 1,207.5 ms | 11.7 ms | 103.53× |
| Grow a new 4 MiB staging array, 256-byte writes | 3 files | 270.4 ms | 271.7 ms | 1.00× |
| Copy 64 KiB | 2,000 | 27.6 ms | 11.7 ms | 2.36× |
| Decode a valid 1,216-byte UTF-8 string | 10,000 | 85.0 ms | 68.2 ms | 1.25× |


## [4.1.0](https://github.com/uttori/uttori-data-tools/compare/v4.0.0...v4.1.0) - 2026-09-24

- 🛠 Switch from `zlib` to `pako` for the same experience in Node & Browser
- 🛠 Use `new TextEncoder().encode(input)` instead of `Buffer.from(input)` for better cross environment support
- 🛠 Optimize a MIDI parse object
- 🎁 Update dev dependencies
- 🎁 Update tests and fix warnings
- 🪲 Fix `SMPL` chunk parsing to be 32bit and not 8bit reads

## [4.0.0](https://github.com/uttori/uttori-data-tools/compare/v3.2.0...v4.0.0)

- 🧰 Add `readNullTerminatedString`, `peekNullTerminatedString`, and `decodeNullTerminatedString` for handling null terminated strings, configurable null bytes supported
- 🧰 Add `convertFromIeeeExtended` for reading IEEE 754 extended precision floats, exposed as `readFloatIEEE754` on `DataBuffer` and `DataStream`
- 🧰 Add `AudioWAV` for parsing WAVE & AIFF audio files and various chunks, migrated from `@uttori/audio-wav`
- 🧰 Add `AudioMIDI` for parsing MIDI audio files, migrated from `@uttori/audio-midi`
- 🛠 Reading methods refactored for better `UnderflowError` protection
- 🛠 Overall less allocations when reading & writing
- 🧹 Documentation & Types clean up
- 🧹 Bump Node to v26.3.0
- 🧹 Migrate to [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)
- 🎁 Update dev dependencies
- 🎁 Update tests and fix warnings

## [3.2.0](https://github.com/uttori/uttori-data-tools/compare/v3.1.2...v3.2.0) - 2025-10-17

- 🧹 Documentation & Types clean up and corrections
- 🧹 Update ESLint synatx to v9
- 🎁 Update dev dependencies
- 🧰 Add `ImageGIF` for parsing GIF images and `GIFLZW` for decompressing GIF data and a general LZW implemenation

```js
const image_data = await fs.readFile('./test/image/assets/sundisk04.gif');
const image = ImageGIF.fromFile(image_data);
image.decodePixels();
const length = image.pixels.length; // ➜ 65536
const pixel = image.getPixel(0, 0); // ➜ [255, 254, 254, 255]
```

- 🧰 Add `ImagePNG` for parsing PNG images

```js
fetch('PNG_transparency_demonstration_1.png')
  .then((r) => r.arrayBuffer())
  .then((buffer) => {
    const image = ImagePNG.fromFile(buffer);
    image.decodePixels();
    console.log('Image', image);
  });
```

- 🧰 Add `IPS` class for creating and applying IPS patch files with truncate support.

```js
const data = await fs.readFile('Chrono Trigger - JP Title Screen (hack).ips');
const patch = new IPS(data, true);
// patch.parse(); // Or called manutally when created with `new IPS(data, false)`
const original = await fs.readFile('Chrono Trigger (USA).sfc');
const patched = patch.apply(new DataBuffer(original));
patched.commit();
await fs.writeFile('Chrono Trigger - JP Title Screen (hack).sfc', Buffer.from(patched.data));
```

- 🧰 Add `isNextBytes` to DataBuffer to compare an array of bytes as the next few bytes in the upcoming data.
- 🧰 Add `diff` method to DataBuffer to generate diff operations that can be used to generate various diff formats

```js
const buffer1 = new DataBuffer([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
const buffer2 = new DataBuffer([0x48, 0x65, 0x79, 0x79, 0x6F]); // "Heyyo"
const edits = buffer1.diff(buffer2);

=== Example 1: DataBuffer.diff() ===
Number of edits: 7
Edits: [
  { op: 0, x: 72, y: 72 },
  { op: 0, x: 101, y: 101 },
  { op: 1, x: 108, y: 108 },
  { op: 1, x: 108, y: 108 },
  { op: 2, x: 121, y: 121 },
  { op: 2, x: 121, y: 121 },
  { op: 0, x: 111, y: 111 }
]
```

- 🧰 Add `formatDiffHex` to format a standard-ish hexadeximal view with option binary and ASCII output that shows the changes as the delta between the two in a row between the old on top and the new on bottom.

```sh
=== Example 2: formatDiffHex() ===
00000000 | 48 65 6C 6C  00 6F       | 01001000 01100101 01101100 01101100  00000000 01101111                   | Hell.o
                   +0D +79          |                               ^ ^ ^   ^^^^  ^
00000000 | 48 65 6C 79  79 6F       | 01001000 01100101 01101100 01111001  01111001 01101111                   | Helyyo
```

```sh
=== Example 4: Binary file comparison ===
00000000 | 00 01 02 03  04 05 06 07  08 09 0A 0B  0C 0D 0E 0F | ................
00000010 | 10 11 12 13  14 15 16 17  18 19 1A 1B  1C 1D 1E 1F | ................
00000020 | 20 21 22 23  24 25 26 27  28 29 2A 2B  2C 2D 2E 2F |  !"#$%&'()*+,-./
          +DF                                                 |
00000020 | FF 21 22 23  24 25 26 27  28 29 2A 2B  2C 2D 2E 2F | .!"#$%&'()*+,-./
00000030 | 30 31 32 33  34 35 36 37  38 39 3A 3B  3C 3D 3E 3F | 0123456789: ;<=>?
```

- 🧰 Add `formatDiffHunks` creates a unified style diff

```sh
=== Example 3: formatDiffHunks() ===
Number of hunks: 1
@@ -2,11 +2,10 @@
 48  H
 65  e
-6C  l
-6C  l
-6F  o
+79  y
 20
 57  W
 6F  o
 72  r
 6C  l
 64  d
+21  !
```

- 🧰 Add `formatMyersGraph` is more for educaitonal purposes but renders the diagnols out of a Myers style diff

```sh
=== Example 1: [a,b,c] ➜ [a,x,c] ===
Path taken:
   0   1   2   3
 0 o
     \
 1     o---o
           |
 2         o
             \
 3             o

Full grid (diagonals at (0,0) and (2,2)):
   0   1   2   3
 0 o---o---o---o
   | \ |   |   |
 1 o---o---o---o
   |   |   |   |
 2 o---o---o---o
   |   |   | \ |
 3 o---o---o---o


=== Example 2: Identical sequences [a,b,c] ➜ [a,b,c] ===
Path (should be all diagonal):
   0   1   2   3
 0 o
     \
 1     o
         \
 2         o
             \
 3             o


=== Example 3: Completely different [a,b] ➜ [x,y] ===
Path (no diagonals):
   0   1   2
 0 o---o---o
           |
 1         o
           |
 2         o

Full grid (no diagonals at all):
   0   1   2
 0 o---o---o
   |   |   |
 1 o---o---o
   |   |   |
 2 o---o---o
```

## [3.1.2](https://github.com/uttori/uttori-data-tools/compare/v3.1.1...v3.1.2) - 2025-01-15

- 🧹 Documentation & Types clean up and corrections
- 🎁 Update dev dependencies

## [3.1.1](https://github.com/uttori/uttori-data-tools/compare/v3.1.0...v3.1.1) - 2024-08-29

- 🧹 Documentation & Types clean up
- 🎁 Update dev dependencies

## [3.1.0](https://github.com/uttori/uttori-data-tools/compare/v3.0.0...v3.1.0) - 2024-08-29

- 🧹 Documentation & Types clean up
- 🎁 Update dev dependencies
- 🎁 Update tests and fix warnings

## [3.0.0](https://github.com/uttori/uttori-data-tools/compare/v2.4.0...v3.0.0) - 2024-01-25

- 💥 BREAKING CHANGES!
- 💥 ESM only, no more CommonJS support
- 💥 Node v20 or higher required
- 🧰 Add `formatTable` to format a 2 dimentional array as an ASCII table
- 🧹 Documentation & Types clean up
- 🎁 Update dev dependencies
- 🎁 Update tests and fix warnings

## [2.4.0](https://github.com/uttori/uttori-data-tools/compare/v2.3.0...v2.4.0) - 2022-05-30

- 🎁 Update dev dependencies
- 🧰 Add `ShiftJIS` class for reading and parsing Shift-JIS enocded text

## [2.3.0](https://github.com/uttori/uttori-data-tools/compare/v2.2.0...v2.3.0) - 2021-12-20

- 🎁 Update dev dependencies
- 🧰 Add `DataBuffer` methods for reading, parsing & writing data without the need for wrapping in a `DataStream`
- 🧰 Allow hex table formatter to format complex encodings with the additon of state and access to the data directly
- 💀 Removed `LZW` library, use [lzw.js](https://github.com/antonylesuisse/lzwjs/blob/master/lzw.js) or something similar

## [2.2.0](https://github.com/uttori/uttori-data-tools/compare/v2.1.0...v2.2.0) - 2021-06-25

- 🎁 Update dev dependencies
- 🧹 Documentation & Types clean up
- 🧰 Add `hexTable` function for debugging with a customizable hex editor like output:

```text
| 76543210 | 00010203 04050607 08090A0B 0C0D0E0F | 0123456789ABCDEF |
|----------|-------------------------------------|------------------|
| 00000000 | 1A45DFA3 A3428681 0142F781 0142F281 |  E...B.. B.. B.. |
| 00000010 | 0442F381 08428288 6D617472 6F736B61 |  B.. B..matroska |
| 00000020 | 42878104 42858102 18538067 01000000 | B.. B..  S.g     |
| 00000030 | 01736F24 114D9B74 C2BF841C 4BB4E14D |  so$ M.t... K..M |
| 00000040 | BB8B53AB 841549A9 6653AC81 A14DBB8B | ..S.. I.fS...M.. |
| 00000050 | 53AB8416 54AE6B53 AC81F14D BB8C53AB | S.. T.kS...M..S. |
| 00000060 | 841254C3 6753AC82 019C4DBB 8E53AB84 | . T.gS.. .M..S.. |
| 00000070 | 1C53BB6B 53AC8401 736DD8EC 01000000 |  S.kS.. sm..     |
```

## [2.1.0](https://github.com/uttori/uttori-data-tools/compare/v2.0.2...v2.1.0) - 2021-04-04

- 🎁 Update dev dependencies
- 🧰 Add `formatBytes` function for formating byte sizes
- 🛠 Allow `DataBufferList` to be constructed with an array of DataBuffers
- 🛠 Convert `LZW` to an object instead of a static method only class
- 🧹 Documentation & Types clean up

## [2.0.2](https://github.com/uttori/uttori-data-tools/compare/v2.0.1...v2.0.2) - 2021-01-14

- 🎁 Update dev dependencies
- 🛠 Add `"sideEffects": false` to the package.json

## [2.0.1](https://github.com/uttori/uttori-data-tools/compare/v2.0.0...v2.0.1) - 2021-01-07

- 🛠 Tweak Tree Shaking, add [Subpath Exports](https://nodejs.org/api/packages.html#packages_subpath_exports)

## [2.0.0](https://github.com/uttori/uttori-data-tools/compare/v1.7.0...v2.0.0) - 2021-01-07

- 🧰 Add ESM Support
- 🛠 CRC32: simplify code
- 🛠 DataStream: edge case on length check
- 🧹 Check Tree Shaking
- 🧹 Documentation & Types clean up

## [1.7.0](https://github.com/uttori/uttori-data-tools/compare/v1.5.0...v1.7.0) - 2021-01-01

- 🎁 Update dev dependencies
- 🛠 Make `debug` an optional dependency
- 🛠 Add more types
- 🛠 Add `moreAvailable` check to `DataBufferList` instances and tweak logic
- 🧹 Drop Node v10 testing on Travis

## [1.5.0](https://github.com/uttori/uttori-data-tools/compare/v1.5.0...v1.6.0) - 2020-11-15

- 🎁 Update dev dependencies
- 🧰 Add very simple `LZW` class

## [1.5.0](https://github.com/uttori/uttori-data-tools/compare/v1.4.0...v1.5.0) - 2020-11-12

- 🎁 Update dev dependencies
- 🧰 Add `availableAt` checks if a given number of bytes are avaliable after a given offset in the stream
- 🧰 Add support for parsing Delphi Real48 / Turbo Pascal numbers as `float48`, see the Data Stream docs for more info
- 🛠 `peek(bits, signed = false)` signed defaults to `false`
- 🛠 Removed optional offset on `peek` methods
- 🛠 `readString` defaults to read from the current offset rather than `0`
- 🛠 `decodeString` edge case issues fixed from real world use in ImagePNG and ImageGIF
- 🛠 `decodeString` defaults to setting length to the reamining bytes rather than `Infinity`
- 🛠 `decodeString` advances the buffer by the length read, not the offset
- 🧹 Clean up tests for the above changes

## [1.4.0](https://github.com/uttori/uttori-data-tools/compare/v1.3.0...v1.4.0) - 2020-07-09

- 🧰 Add `peekBit(position, [length], [offset])` to read the bits from the bytes at the provided offset and return the value.

## [1.3.0](https://github.com/uttori/uttori-data-tools/compare/v1.2.1...v1.3.0) - 2020-07-09

- 🎁 Update dev dependencies
- 🛠 The `next` method no longer throws an error when insufficient bytes are avaliable
- 🗒 Generate Markdown docs in the `/docs`

## [1.2.1](https://github.com/uttori/uttori-data-tools/compare/v1.2.0...v1.2.1) - 2020-07-08

- 🧾 Update types to include `next`

## [1.2.0](https://github.com/uttori/uttori-data-tools/compare/v1.1.0...v1.2.0) - 2020-07-08

- 🎁 Update dev dependencies
- 🧰 Add `next` method to compare input data against the upcoming data, byte by byte
- 🧾 Add debug logging to `advance`

## [1.1.0](https://github.com/uttori/uttori-data-tools/compare/v1.0.0...v1.1.0) - 2020-07-07

- 🎁 Update dev dependencies
- 🧰 Add `fromBytes` and `fromData` to DataBitstream
- 🗒 Clean up documentation defaults

---

## Previous AudioWAV Changelog

## [3.0.0](https://github.com/uttori/uttori-audio-wave/compare/v2.1.0...v3.0.0) - 2023-01-10

- 🧰 Add Support for `AIFF` files and variants like `AIFC`
- 🎁 Update dev dependencies

## [2.1.0](https://github.com/uttori/uttori-audio-wave/compare/v2.0.0...v2.1.0) - 2021-04-04

- 🧰 Add Support for `PEAK`, `PAD`, and `STRC` (ACID Related) chunks (incomplete)
- 🧰 Add identification for `AFAn`, `AFmd`, seems to be the result of a `NSKeyedArchiver`
- 🧰 Add identification for `minf`, `elm1`, `regn`, `ovwf`, `umid`, ProTools Special chunks
- 🛠 Fix issue with infinite loop on some _rare_ broken tags
- 🛠 Fix `FACT` output with actual `numberOfSamples` output
- 🧹 Documentation & Types clean up
- 🎁 Update dev dependencies

## [2.0.0](https://github.com/uttori/uttori-audio-wave/compare/v1.6.1...v2.0.0) - 2021-01-18

- 🧰 Add ESM Support
- 🛠 Add `"sideEffects": false` to the package.json
- 🛠 Tree Shaking, added [Subpath Exports](https://nodejs.org/api/packages.html#packages_subpath_exports)
- 🛠 Fixes for browser compatibility
- 🧹 Documentation & Types clean up
- 🎁 Update dev dependencies
