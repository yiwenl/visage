import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/visage.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/visage.umd.js',
      format: 'umd',
      name: 'visage',
      sourcemap: true,
      globals: {
        '@tensorflow/tfjs-core': 'tf',
        '@tensorflow/tfjs-backend-webgl': 'tf',
        '@tensorflow-models/face-landmarks-detection': 'faceLandmarksDetection',
        'camera-manager': 'CameraManager'
      }
    }
  ],
  external: [
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
    '@tensorflow-models/face-landmarks-detection',
    'camera-manager' // Treat camera-manager as external if we want the user to provide it or it to be bundled separately. 
    // However, for a standalone module, we might want to bundle it?
    // The user's request "create a face mesh detection module" suggests a library.
    // Usually libraries don't bundle their dependencies if they are peer dependencies.
    // But camera-manager is a small util. Let's see. 
    // If I bundle it, resolve() handles it. If I exclude it, I should list it in external.
    // Given the user asked to "add to dependencies", maybe they expect it to be a dependency of the consumed package.
    // I will keep it external for UMD to minimize size, but if the user wants a single bundle, I should remove it from external.
    // Let's assume standard library practice: externalize dependencies.
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' })
  ]
};
