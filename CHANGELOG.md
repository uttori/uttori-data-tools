# Change Log

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

## [Upcoming](https://github.com/uttori/uttori-data-tools/compare/v4.1.0...master)

- 🧰 Add `ImageHEIC` for parsing HEIC image metadata from iPhones

## [5.0.0](https://github.com/uttori/uttori-data-tools/compare/v4.1.0...v5.0.0) - 2026-09-29

Massive overhaul for some more modern applications.

- 💥 Now using TypeScript
- 💥 Removed `DataStream` and `DataBufferList`

CRC32:

- 💥 CRC32 now hashes `Buffer` inputs without copying, callers requiring snapshot behavior must copy or synchronize input data explicitly
- 💥 Internal slicing tables are snapshots, mutating exported lookup tables no longer changes checksum calculations
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

ImageGIF:

- 💥 Enable strict parsing by default, retaining `strict: false` for documented compatibility cases without allowing out-of-bounds reads or unsafe pixel decoding
- 💥 Copy GIF input by default, use `copyInput: false` to explicitly borrow the source byte view
- 💥 Store parsed image descriptor `lzwData` as `Uint8Array`, retaining replacement `number[]` support and the array-returning `decodeDataSubBlocks()` compatibility API
- 🧰 Add `ImageGIF.toIndexed`, `ImageGIF.toRGBA` & `ImageGIF.getPixelInto` for explicit native-index / RGBA conversion and reusable pixel output buffers, preserving duplicate & unused palette slots
- 🧰 Return the existing `RgbaSurface` from RGBA conversion & frame rendering, reusing shared fills, blits, cropping, flipping, nearest-neighbor scaling, line drawing & text methods without duplicating surface operations
- 🧰 Add `ImageGIF.decodeFrame` & `ImageGIF.decodeFrames` for composited animation snapshots, supporting frame positions, local palettes, transparency & disposal methods 0 / 1 / 2 / 3, with independently owned output surfaces
- 🧰 Add `ImageGIF.encodeIndexed` & `ImageGIF.createIndexedGif` for indexed GIF encoding without palette reordering, quantization or duplicate color removal, padding color tables to valid power-of-two sizes
- 🧰 Add `ImageGIF.encodeRGBA` with deterministic first-use palette assignment, rejecting partial alpha, more than 256 exact colors & multiple distinct RGB colors beneath zero alpha instead of silently quantizing or normalizing pixels
- 🧰 Add `ImageGIF.encodeIndexedFrames` for animation encoding with per-frame palettes, positions, delays, disposal, user-input flags & interlacing, plus logical-screen dimensions & loop counts
- 🧰 Add `ImageGIF.rewriteIndexed` & `ImageGIF.rewriteIndexedGif` for same-slot palette, pixel, dimension, delay & disposal edits, validating all source raster frames and returning an exact owned copy for unchanged edits
- 🧰 Preserve original compressed sub-blocks for palette-only edits, including interlacing & sub-block boundaries, isolate palette changes with local tables, recompress only pixel-edited frames & retain other extensions as raw bytes
- 🧰 Add configurable input, per-image pixel, aggregate native-pixel, encoded-output, rendered-memory, frame-count & block-count limits, checking dimensions and budgets before decoding or allocating output
- 🧰 Add explicit `auto`, `transparent` & `logical-screen` background policies, and require `plainText: 'ignore'` for raster-only compositing past unsupported text / graphic-rendering extensions
- 🛠 Cache native pixels per frame, add forced decoding & explicit invalidation, and reset the cursor, metadata, frame associations & cached pixels when parsing again
- 🛠 Decode LZW directly to byte indexes, join validated sub-block payloads with bulk copies into one allocation & replace temporary `DataBitstream` flag decoding with bit masks
- 🪲 Fix unsigned logical-screen dimensions, packed fields, background indexes & pixel aspect ratios, and preserve global color-table bytes in file order instead of reversing the palette
- 🪲 Fix active local-palette selection, frame-local pixel strides & GIF interlace row ordering, keeping native image rectangles separate from the composited logical screen
- 🪲 Fix disposal bit masking & retain transparency, user-input flags and raw hundredths-of-a-second delays, associate each graphic control with its target rendering block without leaking it into later frames
- 🪲 Parse application & unknown extension payloads by sub-block lengths instead of scanning for zero bytes, retaining binary payloads, application identifiers & recognized loop counts
- 🪲 Propagate strict descriptor errors instead of swallowing them, and validate headers, tables, extension sizes, terminators, rectangles, reserved fields, trailers & duplicate or dangling graphic controls
- 🪲 Reject missing palettes during pixel decoding, invalid palette references, truncated LZW data & decoded pixel-count mismatches without caching partially decoded pixels
- 🪲 Decode `getPixel()` lazily and support explicit frame-local or logical-screen coordinates, validating coordinates & destination buffer ranges before writing
- 🧹 Update GIF-specific TypeScript types & JSDoc for ownership, native indexes, rendering, animation, encoding, editing & compatibility policies, and guard optional debug loading when `process` is unavailable
- 🎁 Update existing tests and add regression cases covering malformed framing, palette identity, transparency, interlacing, frame disposal, cache invalidation, ownership, limits, encoding & indexed rewriting

