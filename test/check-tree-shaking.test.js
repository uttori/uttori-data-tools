import path from 'path';
import test from 'ava';

// https://rollupjs.org/guide/en/#javascript-api
import { rollup } from 'rollup';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const onwarn = console.warn;
const plugins = [
  replace({
    preventAssignment: true,
    'process.env.UTTORI_DATA_DEBUG': 'false',
    'process.env.UTTORI_AUDIOMIDI_DEBUG': 'false',
    'process.env.UTTORI_AUDIOWAV_DEBUG': 'false',
    'process.env.UTTORI_IMAGEPNG_DEBUG': 'false',
  }),
];

// Debugging File Output
// await bundle.write({
//   file: './test/tree-shaking-output.js',
//   format: 'es',
// });

test('Tree Shaking: { DataBuffer }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/3-of-3.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
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

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
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

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-hash-crc32.js',
    '3-of-2.js',
  ]);
});

test('Tree Shaking: { ImagePNG }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/imagepng.js',
    onwarn,
    plugins,
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f)), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
    'data-hash-crc32.js',
    'bitmap-text.js',
    'rgba-surface.js',
    'data-image-png.js',
    'imagepng.js',
  ]);
});

test('Tree Shaking: { ImageGIF }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/imagegif.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
    'bitmap-text.js',
    'gif_lzw.js',
    'rgba-surface.js',
    'data-image-gif.js',
    'imagegif.js',
  ]);
});

test('Tree Shaking: { AudioMIDI }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/audiomidi.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
    'audio-midi.js',
    'audiomidi.js',
  ]);
});

test('Tree Shaking: { diff, edits, hunks }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/diff-utils.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'myers.js',
    'diff.js',
    'diff-utils.js',
  ]);
});

test('Tree Shaking: { diffBuffer }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/diff-buffer.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
    'myers.js',
    'diff.js',
    'data-buffer-helpers.js',
    'diff-buffer.js',
  ]);
});

test('Tree Shaking: { AudioWAV }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/audiowav.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
    'audio-wav.js',
    'audiowav.js',
  ]);
});

test('Tree Shaking: { formatBytes, hexTable, formatTable, formatDiffHex, formatDiffHunks, formatMyersGraph }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/formating.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-formating.js',
    'formating.js',
  ]);
});

test('Tree Shaking: { IPS }', async (t) => {
  const bundle = await rollup({
    input: './test/tree-shaking/ips.js',
    onwarn,
    plugins,
    external: ['debug'],
  });

  const output = await bundle.generate({
    format: 'es',
  });

  t.deepEqual(Object.keys(output.output[0].modules).map((f) => path.basename(f).trim()), [
    'data-helpers.js',
    'underflow-error.js',
    'data-buffer.js',
    'data-patch-ips.js',
    'ips.js',
  ]);
});

for (const [symbol, entry, dependencies] of [
  ['SP404PadInfo', 'sp404-padinfo.js', ['sp404-padinfo.js']],
  ['SP404Pattern', 'sp404-pattern.js', ['audio-midi.js', 'sp404-pattern.js']],
  ['SP404PadInfo subpath', 'sp404-padinfo-subpath.js', ['sp404-padinfo.js']],
  ['SP404Pattern subpath', 'sp404-pattern-subpath.js', ['audio-midi.js', 'sp404-pattern.js']],
]) {
  test(`Tree Shaking: ${symbol} includes only its dependencies`, async (t) => {
    const bundle = await rollup({
      input: `./test/tree-shaking/${entry}`,
      plugins: [...plugins, nodeResolve()],
      // Unresolved imports and other warnings must not silently become external dependencies.
      onwarn(warning) { throw new Error(warning.message); },
    });

    try {
      const { output } = await bundle.generate({ format: 'es' });
      t.is(output.length, 1);
      const chunk = output[0];
      t.deepEqual(Object.keys(chunk.modules).map((file) => path.basename(file)), [
        'data-helpers.js', 'underflow-error.js', 'data-buffer.js', ...dependencies, entry,
      ]);
      t.deepEqual(chunk.imports, []);
      t.deepEqual(chunk.dynamicImports, []);
      // Execute the ESM output with no external imports to catch missing runtime dependencies.
      const module = await import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`);
      t.is(module.default.name, symbol.toString().split(' ')[0]);
    } finally {
      await bundle.close();
    }
  });
}
