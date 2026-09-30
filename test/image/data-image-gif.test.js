import test from 'ava';
import { promises as fs } from 'fs';
import { ImageGIF, DataBuffer } from '../../dist/index.js';

// GIFTestSuite data from https://code.google.com/archive/p/imagetestsuite/wikis/GIFTestSuite.wiki
// [imagetestsuite](https://code.google.com/archive/p/imagetestsuite/downloads)
// [pygif](https://github.com/robert-ancell/pygif/tree/master/test-suite)
// [metadata-extractor-images](https://github.com/drewnoakes/metadata-extractor-images)


test('fromFile(data): can read a valid file', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  t.notThrows(() => {
    ImageGIF.fromFile(data);
  });
});

test('fromBuffer(buffer): can read a valid file buffer', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const buffer = new DataBuffer(data);
  t.notThrows(() => {
    ImageGIF.fromBuffer(buffer);
  });
});

test('decodeHeader: throws on a missing or invalid GIF header', (t) => {
  // Six bytes so readString(6) succeeds, but not a 'GIF87a'/'GIF89a' signature.
  t.throws(() => {
    ImageGIF.fromFile(Buffer.from('NOTGIF'));
  }, { message: 'Missing or invalid GIF header.' });
});

test('can parse static GIF - sundisk04', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 256);
});

test('can parse static GIF - gif87', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif87.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 256);
});

test('can parse static GIF - gif89', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif89.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 256);
});

test('can parse static GIF - BOB_89A (1st GIF, Comment & Plain Text Extension)', async (t) => {
  const data = await fs.readFile('./test/image/assets/BOB_89A.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 128);
});

test('can parse animated GIF - gcspro004 (Makers of GIFCONnb)', async (t) => {
  const data = await fs.readFile('./test/image/assets/gcspro004.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 128);
});

test('can parse animated GIF - 4fTUe7x', async (t) => {
  const data = await fs.readFile('./test/image/assets/4fTUe7x.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 256);
});

test('can parse animated GIF - HPGubnk', async (t) => {
  const data = await fs.readFile('./test/image/assets/HPGubnk - Imgur.gif');
  let image = {};
  t.notThrows(() => {
    image = ImageGIF.fromFile(data);
  });
  t.is(image.colors, 256);
});

// At offset 0x328 we have an Image Descriptor:
// 0x328: 2C 00 00 00 00 00 00 2B 00 80 08 FC 00 FF 09 1C
// It has no Local Color Table Flag set - so it is followed directly by a Table Based Image Data block:
// 0x338: 0x48 / 72 (LZW Minimum Code Size)
// But the LZW Minimum Code Size field has to be 2 <= LZW Minimum Code Size <= 8.
test.skip('GIFTestSuite: 2b5bc31d84703bfb9f371925f0e3e57d - Invalid LZW Minimum Code Size (72)', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/2b5bc31d84703bfb9f371925f0e3e57d.gif');
  t.throws(() => {
    const _image = ImageGIF.fromFile(data, {
      rules: {
        strict_lzw_minimum_code_size: true,
      },
    });
  }, { message: 'Invalid Graphic Control Block Size: 238 !== 4' });
});

test('GIFTestSuite: 5f09a896c191db3fa7ea6bdd5ebe9485 - Invalid LZW Minimum Code Size (72)', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/5f09a896c191db3fa7ea6bdd5ebe9485.gif');
  t.throws(() => {
    ImageGIF.fromFile(data);
  });
});

test('GIFTestSuite: 5f09a896 - strict_lzw_minimum_code_size propagates to the caller', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/5f09a896c191db3fa7ea6bdd5ebe9485.gif');
  // With the strict rule on, malformed descriptors now throw through parse() to the caller.
  // This regression no longer treats a swallowed strict-mode error as successful parsing.
  t.throws(() => {
    ImageGIF.fromFile(data, { rules: { strict_lzw_minimum_code_size: true } });
  });
});

// At offset 0x418F we have an Image Data block (preceded by other Image Data blocks):
// 0x418F: 31 (Block Size) ... (0x31 bytes of Data Values)
// Now a Block Terminator follows:
// 0x41C1: 00 (Block Terminator)
// But after it (offset 0x41C2) we don't have another 0x00.
// 0x41C2: 00
// This is not the beginning of a valid block according to GIF 89a specification.
// Section 2 of the GIF 89a specification clearly states:
// "The Graphics Interchange Format(sm) as specified here should be considered complete; any deviation from it should be considered invalid, including but not limited to,[...] the inclusion of extraneous data within or between blocks [...]".
test('GIFTestSuite: 0646caeb9b9161c777f117007921a687 - Missing Data', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/0646caeb9b9161c777f117007921a687.gif');
  t.throws(() => {
    ImageGIF.fromFile(data);
  });
});

// At offset 0x22FC we have the beginning of a Graphic Control Extension block
// 0x22FC: 0x21 (Extension Introducer)
// 0x22FD: 0xF9 (Graphic Control Label)
// 0x22FE: 0xEE (Block Size)
// But according to the GIF 89a specification ("23. Graphic Control Extension") "Block Size field contains the fixed value 4." - so these GIF files are invalid.
test('GIFTestSuite: 243d9798466d64aba0acaa41f980bea6 - Invalid Graphic Control Extension Block Size', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/243d9798466d64aba0acaa41f980bea6.gif');
  t.throws(() => {
    ImageGIF.fromFile(data);
  });
});

test('GIFTestSuite: 7092f253998c1b6b869707ad7ae92854 - Invalid Graphic Control Extension Block Size', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/7092f253998c1b6b869707ad7ae92854.gif');
  t.throws(() => {
    const _image = ImageGIF.fromFile(data, {
      rules: {
        strict_block_size: true,
      },
    });
  }, { message: 'Invalid Graphic Control Block Size: 238 !== 4' });
});

// The first error in these files (from offset 0x315 on) is the same as in fc3e2b992c559055267e26dc23e484c0.gif. Look there for reference.
// If you decide to ignore this error, you find another one in each of these two files:
// Offset 0x87A contains the Block Terminator for Image Data. Now let's look at the byte at offset 0x87B:
// 55abb3cc464305dd554171c3d44cb61f.gif: 0x87B: 2C
// This means an Image Descriptor is the next block. Unluckily the file ends here prematurely.
// 9f8f6046eaf9ffa2d9c5d6db05c5f881.gif: 0x87B: 21
// 0x21 - an "Extension Introducer" byte. The next byte would tell which kind of Extension block follows. Unluckily the file prematurely ends here.
// So obviously in both files no Trailer (0x3B) to finish the GIF file is to be found.
// Note: if we changed the byte at offset 0x87B to 0x3B, these files would perhaps become valid (in the file fc3e2b992c559055267e26dc23e484c0.gif this "bugfix" - or more exactly "not introducing this error" - was applied).
test('GIFTestSuite: 55abb3cc464305dd554171c3d44cb61f - File Ends Prematurely', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/55abb3cc464305dd554171c3d44cb61f.gif');
  t.throws(() => {
    ImageGIF.fromFile(data);
  });
});

