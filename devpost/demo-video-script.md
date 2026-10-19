# ParSight demo video script (draft 2, brief v3)

Target: about 2:15, hard limit 3:00. Public on YouTube. Footage is the Lens Studio preview.
Look: light theme (navy #0f2240 header, #f8fafc / #f1f5f9 surfaces, blue #2563eb accent, cyan #22d3ee to match the bin glow).
Voice: ElevenLabs narrator Brian (`nPczCjzI2devNBz1zQrb`), one voice.
Layout: 1920 x 1080. Headline bar on top; demo scenes show two views side by side: "The supply room" (wide spectator camera, so viewers see which bins glow) and "Through the glasses" (the wearer's view). Von 2026-10-19: the close view alone was hard to follow.
Renderer: ~/parsight-video/make_video.py (stills and short frame bursts captured from the preview, like the Till videos).
Stats are the sourced ones from design-brief.md; keep the wording as cautious as the brief.

| # | Picture | Caption | Narration |
|---|---|---|---|
| 1 | Title card | ParSight. Find it. The count keeps itself. Snap Specs, built in Lens Studio. | It's three in the morning. A float nurse is covering a unit they've never worked on, and they need a Foley catheter kit, now. |
| 2 | Problem card with the numbers | 8 trips a shift for supplies (ED study). Counting still done by hand. | In one emergency department study, nurses left the room for supplies eight times a shift. And the counting behind every supply room is still done by hand, with a clipboard or a scanner. |
| 3 | Wide shot of the shelf (Von's wide pose), slow push in | A supply shelf, on Specs | ParSight runs on Snap Specs. On the left is the whole supply room. On the right is exactly what the nurse sees through the glasses. Saline flushes, IV start kits, and Foley kits, each with a par level. |
| 4 | Find panel: pinch Saline Flush, then the three flush bins glow | Find it | Say what you need, or tap it. The three flush bins light up, right on the shelf, and their label glows, so there's nothing to hunt for. |
| 5 | Reach marker on a flush bin; count goes 26 to 25 | The count keeps itself | Reach in and take one. That's it. The count drops from twenty six to twenty five, by itself. Nobody stops to scan, tap, or write anything down. |
| 6 | Find Foley Kit. Looking away: the arrow pulses; turn to the shelf; empty bins glow, card says "Out of stock, on the Pull List" | Behind you? Follow the arrow | Now the Foley kit. The nurse is facing the wrong way, so an arrow at the edge of their view points back. They turn, and there are the lit bins. The shelf is empty, and ParSight says so. It's already on the pull list. |
| 7 | Pull List: flushes pull 15, Foley pull 8. Restocked to Par: All at par | Restock without a sweep | The supply tech sees exactly what to bring up: fifteen flushes and eight Foley kits. After restocking, one pinch resets every shelf to par. |
| 8 | Closing card | Logic proven: 7 LEAF tests pass in preview. Next: voice, camera confirmation, hospital pharmacy. | Every behavior here is covered by automated tests in Lens Studio. Next comes voice on the glasses, camera confirmation of each pick, and then the hospital pharmacy. ParSight. Find it, and the count keeps itself. |

## Shot notes
- Refresh the preview before capturing so it starts at 26 / 20 / 0 and no LEAF result text is showing.
- The preview does not draw the simulated hand, so scene 5 overlays a cyan "reach" marker on the bin in the edit. The take itself is real (the preview's simulated hand enters the bin and the count drops).
- During capture the find timeout is raised to 60 s so the Foley highlight stays on while the frames are taken; it goes back to 20 s afterwards.
- No patients, no real hospital or product branding, no people on screen.