GIFLZW:

- 💥 Require GIF minimum code sizes in the range 2–8 and low-level packed widths in the range 1–12, rejecting the former minimum-code-size-12 behavior
- 💥 Rewind complete compression & decompression operations automatically, use an exact input subview for embedded streams rather than an initial nonzero cursor
- 💥 Reject complete trailing bytes after EOI by default, with explicit `allowTrailingBytes: true` compatibility support while accepting unused high bits in the final byte
- 🧰 Add `GIFLZW.compressBytes` & `GIFLZW.decompressBytes` for typed-byte processing, retaining the legacy array-returning `compress()` & byte-string-returning `decompress()` APIs
- 🧰 Add configurable input / output byte limits & optional exact `expectedLength` validation, enforcing output limits before buffer growth or writes
- 🛠 Replace hot-path string dictionaries with numeric encoder keys, fixed-size typed prefix / suffix tables & a bounded decoder stack, retaining `buildDictionary()` as a compatibility helper
- 🛠 Replace per-bit hot-path packing & unpacking with bit accumulators, use byte fragments in the public helpers & grow typed output buffers only as needed
- 🪲 Fix code-width transitions, including EOI immediately after a dictionary-growth boundary, while preserving repeated clear codes & empty streams
- 🪲 Validate dictionary references & the KwKwK case, stop dictionary growth at 4,096 entries & support decoding a full frozen dictionary until a deferred clear arrives
- 🪲 Bound code reads, reject missing clear / EOI codes, truncated streams & invalid input values, and prevent malformed dictionary chains from producing invalid output
- 🪲 Fix `pack()` to replace existing bits rather than add to them, and validate `unpack()` widths, input bytes & available bits before advancing the cursor
- 🧹 Update TypeScript types & JSDoc for byte APIs, cursor behavior, limits & trailing-byte policies, and guard optional debug loading when `process` is unavailable
- 🎁 Update existing tests & add regression cases for code-size boundaries, repeated operations, bit overwrites, truncation, invalid codes, dictionary saturation, deferred clears & output limits

DataBuffer:

- 🛠 Optimize `DataBuffer` numeric reads & peeks with a cached, bounded `DataView` that refreshes when the backing data changes
- 🛠 Optimize `compare()` with early range checks and fewer allocations, preserving non-empty region matching
- 🛠 Remove redundant byte copies from copy operations & `diff()`, and cache native endianness detection & the checksum brand once per module
- 🛠 Standardize case-insensitive encoding names & aliases across string reads, peeks & writes, unknown encodings now consistently throw
- 🪲 Fix bounds validation for negative, fractional, non-finite & unsafe offsets and lengths, preventing reads outside the supplied view
- 🪲 Fix reads bypassing committed-data bounds in writing mode while preserving growable writes & separate staging
- 🪲 Fix advancing writes to end at the supplied offset plus the number of bytes written, preserving the cursor when `advance` is `false`
- 🪲 Fix overlapping `writeBytes()` calls corrupting unread source values or indefinitely extending the staging array
- 🪲 Fix failed 24bit reads partially advancing the cursor, validate all three bytes before reading
- 🪲 Fix string length handling: zero reads nothing, omitted lengths read the remainder from the supplied offset, and `null` reads through the terminator
- 🪲 Fix string decoding crossing field boundaries or incorrectly advancing the cursor, failed decodes now leave the cursor unchanged
- 🪲 Fix malformed & incomplete UTF-8 decoding with `U+FFFD` replacement, and unpaired surrogate encoding consuming the next character
- 🪲 Fix UTF-16 BOM detection & writing, preserve the first character when no BOM is present, and consistently reject incomplete code units & invalid surrogate pairs when decoding
- 🪲 Fix large-string decoding exceeding argument limits by assembling output in bounded chunks
- 🪲 Fix `copy()`, `slice()`, `read()`, `peek()`, `readBuffer()` & `peekBuffer()` returning shared storage inconsistently between `Buffer` & `Uint8Array`
- 🪲 Fix Float48 reads ignoring explicit endianness and UInt32 writes staging a negative high byte
- 🪲 Fix `commit()` leaving `lengthInBytes` stale and release the cached numeric view when committed data is replaced
- 🪲 Reject invalid constructor sizes, spoofed typed-array inputs & invalid movement / write ranges before mutating state
- 🧹 Documentation & Types corrections for string lengths, copy ownership, staging, wider typed arrays & single-byte `peekBit()` behavior
- 🎁 Update existing test expectations & expand `DataBuffer` coverage including invalid ranges, malformed strings, overlapping writes, copy isolation, cache invalidation & staging compatibility
- 💥 Move `DataBuffer.diff()` to `diffBuffer()` in `data-buffer-helpers`. Import `diffBuffer` to compare buffers, `DataBuffer` no longer pulls in Myers

```js
import { DataBuffer, diffBuffer } from '@uttori/data-tools';

const buffer1 = new DataBuffer([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
const buffer2 = new DataBuffer([0x48, 0x65, 0x79, 0x79, 0x6F]); // "Heyyo"
const edits = diffBuffer(buffer1, buffer2);
```

