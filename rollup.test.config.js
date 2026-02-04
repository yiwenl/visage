import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
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
};
