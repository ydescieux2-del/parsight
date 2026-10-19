/**
 * ShelfCountTakeDetector — counts a take when a hand reaches into a bin and comes back out.
 *
 * Rule (design brief): the fingertip stays inside one bin's reach box for at least
 * minDwellSeconds, then leaves it -> onTake(shelfKey). Passing in front of the bins never
 * enters a box; a brush shorter than the dwell is ignored; losing hand tracking while inside
 * cancels without a take.
 * Expects: displayCase (bin boxes are in its local space, see ShelfLayout). Reads both hands'
 * index fingertips from SIK. Tests can feed a virtual fingertip with setTestPoint().
 * Must not: change counts itself. Main decides what a take does.
 */
import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {binReachBox, boxContains, BIN_XS, SHELF_Y} from "./ShelfLayout"

interface Tracker {
  key: string | null  // shelf key of the bin the point is in
  bin: number
  enteredAt: number
}

@component
export class ShelfCountTakeDetector extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountTakeDetector – reach into a bin = take one</span>')
  @ui.separator
  @input
  @hint("The DisplayCase object; bins are defined in its local space")
  displayCase: SceneObject

  @input
  @hint("A fingertip must stay inside a bin at least this long to count (brief: 0.3 s)")
  @widget(new SliderWidget(0.05, 1.5, 0.05))
  minDwellSeconds: number = 0.3

  private _onTake = new Event<string>()
  get onTake(): PublicApi<string> { return this._onTake.publicApi() }

  private trackers: {[source: string]: Tracker} = {}
  private testPoint: vec3 | null = null
  private testMode = false
  private hands: HandInputData | null = null

  onAwake() {
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  /**
   * Tests: drive a virtual fingertip (world position, or null = hand gone). While test mode is
   * on, real hands are ignored so a stray preview hand can't disturb the scenario.
   */
  setTestPoint(world: vec3 | null): void {
    this.testMode = true
    this.testPoint = world
  }

  endTestMode(): void {
    this.testMode = false
    this.testPoint = null
    delete this.trackers["test"]
  }

  /** Which shelf's bin (if any) a world point is in. */
  shelfAt(world: vec3): {key: string; bin: number} | null {
    if (!this.displayCase) return null
    const local = this.displayCase.getTransform().getInvertedWorldTransform().multiplyPoint(world)
    for (const key of Object.keys(SHELF_Y)) {
      for (let b = 0; b < BIN_XS.length; b++) {
        if (boxContains(binReachBox(key, b), local)) return {key, bin: b}
      }
    }
    return null
  }

  private tick(): void {
    if (this.testMode) {
      this.track("test", this.testPoint)
      return
    }
    if (!this.hands) {
      try {
        this.hands = HandInputData.getInstance()
      } catch (e) {
        return
      }
    }
    for (const side of ["left", "right"] as const) {
      const hand = this.hands.getHand(side)
      const tip = hand && hand.isTracked() ? hand.indexTip?.position : null
      this.track(side, tip ?? null)
    }
  }

  private track(source: string, world: vec3 | null): void {
    const t = this.trackers[source] ?? (this.trackers[source] = {key: null, bin: -1, enteredAt: 0})
    if (!world) {  // tracking lost: cancel, never count
      t.key = null
      return
    }
    const now = getTime()
    const at = this.shelfAt(world)
    const sameBin = at && t.key === at.key && t.bin === at.bin
    if (sameBin) return
    if (t.key && now - t.enteredAt >= this.minDwellSeconds) this._onTake.invoke(t.key)
    t.key = at ? at.key : null
    t.bin = at ? at.bin : -1
    t.enteredAt = now
  }
}
