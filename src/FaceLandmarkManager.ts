import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { CameraManager } from 'camera-manager';

export interface FaceLandmarkManagerOptions {
  maxFaces?: number;
  refineLandmarks?: boolean;
  mirror?: boolean;
}

export class FaceLandmarkManager extends EventTarget {
  private model: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private cameraManager: CameraManager | null = null;
  private rafId: number | null = null;
  private isRunning: boolean = false;
  private options: FaceLandmarkManagerOptions;
  
  private ownsCameraManager: boolean = false;
  
  // Store latest results
  private faces: faceLandmarksDetection.Face[] = [];

  constructor(options: FaceLandmarkManagerOptions = {}) {
    super();
    this.options = {
      maxFaces: options.maxFaces || 1,
      refineLandmarks: options.refineLandmarks || false,
      mirror: options.mirror ?? true
    };
  }

  async init(cameraManager?: CameraManager) {
    if (cameraManager) {
      this.cameraManager = cameraManager;
      this.ownsCameraManager = false;
    } else {
      this.cameraManager = new CameraManager();
      this.ownsCameraManager = true;
      await this.cameraManager.start();
    }

    // Load method
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
      runtime: 'mediapipe', // or 'tfjs'
      refineLandmarks: this.options.refineLandmarks ?? false,
      maxFaces: this.options.maxFaces,
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh', // Optional: specify path to wasm assets if needed
    };
    
    // Note: ensure backend is ready. webgl is imported.
    await tf.ready();

    this.model = await faceLandmarksDetection.createDetector(model, detectorConfig);

    // Start loop if camera is ready
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.model = null;
    if (this.ownsCameraManager && this.cameraManager) {
      this.cameraManager.stop();
      // CameraManager might not have dispose, check its type definition if needed, but stop is standard. 
      // If it has dispose, call it. Based on previous file reads, it has stop().
    }
    this.cameraManager = null;
    this.faces = [];
  }

  private async loop() {
    if (!this.isRunning || !this.cameraManager) return; // model check inside try/catch or assume init? 
    // Actually best to check model exists
    if (!this.model) return;

    const video = this.cameraManager.video;
    
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        try {
            const faces = await this.model.estimateFaces(video);
            this.faces = faces;
            
            // Dispatch event with results
            this.dispatchEvent(new CustomEvent('face-detected', { detail: { faces } }));
        } catch (err) {
            console.error('Face detection error:', err);
            this.dispatchEvent(new CustomEvent('error', { detail: { error: err } }));
            this.stop(); // Stop on critical error? Maybe not, could be transient. 
            // Let's just log and emit.
        }
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  /**
   * Returns array of vertices positions in 3D for the first detected face.
   * Format: [[x, y, z], ...]
   */
  getVertices(): number[][] {
    if (this.faces.length > 0 && this.faces[0].keypoints) {
      const width = this.cameraManager?.video.videoWidth || 0;
      // keypoints is Array<{x, y, z, name?}>
      // We want to return just arrays of [x, y, z] to match "array of vertices positions in 3D"
      return this.faces[0].keypoints.map(kp => {
        let x = kp.x;
        if (this.options.mirror && width > 0) {
          x = width - x;
        }
        return [x, kp.y, kp.z || 0];
      });
    }
    return [];
  }

  /**
   * Returns number of faces detected
   */
  getFaceCount(): number {
    return this.faces.length;
  }

  /**
   * Returns the CameraManager instance
   */
  getCameraManager(): CameraManager | null {
    return this.cameraManager;
  }

  get mirror(): boolean {
    return this.options.mirror ?? true;
  }
}