test('GIFTestSuite: 9f8f6046eaf9ffa2d9c5d6db05c5f881 - File Ends Prematurely', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/9f8f6046eaf9ffa2d9c5d6db05c5f881.gif');
  t.throws(() => {
    ImageGIF.fromFile(data);
  });
});

// From offset 0x6E3F on we have
// 0x6E3F: 2C (Image Descriptor) 00 00 (Image Left Position) 00 00 (Image Top Position) A0 00 (Image Width) 78 00 (Image Height) 87 (Local Color Table having 256 (0x100) colors)
// So the Local Color Table begins at offset 0x6E49 and consists of 0x300=3*0x100 bytes. But the file consists of exactly 0x7000 bytes. So we can only read 0x1B7 (< 0x300) bytes. In other words: the file ends prematurely.
test('GIFTestSuite: 6d939393058de0579fca1bbf10ecff25 - File Ends Prematurely', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif/6d939393058de0579fca1bbf10ecff25.gif');
  t.throws(() => {
    ImageGIF.fromFile(data);
  });
});

// At offset 0x12FD:
// 0x12FD: 2C (Image Descriptor) 00 00 (Image Left Position) 00 00 (Image Top Position) BD 00 (Image Width) 71 00 (Image Width) 84 (Local Color Table having 32 (2^(4+1)) colors)
// From offset 0x1367 on we have Table Based Image Data
// 0x1367: 05 (LZW Minimum Code Size) 0x1368: FF (Block Size) 0xFF bytes of Data Values follow 0x1468: FF (Block Size) 0xFF bytes of Data Values follow 0x1568: FF (Block Size) 0xFF bytes of Data Values follow 0x1668: FF (Block Size) 0xFF bytes of Data Values follow 0x1768: FF (Block Size) 0xFF bytes of Data Values follow 0x1868: FF (Block Size) 0xFF bytes of Data Values follow 0x1968: FF (Block Size) 0xFF bytes of Data Values follow 0x1A68: FF (Block Size) 0xFF bytes of Data Values follow 0x1B68: FF (Block Size) 0xFF bytes of Data Values follow 0x1C68: FF (Block Size) 0xFF bytes of Data Values follow 0x1D68: FF (Block Size) 0xFF bytes of Data Values follow 0x1E68: FF (Block Size) 0xFF bytes of Data Values follow 0x1F68: FF (Block Size) 0xFF bytes of Data Values follow 0x2068: FF (Block Size) 0xFF bytes of Data Values follow 0x2168: FF (Block Size) 0xFF bytes of Data Values follow 0x2268: FF (Block Size) 0xFF bytes of Data Values follow 0x2368: FF (Block Size) 0xFF bytes of Data Values follow 0x2468: FF (Block Size) 0xFF bytes of Data Values follow 0x2568: FF (Block Size) 0xFF bytes of Data Values follow 0x2668: FF (Block Size) 0xFF bytes of Data Values follow 0x2768: FF (Block Size) 0xFF bytes of Data Values follow 0x2868: 0E (Block Size) 0x0E bytes of Data Values follow 0x2877: 00 (Block Terminator)
// Here the file ends.
// No Trailer (0x3B) to terminate the file follows. If we appended it, the file would perhaps be correct.
// test/gif/adaf0da1764aafb7039440dbe098569b.gif

// Beginning with the highest bit of the byte of offset 0x7FFFF we read a code of 11 bits:
// ``` code word bit count: 0xB (11)
// 0x7FFFF: 50 88 73 B7 01010000 10001000 01110011 10110111 0 10001000 11 ```
// As you can see, the code word is (binary) 11100010000, i. e. 0x710.
// The problem is: at this place, the table index in the LZW code table is 0x052E. The table index always has to be larger than the current code word because of the algorithmic details of the LZW compression.
// test/gif/adf6f850b13dff73ebb22862c6ab028b.gif

// At offset 0x30D
// 0x30D: 21 F9 (Graphic Control Extension) 04 00 E8 03 00 00
// Now at offset 0x315
// ``` 0x315: 21 FF (Application Extension) 0B 4E 45 54 53 43 41 50 45 32 2E 30 03 01 10 27 00
// 0x328: 2C (Image Descriptor) ... ```
// According to the GIF Grammar (Appendix B. of GIF 89a specification) an Application Extension Block must not appear directly after a Graphic Control Extension block. Instead a Graphic-Rendering Block (see GIF Grammar) has to appear before.
// So this GIF file (and f617c7af7f36296a37ddb419b828099c.gif - see below) is invalid.
// Note: (slightly) confusingly the GIF 89a specification (section "23. Graphic Control Extension") tells:
// "d. Extensions and Scope. The scope of this Extension is the graphic rendering block that follows it; it is possible for other extensions to be present between this block and its target. This block can modify the Image Descriptor Block and the Plain Text Extension."
// which - at a first glance - seems to allow the Application Extension block between Graphic Control Extension and Image Descriptor.
// This is clarified in section "20. Image Descriptor.":
// "This block is a Graphic-Rendering Block, optionally preceded by one or more Control blocks such as the Graphic Control Extension [...]"
// By reading section "12. Blocks, Extensions and Scope." you can see that the Application Extension is clearly not a Control block.
// test/gif/bc7af0616c4ae99144c8600e7b39beea.gif

// At offset 0x328 we have an Image Descriptor
// 0x328: 2C 00 00 (Image Left Position) 00 00 (Image Top Position) 01 00 (Image Width) 01 00 (Image Height) 0x331: 85 (Local Color Table with 2^(5+1) = 64 entries, i. e. 3*64=192 bytes)
// So the Table Based Image Data begins at offset 0x3F2.
// 0x3F2: 00 (LZW Minimum Code Size)
// The LZW Minimum Code Size field carries the value 0x0 - but it has to be 2 <= LZW Minimum Code Size <= 8.
// test/gif/ce774930ac70449f38a18789c70095b8.gif

// Signature (in Header block - directly at offset 0x0)
// 0x00 0x49 0x46
// instead of 0x47 0x49 0x46
// Even if we fix (or ignore) this error, we still get the same "invalid LZW Minimum Code Size" problem as in 2b5bc31d84703bfb9f371925f0e3e57d.gif and 5f09a896c191db3fa7ea6bdd5ebe9485.gif (at the same offset (0x338) and the same value there (0x48)).
// test/gif/d5a0175c07418852152ef33a886a5029.gif

// The file begins with the usual GIF 89a header. Then the beginning of a Logical Screen Descriptor follows:
// 0x06: 64 00 (Logical Screen Width) 64 00 (Logical Screen Height)
// After this the file ends prematurely.
// test/gif/e34116d68f49c7852b362ec72a636df5.gif