AudioWAV:

- 💥 Reset `parse()` to byte zero, clear existing chunks & errors in place, and discard cached format / size metadata before parsing again
- 💥 Change AIFF `SSND` entries to `sound_data` & `FVER` entries to `format_version`, only `COMM` retains the `common` type
- 💥 Limit decompressed `ResU` JSON to 16 MiB by default, you can use `maxResUSize` to configure the uncompressed byte budget
- 🧰 Add structured parsing diagnostics through `audio.errors` with byte offsets & messages, replacing unconditional console logging, and add `strict: true` for fail-fast structural checks while retaining permissive recovery by default
- 🛠 Remove `DataBufferList` usage from both factories & the unused intermediate `DataBuffer` from `fromFile()`, avoiding linked-buffer metadata changes in `fromBuffer()` without changing `DataBuffer` itself
- 🛠 Reduce redundant `Buffer` copies in standalone decoders with bounded byte views, and cache format / sample-count metadata instead of repeatedly searching parsed chunks
- 🛠 Remove eager JSON serialization & hexadecimal buffer formatting from debug calls, avoiding that work when logging is disabled
- 🪲 Accept zero-length chunks without consuming subsequent chunks, preserve incomplete trailing headers as broken entries in permissive mode & prevent failed reads from retrying the same bytes indefinitely
- 🪲 Validate container lengths, chunk headers & payload bounds before decoding, diagnose outer-size mismatches in permissive mode and reject them in strict mode while keeping invalid file headers fatal
- 🪲 Separate declared payload sizes from alignment bytes so padding is excluded from duration, metadata & sound data, and apply `roundOddChunks: false` consistently to nested LIST records
- 🪲 Resolve RF64 / BW64 sentinel sizes through `ds64`, consume repeated size-table IDs in FIFO order & retain raw sentinel headers, diagnosing missing mappings and rejecting unsafe 64-bit size conversions
- 🪲 Read exactly `ds64.tableLength` entries instead of treating all remaining bytes as records, and check CUE, SMPL, DS64 & STRC record counts against available payload bytes before iteration
- 🪲 Finalize audio duration after parsing so `data` can precede `fmt ` and sample-count metadata can follow audio, without assigning one file-wide sample count to every data chunk or trusting it over truncated audio
- 🪲 Avoid exceptions & infinite durations when timing metadata is missing or unusable, retain zero duration for empty audio, return `NaN` for unavailable nonempty duration & support PCM / IEEE-float block-alignment fallback with complete extensible GUID checks
- 🪲 Validate FMT base fields, optional extension lengths & the 22-byte extensible minimum, decode combined speaker masks & preserve extension bytes beyond the fixed extensible structure
- 🪲 Encode binary FMT `extraParams` verbatim instead of converting them to text, infer omitted extension lengths, zero-fill excess capacity & reject invalid byte arrays or undersized capacity, placing odd padding outside the declared payload
- 🪲 Derive omitted FMT `blockAlign` & `byteRate` from supplied audio parameters while preserving explicit valid overrides & the historical default 18-byte FMT payload
- 🪲 Validate header IDs & numeric writer fields, write AIFF header sizes in big-endian order & accept the documented `-1` size sentinel for RF64 / BW64 headers
- 🪲 Bound LIST parent / child reads, separate `labl` & `note` cue identifiers from text, decode `ltxt` region / language fields & preserve text whitespace without consuming neighboring records
- 🪲 Decode instrument fine tuning & gain as signed bytes, and unpack SMPL SMPTE offsets in hours / minutes / seconds / frames order with signed hours while bounding optional sampler data
- 🪲 Validate the fixed BEXT structure & honor version-specific UMID, loudness and reserved-field layouts, read loudness values as signed 16-bit integers & retain coding-history bytes in file order without outer padding
- 🪲 Read ACID tempo & its unknown floating-point field as Float32 values instead of unsigned integers
- 🪲 Decode all per-channel PEAK amplitude / position records with container-appropriate endianness, exposing `peaks` while retaining the legacy `ppeakPointer` & `bitAlign` aliases
- 🪲 Preserve the complete DISP payload in `rawData` & decode supported text formats while retaining the legacy numeric `data` field
- 🪲 Accept TLST records with no extension without requiring another DWORD, retain variable-length extension bytes in `extraDataBytes` & preserve the legacy scalar / trailer representation
- 🪲 Honor AIFF SSND offsets & exclude external padding, using COMM frame counts to remove internal block-fill bytes for supported uncompressed formats even when COMM follows SSND, without trimming compressed data using an uncompressed-size formula
- 🪲 Bound AIFF-C COMM Pascal strings & validate their alignment, and handle generic AIFF text chunk lengths with the correct endianness, including empty text
- 🪲 Require completed ResU compressed streams, preserve UTF-8 sequences across incremental output blocks & expose decompression / JSON failures through `error`, with container diagnostics & strict-mode propagation
- 🪲 Validate Roland device width & numeric fields without changing the 466-byte RLND chunk, case-insensitive SP-404SX pad labels or unknown-label fallback to A1
- 🧹 Documentation & Types corrections for parsing options, diagnostics, retained audio bytes, FMT / Roland writer inputs, metadata fields & compatibility aliases, preserving unchanged comments
- 🎁 Update existing tests adding regression cases covering factories, malformed data, padding, duration, RF64 / BW64, metadata, encoding & AIFF

