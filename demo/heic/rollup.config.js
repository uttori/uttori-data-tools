import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';

const config = {
  input: 'demo/heic/index.js',
  output: {
    file: 'demo/heic/heic.js',
    format: 'es',
    name: 'ImageHEIC',
    sourcemap: false,
  },
  plugins: [
    nodeResolve({
      mainFields: ['module', 'main'],
    }),
    replace({
      'process.env.UTTORI_DATA_DEBUG': 'false',
      'process.env.UTTORI_AUDIOMIDI_DEBUG': 'false',
      'process.env.UTTORI_AUDIOWAV_DEBUG': 'false',
      'process.env.UTTORI_IMAGEPNG_DEBUG': 'false',
      delimiters: ['', ''],
      preventAssignment: true,
    }),
    commonjs(),
    babel(),
    cleanup({
      comments: 'none',
    }),
  ],
};

export default config;
