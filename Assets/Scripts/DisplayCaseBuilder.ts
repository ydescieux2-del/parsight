/**
 * DisplayCaseBuilder
 * Stand-in for a hospital clean supply room shelf (see devpost/design-brief.md).
 * Builds, at runtime with MeshBuilder, a chrome wire shelving unit about
 * 120 cm wide x 131 cm tall x 50 cm deep, with shelves at 35 / 70 / 105 cm
 * holding blue bins of saline flushes (top), IV start kits (middle) and
 * Foley catheter kits (bottom, empty at start: count 0), plus overstock cases
 * on the floor deck.
 *
 * Local frame of this SceneObject: origin = floor, center of the unit.
 * +Y up, +Z = front of the unit (toward the user). Units: cm.
 * Shelf front edges sit at z = +22. Top deck surface at y = 131.
 */

type V3 = [number, number, number];
type C4 = [number, number, number, number];

// Baked light so the unlit vertex color material still shows form.
const LIGHT: V3 = (() => {
  const l: V3 = [0.35, 0.85, 0.4];
  const n = Math.hypot(l[0], l[1], l[2]);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

/** Accumulates interleaved position/normal/color verts with a yaw+translate placement. */
class Geo {
  verts: number[] = [];
  idx: number[] = [];
  count = 0;
  private ox = 0;
  private oy = 0;
  private oz = 0;
  private c = 1;
  private s = 0;

  constructor(private shade: boolean) {}

  place(x: number, y: number, z: number, yawDeg: number = 0): void {
    this.ox = x;
    this.oy = y;
    this.oz = z;
    const a = (yawDeg * Math.PI) / 180;
    this.c = Math.cos(a);
    this.s = Math.sin(a);
  }

  v(p: V3, n: V3, col: C4): number {
    // Proper rotation about Y (det = +1) so CCW winding is preserved.
    const px = p[0] * this.c + p[2] * this.s;
    const pz = -p[0] * this.s + p[2] * this.c;
    const nx = n[0] * this.c + n[2] * this.s;
    const nz = -n[0] * this.s + n[2] * this.c;
    let k = 1;
    if (this.shade) {
      const d = nx * LIGHT[0] + n[1] * LIGHT[1] + nz * LIGHT[2];
      k = 0.62 + 0.38 * Math.max(0, d);
    }
    this.verts.push(
      px + this.ox, p[1] + this.oy, pz + this.oz,
      nx, n[1], nz,
      col[0] * k, col[1] * k, col[2] * k, col[3]
    );
    return this.count++;
  }

  tri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }

  quad(p0: V3, p1: V3, p2: V3, p3: V3, n: V3, col: C4): void {
    // p0 -> p1 -> p2 -> p3 must be CCW seen from the side n points to.
    const a = this.v(p0, n, col), b = this.v(p1, n, col);
    const c = this.v(p2, n, col), d = this.v(p3, n, col);
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  /** Axis-aligned box (in placed frame) from min/max corners. Face order verified CCW. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, col: C4): void {
    this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], col);
    this.quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0], col);
    this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], col);
    this.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0], col);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], col);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], col);
  }

  /**
   * Lathe around local Y. profile = [r, y] bottom to top.
   * colorFn(j, theta) picks a color per vertex (j = profile index).
   * Winding [bl, br, tr, bl, tr, tl] verified outward for this labeling.
   */
  lathe(
    src: [number, number][],
    segments: number,
    colorFn: (tag: number, p: V3) => C4,
    maxStep: number = 0.5
  ): void {
    // Resample so profile rows are about as dense as the angular rings;
    // otherwise per-vertex speckles smear into radial streaks.
    // tag = index of the source segment each row came from.
    const profile: [number, number][] = [];
    const tags: number[] = [];
    for (let k = 0; k < src.length; k++) {
      if (k > 0) {
        const a = src[k - 1], b = src[k];
        const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxStep);
        for (let q = 1; q < steps; q++) {
          const t = q / steps;
          profile.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
          tags.push(k - 1);
        }
      }
      profile.push(src[k]);
      tags.push(k);
    }
    const P = profile.length;
    const n2: [number, number][] = [];
    for (let j = 0; j < P; j++) {
      const prev = profile[Math.max(0, j - 1)];
      const next = profile[Math.min(P - 1, j + 1)];
      const dx = next[0] - prev[0], dy = next[1] - prev[1];
      const len = Math.hypot(dx, dy) || 1;
      n2.push([dy / len, -dx / len]);
    }
    const start = this.count;
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      for (let j = 0; j < P; j++) {
        const [r, y] = profile[j];
        const p: V3 = [r * c, y, r * s];
        this.v(p, [n2[j][0] * c, n2[j][1], n2[j][0] * s], colorFn(tags[j], p));
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < P - 1; j++) {
        const bl = start + i * P + j, br = bl + 1;
        const tl = start + (i + 1) * P + j, tr = tl + 1;
        this.tri(bl, br, tr);
        this.tri(bl, tr, tl);
      }
    }
    // Bottom cap (normal -Y): (center, ring i, ring i+1)
    if (profile[0][0] > 1e-6) {
      const [r, y] = profile[0];
      const col = colorFn(tags[0], [0, y, 0]);
      const center = this.v([0, y, 0], [0, -1, 0], col);
      const ring = this.count;
      for (let i = 0; i <= segments; i++) {
        const th = (i / segments) * Math.PI * 2;
        this.v([r * Math.cos(th), y, r * Math.sin(th)], [0, -1, 0], col);
      }
      for (let i = 0; i < segments; i++) this.tri(center, ring + i, ring + i + 1);
    }
    // Top cap (normal +Y): reversed
    if (profile[P - 1][0] > 1e-6) {
      const [r, y] = profile[P - 1];
      const col = colorFn(tags[P - 1], [0, y, 0]);
      const center = this.v([0, y, 0], [0, 1, 0], col);
      const ring = this.count;
      for (let i = 0; i <= segments; i++) {
        const th = (i / segments) * Math.PI * 2;
        this.v([r * Math.cos(th), y, r * Math.sin(th)], [0, 1, 0], col);
      }
      for (let i = 0; i < segments; i++) this.tri(center, ring + i + 1, ring + i);
    }
  }
}

