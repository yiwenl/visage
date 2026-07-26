import assert from 'node:assert/strict';
import test from 'node:test';

import { projectCoverPointToClipSpace } from './overlayProjection.js';

test('maps source pixels directly into clip space when aspect ratios match', () => {
  assert.deepEqual(
    projectCoverPointToClipSpace(
      { x: 320, y: 180 },
      { width: 1280, height: 720 },
      { width: 640, height: 360 },
    ),
    { x: -0.5, y: 0.5 },
  );
});

test('accounts for horizontal cropping when a landscape video covers a portrait canvas', () => {
  const projected = projectCoverPointToClipSpace(
    { x: 0, y: 0 },
    { width: 1280, height: 720 },
    { width: 425, height: 688 },
  );

  assert.ok(Math.abs(projected.x - -2.877908496732026) < 1e-12);
  assert.equal(projected.y, 1);
});

test('keeps the source center aligned with the canvas center after cover cropping', () => {
  assert.deepEqual(
    projectCoverPointToClipSpace(
      { x: 640, y: 360 },
      { width: 1280, height: 720 },
      { width: 425, height: 688 },
    ),
    { x: 0, y: 0 },
  );
});