// Apparently well formed.
// test/gif/e6aa0c45a13dd7fc94f7b5451bd89bf4.gif

// At offset 0x3BFD
// 0x3BFD: 48
// The LZW decoder wants to read 11 bits of a code word - but can only read these 8 bits (0x48) - after this a 0x00 (Block Terminator) follows - this ends the Image Data (of Table Based Image Data). So the code word can't be read completely. Thus the file is invalid.
// test/gif/ea754e040929b7f9c157efc88c4d0eaf.gif

// This is a GIF 87a file - but it contains a Graphic Control Extension Block (Offset 0x30D: 21 F9 04 01 00 00 01 00). According to GIF 89a specification the required version is GIF 89a - so this block has to be skipped.
// At offset 0x420 a Data Sub-block of Image Data occures - with a length of 0x2B.
// No look at offset (at this moment in the LZW decoding the Code Size is 0x0A = 10)
// 0x449: 14 10 00010100 00010000 (binary) 0001 010000 (Code Word)
// So we read the code 0x101 - the End of Information code.
// After these two bytes another one follows in the block:
// 0x44B: 00
// But the GIF 87a specification (the 89a one, too), clearly tells:
// "An End of Information code is defined that explicitly indicates the end of the image data stream. LZW processing terminates when this code is encountered. It must be the last code output by the encoder for an image [!!!]. The value of this code is <Clear code>+1."
// So the file is invalid.
// Additionally no empty Data Sub-block (i. e. Length 0) follows.
// If we changed the 0x2B at offset 0x420 to 0x2A the file would perhaps become correct.
// test/gif/ee6d1133f9264dc6467990e53d0bf104.gif

// 0x00: 47 49 46 38 39 61 (Header) 0x06: 2C 01 2C 01 77 00 00 (Logical Screen Descriptor) - no Global Color Table 0x0D: 21 F9 (Graphic Control Extension) 04 04 46 00 00 00 0x15: 21 FF (Application Extension) 0B 4E 45 54 53 43 41 50 45 32 2E 30 03 01 00 00 00 0x28: 2C ... (Image Descriptor)
// So we have the same situation as in bc7af0616c4ae99144c8600e7b39beea.gif (see the more detailed explanation there): a Graphic Control Extension block followed by an Application Extension block - this is not allowed.
// test/gif/f617c7af7f36296a37ddb419b828099c.gif

// At offset 0xB4A we read a code word of 7 bits:
// 0xB4A: 40 50 01000000 01010000 0 010000
// So the code word is 0x20. This code word is invalid.
// Why?
// To understands look at the Image Descriptor (note that the data beginning at offset 0xB3E also looks like an Image Descriptor - but isn't) before at offset 0xB26:
// 0xB26: 2C 00 00 00 00 01 00 01 00 82 (<Packed Fields>)
// The flags tell that we have a local color table with 2^(2+1) = 8 entries.
// After the Local Color Table (offset 0xB48) we have the LZW Minimum Code Size field. It carries the value 0x06. So the Clear code is 2^6 = 64 and the End of Information code = +1 = 65.
// So the 0x20 code above is not a compression code, but an index in the currently active color table (the Local Color Table). But the Local Color Table has only 8 entries. So the code word 0x20 above is invalid.
// To find another error in this file, look at offset 0x7150, where you find an Image Descriptor
// 0x7150: 2C (Image Separator) 0B 00 (Image Left Position) 04 00 (Image Top Position) 38 00 (Image Width) 3D 00 (Image Height) 00 (<Packed Fields> - no Local Color Table)
// So this image is supposed to consist of Image Width Image Height = 56 61 = 3416 pixels.
// But the LZW-decoded Image Data of the Table Based Image Data block that follows contains 3417 indices into the active color table.
// If we ignore this error, another one follows: at offset 0x9184, we have another Image Descriptor:
// 0x9184: 2C (Image Separator) 03 00 (Image Left Position) 03 00 (Image Top Position) 46 00 (Image Width) 41 00 (Image Height) 00 (<Packed Fields> - no Local Color Table)
// So this image should consist of Image Width Image Height = 4550 pixels.
// This time the LZW-decoded Image Data of the Table Based Image Data block that follows contains only 4537 indices into the active color table.
// test/gif/f88b6907ee086c4c8ac4b8c395748c49.gif

// If you look at offset 0x315, you see an Image Descriptor
// 0x315: 2C (Image Separator) 00 00 (Image Left Position) 00 00 (Image Top Position) 64 00 (Image Width) 2D 00 (Image Height) 07 (<Packed Fields> - no Local Color Table)
// So the image consists of Image Width*Image Height = 2500 pixels.
// But the Image Data in the Table Based Image Data that follows directly after (since we have no Local Color Table)
// 0x31F: 08 (LZW Minimum Code Size) ... (Image Data)
// only contains 2499 indices into the active color table.
// test/gif/fc3e2b992c559055267e26dc23e484c0.gif

test('decodePixels: decodes LZW data for sundisk04.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  t.is(image.pixels.length, 0);
  image.decodePixels();
  t.is(image.pixels.length, 65536);
  t.is(image.pixels.length, image.width * image.height);
});

test('decodePixels: decodes LZW data for gif87.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif87.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.is(image.pixels.length, 35600);
  t.is(image.pixels.length, image.width * image.height);
});

test('decodePixels: decodes LZW data for gif89.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif89.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.is(image.pixels.length, 35600);
  t.is(image.pixels.length, image.width * image.height);
});

test('decodePixels: decodes LZW data for BOB_89A.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/BOB_89A.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.is(image.pixels.length, 64000);
  t.is(image.pixels.length, image.width * image.height);
});

test('decodePixels: throws error when no image descriptors found', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.imageDescriptors = [];
  t.throws(() => {
    image.decodePixels();
  }, { message: 'No image descriptors found' });
});

test('getPixel: returns palette-based colors for sundisk04.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  const pixel = image.getPixel(0, 0);
  t.is(pixel.length, 4);
  t.is(pixel[0], 64);
  t.is(pixel[1], 96);
  t.is(pixel[2], 248);
  t.is(pixel[3], 255);
});

test('getPixel: returns palette-based colors for gif87.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif87.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  const pixel = image.getPixel(0, 0);
  t.is(pixel.length, 4);
  t.true(pixel[0] >= 0 && pixel[0] <= 255);
  t.true(pixel[1] >= 0 && pixel[1] <= 255);
  t.true(pixel[2] >= 0 && pixel[2] <= 255);
  t.true(pixel[3] >= 0 && pixel[3] <= 255);
});

