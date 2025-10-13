# Change Log

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

## [Upcoming](https://github.com/uttori/uttori-data-tools/compare/v3.1.2...master)

## [3.2.0](https://github.com/uttori/uttori-data-tools/compare/v3.1.2...v3.2.0) - 2025-10-12

- 🧹 Documentation & Types clean up and corrections
- 🧹 Update ESLint synatx to v9
- 🎁 Update dev dependencies
- 🧰 Add `diff` method to DataBuffer to generate diff operations that can be used to generate various diff formats

```
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

```
=== Example 2: formatDiffHex() ===
00000000 | 48 65 6C 6C  00 6F       | 01001000 01100101 01101100 01101100  00000000 01101111                   | Hell.o
                   +0D +79          |                               ^ ^ ^   ^^^^  ^
00000000 | 48 65 6C 79  79 6F       | 01001000 01100101 01101100 01111001  01111001 01101111                   | Helyyo
```

```
=== Example 4: Binary file comparison ===
00000000 | 00 01 02 03  04 05 06 07  08 09 0A 0B  0C 0D 0E 0F | 00000000 00000001 00000010 00000011  00000100 00000101 00000110 00000111  00001000 00001001 00001010 00001011  00001100 00001101 00001110 00001111 | ................
00000010 | 10 11 12 13  14 15 16 17  18 19 1A 1B  1C 1D 1E 1F | 00010000 00010001 00010010 00010011  00010100 00010101 00010110 00010111  00011000 00011001 00011010 00011011  00011100 00011101 00011110 00011111 | ................
00000020 | 20 21 22 23  24 25 26 27  28 29 2A 2B  2C 2D 2E 2F | 00100000 00100001 00100010 00100011  00100100 00100101 00100110 00100111  00101000 00101001 00101010 00101011  00101100 00101101 00101110 00101111 |  !"#$%&'()*+,-./
          +DF                                                 | ^^ ^^^^^
00000020 | FF 21 22 23  24 25 26 27  28 29 2A 2B  2C 2D 2E 2F | 11111111 00100001 00100010 00100011  00100100 00100101 00100110 00100111  00101000 00101001 00101010 00101011  00101100 00101101 00101110 00101111 | .!"#$%&'()*+,-./
00000030 | 30 31 32 33  34 35 36 37  38 39 3A 3B  3C 3D 3E 3F | 00110000 00110001 00110010 00110011  00110100 00110101 00110110 00110111  00111000 00111001 00111010 00111011  00111100 00111101 00111110 00111111 | 0123456789:;<=>?
```

- 🧰 Add `formatDiffHunks` creates a unified style diff

```
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

```
=== Example 1: [a,b,c] → [a,x,c] ===
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


=== Example 2: Identical sequences [a,b,c] → [a,b,c] ===
Path (should be all diagonal):
   0   1   2   3
 0 o
     \
 1     o
         \
 2         o
             \
 3             o


=== Example 3: Completely different [a,b] → [x,y] ===
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
