import path from 'path';
import test from 'ava';

// https://rollupjs.org/guide/en/#javascript-api
import { rollup } from 'rollup';
import replace from '@rollup/plugin-replace';

const onwarn = console.warn;
const plugins = [
  replace({
    preventAssignment: true,
    'process.env.UTTORI_DATA_DEBUG': 'false',
    'process.env.UTTORI_IMAGEPNG_DEBUG': 'false',
  }),
];

// Debugging File Output
// await bundle.write({
//   file: './test/tree-shaking-output.js',
//   format: 'es',
// });

test('Tree Shaking: { DataBuffer, DataBufferList, DataStream }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/3-of-3.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules (removing 'commonjsHelpers.js' with slice)
  // DataBuffer now includes diff functionality (diff.js and myers.js)
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()).slice(1), [
    'data-helpers.js',
    'myers.js',
    'diff.js',
    'data-buffer.js',
    'data-buffer-list.js',
    'data-stream.js',
    '3-of-3.js',
  ]);
});

test('Tree Shaking: { DataBitstream }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/4-of-1.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules (removing 'commonjsHelpers.js' with slice)
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()).slice(1), [
    'data-helpers.js',
    'myers.js',
    'diff.js',
    'data-buffer.js',
    'data-buffer-list.js',
    'data-stream.js',
    'data-bitstream.js',
    '4-of-1.js',
  ]);
});

test('Tree Shaking: { CRC32 }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/3-of-2.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules (removing 'commonjsHelpers.js' with slice)
  // DataBuffer now includes diff functionality (diff.js and myers.js)
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()).slice(1), [
    'data-helpers.js',
    'myers.js',
    'diff.js',
    'data-buffer.js',
    'data-hash-crc32.js',
    '3-of-2.js',
  ]);
});

test('Tree Shaking: { ImagePNG, DataBuffer, DataBufferList, DataStream }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/imagepng.js',
    onwarn,
    plugins,
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Pako Version sum should be (1 (input) + 3 (data tools) + 16 pako files) number of expected modules
  // t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f)), [
  //   'adler32.js',
  //   'crc32.js',
  //   'inffast.js',
  //   'inftrees.js',
  //   'constants.js',
  //   'inflate.js',
  //   'common.js',
  //   'strings.js',
  //   'messages.js',
  //   'zstream.js',
  //   'gzheader.js',
  //   'inflate.js',
  //   'data-buffer.js',
  //   'data-buffer-list.js',
  //   'data-stream.js',
  //   'data-image-png.js',
  //   'imagepng.js',
  // ]);

  // Zlib sum should be (1 (input) + 3 (data tools) + 1 shake-me) number of expected modules
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f)), [
    'underflow-error.js',
    'data-helpers.js',
    'myers.js',
    'diff.js',
    'data-buffer.js',
    'data-image-png.js',
    'imagepng.js',
  ]);
});