test('getPixel: returns palette-based colors for gif89.gif', async (t) => {
  const data = await fs.readFile('./test/image/assets/gif89.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  const pixel = image.getPixel(0, 0);
  t.is(pixel.length, 4);
  t.true(pixel[0] >= 0 && pixel[0] <= 255);
  t.true(pixel[1] >= 0 && pixel[1] <= 255);
  t.true(pixel[2] >= 0 && pixel[2] <= 255);
  t.true(pixel[3] >= 0 && pixel[3] <= 255);
});

test('getPixel: lazily decodes pixels like ImagePNG', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  t.is(image.pixels.length, 0);
  t.is(image.getPixel(0, 0).length, 4);
  t.is(image.pixels.length, image.width * image.height);
});

test('getPixel: throws error when x is out of bounds', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.throws(() => {
    image.getPixel(256, 0);
  }, { message: 'x position out of bounds or invalid: 256' });
});

test('getPixel: throws error when x is negative', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.throws(() => {
    image.getPixel(-1, 0);
  }, { message: 'x position out of bounds or invalid: -1' });
});

test('getPixel: throws error when x is not an integer', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.throws(() => {
    image.getPixel(1.5, 0);
  }, { message: 'x position out of bounds or invalid: 1.5' });
});

test('getPixel: throws error when y is out of bounds', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.throws(() => {
    image.getPixel(0, 256);
  }, { message: 'y position out of bounds or invalid: 256' });
});

test('getPixel: throws error when y is negative', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.throws(() => {
    image.getPixel(0, -1);
  }, { message: 'y position out of bounds or invalid: -1' });
});

test('getPixel: throws error when y is not an integer', async (t) => {
  const data = await fs.readFile('./test/image/assets/sundisk04.gif');
  const image = ImageGIF.fromFile(data);
  image.decodePixels();
  t.throws(() => {
    image.getPixel(0, 1.5);
  }, { message: 'y position out of bounds or invalid: 1.5' });
});

// Self-contained fixtures use an independent literal-only LZW stream. Clearing
// before each literal keeps the code width fixed and avoids testing the encoder against itself.
const gifWord = (value) => [value & 255, value >>> 8];
const gifText = (value) => [...value].map((char) => char.charCodeAt(0));
const gifSubBlocks = (bytes, blockSize = 255) => {
  const output = [];
  for (let i = 0; i < bytes.length; i += blockSize) {
    const block = bytes.slice(i, i + blockSize);
    output.push(block.length, ...block);
  }
  return [...output, 0];
};
const gifLiteralData = (indexes, minimum = 2) => {
  const codes = [];
  for (const index of indexes) codes.push(1 << minimum, index);
  if (indexes.length === 0) codes.push(1 << minimum);
  codes.push((1 << minimum) + 1);
  const bytes = [];
  let bit = 0;
  for (const code of codes) {
    for (let i = 0; i <= minimum; i++, bit++) {
      bytes[bit >>> 3] = (bytes[bit >>> 3] ?? 0) | (((code >>> i) & 1) << (bit & 7));
    }
  }
  return bytes;
};
const gifTable = (palette) => {
  const slots = 1 << Math.max(1, Math.ceil(Math.log2(palette.length)));
  const bytes = [];
  for (let i = 0; i < slots; i++) bytes.push(...(palette[i] ?? [0, 0, 0]).slice(0, 3));
  return bytes;
};
const fixtureGIF = ({ width = 2, height = 1, palette = [[255, 0, 0], [0, 255, 0]], frames = [{ indexes: [0, 1] }], before = [], after = [], background = 0, version = 'GIF89a' } = {}) => {
  const depth = palette ? Math.max(1, Math.ceil(Math.log2(palette.length))) : 1;
  const bytes = [...gifText(version), ...gifWord(width), ...gifWord(height), palette ? 0x80 | (depth - 1) : 0, background, 0];
  if (palette) bytes.push(...gifTable(palette));
  bytes.push(...before);
  for (const frame of frames) {
    if (frame.control) bytes.push(0x21, 0xf9, 4, frame.control.packed ?? 0, ...gifWord(frame.control.delay ?? 0), frame.control.transparent ?? 0, 0);
    bytes.push(...(frame.before ?? []));
    const w = frame.width ?? width, h = frame.height ?? height;
    const size = frame.palette ? Math.max(1, Math.ceil(Math.log2(frame.palette.length))) - 1 : 0;
    bytes.push(0x2c, ...gifWord(frame.left ?? 0), ...gifWord(frame.top ?? 0), ...gifWord(w), ...gifWord(h), (frame.palette ? 0x80 | size : 0) | (frame.interlaced ? 0x40 : 0));
    if (frame.palette) bytes.push(...gifTable(frame.palette));
    const minimum = frame.minimum ?? 2;
    bytes.push(minimum, ...gifSubBlocks(frame.compressed ?? gifLiteralData(frame.indexes, minimum), frame.blockSize));
  }
  return Uint8Array.from([...bytes, ...after, 0x3b]);
};
const indexedGIF = (overrides = {}) => ({ width: 2, height: 2, indexes: Uint8Array.of(0, 1, 1, 0), palette: [[10, 20, 30, 255], [40, 50, 60, 255]], ...overrides });

const plainTextBlock = [0x21, 1, 12, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 65, 0];

test('regression: global palette byte order, raw unsigned fields, and GIF87a are preserved', (t) => {
  const data = fixtureGIF({ version: 'GIF87a' });
  data[12] = 255;
  const image = new ImageGIF(data);
  t.deepEqual([...image.palette], [255, 0, 0, 0, 255, 0]);
  t.deepEqual(image.getPixel(0, 0), [255, 0, 0, 255]);
  t.deepEqual(image.getPixel(1, 0), [0, 255, 0, 255]);
  t.is(image.pixelAspectRatio, 255);
  t.is(image.packed, 128);
  t.is(image.version, 87);
  t.is(image.colorType, 3);
  t.is(image.bitDepth, 1);
});

test('regression: dimensions above signed 16-bit range stay positive', (t) => {
  const bytes = fixtureGIF({ width: 65535, height: 1, frames: [] });
  t.is(new ImageGIF(bytes).width, 65535);
  const image = new ImageGIF(fixtureGIF({ width: 1, height: 40000, frames: [] }));
  t.is(image.height, 40000);
  t.throws(() => image.decodePixels(), { message: 'No image descriptors found' });
});

test('regression: local tables override the global table and work without a global table', (t) => {
  for (const palette of [undefined, null]) {
    const image = new ImageGIF(fixtureGIF({ palette, frames: [{ indexes: [0, 1], palette: [[0, 0, 255], [11, 22, 33]] }] }));
    t.deepEqual(image.getPixel(0, 0), [0, 0, 255, 255]);
    t.deepEqual(image.toIndexed().palette[1], [11, 22, 33, 255]);
  }
});

test('regression: palette-less protocol files parse but cannot invent rendering colors', (t) => {
  const image = new ImageGIF(fixtureGIF({ palette: null }));
  t.is(image.imageDescriptors.length, 1);
  t.throws(() => image.decodePixels(), { message: /active color table/ });
});

