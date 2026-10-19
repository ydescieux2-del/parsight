/**
 * ShelfLayout — bin geometry of the supply shelf, shared by the find highlight, the arrow and
 * take detection. Must match tools/supply_shelf/build_shelf.py.
 *
 * Frame: the DisplayCase SceneObject's local space. cm, origin = floor at the unit's center,
 * +Y up, +Z = front of the unit (toward the user).
 */

/** Deck height (cm) of the shelf that holds each item. */
export const SHELF_Y: {[key: string]: number} = {Flushes: 105, IVStart: 70, Foley: 35}

/** Center X of the three bins on every shelf. */
export const BIN_XS = [-38, 0, 38]
export const BIN_HALF_W = 17
export const BIN_Z0 = -20
export const BIN_Z1 = 19
export const BIN_H = 10

/** A box in DisplayCase-local cm. */
export interface Box3 {
  min: vec3
  max: vec3
}

/**
 * The space a hand has to enter for a take: the bin's footprint, from its floor up to well
 * above the rim (stock stands taller than the bin), but never as far as the next deck.
 */
export function binReachBox(key: string, binIndex: number): Box3 {
  const y = SHELF_Y[key]
  const cx = BIN_XS[binIndex]
  return {
    min: new vec3(cx - BIN_HALF_W, y + 0.5, BIN_Z0),
    max: new vec3(cx + BIN_HALF_W, y + 22, BIN_Z1),
  }
}

export function boxContains(b: Box3, p: vec3): boolean {
  return p.x >= b.min.x && p.x <= b.max.x && p.y >= b.min.y && p.y <= b.max.y &&
    p.z >= b.min.z && p.z <= b.max.z
}

/** Center of an item's three bins (rim height), for the arrow and tests. */
export function shelfBinsCenter(key: string): vec3 {
  return new vec3(0, SHELF_Y[key] + BIN_H * 0.6, (BIN_Z0 + BIN_Z1) / 2)
}
