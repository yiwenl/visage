# CLAUDE.md

## Project purpose

Visage is a small, browser-only TypeScript library for real-time MediaPipe Face
Mesh detection. It combines `camera-manager` with
`@tensorflow-models/face-landmarks-detection` and exposes detected faces,
mirrored 3D landmark vertices, and the underlying video element through an
event-driven API.

Keep the library framework-agnostic and focused on face landmarks. Avoid adding
UI concerns or unrelated computer-vision features to the core class.

## Important files

- `src/FaceLandmarkManager.ts` — face detector lifecycle and public API.
- `src/index.ts` — package exports.
- `README.md` — consumer-facing usage documentation.
- `test/index.html` and `test/demo3d.js` — browser-based camera and WebGL
  landmark overlay demo.
- `test/overlayProjection.js` — maps camera pixels through the demo's
  `object-fit: cover` crop into WebGL clip space.
- `test/overlayProjection.test.js` — regression tests for overlay alignment.
- `rollup.config.js` — ESM and UMD library builds.
- `vite.config.js` — local demo server and source alias.
- `tsconfig.json` — strict TypeScript and declaration settings.

Files under `dist/` are generated and ignored. Do not edit them directly.

## Architecture and data flow

1. `FaceLandmarkManager.init()` accepts an optional `CameraManager`.
2. Without one, Visage creates and starts its own camera and records ownership.
3. With one, the caller remains responsible for starting, stopping, and
   disposing that camera.
4. Initialization waits for TensorFlow.js and creates a MediaPipe Face Mesh
   detector.
5. A sequential `requestAnimationFrame` loop calls `estimateFaces(video)`.
6. Each completed inference stores the latest faces and emits `face-detected`.
   The event is currently emitted even when the resulting faces array is empty.
7. `getVertices()` converts the first face's keypoints to `[x, y, z]` arrays
   and mirrors only the returned X coordinates when `mirror` is enabled.

The raw `event.detail.faces` results are not mirrored. The demo mirrors the
visible video separately with CSS.

## Public API

```ts
import { FaceLandmarkManager } from 'visage';

const manager = new FaceLandmarkManager({
  maxFaces: 1,
  refineLandmarks: true,
  mirror: true,
});

manager.addEventListener(
  FaceLandmarkManager.EVENTS.FACE_DETECTED,
  (event) => {
    const faces = (event as CustomEvent<{ faces: unknown[] }>).detail.faces;
    const vertices = manager.getVertices();
  },
);

manager.addEventListener(FaceLandmarkManager.EVENTS.ERROR, (event) => {
  const error = (event as CustomEvent<{ error: unknown }>).detail.error;
});

await manager.init();

// Later:
manager.stop();
manager.dispose();
```

Options:

- `maxFaces` defaults to `1`.
- `refineLandmarks` defaults to `false`.
- `mirror` defaults to `true`.

Methods:

- `init(cameraManager?)` prepares the camera and detector, then starts
  inference.
- `start()` starts the inference loop. Call `init()` first.
- `stop()` stops scheduling inference but does not stop the camera.
- `dispose()` stops inference and releases references.
- `getVertices()` returns landmarks for the first detected face.
- `getFaceCount()` returns the size of the latest result.
- `getVideo()` returns the current camera's detached video element.

Events:

- `FaceLandmarkManager.EVENTS.FACE_DETECTED` (`face-detected`) provides
  `{ faces }`.
- `FaceLandmarkManager.EVENTS.ERROR` (`error`) provides `{ error }` for
  inference failures.

Initialization failures reject `init()` directly; they do not currently emit
the `error` event.

## Runtime constraints

- The package requires a browser DOM, WebGL, camera APIs, and a secure context
  such as HTTPS or localhost.
- Camera permission must be requested from a user gesture where required by
  the browser.
- The MediaPipe runtime downloads assets from the `solutionPath` configured in
  `FaceLandmarkManager.ts`; the demo therefore needs network access.
- Use the documented ESM named import. The current CommonJS `require` entry
  resolves to a UMD file but does not expose the package exports in Node.
- The UMD build externalizes TensorFlow.js, Face Landmarks Detection, and
  CameraManager. Browser consumers of that build must provide the corresponding
  globals themselves.

## Known lifecycle gaps

Treat these as focused follow-up work rather than reasons to rewrite the
library:

- `dispose()` should call the detector's `dispose()` method before dropping the
  reference.
- An internally owned camera should use `cameraManager.dispose()`, not only
  `stop()`, so its global `devicechange` listener is removed.
- If detector initialization fails after the internal camera starts, the camera
  should be cleaned up before `init()` rejects.
- Calling `start()` before `init()` currently leaves `isRunning` true without a
  scheduled loop, which prevents initialization from starting it later.
- Repeated `init()` calls need an explicit policy to avoid replacing live
  detector or camera resources.
- The jsDelivr MediaPipe `solutionPath` is unversioned and can change
  independently of the installed peer dependency.

Preserve current event names and output coordinates unless making an explicit
breaking release.

## Development workflow

CI currently targets Node.js 20.

Install dependencies:

```bash
npm ci
```

Run the local camera/WebGL demo:

```bash
npm run dev
```

Build ESM, UMD, source maps, and declarations:

```bash
npm run build
```

Type-check without generating files:

```bash
npx tsc --noEmit
```

Run the automated coordinate-mapping tests:

```bash
npm test
```

For browser behavior changes, manually verify the Vite demo:

1. Camera permission succeeds and a preview appears.
2. Face and vertex counts update for both a present and absent face.
3. Mirrored video and returned landmark X coordinates remain aligned.
4. Detection errors emit the documented error event.
5. Stop prevents further inference.
6. Dispose releases owned camera and detector resources.
7. A caller-provided CameraManager remains under caller ownership.

## Change guidelines

- Keep public types explicit; add exported event-detail types when extending
  the event API.
- Avoid overlapping inference calls. The current loop waits for one
  `estimateFaces()` call before scheduling the next.
- Keep the video CSS `object-fit` behavior and the overlay projection helper in
  sync. A crop or layout change requires corresponding mapping tests.
- Preserve camera ownership: never stop or dispose a caller-provided camera.
- Update `README.md` and this file whenever public behavior changes.
- Run `npm run build` and `npx tsc --noEmit` before considering a change
  complete.
- Do not commit `dist/`, `node_modules/`, local environment files, or captured
  camera media.