test('regression: GCE transparency, delay, user input, and disposal are retained per frame', (t) => {
  const image = new ImageGIF(fixtureGIF({ frames: [
    { indexes: [0, 1], control: { packed: 15, delay: 65535, transparent: 1 } },
    { indexes: [1, 0] },
  ] }));
  t.is(image.frames.length, 2);
  t.is(image.frames[0].delay, 65535);
  t.is(image.frames[0].disposal, 3);
  t.true(image.frames[0].userInput);
  t.is(image.frames[0].transparentIndex, 1);
  t.is(image.frames[1].transparentIndex, undefined);
  t.is(image.frames[1].delay, 0);
  t.true(image.alpha);
  t.deepEqual([...image.transparency], [255, 0]);
  t.deepEqual(image.getPixel(1, 0), [0, 0, 0, 0]);
  t.deepEqual(image.getPixel(1, 0, { composited: false }), [0, 255, 0, 0]);
});

test('regression: reserved disposal bits are masked even in compatibility mode', (t) => {
  const bytes = fixtureGIF({ frames: [{ indexes: [0, 1], control: { packed: 0xe4 } }] });
  t.throws(() => new ImageGIF(bytes), { message: /reserved/ });
  t.is(new ImageGIF(bytes, { strict: false }).frames[0].disposal, 1);
});

test('regression: native frame dimensions differ from logical-screen offsets', (t) => {
  const image = new ImageGIF(fixtureGIF({ width: 4, height: 3, frames: [{ width: 1, height: 1, left: 2, top: 1, indexes: [1] }] }));
  t.is(image.decodePixels().length, 1);
  t.is(image.toIndexed().width, 1);
  t.is(image.toIndexed().leftPosition, 2);
  t.is(image.toRGBA().width, 4);
  t.is(image.toRGBA({ composited: false }).width, 1);
  t.deepEqual(image.getPixel(2, 1), [0, 255, 0, 255]);
  t.deepEqual(image.getPixel(0, 0), [255, 0, 0, 255]);
  t.deepEqual(image.getPixel(0, 0, { background: 'transparent' }), [0, 0, 0, 0]);
});

for (const height of [1, 2, 3, 4, 5, 7, 8, 9, 17]) {
  test(`regression: GIF interlace covers every row exactly once at height ${height}`, (t) => {
    const expected = Array.from({ length: height * 3 }, (_, i) => (Math.floor(i / 3) + i % 3) & 3);
    const ordered = [];
    for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) {
      for (let y = start; y < height; y += step) ordered.push(...expected.slice(y * 3, y * 3 + 3));
    }
    const image = new ImageGIF(fixtureGIF({ width: 3, height, palette: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]], frames: [{ indexes: ordered, interlaced: true }] }));
    t.deepEqual([...image.decodePixels()], expected);
  });
}

test('regression: all disposal methods compose consistently with getPixelInto', (t) => {
  for (const disposal of [0, 1, 2, 3]) {
    const image = new ImageGIF(fixtureGIF({ width: 3, frames: [
      { indexes: [0, 0, 0] },
      { width: 1, height: 1, left: 1, indexes: [1], control: { packed: disposal << 2 } },
      { width: 1, height: 1, left: 2, indexes: [1] },
    ] }));
    const frames = image.decodeFrames();
    t.is(frames.length, 3);
    const expected = disposal < 2 ? [0, 255, 0, 255] : [255, 0, 0, 255];
    t.deepEqual(image.getPixel(1, 0, { frameIndex: 2 }), expected);
    const into = new Uint8Array(8).fill(111);
    t.is(image.getPixelInto(1, 0, into, 2, { frameIndex: 2 }), into);
    t.deepEqual([...into.subarray(2, 6)], expected);
    t.is(into[0], 111);
    for (let f = 0; f < frames.length; f++) {
      for (let x = 0; x < 3; x++) t.deepEqual(image.getPixel(x, 0, { frameIndex: f }), [...frames[f].surface.rgba.subarray(x * 4, x * 4 + 4)]);
    }
    frames[0].surface.rgba.fill(99);
    t.not(frames[1].surface.rgba[0], 99);
  }
});

test('regression: disposal 3 restores the prior rectangle rather than global background', (t) => {
  const image = new ImageGIF(fixtureGIF({ width: 3, frames: [
    { indexes: [1, 1, 1] },
    { width: 1, height: 1, left: 1, indexes: [0], control: { packed: 12 } },
    { width: 1, height: 1, left: 2, indexes: [0] },
  ] }));
  t.deepEqual(image.getPixel(1, 0, { frameIndex: 2 }), [0, 255, 0, 255]);
  t.deepEqual([...image.toRGBA({ frameIndex: 2 }).rgba.subarray(4, 8)], [0, 255, 0, 255]);
});

test('regression: transparent source indexes leave earlier frame pixels unchanged', (t) => {
  const image = new ImageGIF(fixtureGIF({ frames: [
    { indexes: [0, 0] },
    { indexes: [1, 0], control: { packed: 1, transparent: 0 } },
  ] }));
  t.deepEqual(image.getPixel(1, 0, { frameIndex: 1 }), [255, 0, 0, 255]);
  t.deepEqual([...image.toRGBA({ frameIndex: 1 }).rgba], [0, 255, 0, 255, 255, 0, 0, 255]);
});

test('regression: explicit background policy controls transparent disposal', (t) => {
  const image = new ImageGIF(fixtureGIF({ frames: [
    { indexes: [0, 1], control: { packed: 9, transparent: 1 } },
    { width: 1, height: 1, indexes: [1] },
  ] }));
  t.deepEqual(image.getPixel(1, 0, { frameIndex: 1 }), [0, 0, 0, 0]);
  t.deepEqual(image.getPixel(1, 0, { frameIndex: 1, background: 'logical-screen' }), [255, 0, 0, 255]);
});

test('regression: copies, borrowed indexes, forced decoding, and parse resets are explicit', (t) => {
  const data = fixtureGIF();
  const image = new ImageGIF(data);
  const first = image.decodePixels();
  t.is(image.decodePixels(), first);
  t.not(image.toIndexed().indexes, first);
  t.is(image.toIndexed({ copy: false }).indexes, first);
  first[0] = 1;
  t.deepEqual(image.getPixel(0, 0), [0, 255, 0, 255]);
  t.deepEqual([...image.decodePixels({ force: true })], [0, 1]);
  image.invalidatePixels();
  t.is(image.pixels.length, 0);
  image.parse();
  t.is(image.frames.length, 1);
  t.is(image.blocks.filter((block) => block.type === 'image').length, 1);
  data[13] = 100;
  t.is(image.palette[0], 255);
  const borrowed = new ImageGIF(data, { copyInput: false });
  t.is(borrowed.data.buffer, data.buffer);
  data[13] = 80;
  borrowed.parse();
  t.is(borrowed.palette[0], 80);
});

