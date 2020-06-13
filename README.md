[![view on npm](http://img.shields.io/npm/v/uttori-data-tools.svg)](https://www.npmjs.com/package/@uttori/data-tools)
[![npm module downloads](http://img.shields.io/npm/dt/uttori-data-tools.svg)](https://www.npmjs.com/package/@uttori/data-tools)
[![Build Status](https://travis-ci.org/uttori/uttori-data-tools.svg?branch=master)](https://travis-ci.org/uttori/uttori-data-tools)
[![Dependency Status](https://david-dm.org/uttori/uttori-data-tools.svg)](https://david-dm.org/uttori/uttori-data-tools)
[![Coverage Status](https://coveralls.io/repos/uttori/uttori-data-tools/badge.svg?branch=master)](https://coveralls.io/r/uttori/uttori-data-tools?branch=master)

# Uttori Data Tools

Tools for working with binary data.

- **CRC32** - Derive the Cyclic Redundancy Check of a data blob.
- **DataStream** - Helpter class to ease parsing binary formats.
- **DataBuffer** - Helper class for working with binary data.
- **DataBufferList** - A linked list of DataBuffers.
- **DataBitstream** - Read a DataStream as a stream of bits.

## Install

```bash
npm install --save @uttori/data-tools
```

* * *

# Examples

```js
const { CRC32, DataBuffer, DataBufferList, DataBitstream, DataStream } = require('uttori-data-tools');

const CRC32 = require('uttori-data-tools');
CRC32.of('The quick brown fox jumps over the lazy dog');
➜ '414FA339'

const stream_a = DataStream.fromData(Buffer.from([20, 29, 119]));
const stream_b = DataStream.fromData(Buffer.from([20, 29, 119]));
stream_a.compare(stream_b);
➜ true

const buffer = new DataBuffer(data);
const list = new DataBufferList();
list.append(buffer);
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

* [Matthew Callis](https://github.com/MatthewCallis)

## License

* [MIT](LICENSE)
