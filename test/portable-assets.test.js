import test from 'ava';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import ImagePNG from '@uttori/data-tools/image/data-image-png';
import AudioWAV from '@uttori/data-tools/audio/audio-wav';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('public PNG and WAVE subpaths parse supplied bytes', (t) => {
  const png = ImagePNG.fromFile(readFileSync(resolve(root, 'test/image/assets/4x4x8-RGB-MAGENTA.png')));
  png.decodePixels();
  t.true(png.width > 0);
  t.true(png.height > 0);
  const wav = AudioWAV.fromFile(readFileSync(resolve(root, 'test/audio/assets/pluck-pcm16.wav')));
  t.true(wav.chunks.some((chunk) => chunk.type === 'format'));
  t.true(wav.chunks.some((chunk) => chunk.type === 'data'));
});

test('public PNG and WAVE subpaths bundle for a browser without Node imports', async (t) => {
  for (const entry of ['src/image/data-image-png.js', 'src/audio/audio-wav.js']) {
    const bundle = await rollup({ input: resolve(root, entry), plugins: [nodeResolve()] });
    const output = await bundle.generate({ format: 'es', inlineDynamicImports: true });
    t.is(output.output.length, 1);
    t.deepEqual(output.output[0].imports, []);
    await bundle.close();
  }
});