test('regression: typed inputs use exact byte ranges including DataView and wider arrays', (t) => {
  const bytes = fixtureGIF();
  const backing = new Uint8Array(bytes.length + 8);
  backing.set(bytes, 4);
  const views = [backing.subarray(4, 4 + bytes.length), new DataView(backing.buffer, 4, bytes.length)];
  if (bytes.length % 2 === 0) views.push(new Uint16Array(backing.buffer, 4, bytes.length / 2));
  for (const view of views) t.deepEqual(new ImageGIF(view).decodePixels(), Uint8Array.of(0, 1));
  const buffer = new DataBuffer(bytes);
  buffer.offset = 10;
  t.deepEqual(ImageGIF.fromBuffer(buffer).decodePixels(), Uint8Array.of(0, 1));
  t.is(buffer.offset, 10);
});

test('regression: native indexes and RGB beneath transparency survive conversion and editing', (t) => {
  const data = ImageGIF.encodeIndexed(indexedGIF({ palette: [[10, 20, 30, 255], [40, 50, 60, 0]] }));
  const image = new ImageGIF(data);
  const patch = image.toRGBA({ composited: false });
  t.deepEqual([...patch.rgba.subarray(4, 8)], [40, 50, 60, 0]);
  const original = image.decodePixels().slice();
  patch.fill([255, 255, 255, 255]).flipX().scaleNearest(4, 4).crop(0, 0, 1, 1);
  t.deepEqual(image.decodePixels(), original);
});

test('regression: application payload zeros and NAME sub-block framing cannot desynchronize parsing', (t) => {
  const application = [0x21, 0xff, 11, ...gifText('CUSTOM01234'), ...gifSubBlocks([0, 0x2c, 0x21, 0, 0x3b])];
  const name = [0x21, 0xce, ...gifSubBlocks([65, 0, 66])];
  const image = new ImageGIF(fixtureGIF({ before: [...application, ...name] }));
  t.deepEqual([...image.applicationExtensions[0].data], [0, 0x2c, 0x21, 0, 0x3b]);
  t.is(image.imageDescriptors.length, 1);
});

for (const identifier of ['NETSCAPE2.0', 'ANIMEXTS1.0']) {
  test(`regression: ${identifier} looping and byte-oriented comments are retained`, (t) => {
    const image = new ImageGIF(fixtureGIF({ before: [0x21, 0xff, 11, ...gifText(identifier), 3, 1, 255, 255, 0, 0x21, 0xfe, 2, 128, 255, 0] }));
    t.is(image.loopCount, 65535);
    t.is(image.applicationExtensions[0].loopCount, 65535);
    t.is(image.comments[0].comment.charCodeAt(0), 128);
    t.is(image.comments[0].comment.charCodeAt(1), 255);
  });
}

test('regression: GCE survives comments/application data but is consumed by plain text', (t) => {
  const comment = [0x21, 0xfe, 1, 88, 0];
  const image = new ImageGIF(fixtureGIF({ frames: [{ indexes: [0, 1], control: { packed: 1, delay: 12, transparent: 1 }, before: comment }] }));
  t.is(image.frames[0].delay, 12);
  const bytes = fixtureGIF({ frames: [{ indexes: [0, 1], control: { packed: 1, delay: 12, transparent: 1 }, before: plainTextBlock }] });
  const text = new ImageGIF(bytes);
  t.is(text.frames[0].delay, 0);
  t.is(text.frames[0].transparentIndex, undefined);
  t.is(text.plainTextExtensions[0].graphicControl.delay, 12);
  t.is(text.plainTextExtensions[0].plainText, 'A');
  t.throws(() => text.toRGBA(), { message: /unsupported rendering/ });
  t.notThrows(() => text.toRGBA({ composited: false }));
  t.notThrows(() => new ImageGIF(bytes, { plainText: 'ignore' }).toRGBA());
});

test('regression: raster-only parsing does not manufacture frames for dangling GCEs', (t) => {
  const bytes = fixtureGIF({ frames: [], before: [0x21, 0xf9, 4, 0, 0, 0, 0, 0] });
  t.throws(() => new ImageGIF(bytes), { message: /without a rendering block/ });
  t.is(new ImageGIF(bytes, { strict: false }).frames.length, 0);
});

test('regression: every truncated prefix is rejected rather than partially published', (t) => {
  const bytes = fixtureGIF({ frames: [{ indexes: [0, 1], control: { packed: 0 } }] });
  for (let i = 0; i < bytes.length; i++) t.throws(() => new ImageGIF(bytes.subarray(0, i)));
});

test('regression: strict defaults reject missing trailers, padding, and trailing bytes', (t) => {
  const valid = fixtureGIF();
  const missing = valid.subarray(0, valid.length - 1);
  const trailing = Uint8Array.from([...valid, 0]);
  const padded = fixtureGIF({ before: [0] });
  for (const bytes of [missing, trailing, padded]) {
    t.throws(() => new ImageGIF(bytes));
    t.notThrows(() => new ImageGIF(bytes, { strict: false }));
  }
  t.throws(() => new ImageGIF(valid.subarray(0, valid.length - 3), { strict: false }));
});

test('regression: strict minimum-code rules propagate while explicit leniency remains metadata-only', (t) => {
  const bytes = fixtureGIF({ frames: [{ indexes: [0, 1], minimum: 9, compressed: [0] }] });
  t.throws(() => new ImageGIF(bytes), { message: /Invalid LZW Minimum/ });
  const metadata = new ImageGIF(bytes, { rules: { strict_lzw_minimum_code_size: false } });
  t.throws(() => metadata.decodePixels(), { instanceOf: RangeError });
});

test('regression: reserved descriptor bits, zero dimensions, and out-of-screen rectangles reject', (t) => {
  const bytes = fixtureGIF();
  const image = new ImageGIF(bytes);
  const invalid = bytes.slice();
  invalid[image.imageDescriptors[0].offset + 9] |= 0x18;
  t.throws(() => new ImageGIF(invalid));
  t.throws(() => new ImageGIF(fixtureGIF({ width: 0, frames: [] })));
  t.throws(() => new ImageGIF(fixtureGIF({ frames: [{ left: 2, width: 1, height: 1, indexes: [0] }] })));
  const clipped = new ImageGIF(fixtureGIF({ frames: [{ left: 1, width: 2, height: 1, indexes: [1, 0] }] }), { strict: false });
  t.deepEqual([...clipped.toRGBA().rgba], [255, 0, 0, 255, 0, 255, 0, 255]);
});

test('regression: invalid palettes, transparency slots, indexes, and decoded lengths reject', (t) => {
  t.throws(() => new ImageGIF(fixtureGIF({ background: 2 })));
  t.throws(() => new ImageGIF(fixtureGIF({ frames: [{ indexes: [0, 1], control: { packed: 1, transparent: 2 } }] })));
  for (const indexes of [[0], [0, 1, 0], [0, 2]]) {
    const image = new ImageGIF(fixtureGIF({ frames: [{ indexes }] }));
    t.throws(() => image.decodePixels());
    t.is(image.pixels.length, 0);
    t.false(image._decoded);
  }
});