// ---- Palette (kept light: the Specs display is additive, dark reads as clear) ----
const CHROME: C4 = [0.82, 0.85, 0.88, 1];
const TOP_DECK: C4 = [0.78, 0.82, 0.86, 1];
const SYRINGE: C4 = [0.95, 0.96, 0.97, 1];
const FLUSH_CAP: C4 = [0.30, 0.55, 0.95, 1];
const POUCH: C4 = [0.96, 0.96, 0.93, 1];
const POUCH_STRIPE: C4 = [0.35, 0.75, 0.55, 1];
const CASE_BOX: C4 = [0.82, 0.68, 0.48, 1];
const CASE_TAPE: C4 = [0.93, 0.86, 0.70, 1];
const BIN: C4 = [0.10, 0.24, 0.42, 1]; // Add blend: translucent blue

// ---- Unit dimensions (cm) ----
export const SHELF_HEIGHTS = { bottom: 35, middle: 70, top: 105 };
const FLOOR_DECK = 8;
const HALF_W = 60;
const HALF_D = 25;
const SHELF_FRONT_Z = 22;
const TOP_Y = 128;
const BIN_XS = [-38, 0, 38];
const BIN_HALF_W = 17;
const BIN_Z0 = -20, BIN_Z1 = 19;
const BIN_H = 10;

@component
export class DisplayCaseBuilder extends BaseScriptComponent {
  @input
  @hint("Vertex color material (vertexBaseColorMaterial)")
  material: Material;

  @input
  @hint("Material for the translucent bins (Add blend, two sided)")
  glassMaterial: Material;

  onAwake(): void {
    this.buildSolid();
    this.buildBins();
  }

