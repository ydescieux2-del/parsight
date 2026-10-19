// Done criterion 2: card amber below par, red at zero, normal at/above par (state + rendered color).
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {KEYS, click, getCard, log, waitReady} from "./ShelfCountLeafHelpers"

function expectedState(count: number, par: number): string {
  return count <= 0 ? "red" : count < par ? "amber" : "normal"
}

function bg(key: string): vec4 {
  const rr = findSceneObjectByName("Card_" + key).getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
  if (!rr) throw new Error("RoundedRectangle on Card_" + key + " not found")
  return rr.backgroundColor
}

function checkCard(main: any, key: string, label: string): void {
  const count = main.getCount(key)
  const par = main.getPar(key)
  const want = expectedState(count, par)
  const card = getCard(key)
  expect(main.getCardState(key), `${label}: ${key} state (count ${count}/${par})`).toBe(want)
  expect(card.currentVisualState, `${label}: ${key} card visual state`).toBe(want)
  const c = bg(key)
  const ref = want === "red" ? card.redColor : want === "amber" ? card.amberColor : card.normalColor
  expect(c.x, `${label}: ${key} bg.r`).toBeCloseTo(ref.x, 2)
  expect(c.y, `${label}: ${key} bg.g`).toBeCloseTo(ref.y, 2)
  expect(c.z, `${label}: ${key} bg.b`).toBeCloseTo(ref.z, 2)
  log(`${label}: ${key} count ${count}/${par} -> ${want}, bg (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`)
}

@component
export class CardColorScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = await waitReady()
    const ui = new DefaultLeafInteractor()
    for (const k of KEYS) checkCard(main, k, "initial")

    // IVStart: bring to exactly par with clicks -> normal; one minus -> amber; plus -> normal.
    let g = 0
    while (main.getCount("IVStart") < main.getPar("IVStart") && g++ < 40) await click(ui, "Btn_Plus_IVStart")
    while (main.getCount("IVStart") > main.getPar("IVStart") && g++ < 80) await click(ui, "Btn_Minus_IVStart")
    expect(main.getCount("IVStart"), "IVStart at par").toBe(main.getPar("IVStart"))
    checkCard(main, "IVStart", "at par")
    expect(main.getCardState("IVStart")).toBe("normal")
    await click(ui, "Btn_Minus_IVStart")
    checkCard(main, "IVStart", "par-1")
    expect(main.getCardState("IVStart")).toBe("amber")
    await click(ui, "Btn_Plus_IVStart")
    await click(ui, "Btn_Plus_IVStart")
    checkCard(main, "IVStart", "par+1")
    expect(main.getCardState("IVStart")).toBe("normal")

    // Foley: drive to 0 -> red; plus -> amber; minus -> red.
    g = 0
    while (main.getCount("Foley") > 0 && g++ < 40) await click(ui, "Btn_Minus_Foley")
    checkCard(main, "Foley", "zero")
    expect(main.getCardState("Foley")).toBe("red")
    await click(ui, "Btn_Plus_Foley")
    checkCard(main, "Foley", "one")
    expect(main.getCardState("Foley")).toBe("amber")
    await click(ui, "Btn_Minus_Foley")
    checkCard(main, "Foley", "back to zero")
    expect(main.getCardState("Foley")).toBe("red")

    // Flushes: amber->red path by clicking minus down to 0.
    g = 0
    while (main.getCount("Flushes") > 1 && g++ < 40) await click(ui, "Btn_Minus_Flushes")
    checkCard(main, "Flushes", "one left")
    await click(ui, "Btn_Minus_Flushes")
    checkCard(main, "Flushes", "zero")
    expect(main.getCardState("Flushes")).toBe("red")
    log("CardColorScenario end state " + main.getStateJson())
  }
}
