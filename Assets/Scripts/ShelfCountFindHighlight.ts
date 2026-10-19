/**
 * ShelfCountFindHighlight — glowing outlines around the bins of the item being found.
 *
 * Builds one outline object per shelf ("Highlight_<key>", hidden) under its own SceneObject,
 * which must sit at the DisplayCase origin (bin geometry from ShelfLayout). show(key) lights
 * that shelf's three bins; show(null) hides all. The outline gently pulses while shown.
 * Must not: decide when to show; Main owns the find state and its timeout.
 */
import {GlowMesh} from "./GlowMesh"
import {BIN_H, BIN_HALF_W, BIN_XS, BIN_Z0, BIN_Z1, SHELF_Y} from "./ShelfLayout"

const EDGE = 1.4       // outline bar thickness (cm); thin lines vanish against the light bins
const PAD = 0.8        // outline sits this far outside the bin
const PULSE_HZ = 1.2
const PULSE_AMOUNT = 0.035

@component
export class ShelfCountFindHighlight extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountFindHighlight – glowing bin outlines</span>')
  @ui.separator
  @input
  @hint("Unlit vertex-color material for the solid outline (additive glow vanishes on the light bins)")
  edgeMaterial: Material

  @input
  @hint("Additive glow material that uses vertex color, for the soft fill")
  glowMaterial: Material

  @input("vec4", "{0.25,0.95,1.0,1.0}")
  @hint("Outline color")
  @widget(new ColorWidget())
  glowColor: vec4

  @input("vec4", "{0.06,0.3,0.36,1.0}")
  @hint("Soft fill across each bin's floor and back wall (additive, so keep it dim)")
  @widget(new ColorWidget())
  fillColor: vec4

  private outlines: {[key: string]: SceneObject} = {}
  private shown: string | null = null

  onAwake() {
    for (const key of Object.keys(SHELF_Y)) this.outlines[key] = this.buildOutline(key)
    this.createEvent("UpdateEvent").bind(() => this.pulse())
  }

  show(key: string | null): void {
    this.shown = key
    for (const k of Object.keys(this.outlines)) this.outlines[k].enabled = k === key
  }

  /** For tests: which shelf is lit, or null. */
  get shownKey(): string | null { return this.shown }

  private buildOutline(key: string): SceneObject {
    const g = new GlowMesh(this.glowColor)
    const y0 = SHELF_Y[key] + 0.2
    const y1 = y0 + BIN_H + PAD
    for (const cx of BIN_XS) {
      const x0 = cx - BIN_HALF_W - PAD, x1 = cx + BIN_HALF_W + PAD
      const z0 = BIN_Z0 - PAD, z1 = BIN_Z1 + PAD
      // Four vertical posts and the top rim; the front bottom edge too, so it reads from the aisle.
      for (const x of [x0, x1]) {
        for (const z of [z0, z1]) g.box(x - EDGE / 2, y0, z - EDGE / 2, x + EDGE / 2, y1, z + EDGE / 2)
      }
      g.box(x0, y1 - EDGE, z0 - EDGE / 2, x1, y1, z0 + EDGE / 2)
      g.box(x0, y1 - EDGE, z1 - EDGE / 2, x1, y1, z1 + EDGE / 2)
      g.box(x0 - EDGE / 2, y1 - EDGE, z0, x0 + EDGE / 2, y1, z1)
      g.box(x1 - EDGE / 2, y1 - EDGE, z0, x1 + EDGE / 2, y1, z1)
      g.box(x0, y0, z1 - EDGE / 2, x1, y0 + EDGE, z1 + EDGE / 2)
    }
    const so = global.scene.createSceneObject("Highlight_" + key)
    so.setParent(this.sceneObject)
    g.commit(so, this.edgeMaterial)
    // Soft fill so the whole bin reads as lit, not just its edges.
    const f = new GlowMesh(this.fillColor)
    for (const cx of BIN_XS) {
      f.box(cx - BIN_HALF_W, y0 + 0.5, BIN_Z0, cx + BIN_HALF_W, y0 + 0.7, BIN_Z1)
      f.box(cx - BIN_HALF_W, y0, BIN_Z0 + 0.5, cx + BIN_HALF_W, y0 + BIN_H, BIN_Z0 + 0.7)
    }
    const fill = global.scene.createSceneObject("HighlightFill_" + key)
    fill.setParent(so)
    f.commit(fill, this.glowMaterial)
    so.enabled = false
    return so
  }

  private pulse(): void {
    if (!this.shown) return
    // Breathe the outline about its shelf so it catches the eye without flashing.
    const s = 1 + PULSE_AMOUNT * Math.sin(getTime() * Math.PI * 2 * PULSE_HZ)
    const t = this.outlines[this.shown].getTransform()
    const pivotY = SHELF_Y[this.shown]
    t.setLocalScale(new vec3(1, s, 1))
    t.setLocalPosition(new vec3(0, pivotY * (1 - s), 0))
  }
}