  private makeBuilder(): MeshBuilder {
    const b = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ]);
    b.topology = MeshTopology.Triangles;
    b.indexType = MeshIndexType.UInt16;
    return b;
  }

  private commit(g: Geo, target: SceneObject, mat: Material): void {
    const b = this.makeBuilder();
    b.appendVerticesInterleaved(g.verts);
    b.appendIndices(g.idx);
    if (!b.isValid()) {
      print("DisplayCaseBuilder: invalid mesh on " + target.name);
      return;
    }
    const rmv = target.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    rmv.mesh = b.getMesh();
    if (mat) rmv.mainMaterial = mat;
    b.updateMesh();
  }

  private buildSolid(): void {
    const g = new Geo(true);
    g.place(0, 0, 0, 0);

    // Four round-ish corner posts, floor to the top deck.
    const px = HALF_W - 1.2, pz = HALF_D - 1.2, pw = 1.1;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        g.box(sx * px - pw, 0, sz * pz - pw, sx * px + pw, TOP_Y + 3, sz * pz + pw, CHROME);
      }
    }

    // Wire decks: front edge strip (cards hang from it), back and side rails, front-to-back wires.
    for (const h of [FLOOR_DECK, SHELF_HEIGHTS.bottom, SHELF_HEIGHTS.middle, SHELF_HEIGHTS.top]) {
      this.addWireDeck(g, h);
    }

    // Solid top deck: the control panel sits on it (~131 cm).
    g.box(-HALF_W, TOP_Y, -HALF_D, HALF_W, TOP_Y + 3, HALF_D, TOP_DECK);

    this.addFlushes(g, SHELF_HEIGHTS.top + 0.6);
    this.addIvStartKits(g, SHELF_HEIGHTS.middle + 0.6);
    // Bottom shelf (Foley kits) starts at count 0, so its bins are left empty.
    this.addOverstockCases(g, FLOOR_DECK + 0.6);

    this.commit(g, this.sceneObject, this.material);
    print("DisplayCaseBuilder: solid verts=" + g.count + " tris=" + g.idx.length / 3);
  }

  private addWireDeck(g: Geo, h: number): void {
    const x0 = -HALF_W + 2.4, x1 = HALF_W - 2.4;
    g.box(x0, h - 1.8, SHELF_FRONT_Z, x1, h + 0.3, SHELF_FRONT_Z + 0.8, CHROME);
    g.box(x0, h - 1.2, -HALF_D + 1.6, x1, h, -HALF_D + 2.4, CHROME);
    g.box(x0, h - 1.2, -HALF_D + 1.6, x0 + 0.8, h, SHELF_FRONT_Z, CHROME);
    g.box(x1 - 0.8, h - 1.2, -HALF_D + 1.6, x1, h, SHELF_FRONT_Z, CHROME);
    for (let x = x0 + 3; x < x1 - 1; x += 3) {
      g.box(x - 0.18, h - 0.5, -HALF_D + 2.4, x + 0.18, h, SHELF_FRONT_Z, CHROME);
    }
  }

  private buildBins(): void {
    const g = new Geo(false);
    g.place(0, 0, 0, 0);
    const t = 0.4;
    for (const h of [SHELF_HEIGHTS.bottom, SHELF_HEIGHTS.middle, SHELF_HEIGHTS.top]) {
      const y0 = h + 0.2;
      for (const cx of BIN_XS) {
        const x0 = cx - BIN_HALF_W, x1 = cx + BIN_HALF_W;
        g.box(x0, y0, BIN_Z0, x1, y0 + t, BIN_Z1, BIN); // floor
        g.box(x0, y0, BIN_Z0, x1, y0 + BIN_H, BIN_Z0 + t, BIN); // back
        g.box(x0, y0, BIN_Z1 - t, x1, y0 + BIN_H * 0.7, BIN_Z1, BIN); // low front (scoop)
        g.box(x0, y0, BIN_Z0, x0 + t, y0 + BIN_H, BIN_Z1, BIN); // left
        g.box(x1 - t, y0, BIN_Z0, x1, y0 + BIN_H, BIN_Z1, BIN); // right
      }
    }
    const binObj = global.scene.createSceneObject("SupplyBins");
    binObj.setParent(this.sceneObject);
    // Draw the bins after the solids so the stock shows through them.
    this.commit(g, binObj, this.glassMaterial ? this.glassMaterial : this.material);
  }

  // ---- Stock ----

  /** 26 prefilled saline flush syringes standing cap-down (count 26 of par 40). */
  private addFlushes(g: Geo, y: number): void {
    const profile: [number, number][] = [
      [0.6, 0], [0.6, 1.6], // cap
      [0.85, 1.6], [0.85, 9.5], // barrel
      [1.7, 9.5], [1.7, 9.9], // finger flange
      [0.45, 9.9], [0.45, 12.4], // plunger rod
      [1.1, 12.4], [1.1, 12.8], // thumb press
    ];
    const perBin = [12, 12, 2];
    perBin.forEach((n, b) => {
      for (let i = 0; i < n; i++) {
        const col = i % 4, row = Math.floor(i / 4);
        g.place(BIN_XS[b] - 10.5 + col * 7, y, 12 - row * 8, 0);
        g.lathe(profile, 10, (tag) => (tag <= 1 ? FLUSH_CAP : SYRINGE), 4);
      }
    });
  }

  /** 20 IV start kit pouches filed upright front-to-back (count 20 of par 20). */
  private addIvStartKits(g: Geo, y: number): void {
    const perBin = [7, 7, 6];
    perBin.forEach((n, b) => {
      for (let i = 0; i < n; i++) {
        const z = 15 - i * 4.6;
        g.place(BIN_XS[b], y, z, 0);
        g.box(-7, 0, -0.45, 7, 15, 0.45, POUCH);
        g.box(-7, 12, 0.45, 7, 13.5, 0.6, POUCH_STRIPE);
      }
    });
  }

  /** Taped overstock cases on the floor deck. */
  private addOverstockCases(g: Geo, y: number): void {
    for (const cx of BIN_XS) {
      g.place(cx, y, -2, 0);
      g.box(-15, 0, -17, 15, 22, 17, CASE_BOX);
      g.box(-15.2, 21.5, -2.5, 15.2, 22.3, 2.5, CASE_TAPE);
    }
  }
}
