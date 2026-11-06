// systems/quest/inBlock.js — QAE3 CurrentInBlockPixel: the player's position
// inside the current RMB block, normalized to QAE's 0..128 grid.
//
// An RMB block is RMB_DIMENSION (4096) native units on a side; MeshReader.
// GlobalScale is 0.025 m per native unit. QAE reports the in-block position on
// a 0..128 grid ((0,0) Southwest to (128,128) Northeast, height ignored), so
// each QAE pixel is 4096/128 = 32 native units.
//
// The block the player stands in is found by flooring the native position to
// the block grid; the pixel is the offset within that block / 32.

export const RMB_DIMENSION = 4096;   // native units per RMB block side (formats/blocksFile.js)
export const GLOBAL_SCALE = 0.025;   // metres per native unit (world/meshReader.js)
export const QAE_PIXELS = 128;       // QAE's in-block grid size
export const NATIVE_PER_PIXEL = RMB_DIMENSION / QAE_PIXELS;   // 32

/** The block origin (native units) containing a native position. */
export function blockOriginNative(nativeX, nativeZ) {
  return {
    x: Math.floor(nativeX / RMB_DIMENSION) * RMB_DIMENSION,
    z: Math.floor(nativeZ / RMB_DIMENSION) * RMB_DIMENSION,
  };
}

/** In-block QAE pixel (0..128) for a native-unit position.
 *  Height is ignored (QAE reads XZ only).
 */
export function inBlockPixelNative(nativeX, nativeZ) {
  const ox = ((nativeX % RMB_DIMENSION) + RMB_DIMENSION) % RMB_DIMENSION;
  const oz = ((nativeZ % RMB_DIMENSION) + RMB_DIMENSION) % RMB_DIMENSION;
  return {
    x: Math.min(QAE_PIXELS, Math.max(0, Math.floor(ox / NATIVE_PER_PIXEL))),
    y: Math.min(QAE_PIXELS, Math.max(0, Math.floor(oz / NATIVE_PER_PIXEL))),
  };
}

/** In-block QAE pixel for a SCENE (metre) position [x,y,z] or {x,z}. */
export function inBlockPixel(worldPos) {
  const wx = Array.isArray(worldPos) ? worldPos[0] : worldPos?.x;
  const wz = Array.isArray(worldPos) ? worldPos[2] : (worldPos?.z ?? worldPos?.y);
  if (wx == null || wz == null) return null;
  return inBlockPixelNative(wx / GLOBAL_SCALE, wz / GLOBAL_SCALE);
}
