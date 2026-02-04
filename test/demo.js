import { CameraManager, FaceLandmarkManager } from '../dist/visage.esm.js';

async function init() {
    const cameraManager = new CameraManager();
    await cameraManager.start();
    document.body.appendChild(cameraManager.video);

    const faceManager = new FaceLandmarkManager({
        maxFaces: 1,
        refineLandmarks: true
    });

    await faceManager.init(cameraManager);

    faceManager.addEventListener('face-detected', (e) => {
        const count = faceManager.getFaceCount();
        const vertices = faceManager.getVertices();
        
        document.getElementById('face-count').innerText = count;
        document.getElementById('vertex-count').innerText = vertices.length;
        
        if (vertices.length > 0) {
            console.log('Detected vertices:', vertices[0]);
        }
    });
}

init();
