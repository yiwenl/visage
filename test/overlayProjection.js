export function projectCoverPointToClipSpace(point, sourceSize, targetSize) {
  const scale = Math.max(
    targetSize.width / sourceSize.width,
    targetSize.height / sourceSize.height,
  );
  const offsetX = (targetSize.width - sourceSize.width * scale) / 2;
  const offsetY = (targetSize.height - sourceSize.height * scale) / 2;
  const screenX = offsetX + point.x * scale;
  const screenY = offsetY + point.y * scale;

  return {
    x: screenX / targetSize.width * 2 - 1,
    y: 1 - screenY / targetSize.height * 2,
  };
}