AudioMIDI:

- 💥 Require integer variable-length quantities in the range `0` through `0x0FFFFFFF` and reject fractional, negative, non-finite & oversized values instead of silently rounding or wrapping
- 💥 Reset `parse()` to byte zero and replace previous chunks and pass a bounded byte view to parse an embedded MIDI file instead of seeking before parsing
- 💥 Use Standard MIDI File length framing for `0xF0` & `0xF7` SysEx events, where previously emitted lengthless `0xF0` events are not auto-detected
- 💥 Add End of Track automatically in `convertToMidi()` so manual track serialization now requires exactly one final End of Track event, and saving an empty instance throws
- 💥 Default multi-track conversion to format 1 with the shared tempo in the first track, use explicit `format: 2` for independent track tempos, and reject conflicting format-1 tempos
- 🧰 Add three-byte SysEx manufacturer IDs, partial packets & opaque continuation / escape payloads, with `manufacturerIdBytes` & `terminated: false` for structured partial messages
- 🧰 Preserve unchanged legacy text bytes in `event.textBytes` & bytes after End of Track in `track.trailingData`, retaining those bytes when writing
- 🛠 Remove `DataStream` usage from `AudioMIDI`, reusing `DataBuffer` for `decodeHeader()` without changing other modules or adding dependencies
- 🛠 Optimize `addEvent()` batch appends without copying the growing destination array, preserving the identity of `track.events`
- 🛠 Cache label tables, remove temporary arrays from VLQ encoding & reduce allocations when writing channel events
- 🛠 Optimize `getUsedNotes()` with a single event scan instead of intermediate filtered arrays, safely handling null / malformed data & validating numeric note strings without partial parsing
- 🪲 Validate header signatures, lengths, formats & timing fields, and prevent truncated chunk payloads or event reads from crossing track boundaries
- 🪲 Honor extended header lengths & skip unknown chunks by their declared lengths and read all available tracks while retaining the declared track count for mismatch diagnostics
- 🪲 Reject truncated or overlong VLQs & running status without a preceding channel status, cancel running status after meta / SysEx events while preserving it across supported direct real-time messages
- 🪲 Isolate note clocks & matching by track, numeric MIDI port, channel & pitch, and queue overlapping same-pitch notes in FIFO order without shifting arrays
- 🪲 Treat zero-velocity Note On events as releases when calculating note lengths, retaining the original event type & label and back-filling the matched Note On
- 🪲 Retain system event status bytes, correct System Common / Real-Time data widths, read & write Song Position Pointer LSB first, and use matching `{ songNumber }` data for Song Select
- 🪲 Stop event parsing at the first End of Track instead of interpreting trailing bytes as additional events
- 🪲 Check known meta payload lengths before reading fields, preserving malformed payloads as raw bytes without consuming the next event
- 🪲 Fix M-Live tag parsing reading one byte beyond its declared payload, support empty tag values & write structured M-Live tag data
- 🪲 Fix zero-length Sequence Number events to use the current zero-based track index without consuming or writing payload bytes
- 🪲 Decode writer-generated UTF-8 text correctly, support empty strings, embedded NULs & BOM characters, and retain byte-for-character fallback data for invalid UTF-8 until the text is edited
- 🪲 Derive serialized meta lengths from the actual payload instead of stale `metaEventLength` values, and write unknown meta payloads instead of discarding their data
- 🪲 Fix signed SMPTE header frame-code decoding & serialization, preserve fractional BPM without producing Infinity for zero tempo, and use the correct minor-key names without mislabeling unknown modes
- 🪲 Validate event status, channel, delta time & payload before writing that event, reject invalid seven-bit fields, byte values & array holes, and preserve the status channel nibble when no explicit channel is supplied
- 🪲 Write header track counts from the `MTrk` chunks actually serialized, recompute chunk lengths & reject invalid header values, including format 0 with multiple tracks
- 🪲 Remove floating-point tick accumulation in `convertToMidi()`, preserve skipped-note timing & trailing silence, and keep rounded note-length metadata consistent with generated events
- 🪲 Honor per-track BPM overrides for single-track conversion and independent format-2 tracks, and advance the timeline for zero-velocity duration-note inputs without generating unmatched releases
- 🪲 Add flat spellings & fix B# / Cb octave crossings in `noteToMidi()`, validate note values, octave offsets & custom mappings in both conversion directions while preserving the `C1 = 36` convention
- 🪲 Expand `validate()` diagnostics for numeric fields, raw known-meta values, payload lengths, note matching, SysEx packet sequences, structural placement & End of Track ordering, flag direct system messages as a non-SMF compatibility extension
- 🧹 Documentation & Types corrections for optional constructor input, derived Pitch Bend / M-Live fields, SysEx packets, conversion timing & the existing encoded time-signature denominator API
- 🎁 Update existing AVA test expectations & add regression cases covering boundaries, malformed data, note routing, metadata, serialization & conversion, including malformed-track inputs & truncation checks

