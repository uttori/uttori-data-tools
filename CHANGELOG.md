# Change Log

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

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
