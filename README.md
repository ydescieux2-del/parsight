# ParSight

**Find it. The count keeps itself.** A Snap Specs Lens for hospital clean supply rooms.

A float nurse in a supply room they don't know asks for an item, and its bins light up on the
shelf. If the bins are behind them, an arrow at the edge of their view points the way. When they
reach in and take one, the shelf's count drops by itself. Low shelves turn amber, empty ones red,
and the supply tech's Pull List already knows what to bring.

Demo video: _(YouTube link)_ · Design brief: [`devpost/design-brief.md`](devpost/design-brief.md)

## Why glasses
- The answer lights up the real bin, in front of you or behind you. A phone can only describe where it is.
- Counting happens as a side effect of taking an item. Nobody stops to scan, tap, or write.
- Gloved, often contaminated hands can't easily work a phone or scanner; a mid-air pinch touches nothing.

## Run it
1. Open `specs-shelf-count.esproj` in **Lens Studio 5.24** or later (Specs target).
2. Use Interactive Preview. WASD moves, Q/E go down and up, right-drag looks around, click is a pinch.
3. On top of the shelf: **Find** (Saline Flush, IV Start Kit, Foley Kit) and the supply panel
   (Restocked to Par, Pull List). Each shelf card has plus and minus buttons for corrections.
4. Take detection reads the Spectacles Interaction Kit fingertip position against each bin. In the
   preview, drive it with the simulated hand (it counts a take when the fingertip stays in a bin
   for at least 0.3 s and comes back out).

The shelf, its stock, and the room are a stand-in for the preview. On the glasses, the shelf would
be the real one and only the cards, glow, arrow and panels would be drawn.

## Tests (LEAF)
Seven scenarios in `Assets/Tests/Leaf/`, one per done criterion in the brief. Run them from the
LEAF panel in Lens Studio (preview target). All seven pass.

| ID | Checks |
|---|---|
| `c1-find` | Find lights the item's bins and card, switches, clears after a take, a second pinch, or 20 s |
| `c2-find-arrow` | Arrow points to out-of-view bins and hides when they are in view (run per camera pose) |
| `c3-take` | Reaching in counts one take; brushes, passes in front, lost tracking and empty shelves do not |
| `c4a-card-color` | Amber below par, red at zero, normal at or above par |
| `c4b-pull-list` | Pull List lists every shelf under par with how many to pull, or "All at par"; hides after 15 s |
| `c5-card-placement` | Cards stay on their shelf edges at real size while the viewer moves |
| `extra-plus-minus` | Plus and minus corrections, never below zero |

## Layout
- `Assets/Scripts/` Lens logic. `ShelfCountMain.ts` owns state; `ShelfCountTakeDetector.ts`,
  `ShelfCountFindHighlight.ts`, `ShelfCountFindArrow.ts` and the `*UI.ts` panels are single-purpose views.
- `Assets/GeneratedMeshes/` the Blender-built shelf (`SupplyShelf.glb`) and room (`SupplyRoom.glb`).
- `tools/supply_shelf/` Python + Blender sources for those models and their printed labels (generic text, no brands):
  ```
  python3 tools/supply_shelf/make_labels.py && python3 tools/supply_shelf/make_room_textures.py
  blender --background --factory-startup --python tools/supply_shelf/build_shelf.py -- Assets/GeneratedMeshes/SupplyShelf.glb
  blender --background --factory-startup --python tools/supply_shelf/build_room.py -- Assets/GeneratedMeshes/SupplyRoom.glb
  ```
- `devpost/` design brief, walkthrough notes, video script, and submission text.

## Built with
Lens Studio 5.24 · Spectacles Interaction Kit 0.18 · Spectacles UI Kit · LEAF 2.0 · TypeScript ·
Blender 5.2 · Python (Pillow) · Claude Code with the Lens Studio MCP tools · ElevenLabs (video narration)

## Limits (honest)
- No voice recognition in the preview; the Find panel stands in for "find Foley kit".
- No camera recognition of which item was taken; putting an item back reads as a take (plus corrects it).
- Counts are not saved between sessions and are not connected to a hospital materials system.
- No patient data of any kind.

## License
MIT for this project's own code, models and docs. Copyright (c) 2026 Descieux Digital LLC. See [LICENSE](LICENSE).
Everything under `Packages/` (Spectacles Interaction Kit, UI Kit, LEAF and other Snap packages) belongs to Snap Inc. and keeps its own license.