Diff:

- 💥 Require non-negative safe integer context values for `hunks()`, `textHunks()`, `unified()` & `htmlTable()`, rejecting negative, fractional, non-finite, unsafe & incorrectly typed values, including `Infinity`
- 💥 Repeated elements may align differently when multiple minimum-length edit scripts exist, so consumers relying on exact edit placement should review their snapshots
- 🛠 Remove quadratic element interning, numeric token arrays & unused counts from `diff()`, comparing original inputs directly without adding production dependencies
- 🛠 Initialize boolean result vectors with filled arrays, reduce diagonal workspace sizes & remove the temporary combined buffer and copying slices
- 🛠 Replace recursive Myers comparisons with an explicit work stack, trim common edges on subproblems & avoid search workspace allocation when either remaining side is empty
- 🛠 Optimize text line splitting with `indexOf()` & return early for identical text hunk / formatting requests before allocating line arrays
- 🛠 Build array hunk edits only for the reported ranges & reuse the bounded text-edit builder instead of maintaining duplicate traversal loops
- 🪲 Fix custom equality callbacks receiving numeric IDs instead of original elements, consistently pass left / right values without an accidental Myers receiver & propagate callback exceptions unchanged
- 🪲 Fix array hunks ignoring context, merge overlapping or touching context windows & split distant changes into separate hunks
- 🪲 Fix hunk coordinates disagreeing with their edit lists, including insertion-only & deletion-only changes with zero-width ranges
- 🪲 Validate Myers index mappings & allocate dense result vectors through the largest mapped position, retaining the trailing false sentinel and existing reordered / repeated mapping behavior
- 🪲 Validate public Myers `compare()` & `split()` bounds, handle empty ranges and common edges & recenter or grow workspaces for shifted or expanded subranges
- 🪲 Fix unified diff headers for empty ranges, using the preceding-line position and `0,0` at the start of an empty file
- 🪲 Preserve missing final newlines in unified output with `\ No newline at end of file` markers for deleted, inserted & matching context lines, retaining the existing headerless output format
- 🪲 Throw on stalled internal text-edit range traversal instead of silently skipping source data
- 🪲 Fix `htmlTable()` to include both `data-block-start` & `data-block-end` when a hunk has only one matching context line
- 🧹 Documentation corrections for context validation, half-open ranges, Myers bounds / mappings & the preserved mirrored values in insertion / deletion edit payloads
- 🎁 Fix existing test expectations & add tests for custom comparators, sparse / frozen inputs, numeric edge cases, mapping bounds, context windows, Unicode, line endings & HTML output, with exhaustive minimum-distance checks and seeded randomized reconstruction tests
- 🎁 Add optional GNU `patch` integration coverage for forward / reverse application with exact byte comparisons, enabled by `DIFF_TEST_GNU_PATCH=1`

DataBitstream:

- 💥 Change `DataBitstream` to use `DataBuffer` directly, retaining the public `stream` property and removing `DataStream` & `DataBufferList` imports, factory construction paths and test dependencies
- 🧰 Add `Int32Array` & `Uint16Array` factory input types to match the supported `DataBuffer` constructor inputs
- 🛠 Read committed bytes directly without repeated numeric peeks, and use arithmetic for cursor movement instead of signed 32-bit shifts that can wrap large offsets
- 🪲 Fix sequential MSB / LSB reads & peeks using the beginning of the buffer instead of the current byte cursor
- 🪲 Fix `available()` to use the exact remaining bit count, including partially consumed bytes & zero-bit requests at EOF, returning `false` for invalid counts or cursor state
- 🪲 Support signed & unsigned fields from 0 through 40 bits at all eight alignments, including the sixth byte required by unaligned 40-bit reads, without truncating wide values to 32 bits
- 🪲 Validate read widths, movement counts & complete requested ranges before changing either cursor component, rejecting negative, fractional, non-finite & unsafe values and partial-byte movement beyond EOF
- 🪲 Fix `copy()` to preserve both byte & bit offsets while keeping committed bytes independent, and safely align partially consumed final bytes to EOF
- 🧹 Correct constructor examples, factory types, copy documentation & the `bitPosition` description
- 🎁 Update existing sequential-read expectations & add bit-by-bit reference tests for all widths, alignments, bit orders & signedness modes, plus cursor preservation, subviews, uncommitted data, EOF & large-offset arithmetic

IPS:

