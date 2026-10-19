// Done criterion 4: cards stay on their shelf edges at real size while the viewer moves.
// Samples card transforms every frame for sample_ms while recording the camera pose.
// Run once per preview-camera position (camera is moved externally via MovePreviewCamera);
// min_camera_poses > 1 makes the scenario wait for that many distinct camera poses during sampling.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {log, waitReady} from "./ShelfCountLeafHelpers"

// Authored placement: each card straddles its shelf's front lip (1 cm below the deck), and the
// lower cards tilt back toward the eye (tilt = rotation about X in degrees, negative = face up).
const EXPECT: {[k: string]: {edge: string; pos: vec3; tilt: number}} = {
  Flushes: {edge: "ShelfEdge_Top", pos: new vec3(0, -46, -89), tilt: 0},
  IVStart: {edge: "ShelfEdge_Middle", pos: new vec3(0, -81, -89), tilt: -20},
  Foley: {edge: "ShelfEdge_Bottom", pos: new vec3(0, -116, -89), tilt: -25},
}
const CARD_W = 16
const CARD_H = 8.8

function fmt(v: vec3): string {
  return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`
}

function checkCard(key: string, tag: string): void {
  const so = findSceneObjectByName("Card_" + key)
  if (!so) throw new Error("Card_" + key + " not found")
  const e = EXPECT[key]
  expect(so.getParent()?.name, `${tag} ${key} parent`).toBe(e.edge)
  const t = so.getTransform()
  const p = t.getWorldPosition()
  const s = t.getWorldScale()
  expect(p.distance(e.pos), `${tag} ${key} world pos ${fmt(p)} vs ${fmt(e.pos)}`).toBeLessThan(0.05)
  expect(s.x, `${tag} ${key} scale.x`).toBeCloseTo(1, 3)
  expect(s.y, `${tag} ${key} scale.y`).toBeCloseTo(1, 3)
  expect(s.z, `${tag} ${key} scale.z`).toBeCloseTo(1, 3)
  // Card sits on (just in front of / below) its ShelfEdge.
  const edge = findSceneObjectByName(e.edge).getTransform().getWorldPosition()
  expect(p.distance(edge), `${tag} ${key} distance to ${e.edge}`).toBeLessThan(8)
  // Card faces the viewer: its up axis is tilted back by exactly the authored angle.
  const up = t.getWorldRotation().multiplyVec3(vec3.up())
  const tiltDeg = Math.atan2(up.z, up.y) * 180 / Math.PI
  expect(Math.abs(tiltDeg - e.tilt), `${tag} ${key} tilt ${tiltDeg.toFixed(1)} vs ${e.tilt}`).toBeLessThan(0.5)
  // Real size, measured in the card's own plane so the tilt doesn't shrink it.
  const rmv = so.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
  if (rmv) {
    const mn = rmv.localAabbMin(), mx = rmv.localAabbMax()
    expect(Math.abs((mx.x - mn.x) * s.x - CARD_W), `${tag} ${key} width ${(mx.x - mn.x).toFixed(2)}`).toBeLessThan(0.5)
    expect(Math.abs((mx.y - mn.y) * s.y - CARD_H), `${tag} ${key} height ${(mx.y - mn.y).toFixed(2)}`).toBeLessThan(0.5)
  }
}

@component
export class CardPlacementScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    await sleep(1500)
    await waitReady()
    const label = config?.get("label") ?? "pose"
    const sampleMs = config?.getNumber("sample_ms") ?? 2000
    const minPoses = config?.getNumber("min_camera_poses") ?? 1
    const cam = findSceneObjectByName("Camera Object").getTransform()

    const poses: vec3[] = [cam.getWorldPosition()]
    log(`[${label}] camera start ${fmt(poses[0])}`)
    for (const k of Object.keys(EXPECT)) {
      checkCard(k, `[${label}] t0`)
      const so = findSceneObjectByName("Card_" + k)
      const rmv = so.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
      const sz = rmv ? rmv.localAabbMax().sub(rmv.localAabbMin()) : vec3.zero()
      log(`[${label}] Card_${k} pos ${fmt(so.getTransform().getWorldPosition())} scale ${fmt(so.getTransform().getWorldScale())} size ${sz.x.toFixed(2)}x${sz.y.toFixed(2)}`)
    }

    const start = getTime()
    let frames = 0
    while ((getTime() - start) * 1000 < sampleMs || poses.length < minPoses) {
      if ((getTime() - start) * 1000 > Math.max(sampleMs, 120000)) {
        throw new Error(`[${label}] only saw ${poses.length} camera poses (wanted ${minPoses})`)
      }
      await nextFrame()
      frames++
      const c = cam.getWorldPosition()
      if (c.distance(poses[poses.length - 1]) > 10) {
        poses.push(c)
        log(`[${label}] camera moved to ${fmt(c)} (pose ${poses.length}) at frame ${frames}`)
        for (const k of Object.keys(EXPECT)) checkCard(k, `[${label}] pose${poses.length}`)
      }
      if (frames % 10 === 0) for (const k of Object.keys(EXPECT)) checkCard(k, `[${label}] f${frames}`)
    }
    for (const k of Object.keys(EXPECT)) checkCard(k, `[${label}] end`)
    log(`[${label}] PASS ${frames} frames, ${poses.length} camera pose(s), camera end ${fmt(cam.getWorldPosition())}`)
  }
}
