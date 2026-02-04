import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'test/demo.js',
    output: {
      file: 'test/bundle.js',
      format: 'iife',
      name: 'demo'
    },
    plugins: [
      nodeResolve(),
      commonjs()
    ]
  },
  {
    input: 'test/demo3d.js',
    output: {
        file: 'test/bundle3d.js',
        format: 'iife',
        name: 'demo3d'
    },
    plugins: [
        nodeResolve(),
        commonjs()
    ]
  }
];