- 💥 Make `createIPSFromDataBuffers()` compare complete committed inputs regardless of their cursors, without consuming either input, and return committed bytes at offset zero from `apply()` without requiring a subsequent `commit()`
- 🧰 Add `hasTruncate` to distinguish an absent final-size command from explicit truncation to zero, preserving direct assignment of positive `truncate` values and setting presence automatically during parsing & creation
- 🧰 Accept `Uint8Array` literal payloads, including subviews, alongside the existing numeric-array hunk representation
- 🛠 Replace creation retries with a forward-only scan, retaining bounded nearby-literal merging & RLE selection without revisiting the same input region
- 🛠 Preallocate exact-size patch & application buffers, using bulk `Uint8Array.set()` & `fill()` instead of staged per-byte writes
- 🛠 Skip debug-only hex rendering when logging is disabled, avoid redundant validation of freshly parsed byte payloads & import the project's local `DataBuffer`
- 🪲 Fix the placeholder previous record absorbing changes near the beginning of a file without emitting a hunk, and the retry branch repeatedly revisiting an initial long RLE run
- 🪲 Fix empty-file handling, all-zero expansion without an earlier hunk & trailing zero growth, while preserving nearby literal changes and keeping long RLE runs separate
- 🪲 Split generated records at 65,535 bytes and allow merged literals to reach that limit without losing or duplicating changes
- 🪲 Avoid record starts at the reserved `0x454F46` EOF address by including the preceding target byte, including record-split & final-growth boundaries, and reject manually supplied records at that address
- 🪲 Restart `parse()` at the patch header, replace previous hunks after successful reparsing & preserve existing hunks, truncate state and cursor when reparsing fails
- 🪲 Require a complete header & EOF marker, accept only zero or three bytes after EOF, and reject truncated, malformed & zero-length records
- 🪲 Validate mutable hunk offsets, lengths, payload sizes, byte values, RLE values & truncate sizes before encoding or application, rejecting missing / conflicting payloads and enforcing the project's supported 16 MiB output ceiling
- 🪲 Apply RLE byte `0x00`, preserve overlapping-record order, zero-fill holes & growth, and leave source bytes and cursors unchanged
- 🪲 Apply the optional final-size extension after records, supporting explicit empty output, clipping records at the final size & zero-extending output when required
- 🧹 Document committed-input handling, truncation presence, payload types & the distinction between the project's output ceiling and the IPS record representation
- 🎁 Add tests for malformed patches, stable state, zero-valued runs, empty input, growth, truncation, record limits & reserved offsets, including 1,000 seeded create / encode / parse / apply transformations checked with an independent IPS applicator

DataHelpers:

- 💥 Return the complete stored Real48 fraction from `float48()` instead of rounding every result to four decimal places
- 🛠 Remove Real48 decimal formatting / reparsing overhead, replace aligned host-endian `Uint32Array` construction & spreading in `float80()` with explicit byte reads, and share extended-float classification & rounding logic between byte orders
- 🛠 Use a one-variable-power fast path for ordinary normalized extended floats, reserving integer-significand rounding for binary64 subnormal conversions
- 🪲 Preserve tiny nonzero Real48 values & low fraction bits previously discarded by `toFixed(4)`
- 🪲 Validate required input lengths & ordinary-array byte values rather than decoding truncated inputs, array holes or invalid bytes
- 🪲 Read little-endian extended floats from unaligned views without depending on host endianness or accessing unrelated backing-buffer bytes
- 🪲 Handle canonical infinity, NaN & signed zero consistently in both extended-float decoders, retaining legacy zero-significand infinity while returning NaN for reserved exponents with nonzero fraction bits
- 🪲 Fix extended-float overflow, underflow & binary64 subnormal rounding, using ties-to-even on the original significand to avoid premature intermediate underflow and double rounding, while retaining finite unnormalized-significand compatibility
- 🎁 Add tests for all 256 Real48 exponents, special values, unaligned views & halfway / subnormal / overflow boundaries, plus 4,096 independently generated reference cases checked in both byte orders

DataFormatting:

- 💥 Change hex-table inputs & ASCII callback data to `DataBuffer`, removing the remaining `DataStream` types and test usage while retaining the existing `data-formating.ts`, `HexTableFormater` & `hexTableFormaters` names
- 🧰 Accept complete strings from ASCII callbacks as well as the existing character / flags tuple, preserving callback state without destructuring strings into individual characters
- 🧰 Support multiline table cells & titles, pad ragged rows to the maximum column count & expand the final column when a title is wider than the table
- 🧰 Add `formatMyersGraph()` `maxCells`, defaulting to 1,000,000 character cells, and reject oversized grids before path tracing or allocation
- 🛠 Copy only the bytes visible in default hex-table output, retaining a complete independent copy for custom ASCII callbacks that need lookahead
- 🛠 Remove table deep-cloning, stringify cells once & avoid regex splitting for ordinary single-line cells, using native repeat / padding operations instead of per-character concatenation
- 🛠 Cache hex, bit & XOR-marker representations for byte values, find the final hunk change without copying / reversing edits & initialize graph rows with filled arrays
- 🪲 Fix `formatBytes()` for negative values, fractional bytes, values beyond the largest supplied suffix & logarithm rounding immediately below unit boundaries
- 🪲 Reject invalid formatting dimensions, numeric configuration, padding, row sizes & context values, including empty byte-size suffix lists, instead of producing malformed output or invalid ranges
- 🪲 Preserve the hex-table source & current cursor, keep the explicit offset as the display label, respect the requested header column count & correctly pad partial rows without formatting invented bytes
- 🪲 Return empty output for empty tables and keep multiline cells, titles & overlong titles inside their frames without negative padding lengths
- 🪲 Combine complete adjacent delete / insert runs in `formatDiffHex()` while preserving both byte sequences, instead of pairing only the last deletion with the next insertion
- 🪲 Show missing diff sides as `--` in hex & `--------` in bits, keeping standalone insertions / deletions visible even when the changed byte is zero
- 🪲 Advance original & resulting diff offsets independently, show both positions when equal bytes occur at different offsets & fix signed delta alignment when offset columns are hidden
- 🪲 Reject invalid diff operations, malformed matches & invalid byte values, and render placeholders for unsupported hunk byte values so header counts agree with output lines
- 🪲 Preserve default hunk / graph options when partial options are supplied, and expand graph cell & label widths for larger axis numbers
- 🪲 Guard debug environment access in the changed modules so importing without a `process` global does not throw
- 🧹 Update formatter types & option documentation while retaining existing UTF-16 width behavior and emoji-width
- 🎁 Expand existing tests, add seeded hex-diff renders that reconstruct both input sequences and check both sets of offsets, plus imports without `process` & `Buffer` globals

