# ParSight demo video script (draft 1)

Target: 2:30, hard limit 3:00. Public on YouTube. Footage is the Lens Studio Interactive Preview.
Look: light blue title/caption cards (navy #0f2240 header, #f8fafc surface, #2563eb accent).
Voice: ElevenLabs narrator Brian (`nPczCjzI2devNBz1zQrb`). One voice only; no character voices.
Stats in narration are the sourced ones from design-brief.md; keep wording as cautious as the brief.

| # | Time | Picture | Narration |
|---|---|---|---|
| 1 | 0:00–0:12 | Title card: "ParSight. Par counts where the supplies are." Subtitle: Snap Specs, built in Lens Studio. | Every hospital floor has a clean supply room. Every bin in it has a par level. And every day, someone counts them by hand. |
| 2 | 0:12–0:32 | Caption card with the three numbers, one at a time. | In one emergency department study, nurses left the room for supplies eight times a shift. Supplies are about fifteen percent of hospital spending. And the count is still a clipboard or a handheld scanner, in gloved hands. |
| 3 | 0:32–0:45 | Preview, start pose: wire shelf, bins, control panel on top. Slow tilt down. | ParSight puts the count on the shelf itself. This is a stand-in supply shelf: saline flushes, IV start kits, Foley catheter kits. |
| 4 | 0:45–1:05 | Look at top shelf. Card brightens from dim. Close-up of "26 / 26 of 40", amber. | Each shelf has a label card at real size. It shows the count against par. Flushes are at twenty six of forty, so the card is amber. Cards you aren't looking at dim, so they stay findable without getting in the way. |
| 5 | 1:05–1:25 | Pinch plus twice (26→28), minus once (28→27). Tones audible. | Stock goes in, pinch plus. Stock comes out, pinch minus. Nothing to touch, nothing to wipe down, and your eyes never leave the shelf. |
| 6 | 1:25–1:40 | Look down to bottom shelf: red card, 0 of 8, empty bins. | Foley kits are at zero. The card turns red. |
| 7 | 1:40–2:00 | Look up at control panel, pinch Pull List. List shows flushes and Foley with "pull N". | Pull List shows exactly what to bring up from central supply, and how many of each. |
| 8 | 2:00–2:12 | Pinch Restocked to Par. All cards go back to the normal color. Pull List: "All at par". | After the restock, one pinch resets every shelf to par. |
| 9 | 2:12–2:30 | Caption card: "Logic proven: 4 of 4 LEAF tests pass in preview." "Next: real item recognition, tie in to the hospital's par system." | All four behaviors are covered by automated LEAF tests in Lens Studio. Next comes counting the bins automatically, and connecting to the hospital's own par and requisition system. ParSight. |

## Shot notes
- Record at the preview's default pose height (eye level about 1.5 m, 1 m from the shelf). Move with WASD/QE, look with right-drag.
- Hide the LEAF result overlay text in the preview before recording (it shows "c4-card-placement PASSED" at top left).
- Start state must be 26 / 20 / 0. Refresh the preview before each take.
- No patients, no real hospital branding, no people on screen.

## Open items before recording
- Von's design notes from the walkthrough (see design-notes-2026-10-19.md) may change shots 4 to 6.
- Recording method: screen-record the Preview panel, or build a rendered video from preview captures like the Till videos. Decide after design notes land.
