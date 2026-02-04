# Visage

A lightweight Face Mesh detection module using TensorFlow.js and MediaPipe, capable of detecting faces and providing 3D vertex positions.

## Features

- **Face Detection**: Real-time face detection using MediaPipe Face Mesh.
- **3D Landmarks**: specialized in providing the array of 3D vertices for the detected face.
- **Camera Management**: Built-in camera access handling via [camera-manager](https://github.com/yiwenl/camera-manager).
- **Easy Integration**: Modular design with TypeScript support.
- **Mirroring**: Automatic horizontal mirroring for natural interaction.

## Installation

```bash
npm install visage
```

(Note: If this is a private package, adjust installation instructions accordingly)

## Usage

```typescript
import { FaceLandmarkManager } from 'visage';

// 1. Initialize Manager (Handling camera automatically)
const faceManager = new FaceLandmarkManager({
    maxFaces: 1,
    refineLandmarks: true, // Improves eye and lip landmarks
    mirror: true // Default: true. Flips coordinates for mirrored view.
});

// Init will create and start the camera internally if not provided
await faceManager.init();

// 2. Access Camera (Optional)
// If you need to attach the video element to the DOM
const video = faceManager.getVideo();
if (video) {
    document.body.appendChild(video);
}

// 3. Listen for Results
faceManager.addEventListener('face-detected', (e) => {
    // Get 3D vertices (x, y, z)
    // If mirror is true, x coordinates are flipped
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

## Demos

The project includes a 3D WebGL demo to verify functionality.

### 3D WebGL Demo
A 3D visualization using `gl-matrix` and WebGL to render the detected face mesh as a point cloud.
- **Files**: `test/index.html`, `test/demo3d.js`
- **Features**: 
  - Real-time 3D rendering.
  - Semi-transparent camera feed overlay.
  - Mirrored visualization.

### Running the Demo
To run the demo locally:

```bash
npm install
npm install
npm run build
npm run dev
```

Then open:
- [http://localhost:5173/](http://localhost:5173/)

## License

ISC
