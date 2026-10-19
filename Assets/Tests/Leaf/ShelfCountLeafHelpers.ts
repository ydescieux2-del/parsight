// LEAF test helpers for Shelf Count. Test-only; does not modify Lens code.
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {ShelfCountMain} from "../../Scripts/ShelfCountMain"
import {ShelfCountAudioController} from "../../Scripts/ShelfCountAudioController"
import {ShelfCountCardUI} from "../../Scripts/ShelfCountCardUI"

export const KEYS = ["Flushes", "IVStart", "Foley"]

export function log(msg: string): void {
  print("[ShelfCountLEAF] " + msg)
}

export function getMain(): ShelfCountMain {
  const so = findSceneObjectByName("ShelfCountManager")
  if (!so) throw new Error("ShelfCountManager not found")
  const m = so.getComponent(ShelfCountMain.getTypeName()) as ShelfCountMain
  if (!m) throw new Error("ShelfCountMain component not found")
  return m
}

export function getAudio(): ShelfCountAudioController {
  const so = findSceneObjectByName("ShelfCountAudio")
  if (!so) throw new Error("ShelfCountAudio not found")
  const a = so.getComponent(ShelfCountAudioController.getTypeName()) as ShelfCountAudioController
  if (!a) throw new Error("ShelfCountAudioController component not found")
  return a
}

export function getCard(key: string): ShelfCountCardUI {
  const so = findSceneObjectByName("Card_" + key)
  if (!so) throw new Error("Card_" + key + " not found")
  const c = so.getComponent(ShelfCountCardUI.getTypeName()) as ShelfCountCardUI
  if (!c) throw new Error("ShelfCountCardUI on Card_" + key + " not found")
  return c
}

export function textOf(name: string): string {
  const so = findSceneObjectByName(name)
  if (!so) throw new Error(name + " not found")
  const t = so.getComponent("Component.Text") as Text
  if (!t) throw new Error("Text on " + name + " not found")
  return t.text
}

/** Waits until the manager has initialized (state built in OnStart). */
export async function waitReady(): Promise<ShelfCountMain> {
  for (let i = 0; i < 100; i++) {
    const m = getMain()
    if (m.getShelfKeys().length === 3) return m
    await sleep(100)
  }
  throw new Error("ShelfCountMain never became ready")
}

/** Real SIK click on a UI Kit button through the LEAF interactor (hover -> select -> release). */
export async function click(interactor: DefaultLeafInteractor, name: string): Promise<void> {
  const target = findInteractablesByName(name, undefined, true)[0]
  if (!target) throw new Error(`Interactable "${name}" not found or not enabled`)
  await interactor.trigger(target)
  await sleep(250)
  log("clicked " + name)
}
