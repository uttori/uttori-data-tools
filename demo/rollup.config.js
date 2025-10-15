import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';

const config = {
  input: 'demo/index.js',
  output: {
    file: 'demo/png.js',
    format: 'es',
    name: 'ImagePNG',
    sourcemap: false,
  },
  plugins: [
    // Replace zlib with pako for brwosers
    replace({
      "import zlib from 'node:zlib';": "import pako from 'pako/lib/inflate.js';",
      'zlib.inflateSync(': 'pako.inflate(',
      delimiters: ['', ''],
      preventAssignment: true,
    }),
    nodeResolve({
      mainFields: ['module', 'main'],
    }),
    replace({
      'process.env.UTTORI_DATA_DEBUG': 'false',
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
