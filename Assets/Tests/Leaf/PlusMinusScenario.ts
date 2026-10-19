// Done criterion 1: pinching plus adds one, minus takes one away; never below 0; tones counted.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {KEYS, click, getAudio, log, textOf, waitReady} from "./ShelfCountLeafHelpers"

@component
export class PlusMinusScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = await waitReady()
    const audio = getAudio()
    const ui = new DefaultLeafInteractor()
    log("start state " + main.getStateJson())

    for (const key of KEYS) {
      const c0 = main.getCount(key)
      const par = main.getPar(key)
      const p0 = audio.plusPlays
      const m0 = audio.minusPlays

      await click(ui, "Btn_Plus_" + key)
      expect(main.getCount(key), key + " count after plus").toBe(c0 + 1)
      expect(textOf("Count_" + key), key + " Count text after plus").toBe("" + (c0 + 1))
      expect(textOf("Par_" + key), key + " Par text after plus").toBe((c0 + 1) + " of " + par)
      expect(audio.plusPlays, key + " plusPlays").toBe(p0 + 1)
      expect(audio.minusPlays, key + " minusPlays unchanged by plus").toBe(m0)

      await click(ui, "Btn_Minus_" + key)
      expect(main.getCount(key), key + " count after minus").toBe(c0)
      expect(textOf("Count_" + key), key + " Count text after minus").toBe("" + c0)
      expect(audio.minusPlays, key + " minusPlays").toBe(m0 + 1)
      expect(audio.plusPlays, key + " plusPlays unchanged by minus").toBe(p0 + 1)
      log(`${key}: ${c0} -> ${c0 + 1} -> ${c0} OK (plusPlays ${audio.plusPlays}, minusPlays ${audio.minusPlays})`)
    }

    // Floor: drive Foley to 0 with clicks, then one more minus must keep it at 0.
    const key = "Foley"
    let guard = 0
    while (main.getCount(key) > 0 && guard++ < 40) await click(ui, "Btn_Minus_" + key)
    expect(main.getCount(key), "Foley reached 0").toBe(0)
    const mBefore = audio.minusPlays
    await click(ui, "Btn_Minus_" + key)
    await click(ui, "Btn_Minus_" + key)
    expect(main.getCount(key), "count never below 0").toBe(0)
    expect(textOf("Count_" + key), "Count text stays 0").toBe("0")
    expect(audio.minusPlays, "no minus tone at 0").toBe(mBefore)
    log("minus at 0: minusPlays " + mBefore + " -> " + audio.minusPlays)

    // Pinching the card body does nothing.
    const before = main.getStateJson()
    await click(ui, "Card_Flushes")
    expect(main.getStateJson(), "card body pinch does nothing").toBe(before)

    log("PlusMinusScenario end state " + main.getStateJson())
  }
}
