// Done criterion 2: when the found bins are out of view, an arrow points toward them; it hides
// once they are in view. Run once per preview-camera pose (camera moved via MovePreviewCamera),
// with expect=visible or expect=hidden.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {shelfBinsCenter} from "../../Scripts/ShelfLayout"
import {caseToWorld, click, getArrow, log, waitReady} from "./ShelfCountLeafHelpers"

@component
export class FindArrowScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    await sleep(1500)
    const main = await waitReady()
    const ui = new DefaultLeafInteractor()
    const key = config?.get("key") ?? "Foley"
    const want = config?.get("expect") ?? "visible"
    const arrow = getArrow()

    expect(arrow.isShowing, "no arrow before a find").toBe(false)
    await click(ui, "Btn_Find_" + key)
    await sleep(300)

    // Independent view-space direction to the bins, to check where the arrow points.
    const cam = findSceneObjectByName("Camera Object").getTransform()
    const toT = caseToWorld(shelfBinsCenter(key)).sub(cam.getWorldPosition()).normalize()
    const fwd = cam.forward.uniformScale(-1).normalize()
    const angle = Math.acos(Math.max(-1, Math.min(1, toT.dot(fwd)))) * 180 / Math.PI
    log(`[${want}] ${key} bins are ${angle.toFixed(1)} deg from view center`)

    const arrowObj = findSceneObjectByName("FindArrowMesh")
    if (want === "visible") {
      expect(angle > 25, "pose really has the bins out of view").toBe(true)
      expect(arrow.isShowing, "arrow shows").toBe(true)
      expect(arrowObj.enabled, "arrow object enabled").toBe(true)
      const dx = toT.dot(cam.right.normalize()), dy = toT.dot(cam.up.normalize())
      const len = Math.hypot(dx, dy)
      const p = arrow.pointing
      const agree = (p.x * dx + p.y * dy) / len
      log(`[${want}] arrow points (${p.x.toFixed(2)}, ${p.y.toFixed(2)}), expected (${(dx / len).toFixed(2)}, ${(dy / len).toFixed(2)})`)
      expect(agree > 0.98, "arrow points toward the bins").toBe(true)
    } else {
      expect(angle <= 25, "pose really has the bins in view").toBe(true)
      expect(arrow.isShowing, "arrow hidden").toBe(false)
      expect(arrowObj.enabled, "arrow object disabled").toBe(false)
    }

    // Clearing the find always removes the arrow.
    await click(ui, "Btn_Find_" + key)
    await sleep(100)
    expect(main.getFoundKey(), "find cleared").toBe(null)
    expect(arrow.isShowing, "arrow gone after clear").toBe(false)
    log(`[${want}] PASS`)
  }
}
