// Done criterion 1: pinching an item on the Find panel lights its bins and card; another item
// switches; the highlight clears after a take, a second pinch, or 20 seconds.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {KEYS, caseToWorld, click, getCard, getDetector, highlightOn, log, textOf, waitReady} from "./ShelfCountLeafHelpers"

function expectFound(key: string | null, tag: string, foundKey: string | null): void {
  expect(foundKey, tag + " foundKey").toBe(key)
  for (const k of KEYS) {
    expect(highlightOn(k), `${tag} Highlight_${k}`).toBe(k === key)
    expect(getCard(k).isFound, `${tag} Card_${k} found`).toBe(k === key)
  }
}

@component
export class FindScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    await sleep(1500)
    const main = await waitReady()
    const ui = new DefaultLeafInteractor()
    log("start state " + main.getStateJson())
    expectFound(null, "start", main.getFoundKey())

    // Find lights that item's bins + card.
    await click(ui, "Btn_Find_Flushes")
    expectFound("Flushes", "find Flushes", main.getFoundKey())

    // Another item switches.
    await click(ui, "Btn_Find_Foley")
    expectFound("Foley", "switch to Foley", main.getFoundKey())
    expect(textOf("Name_Foley"), "out-of-stock message").toBe("Out of stock, on the Pull List")

    // Same item again clears.
    await click(ui, "Btn_Find_Foley")
    expectFound(null, "second pinch", main.getFoundKey())
    expect(textOf("Name_Foley"), "name restored").toBe("Foley Catheter Kits")

    // A take from the found item's bin clears it (fingertip into the middle flush bin and out).
    await click(ui, "Btn_Find_Flushes")
    expectFound("Flushes", "find again", main.getFoundKey())
    const det = getDetector()
    const c0 = main.getCount("Flushes")
    det.setTestPoint(caseToWorld(new vec3(0, 112, 45)))
    await sleep(200)
    det.setTestPoint(caseToWorld(new vec3(0, 112, 0)))
    await sleep(500)
    det.setTestPoint(caseToWorld(new vec3(0, 112, 45)))
    await sleep(200)
    det.endTestMode()
    expect(main.getCount("Flushes"), "take counted").toBe(c0 - 1)
    expectFound(null, "after take", main.getFoundKey())
    await click(ui, "Btn_Plus_Flushes")  // restore the count for the next scenarios

    // Timeout: still lit at 18 s, cleared by 21 s.
    if ((config?.get("check_timeout") ?? "true") !== "false") {
      await click(ui, "Btn_Find_IVStart")
      expectFound("IVStart", "find IVStart", main.getFoundKey())
      await sleep(18000)
      expectFound("IVStart", "still lit at 18 s", main.getFoundKey())
      await sleep(3000)
      expectFound(null, "cleared by 21 s", main.getFoundKey())
    }
    log("FindScenario end state " + main.getStateJson())
  }
}
