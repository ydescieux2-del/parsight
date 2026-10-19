// Done criterion 3: a hand reaching into a bin and back out lowers that shelf's count by one;
// passing in front of the bins does not; plus on the card undoes it.
// The fingertip is driven through ShelfCountTakeDetector.setTestPoint (LEAF can't place a
// simulated hand at an arbitrary point inside a bin). The real SIK hand path was checked
// separately in the preview with PreviewInteractTool hovers.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {caseToWorld, click, getAudio, getDetector, log, waitReady} from "./ShelfCountLeafHelpers"

const OUT = new vec3(0, 112, 45)      // in front of the top shelf, outside every bin
const IN_FLUSH = new vec3(0, 112, 0)  // middle flush bin
const IN_FOLEY = new vec3(38, 42, 0)  // right Foley bin (empty shelf)

@component
export class TakeScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = await waitReady()
    const ui = new DefaultLeafInteractor()
    const audio = getAudio()
    const det = getDetector()
    const at = async (local: vec3 | null, ms: number) => {
      det.setTestPoint(local ? caseToWorld(local) : null)
      await sleep(ms)
    }
    log("start state " + main.getStateJson())
    const c0 = main.getCount("Flushes")
    const m0 = audio.minusPlays

    try {
      // 1) Reach in, stay 0.5 s, come out: one take, with the lower tone.
      await at(OUT, 200)
      await at(IN_FLUSH, 500)
      await at(OUT, 200)
      expect(main.getCount("Flushes"), "take counted").toBe(c0 - 1)
      expect(audio.minusPlays, "take tone").toBe(m0 + 1)

      // 2) A brush shorter than the 0.3 s dwell does nothing.
      await at(IN_FLUSH, 100)
      await at(OUT, 200)
      expect(main.getCount("Flushes"), "brief brush ignored").toBe(c0 - 1)

      // 3) Sweeping across the front of all three bins never enters one.
      for (const x of [-55, -38, -19, 0, 19, 38, 55]) await at(new vec3(x, 112, 30), 120)
      await at(OUT, 200)
      expect(main.getCount("Flushes"), "pass in front ignored").toBe(c0 - 1)

      // 4) Hand tracking lost while inside: no take.
      await at(IN_FLUSH, 500)
      await at(null, 200)
      await at(OUT, 200)
      expect(main.getCount("Flushes"), "tracking lost ignored").toBe(c0 - 1)

      // 5) Reaching into an empty shelf's bin does nothing (count stays 0, no tone).
      const mBefore = audio.minusPlays
      await at(IN_FOLEY, 500)
      await at(OUT, 200)
      expect(main.getCount("Foley"), "empty shelf stays 0").toBe(0)
      expect(audio.minusPlays, "no tone for empty shelf").toBe(mBefore)
    } finally {
      det.endTestMode()
    }

    // 6) Plus on the card undoes the take.
    await click(ui, "Btn_Plus_Flushes")
    expect(main.getCount("Flushes"), "plus undoes the take").toBe(c0)
    log("TakeScenario end state " + main.getStateJson())
  }
}