test('regression: fixed extension sizes and terminators are validated', (t) => {
  for (const before of [
    [0x21, 0xf9, 3, 0, 0, 0, 0],
    [0x21, 0xf9, 4, 0, 0, 0, 0, 1],
    [0x21, 0xff, 10, ...gifText('CUSTOM0000'), 0],
    [0x21, 1, 11, ...new Array(11).fill(0), 0],
    [0x21, 0xff, 11, ...gifText('NETSCAPE2.0'), 1, 1, 0],
  ]) t.throws(() => new ImageGIF(fixtureGIF({ before })));
  const duplicate = [0x21, 0xf9, 4, 0, 0, 0, 0, 0, 0x21, 0xf9, 4, 0, 0, 0, 0, 0];
  t.throws(() => new ImageGIF(fixtureGIF({ before: duplicate })), { message: /multiple graphic/ });
});

test('regression: input, native, canvas, frame, block, and rendered allocation limits enforce bounds', (t) => {
  const bytes = fixtureGIF();
  for (const options of [{ maxInputBytes: 1 }, { maxPixels: 1 }, { maxInflatedBytes: 1 }, { maxBlocks: 1 }]) {
    t.throws(() => new ImageGIF(bytes, options), { instanceOf: RangeError });
  }
  t.throws(() => new ImageGIF(fixtureGIF({ frames: [{ indexes: [0, 1] }, { indexes: [1, 0] }] }), { maxFrames: 1 }));
  t.throws(() => new ImageGIF(bytes, { maxRenderedBytes: 7 }).toRGBA());
  t.throws(() => new ImageGIF(bytes, { maxRenderedBytes: 23 }).decodeFrames());
  t.throws(() => ImageGIF.encodeIndexed(indexedGIF(), { maxOutputBytes: 1 }));
  t.throws(() => ImageGIF.encodeIndexed(indexedGIF(), { maxBlocks: 1 }));
  t.throws(() => ImageGIF.rewriteIndexed(bytes, {}, { maxOutputBytes: 1 }));
  for (const limit of [0, -1, 1.5, NaN, Infinity]) t.throws(() => new ImageGIF(bytes, { maxFrames: limit }));
});

test('regression: pixel destination, frame selection, ownership flags, and input types validate', (t) => {
  const image = new ImageGIF(fixtureGIF());
  for (const value of [-1, 1.5, NaN, Infinity, 2]) t.throws(() => image.getPixel(value, 0));
  for (const value of [-1, 0.5, NaN, 1]) t.throws(() => image.getPixel(0, value));
  t.throws(() => image.getPixelInto(0, 0, new Uint8Array(3)));
  t.throws(() => image.getPixelInto(0, 0, new Uint8Array(4), -1));
  t.throws(() => image.toRGBA({ frameIndex: 1 }));
  t.throws(() => image.toRGBA({ background: 'unknown' }));
  t.throws(() => image.toRGBA({ copy: 0 }));
  t.throws(() => image.toIndexed({ copy: 0 }));
  t.throws(() => image.decodePixels({ force: 0 }));
  for (const input of [1, {}, null, undefined, [-1], [NaN]]) t.throws(() => new ImageGIF(input));
  t.throws(() => new ImageGIF(fixtureGIF(), { copyInput: 0 }));
  t.throws(() => new ImageGIF(fixtureGIF(), { plainText: 'guess' }));
});

for (const slots of [1, 2, 3, 4, 7, 16, 128, 255, 256]) {
  test(`regression: encodeIndexed preserves ${slots} palette slots and pads only the physical table`, (t) => {
    const palette = Array.from({ length: slots }, (_, i) => [i, (i * 7) & 255, (i * 13) & 255, 255]);
    if (slots > 2) palette[1] = [...palette[0]]; // Equal colors still occupy distinct slots.
    const indexes = Uint8Array.from({ length: 321 }, (_, i) => i % slots);
    for (const interlaced of [false, true]) {
      const bytes = ImageGIF.encodeIndexed({ width: 107, height: 3, indexes, palette }, { interlaced });
      const decoded = new ImageGIF(bytes).toIndexed();
      t.deepEqual(decoded.indexes, indexes);
      t.deepEqual(decoded.palette.slice(0, slots), palette);
      t.is(decoded.palette.length, 1 << Math.max(1, Math.ceil(Math.log2(slots))));
    }
  });
}

test('regression: exact RGBA encoding accepts binary alpha and rejects lossy conversions', (t) => {
  const rgba = Uint8Array.of(1, 2, 3, 255, 4, 5, 6, 0);
  const source = { width: 2, height: 1, rgba };
  t.deepEqual(new ImageGIF(ImageGIF.encodeRGBA(source)).toRGBA({ composited: false }).rgba, rgba);
  t.throws(() => ImageGIF.encodeRGBA({ ...source, rgba: Uint8Array.of(1, 2, 3, 128, 4, 5, 6, 0) }));
  t.throws(() => ImageGIF.encodeRGBA({ ...source, rgba: Uint8Array.of(1, 2, 3, 0, 4, 5, 6, 0) }));
  const colors = new Uint8Array(257 * 4);
  for (let i = 0; i < 257; i++) colors.set([i & 255, i >>> 8, 0, 255], i * 4);
  t.throws(() => ImageGIF.encodeRGBA({ width: 257, height: 1, rgba: colors }), { message: /256/ });
});

test('regression: animation encoding retains loops, local palettes, offsets, and timing', (t) => {
  const frames = [indexedGIF(), indexedGIF({ width: 1, height: 1, leftPosition: 1, topPosition: 1, indexes: Uint8Array.of(1), palette: [[0, 0, 0, 0], [77, 88, 99, 255]], delay: 12, disposal: 3, userInput: true })];
  const image = new ImageGIF(ImageGIF.encodeIndexedFrames(frames, { loopCount: 0 }));
  t.true(image.animated);
  t.is(image.loopCount, 0);
  t.is(image.frames[1].delay, 12);
  t.is(image.frames[1].disposal, 3);
  t.true(image.frames[1].userInput);
  t.is(image.imageDescriptors[1].localColorTableFlag, 1);
  t.deepEqual(image.getPixel(1, 1, { frameIndex: 1 }), [77, 88, 99, 255]);
  t.deepEqual(ImageGIF.createIndexedGif(indexedGIF()), ImageGIF.encodeIndexed(indexedGIF()));
});

