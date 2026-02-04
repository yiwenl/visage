# Visage

A lightweight Face Mesh detection module using TensorFlow.js and MediaPipe, capable of detecting faces and providing 3D vertex positions.

## Features

- **Face Detection**: Real-time face detection using MediaPipe Face Mesh.
- **3D Landmarks**: specialized in providing the array of 3D vertices for the detected face.
- **Camera Management**: Built-in camera access handling via `camera-manager`.
- **Easy Integration**: Modular design with TypeScript support.

## Installation

```bash
npm install visage
```

(Note: If this is a private package, adjust installation instructions accordingly)

## Usage

```typescript
import { CameraManager, FaceLandmarkManager } from 'visage';

// 1. Initialize Camera
const cameraManager = new CameraManager();
await cameraManager.start();
document.body.appendChild(cameraManager.video);

// 2. Initialize Face Mesh
const faceManager = new FaceLandmarkManager({
    maxFaces: 1,
    refineLandmarks: true // Improves eye and lip landmarks
});
await faceManager.init(cameraManager);

// 3. Listen for Results
faceManager.addEventListener('face-detected', (e) => {
    // Get 3D vertices (x, y, z)
    const vertices = faceManager.getVertices();
    const faceCount = faceManager.getFaceCount();

    console.log(`Detected ${faceCount} face(s)`);
    if (vertices.length > 0) {
        console.log('First vertex:', vertices[0]);
    }
});
```

## Build

To build the project locally:

```bash
npm install
npm run build
```

## Development

To run the demo page locally:

```bash
npm install
npm run build
npm run test:build
# Serve the test/ directory with your preferred server, e.g., 'serve test'
```

## License

ISC
