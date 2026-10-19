// Done criterion 4 (part b): Pull List lists every shelf under par with how many to order, or "All at par".
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {KEYS, click, getCard, log, textOf, waitReady} from "./ShelfCountLeafHelpers"

function expectedReorder(main: any): string {
  const lines: string[] = []
  for (const k of KEYS) {
    const n = main.getPar(k) - main.getCount(k)
    if (n > 0) lines.push(getCard(k).itemName + ", pull " + n)
  }
  return lines.length ? lines.join("\n") : "All at par"
}

function listEnabled(): boolean {
  const so = findSceneObjectByName("ReorderList")
  if (!so) throw new Error("ReorderList not found")
  return so.isEnabledInHierarchy
}

@component
export class ReorderScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    await sleep(1500)
    const main = await waitReady()
    const ui = new DefaultLeafInteractor()
    log("start state " + main.getStateJson())
    expect(listEnabled(), "reorder list hidden at start").toBe(false)

    // Make sure at least one shelf is under par (click minus on Flushes if needed).
    if (main.getCount("Flushes") >= main.getPar("Flushes")) await click(ui, "Btn_Minus_Flushes")

    // 1) Reorder with shelves under par.
    await click(ui, "Btn_Reorder")
    const want1 = expectedReorder(main)
    expect(main.isReorderVisible(), "reorder visible after click").toBe(true)
    expect(listEnabled(), "ReorderList enabled after click").toBe(true)
    expect(textOf("ReorderText"), "reorder text (under par)").toBe(want1)
    expect(want1 === "All at par", "some shelf should be under par").toBe(false)
    log("reorder text #1:\n" + textOf("ReorderText"))

    // Live update while open: one plus on Flushes changes its order quantity.
    await click(ui, "Btn_Plus_Flushes")
    expect(textOf("ReorderText"), "reorder text live-updates").toBe(expectedReorder(main))
    log("reorder text after plus:\n" + textOf("ReorderText"))

    // 2) Close hides it.
    await click(ui, "Btn_CloseReorder")
    expect(main.isReorderVisible(), "hidden after Close").toBe(false)
    expect(listEnabled(), "ReorderList disabled after Close").toBe(false)

    // 3) Start of Day -> all at par -> Pull List says All at par.
    await click(ui, "Btn_StartOfDay")
    for (const k of KEYS) expect(main.getCount(k), k + " at par after Start of Day").toBe(main.getPar(k))
    await click(ui, "Btn_Reorder")
    expect(listEnabled(), "ReorderList enabled (all stocked)").toBe(true)
    expect(textOf("ReorderText"), "All stocked text").toBe("All at par")
    log("reorder text #2: " + textOf("ReorderText"))
    await click(ui, "Btn_CloseReorder")
    expect(listEnabled(), "closed again").toBe(false)

    // 4) Auto-hide after ~15 s (skippable with check_autohide=false).
    if ((config?.get("check_autohide") ?? "true") !== "false") {
      await click(ui, "Btn_Reorder")
      expect(listEnabled()).toBe(true)
      await sleep(13000)
      expect(listEnabled(), "still shown at 13 s").toBe(true)
      await sleep(3500)
      expect(listEnabled(), "auto-hidden by 16.5 s").toBe(false)
      expect(main.isReorderVisible()).toBe(false)
      log("auto-hide at ~15 s verified")
    }
    log("ReorderScenario end state " + main.getStateJson())
  }
}