### CRC32 Benchmarks

Original implementation compared with the full optimized JavaScript implementation using the existing `compute` & `crc32c` APIs, not the new byte-only helpers.

Measured with Node.js v22 on Linux x64.

Per-call results are medians of nine samples. The 1 million-call result is a median of five samples. The 50 million-call result is one measured batch, not an extrapolation. Speedups are calculated before rounding.

| Operation / Input | Original | Optimized | Result |
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

| Operation / Input | Original (ms) | Optimized (ms) | Result |
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

### GIFLZW Benchmarks

Measured with Node.js v22 on Linux x64.

Median milliseconds per operation from nine samples of ten operations, after five warmup operations. Each input contains 65,536 native indexes, using minimum code size 8. Ratios are calculated before rounding.

Decoding compares the original string output plus its required `Uint8Array` conversion with `decompressBytes()` using an exact expected length. Compression compares the original `number[]` API with `compressBytes()`. These are byte-processing benchmarks, not identical return-type APIs or full ImageGIF pipeline timings. Flat-input decoding is effectively unchanged within normal measurement noise.

| Operation / Input | Original (ms/op) | Optimized (ms/op) | Result |
| --- | ---: | ---: | ---: |
| Decode to byte indexes, flat | 0.263 | 0.259 | 1.02× faster |
| Compress, flat | 16.684 | 0.791 | 21.10× faster |
| Decode to byte indexes, patterned | 0.484 | 0.248 | 1.95× faster |
| Compress, patterned | 5.950 | 1.353 | 4.40× faster |
| Decode to byte indexes, random 256-color | 5.450 | 0.904 | 6.03× faster |
| Compress, random 256-color | 16.894 | 3.581 | 4.72× faster |

### DataBuffer Benchmarks

Measured with Node.js v22 on Linux x64

Median batch durations from five measured samples after three warmup batches, with separate processes for each implementation / workload and bounds validation enabled in the updated implementation.

The early-mismatch result reflects avoided wrapper construction, growing-array writes showed no meaningful improvement.

| Operation / Input | Operations per sample | Original | Optimized | Result |
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

### AudioWAV Benchmarks

Measured with Node.js v22.16.0 on Linux x64, AMD EPYC 9V74

Median microseconds per call from seven measured rounds after warmup, with alternating implementation order & explicit garbage collection between batches. Ratios are calculated before rounding.

Measurements used the isolated dependency setup documented in the update, including a baseline-only `DataBufferList` adapter. These are not full-project or application-latency measurements. The 4 MiB full-file parse was approximately 5.1% slower, and small full-file differences should not be treated as consistent improvements.

| Operation / Input | Operations per sample | Original (µs/call) | Optimized (µs/call) | Result |
| --- | ---: | ---: | ---: | ---: |
| `decodeFMT()`, PCM | 40,000 | 2.711 | 1.234 | 2.20× faster |
| `decodeFMT()`, 1 KiB binary extension | 4,000 | 68.749 | 3.101 | 22.17× faster |
| `decodeCue()`, 128 cue points | 1,000 | 56.797 | 20.887 | 2.72× faster |
| `encodeFMT()`, default PCM | 40,000 | 0.223 | 0.122 | 1.82× faster |
| `fromFile()`, 64 KiB PCM | 1,000 | 29.646 | 28.355 | 1.05× faster |
| `fromFile()`, 4 MiB PCM | 40 | 1,467.966 | 1,542.634 | 1.05× slower |

### AudioMIDI Benchmarks

Measured with Node.js v22 on Linux x64

Median batch durations from seven measured samples after three warmup batches, with alternating implementation order & explicit garbage collection outside the timed region.

The one-byte VLQ read is slower with the added cursor / boundary validation. Ratios are calculated before rounding.

| Operation / Input | Operations per sample | Original | Optimized | Result |
| --- | ---: | ---: | ---: | ---: |
| Read one-byte VLQs | 1,000,000 | 7.389 ms | 12.431 ms | 1.68× slower |
| Write mixed one-to-four-byte VLQs | 250,000 | 21.191 ms | 19.239 ms | 1.10× faster |
| `getUsedNotes()`, 10,000 events per scan | 1,000 scans | 94.735 ms | 70.657 ms | 1.34× faster |
| `addEvent()`, 200 events per batch | 300 batches | 68.655 ms | 1.953 ms | 35.15× faster |
| Manufacturer-label lookups | 250,000 | 22.875 ms | 6.250 ms | 3.66× faster |
| Write channel-note events | 100,000 | 18.830 ms | 16.027 ms | 1.17× faster |

