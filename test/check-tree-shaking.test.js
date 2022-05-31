const path = require('path');
const test = require('ava');

// https://rollupjs.org/guide/en/#javascript-api
const rollup = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');

const onwarn = () => {};
const plugins = [
  replace({
    'process.env.UTTORI_DATA_DEBUG': 'false',
  }),
  commonjs(),
];

// Debugging File Output
// await bundle.write({
//   file: './test/tree-shaking-output.js',
//   format: 'es',
// });

test('Tree Shaking: { DataBuffer, DataBufferList, DataStream }', async (t) => {
  const bundle = await rollup.rollup({
    input: './test/tree-shaking/3-of-3.mjs',
    onwarn,
    plugins,
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f)), [
    'underflow-error.js',
    'data-helpers.js',
    'data-buffer.js',
    'data-buffer-list.js',
    'data-stream.js',
    '3-of-3.mjs',
    '3-of-3.mjs?commonjs-entry',
  ]);
});

test('Tree Shaking: { DataBitstream }', async (t) => {
  const bundle = await rollup.rollup({
    input: './test/tree-shaking/4-of-1.mjs',
    onwarn,
    plugins,
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f)), [
    'underflow-error.js',
    'data-helpers.js',
    'data-buffer.js',
    'data-buffer-list.js',
    'data-stream.js',
    'data-bitstream.js',
    '4-of-1.mjs',
    '4-of-1.mjs?commonjs-entry',
  ]);
});

test('Tree Shaking: { CRC32 }', async (t) => {
  const bundle = await rollup.rollup({
    input: './test/tree-shaking/3-of-2.mjs',
    onwarn,
    plugins,
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f)), [
    'underflow-error.js',
    'data-helpers.js',
    'data-buffer.js',
    'data-hash-crc32.js',
    '3-of-2.mjs',
    '3-of-2.mjs?commonjs-entry',
  ]);
});
