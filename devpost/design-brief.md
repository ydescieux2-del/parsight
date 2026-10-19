---
status: approved
---

# Design brief: ParSight

<!-- Revised 2026-10-17 from the original bakery version (Shelf Count, kept in design-brief-bakery-v1.md). Same mechanics, retargeted to hospital clean supply rooms. Values marked (default) were not chosen by the learner. -->

## The one spatial moment
A supply tech or charge nurse is sweeping the clean supply room in gloves, often carrying stock. They look at the supply shelf and see a small label card on the front edge of each shelf showing how many items are left against par. A quick pinch on plus or minus updates the count, and the card turns amber below par and red at zero, so they know what to pull from central supply without putting anything down to use a scanner or clipboard.

## Who it's for
- Hospital supply chain and nursing teams. "Par level" is how hospital supply rooms already work: each bin has a par, and staff count and restock to it every day.
- Why it matters:
  - In an emergency department study, nurses left the room for supplies 8 times per shift before point-of-use storage, and 2.5 times after ([Richardson et al. 2014](https://healthdesign.org/system/files/Richardson_Rupp_Long_Urquhart_Ricart_Newcomb_Myers_Kane-2014-CHD-KPS.pdf)).
  - Earlier studies, as cited by vendors, put lost time at up to about 40 minutes per shift, mostly hunting for items (Hendrich 2008). They also found 14% of nurse time spent working around missing supplies (Tucker 2014) ([summary](https://www.tersosolutions.com/updates/frustrations-of-manual-inventory-management-a-nurses-perspective)).
  - Supplies are about 15% of hospital expenses on average, and 30 to 40% in surgery-heavy hospitals ([SAGE 2017](https://journals.sagepub.com/doi/10.1177/1077558717719928)).
- No patient data is involved. It counts supplies only.

## Why it belongs on glasses
- Uses: draws in the world (each count sits on the shelf it describes), leaves your body free (eyes stay on the shelf, gloved hands stay on the stock).
- Why it's better than the phone or handheld scanner version:
  - Gloved, often contaminated hands can't easily work a phone or scanner.
  - Infection control discourages touching shared screens, and a mid-air pinch touches nothing.
  - There's no list to match against shelves: the count sits on the shelf you're already looking at.

## Product or overlay
- Type: overlay. It responds to real shelves and real stock.
- What the real version would sense: the items in each bin, to count them automatically (or tie into the hospital's existing par and requisition system).
- Stand-in for the preview: no recognition. Staff count by hand with big plus and minus buttons on each card. The shelf is a virtual chrome wire shelving unit with translucent blue bins.

## Where things live
- Where the user is looking during the main task: at the front of the shelf unit, about a meter away, moving between shelves.
- Shelf unit: a chrome wire shelving unit about 1.2 m wide, 1.3 m tall and 0.5 m deep, standing on the floor about 1 m in front of the user at start. Shelves at about 35 cm, 70 cm and 105 cm, plus a floor deck holding sealed overstock cases.
- Shelf contents (simple 3D stand-ins in blue bins):
  - Top shelf: Saline Flushes 10 mL, par 40. Starts at 26, with about 26 syringes visible.
  - Middle shelf: IV Start Kits, par 20. Starts at 20, full.
  - Bottom shelf: Foley Catheter Kits, par 8. Starts at 0, with empty bins.
- Shelf cards: one per shelf, on the front edge of its shelf like a bin label (straddling the shelf lip), centered, facing the user, at real size, about 16 x 9 cm. The middle and bottom cards tilt back 20 and 25 degrees so they face the eye when you look down. Each shows the item name, the count large, and the par under it, like "26 of 40". All text is sized to read from about 1 m.
- Plus and minus buttons: two big equal buttons on each card, minus on the left, plus on the right, with a clear gap between them. About 5 x 5 cm each, with a 4 cm gap.
- Control panel: a small panel on top of the shelf unit, at about chest height (about 1.3 m). Restocked to Par on the left, Pull List on the right.
- Pull list: opens just above the control panel, facing the user.

## Hands and input
- Add one: pinch the plus button on a shelf card. Plays a short higher tone.
- Take one away (used or pulled): pinch the minus button. Plays a short lower tone.
- Pinching the card itself does nothing, so a near miss never counts.
- The count never goes below 0, and a minus at 0 is silent. It can go above par.
- Restocked to Par: pinch the button on the control panel. Sets every shelf to full par: 40, 20 and 8.
- Pull List: pinch the button on the control panel. Opens the pull list.
- Close: pinch the Close button on the pull list.
- Par is fixed at 40, 20 and 8 for this Lens.
- Targets are big and highlight when aimed at. All panels and buttons are light (outlined buttons on light plates), because dark UI disappears on the additive display.
- Voice: none.

## When things show
- Shelf cards: always present on their shelf edges. Full brightness when the user looks at that shelf, and dimmed to a faint outline (about 30 percent) when they look away, so they can still find the cards. "Looking at" means the card is within about 15 degrees of the center of view (default).
- Card color: normal (light slate) at or above par, amber below par, red at zero.
- Pull list: shows when Pull List is pressed. It lists each shelf under par and how many to pull to get back to par, like "Saline Flushes 10 mL, pull 14". If nothing is under par it says "All at par". It hides when Close is pressed, or by itself after 15 seconds.
- If something needs attention out of view: nothing extra. The cards dim instead of disappearing, so they stay findable.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinching a card's plus button adds one to its count, and pinching minus takes one away.
2. A card turns amber when its count drops below par, and red at zero.
3. Pull List lists every shelf under par with how many to pull, or "All at par" if none are.
4. Cards stay on the shelf edges at real size while I walk around in the preview.

## Out of scope
- Recognizing or counting real items automatically.
- Connecting to a hospital materials management or requisition system.
- Changing par levels (can come later).
- Saving counts between sessions, or sending an actual order.
- More than one shelf unit or supply room.
- Anything involving patients or patient data.

## Risks and open questions
- Feel unproven: whether pinching card buttons is comfortable in gloves with hands full of stock, and how reliable real hand tracking is at that distance.
- In the preview, "looking at a shelf" follows where the camera points (your head), not your eyes. Real glasses would behave the same way, but it may dim cards you're glancing at sideways.
- The glasses' view is narrow, so from 1 m away you'll see about one or two shelves at a time and tilt your head to see the rest. At the start view all three cards are below eye level, so they start dimmed until you look down at a shelf.
- Hospital adoption would need IT and infection-control sign-off on the glasses themselves (cleaning, shared devices).

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
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