test('regression: encoding rejects invalid palettes, frame metadata, and unrepresentable indexes', (t) => {
  for (const palette of [[], [[0, 0, 0]], [[0, 0, 0, 128]], [[0, 0, 0, 0], [1, 1, 1, 0]], [[256, 0, 0, 255]]]) {
    t.throws(() => ImageGIF.encodeIndexed(indexedGIF({ palette })));
  }
  t.throws(() => ImageGIF.encodeIndexed(indexedGIF({ indexes: Uint8Array.of(0, 1, 1, 2) })));
  t.throws(() => ImageGIF.encodeIndexed(indexedGIF({ width: 65536 })));
  t.throws(() => ImageGIF.encodeIndexedFrames([]));
  for (const options of [{ disposal: 4 }, { delay: -1 }, { loopCount: 65536 }, { backgroundColorIndex: 2 }, { interlaced: 1 }, { userInput: 1 }, { width: 1 }]) {
    t.throws(() => ImageGIF.encodeIndexed(indexedGIF(), options));
  }
});

test('regression: no-op rewrites return exact independently owned bytes including extensions', (t) => {
  const bytes = fixtureGIF({ before: [0x21, 0xfe, 3, 65, 0, 66, 0] });
  const rewritten = ImageGIF.rewriteIndexed(bytes);
  t.deepEqual(rewritten, bytes);
  t.not(rewritten.buffer, bytes.buffer);
  t.deepEqual(ImageGIF.rewriteIndexedGif(bytes), bytes);
});

test('regression: palette-only edits retain exact framed LZW and isolate shared global slots', (t) => {
  const bytes = fixtureGIF({ frames: [{ indexes: [0, 1] }, { indexes: [1, 0] }] });
  const image = new ImageGIF(bytes);
  const old = image.imageDescriptors[0];
  const palette = [[3, 4, 5, 255], [6, 7, 8, 0]];
  const output = ImageGIF.rewriteIndexed(bytes, { palette });
  const edited = new ImageGIF(output);
  const next = edited.imageDescriptors[0];
  t.deepEqual(output.subarray(next.imageDataOffset, next.end), bytes.subarray(old.imageDataOffset, old.end));
  t.deepEqual(edited.toIndexed().palette, palette);
  t.deepEqual(edited.toIndexed({ frameIndex: 1 }).palette, image.toIndexed({ frameIndex: 1 }).palette);
  t.is(edited.imageDescriptors[0].localColorTableFlag, 1);
  t.deepEqual(edited.palette, image.palette);
});

test('regression: indexed rewrites retain interlacing, callbacks, timing, and selected frame pixels', (t) => {
  const source = ImageGIF.encodeIndexed(indexedGIF(), { interlaced: true });
  const replacement = Uint8Array.of(1, 1, 0, 0);
  let called = 0;
  const output = ImageGIF.rewriteIndexed(source, { indexes: replacement, delay: 33, disposal: 2 }, {
    validateIndexed(image) { called++;t.is(image.indexes, replacement); },
  });
  const image = new ImageGIF(output);
  t.is(called, 1);
  t.deepEqual(image.decodePixels(), replacement);
  t.is(image.imageDescriptors[0].interlaceFlag, 1);
  t.is(image.frames[0].delay, 33);
  t.is(image.frames[0].disposal, 2);
  t.throws(() => ImageGIF.rewriteIndexed(source, {}, { validateIndexed() { throw new Error('policy'); } }), { message: 'policy' });
});

test('regression: resize requires replacement indexes and updates single-frame canvas', (t) => {
  const bytes = ImageGIF.encodeIndexed(indexedGIF());
  t.throws(() => ImageGIF.rewriteIndexed(bytes, { dimensions: { width: 1, height: 1 } }));
  t.throws(() => ImageGIF.rewriteIndexed(bytes, { palette: [[0, 0, 0, 255]] }));
  const image = new ImageGIF(ImageGIF.rewriteIndexed(bytes, { dimensions: { width: 1, height: 1 }, indexes: Uint8Array.of(1) }));
  t.is(image.width, 1);
  t.is(image.height, 1);
  t.deepEqual(image.decodePixels(), Uint8Array.of(1));
});

test('regression: metadata-only edit upgrades GIF87a and preserves unrelated extension bytes', (t) => {
  const bytes = fixtureGIF({ version: 'GIF87a', before: [0x21, 0xfe, 2, 128, 255, 0] });
  const image = new ImageGIF(ImageGIF.rewriteIndexed(bytes, { delay: 10 }));
  t.is(image.version, 89);
  t.is(image.frames[0].delay, 10);
  t.is(image.comments[0].comment, String.fromCharCode(128, 255));
  t.deepEqual(image.decodePixels(), Uint8Array.of(0, 1));
});

test('regression: application identifiers do not make unrelated private payloads into loop counts', (t) => {
  const before = [0x21, 0xff, 11, ...gifText('NETSCAPE2.0'), 5, 2, 0, 0, 1, 0, 0];
  const image = new ImageGIF(fixtureGIF({ before }));
  t.is(image.loopCount, undefined);
  t.deepEqual([...image.applicationExtensions[0].data], [2, 0, 0, 1, 0]);
});

test('regression: plain text validates grid, color slots, and required global table', (t) => {
  const zeroCell = [...plainTextBlock];
  zeroCell[11] = 0;
  const missingColor = [...plainTextBlock];
  missingColor[13] = 2;
  for (const before of [zeroCell, missingColor]) t.throws(() => new ImageGIF(fixtureGIF({ before })));
  t.throws(() => new ImageGIF(fixtureGIF({ palette: null, before: plainTextBlock })));
});

test('regression: invalid edits to borrowed cached indexes cannot silently render zero channels', (t) => {
  const image = new ImageGIF(fixtureGIF());
  image.decodePixels()[0] = 255;
  t.throws(() => image.getPixel(0, 0), { message: /palette index/ });
  t.throws(() => image.toRGBA(), { message: /palette index/ });
  t.throws(() => image.toRGBA({ composited: false }));
});

test('regression: indexed rewriting validates untouched native frames before preserving them', (t) => {
  const bytes = fixtureGIF({ frames: [{ indexes: [0, 1] }, { indexes: [0] }] });
  t.notThrows(() => new ImageGIF(bytes).decodePixels());
  t.throws(() => ImageGIF.rewriteIndexed(bytes));
});

test('regression: UTF-8 string inputs cannot bypass the source byte limit', (t) => {
  for (const text of ['GIF89aéé', 'GIF89a🙂', 'GIF89a\ud800\ud800']) {
    t.throws(() => new ImageGIF(text, { maxInputBytes: 8 }), { message: /input byte limit/ });
  }
});

test('regression: standalone indexed encoding does not inherit animation offsets from toIndexed', (t) => {
  const source = new ImageGIF(fixtureGIF({ width: 4, height: 3, frames: [{ width: 1, height: 1, left: 2, top: 1, indexes: [1] }] }));
  const image = new ImageGIF(ImageGIF.encodeIndexed(source.toIndexed()));
  t.is(image.width, 1);
  t.is(image.imageDescriptors[0].leftPosition, 0);
  t.deepEqual(image.decodePixels(), Uint8Array.of(1));
  t.deepEqual(image.getPixel(0, 0), [0, 255, 0, 255]);
});
