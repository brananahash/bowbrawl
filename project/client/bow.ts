import * as J from "jamango";

const BASE_POSITION: J.Vec3 = [-0.4 * 0.8 + 0.2, -3 * 0.8, -1];
const SCALE = 0.2 * 0.8;
const QUATERNION: J.Quat = [0, 0, 0, 1];

const bowFrames = [
  { asset: J.assets.props["Bow Frame 0"], offset: [0, 0, 0.5] },
  { asset: J.assets.props["Bow Frame 1"], offset: [1.5, 0, 10] },
  { asset: J.assets.props["Bow Frame 2"], offset: [1.5, 0, 8] },
  { asset: J.assets.props["Bow Frame 3"], offset: [1.5, -2, 7] },
  { asset: J.assets.props["Bow Frame 4"], offset: [1.5, -4, 6] },
].map((frame) => {
  const adjustment = J.vec3.fromValues(
    ((frame.asset.bounds.x + 0.5) / 2 - frame.offset[0]) * SCALE,
    ((frame.asset.bounds.y + 0.5) / 2 - frame.offset[1]) * SCALE,
    ((frame.asset.bounds.z + 0.5) / 2 - frame.offset[2]) * SCALE
  );
  return {
    asset: frame.asset.id,
    position: J.vec3.add([0, 0, 0], BASE_POSITION, adjustment),
    scale: SCALE,
  };
});

export function setBowFrame(entityId: J.EntityId, frameIndex: number): void {
  const frame = bowFrames[frameIndex];
  J.setCharacterItem(entityId, {
    asset: frame.asset,
    transform: {
      position: frame.position,
      quaternion: QUATERNION,
      scale: frame.scale,
    },
    animations: J.ItemAnimations.ONE_HANDED_MELEE,
  });
}

export function initBow(entityId: J.EntityId): void {
  setBowFrame(entityId, 0);
}
