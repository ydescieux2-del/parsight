/**
 * ShelfCountFindArrow — while an item is being found and its bins are out of view, a small
 * glowing arrowhead near the edge of the view points toward them (design brief).
 *
 * Each frame: if a target is set and the bins are more than showAngleDeg from the center of
 * view, place the arrowhead distanceCm ahead of the camera, out near the edge of the display in
 * the bins' direction (an ellipse edgeXCm x edgeYCm), rotated to point at them, so it never sits
 * over what the user is looking at. Otherwise hide it.
 * Expects: cameraObject, displayCase (bins in its local space, see ShelfLayout).
 * Must not: decide the target; Main calls setTarget().
 */
import {GlowMesh} from "./GlowMesh"
import {shelfBinsCenter} from "./ShelfLayout"

@component
export class ShelfCountFindArrow extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountFindArrow – points to out-of-view bins</span>')
  @ui.separator
  @input
  cameraObject: SceneObject

  @input
  @hint("The DisplayCase object; bins are defined in its local space")
  displayCase: SceneObject

  @input
  @hint("Unlit vertex-color material (solid, so the arrow reads against any background)")
  glowMaterial: Material

  @input("vec4", "{0.25,0.95,1.0,1.0}")
  @widget(new ColorWidget())
  glowColor: vec4

  @input
  @hint("Show the arrow when the bins are farther than this from the view center (brief: 25)")
  @widget(new SliderWidget(10, 45, 1))
  showAngleDeg: number = 25

  @input
  @hint("How far ahead of the eyes the arrow floats (cm)")
  distanceCm: number = 100

  @input
  @hint("Horizontal reach toward the edge of the view (cm at that distance); keep inside the display")
  edgeXCm: number = 20

  @input
  @hint("Vertical reach toward the edge of the view (cm at that distance); the display is taller than wide")
  edgeYCm: number = 28

  @input
  @hint("Pulse rate of the arrow (beats per second)")
  pulseHz: number = 1.4

  private arrow: SceneObject
  private targetKey: string | null = null
  private showing = false
  private dir2 = vec2.zero()

  onAwake() {
    this.arrow = global.scene.createSceneObject("FindArrowMesh")
    const g = new GlowMesh(this.glowColor)
    // Solid arrowhead pointing +X in its own plane (z = 0), about 5 x 6 cm, notched at the back.
    const tip = new vec3(3, 0, 0), top = new vec3(-2, 3, 0), bot = new vec3(-2, -3, 0), notch = new vec3(-0.6, 0, 0)
    g.tri(notch, tip, top)
    g.tri(notch, bot, tip)
    g.commit(this.arrow, this.glowMaterial)
    this.arrow.enabled = false
    this.createEvent("LateUpdateEvent").bind(() => this.tick())
  }

  setTarget(key: string | null): void {
    this.targetKey = key
    if (!key) this.setShowing(false)
  }

  /** For tests. */
  get isShowing(): boolean { return this.showing }
  /** For tests: direction the arrow points in view space (x right, y up), unit length. */
  get pointing(): vec2 { return this.dir2 }

  private setShowing(on: boolean): void {
    this.showing = on
    if (this.arrow) this.arrow.enabled = on
  }

  private tick(): void {
    if (!this.targetKey || !this.cameraObject || !this.displayCase) return this.setShowing(false)
    const cam = this.cameraObject.getTransform()
    const camPos = cam.getWorldPosition()
    const fwd = cam.forward.uniformScale(-1).normalize()  // camera looks down -Z
    const right = cam.right.normalize()
    const up = cam.up.normalize()
    const target = this.displayCase.getTransform().getWorldTransform().multiplyPoint(shelfBinsCenter(this.targetKey))
    const toT = target.sub(camPos).normalize()
    const angle = Math.acos(Math.max(-1, Math.min(1, toT.dot(fwd)))) * 180 / Math.PI
    if (angle <= this.showAngleDeg) return this.setShowing(false)

    const dx = toT.dot(right), dy = toT.dot(up)
    const len = Math.hypot(dx, dy)
    this.dir2 = len > 1e-4 ? new vec2(dx / len, dy / len) : new vec2(0, -1)
    const t = this.arrow.getTransform()
    // Pulse: grow a little and nudge toward the bins, so it reads as "this way".
    const beat = 0.5 + 0.5 * Math.sin(getTime() * Math.PI * 2 * this.pulseHz)
    const nudge = 1.5 * beat
    t.setWorldPosition(camPos.add(fwd.uniformScale(this.distanceCm))
      .add(right.uniformScale(this.dir2.x * (this.edgeXCm + nudge)))
      .add(up.uniformScale(this.dir2.y * (this.edgeYCm + nudge))))
    t.setLocalScale(vec3.one().uniformScale(1 + 0.18 * beat))
    const spin = quat.angleAxis(Math.atan2(this.dir2.y, this.dir2.x), vec3.forward())
    t.setWorldRotation(cam.getWorldRotation().multiply(spin))
    this.setShowing(true)
  }
}
