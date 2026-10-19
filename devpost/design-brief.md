---
status: approved
---

# Design brief: ParSight

<!-- v3, 2026-10-19: pivot from "count by pinching" to "find it, and the count keeps itself". v2 (manual par counter) is in git history (commit 49f6ec9); the bakery v1 is in design-brief-bakery-v1.md. Values marked (default) were not chosen by the learner. -->

## The one spatial moment
A float nurse is in a clean supply room they have never worked in, gloved, and needs a Foley catheter kit now. They tap "Foley Kit" on the Find panel on top of the shelf (on glasses, they would just say it). The right bins light up on the shelf, and if they are out of view, an arrow at the edge of their vision points the way. They reach in and take one, and the count for that shelf drops by itself. Nobody counts, and nobody hunts. When a shelf runs low its label turns amber, then red, and the supply tech's Pull List already knows what to bring.

## Who it's for
- **Nurses, especially float and travel nurses**, who lose time searching for supplies in rooms they don't know. Searching is the biggest part of the "time lost to supplies" problem below.
- **Supply techs**, who restock to par every day and today walk the room with a handheld scanner to find out what is short.
- Why it matters:
  - In an emergency department study, nurses left the room for supplies 8 times per shift before point-of-use storage, and 2.5 times after ([Richardson et al. 2014](https://healthdesign.org/system/files/Richardson_Rupp_Long_Urquhart_Ricart_Newcomb_Myers_Kane-2014-CHD-KPS.pdf)).
  - Earlier studies, as cited by vendors, put lost time at up to about 40 minutes per shift, mostly hunting for items (Hendrich 2008). They also found 14% of nurse time spent working around missing supplies (Tucker 2014) ([summary](https://www.tersosolutions.com/updates/frustrations-of-manual-inventory-management-a-nurses-perspective)).
  - Supplies are about 15% of hospital expenses on average, and 30 to 40% in surgery-heavy hospitals ([SAGE 2017](https://journals.sagepub.com/doi/10.1177/1077558717719928)).
- No patient data is involved. It finds and counts supplies only.
- **Next market: hospital pharmacy and medication rooms.** "Find it" matters even more there (look-alike, sound-alike drugs), but it needs barcode or camera confirmation of every pick, and controlled substances already live in counting cabinets. The stock room proves the idea first.

## Why it belongs on glasses
- Uses: draws in the world (the answer lights up the actual bin), leaves your body free (eyes up, gloved hands on the stock), knows what your hands are doing (reaching into a bin counts as taking).
- Why a phone or scanner can't do this:
  - A phone can tell you "aisle 2, shelf 3". It can't light up the bin in front of you or point to it when it's behind you.
  - Counting happens as a side effect of taking an item. Nobody stops to scan, tap, or write.
  - Gloved, often contaminated hands can't easily work a phone or scanner, and a mid-air pinch touches nothing.

## Product or overlay
- Type: overlay. It responds to real shelves and real stock.
- What the real version would sense: the user's voice ("Foley sixteen French"), hand position against each bin's known space (take detection), and later the camera recognizing the item taken.
- Stand-in for the preview:
  - Find by tapping an item on the Find panel instead of voice.
  - Take detection uses the hand position from Spectacles Interaction Kit against each bin's space, so it works with the preview's simulated hands.
  - The shelf is a virtual chrome wire shelving unit with translucent blue bins, built in Blender at real size with printed generic labels (no brands). Source: tools/supply_shelf/.

## Where things live
- Where the user is looking during the main task: at the front of the shelf unit, about a meter away, moving between shelves.
- Shelf unit: a chrome wire shelving unit about 1.2 m wide, 1.3 m tall and 0.5 m deep, standing on the floor about 1 m in front of the user at start. Shelves at about 35 cm, 70 cm and 105 cm, plus a floor deck holding sealed overstock cases.
- Shelf contents (three bins per shelf, one item per shelf):
  - Top shelf: Saline Flushes 10 mL, par 40. Starts at 26, with 26 syringes visible.
  - Middle shelf: IV Start Kits, par 20. Starts at 20, full.
  - Bottom shelf: Foley Catheter Kits, par 8. Starts at 0, with empty bins.
- Shelf cards: one per shelf, on the front edge of its shelf like a bin label, centered, at real size, about 16 x 9 cm. Middle and bottom cards tilt back 20 and 25 degrees toward the eye. Each shows the item name, the count large, and "26 of 40" under it. Plus and minus buttons stay on each card for corrections (about 5 x 5 cm, 4 cm gap).
- Find panel: on top of the shelf unit, centered, at about chest height (about 1.3 m). Three big buttons, one per item: "Saline Flush", "IV Start Kit", "Foley Kit".
- Supply panel (for the supply tech): on top of the unit, to the right of the Find panel. Restocked to Par and Pull List.
- Pull list: opens just above the supply panel, facing the user.
- Bin highlight: a bright outline around each bin of the found item, plus that shelf's card glowing.
- Arrow: when the found bins are out of view, a small arrow near the edge of the view, about 1 m ahead, pointing toward them (default).

## Hands and input
- Find: pinch an item on the Find panel. Its bins and card light up. Pinching another item switches. Pinching the same item again clears it.
- Take: a hand reaches into a bin (stays inside at least 0.3 s) and comes back out. That shelf's count drops by one, with the short lower tone. A hand passing in front of a bin without entering it does nothing. A take also clears the find highlight for that item.
- Correct: plus and minus on the card, as before. Plus undoes a wrong take.
- The count never goes below 0. A take from an empty shelf does nothing.
- Restocked to Par and Pull List: as before, on the supply panel.
- Par is fixed at 40, 20 and 8 for this Lens.
- Targets are big and highlight when aimed at. All panels and buttons are light (outlined buttons on light plates), because dark UI disappears on the additive display.
- Voice: on glasses, "find <item>". In the preview, the Find panel stands in for it (default).

## When things show
- Shelf cards: always present. Full brightness when looked at (within about 15 degrees of the center of view), dimmed to about 30 percent otherwise. A found item's card stays at full brightness.
- Card color: normal (light slate) at or above par, amber below par, red at zero.
- Found an item that is out of stock (count 0): its bins still light up, and the card shows "Out of stock, on the Pull List".
- Highlight: stays until the item is taken, the same Find button is pinched again, or 20 seconds pass (default).
- Arrow: shows only while a highlight is active and the found bins are more than about 25 degrees from the center of view (default). Hides as soon as they come into view.
- Pull list: lists each shelf under par and how many to pull, like "Saline Flushes 10 mL, pull 14", or "All at par". Hides on Close or after 15 seconds.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinching an item on the Find panel lights up that item's bins and card. Pinching another item switches the highlight, and the highlight clears after a take, a second pinch, or 20 seconds.
2. When the found bins are out of view, an arrow points toward them, and it hides once they are in view.
3. A hand reaching into a bin and back out lowers that shelf's count by one. A hand passing in front of the bins without entering does not. Plus on the card undoes it.
4. A card turns amber below par and red at zero, and Pull List lists every shelf under par with how many to pull, or "All at par".
5. Cards stay on the shelf edges at real size while I walk around in the preview.

## Out of scope
- Voice recognition in the preview (on glasses only).
- Camera recognition of which item was taken.
- Telling a take apart from putting an item back (the plus button corrects it).
- Connecting to a hospital materials management or requisition system.
- Changing par levels, saving counts between sessions, or sending an actual order.
- More than one shelf unit or supply room.
- Anything involving patients, patient data, or medications.

## Risks and open questions
- Feel unproven: whether take detection is reliable with real hands, gloves and quick reaches, and how often a reach without a take fools it.
- Putting an item back reads as a take. The plus button corrects it; a real version would need the camera.
- Voice may work only on device. If so, the demo shows tap-to-find and describes voice.
- In the preview, "looking at" follows the camera (your head), not your eyes.
- Hospital adoption would need IT and infection-control sign-off on the glasses (cleaning, shared devices).

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Keep the existing shelf model, cards, Pull List and tests; add Find, highlight, arrow and take detection on top.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Keep text and highlights light and readable.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
