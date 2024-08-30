import path from 'path';
import test from 'ava';

// https://rollupjs.org/guide/en/#javascript-api
import { rollup } from 'rollup';
import replace from '@rollup/plugin-replace';

// eslint-disable-next-line no-console
const onwarn = console.warn;
const plugins = [
  replace({
    preventAssignment: true,
    'process.env.UTTORI_DATA_DEBUG': 'false',
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
    external: ["debug"],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules (removing 'commonjsHelpers.js' with slice)
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()).slice(1), [
    'data-helpers.js',
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
    external: ["debug"],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules (removing 'commonjsHelpers.js' with slice)
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()).slice(1), [
    'data-helpers.js',
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
    external: ["debug"],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  // Sum should be 1 + number of expected modules (removing 'commonjsHelpers.js' with slice)
  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()).slice(1), [
    'data-helpers.js',
    'data-buffer.js',
    'data-hash-crc32.js',
    '3-of-2.js',
  ]);
});