### Diff Benchmarks

Measured with Node.js v22 on Linux x64.

Median milliseconds per operation from five calibrated batches after warmup, with alternating implementation order & explicit garbage collection outside the timed region.

The largest gains reflect removal of quadratic element interning, not equivalent improvements to Myers itself. The direct Myers workload was approximately 7% slower, with overlapping batch ranges. Dense unrelated inputs retain quadratic worst-case behavior. Ratios are calculated before rounding.

| Operation / Input | Original (ms/op) | Optimized (ms/op) | Result |
| --- | ---: | ---: | ---: |
| `diff()`, 16 identical numbers | 0.009261 | 0.001964 | 4.72× faster |
| `edits()`, 16 numbers, one replacement | 0.021464 | 0.005027 | 4.27× faster |
| `diff()`, 10,000 identical unique strings | 1483.202175 | 0.354511 | 4183.80× faster |
| `diff()`, 10,000 strings, one replacement | 1065.783259 | 0.340482 | 3130.22× faster |
| `diff()`, 10,000 strings, one insertion | 1131.928091 | 0.290848 | 3891.82× faster |
| `diff()`, 2,000 repeated numbers, 20 replacements | 2.022120 | 1.070668 | 1.89× faster |
| `diff()`, 500 completely different strings per side | 15.417290 | 7.715386 | 2.00× faster |
| `textEdits()`, 5,000 lines, one replacement | 257.307017 | 0.940542 | 273.57× faster |
| `unified()`, 5,000 lines, one replacement | 251.932137 | 0.701904 | 358.93× faster |
| `htmlTable()`, 5,000 lines, one replacement | 297.346227 | 0.774486 | 383.93× faster |
| `textEdits()`, two 500,000-character matching lines | 5.801592 | 0.053949 | 107.54× faster |
| Myers directly, 500 disjoint strings per side | 6.137099 | 6.571926 | 1.07× slower |

### Helper Benchmarks

Measured with Node.js v22 on Linux x64.

Median time per operation from seven warmed samples, with alternating implementation order & independently calibrated batches targeting 25 ms. Ratios are calculated before rounding.

Original IPS application timings include the required `commit()`, and debug-disabled IPS parsing retains the original eager debug-table construction.

Every timed case checks equal observable outputs first; correctness-changing inputs are excluded from speed comparisons. Allocation-sensitive gains, especially bounded hex-table copies & bulk RLE application, can vary between runs. The 8-bit peek is approximately 10.0% slower with the added validation retained.

| Operation / Input | Original | Optimized | Result |
| --- | ---: | ---: | ---: |
| Bitstream `peek(8)`, cursor zero | 13.4 ns | 14.8 ns | 1.10× slower |
| Bitstream `peek(24)`, cursor zero | 18.9 ns | 16.1 ns | 1.17× faster |
| Bitstream `peek(32)`, cursor zero | 24.4 ns | 17.1 ns | 1.43× faster |
| Bitstream `peekLSB(32)`, cursor zero | 118.9 ns | 32.2 ns | 3.69× faster |
| Bitstream `peekLSB(40)`, cursor zero | 166.4 ns | 123.7 ns | 1.35× faster |
| `float48`, valid ordinary values | 181.8 ns | 75.8 ns | 2.40× faster |
| `float80`, valid ordinary values | 341.3 ns | 157.3 ns | 2.17× faster |
| `convertFromIeeeExtended`, valid ordinary values | 201.5 ns | 155.3 ns | 1.30× faster |
| `formatTable`, 41 × 4 cells | 40.92 µs | 32.92 µs | 1.24× faster |
| `formatTableLine`, eight 64-character columns | 3.02 µs | 504.5 ns | 5.98× faster |
| `hexTable`, 640-byte input / 40 visible rows | 48.12 µs | 24.24 µs | 1.99× faster |
| `hexTable`, 4 MiB input / 40 visible rows | 1105.90 µs | 25.36 µs | 43.61× faster |
| `formatDiffHex`, 256 matches with bits | 37.90 µs | 20.63 µs | 1.84× faster |
| `formatDiffHex`, 256 replacements with bits | 98.55 µs | 47.13 µs | 2.09× faster |
| `formatDiffHunks`, 256 bytes | 21.26 µs | 12.63 µs | 1.68× faster |
| `formatMyersGraph`, 40 × 40 path | 647.86 µs | 145.41 µs | 4.46× faster |
| IPS create, sparse 64 KiB file | 271.79 µs | 121.11 µs | 2.24× faster |
| IPS encode, 32 KiB literal | 402.17 µs | 131.39 µs | 3.06× faster |
| IPS parse, 32 KiB literal / debug disabled | 1021.09 µs | 147.68 µs | 6.91× faster |
| IPS apply, 32 KiB literal | 1950.60 µs | 117.47 µs | 16.60× faster |
| IPS apply, 65,535-byte RLE run | 2181.49 µs | 5.84 µs | 373.77× faster |

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
