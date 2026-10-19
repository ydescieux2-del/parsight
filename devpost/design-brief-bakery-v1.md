---
status: approved
---

# Design brief: Shelf Count

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
A bakery or small shop owner is restocking with their hands full. They look at the display case and see a small card on the front edge of each shelf showing how many items are left against par. A quick pinch on plus or minus updates the count, and the card turns amber below par and red at zero, so they know what to reorder without stepping away to a clipboard or screen.

## Why it belongs on glasses
- Uses: draws in the world (each count sits on the shelf it describes), leaves your body free (eyes stay on the shelf, hands stay mostly on the stock).
- Why it's better than the phone or laptop version: there's no phone to pull out and unlock with full hands, and no list to match against shelves. The count is on the shelf you're already looking at.

## Product or overlay
- Type: overlay. It responds to real shelves and real stock.
- What the real version would sense: the items on each shelf, to count them automatically.
- Stand-in for the preview: no recognition. The owner counts by hand with big plus and minus buttons on each card. The shelves are a virtual glass bakery display case.

## Where things live
- Where the user is looking during the main task: at the front of the display case, about a meter away, moving between shelves.
- Display case: a glass bakery display case about 1.2 m wide and 1.3 m tall, standing on the floor about 1 m in front of the user at start. Three shelves at about 35 cm, 70 cm and 105 cm high (default).
- Shelf contents (a few simple 3D pastries on each, so it looks real):
  - Top shelf: croissants, par 12.
  - Middle shelf: blueberry muffins, par 10.
  - Bottom shelf: chocolate chip cookies, par 24.
- Shelf cards: one per shelf, on the front edge of its shelf, centered, facing the user, at real size. About 16 x 9 cm (default). Each shows the item name (default), the count large, and the par as small text under it, like "8 of 12".
- Plus and minus buttons: two big equal buttons on each card, minus on the left, plus on the right, with a clear gap between them. About 5 x 5 cm each with about 3 cm gap (default).
- Control panel: a small panel on top of the display case, at about chest height (about 1.3 m). Start of Day on the left, Reorder on the right.
- Reorder list: opens just above the control panel, facing the user.

## Hands and input
- Add one: pinch the plus button on a shelf card. Plays a short higher tone.
- Take one away (sold or pulled): pinch the minus button. Plays a short lower tone.
- Pinching the card itself does nothing, so a near miss never counts.
- Count never goes below 0 (default). It can go above par (default).
- Start of Day: pinch the button on the control panel. Sets every shelf to full par: 12, 10 and 24.
- Reorder: pinch the button on the control panel. Opens the reorder list.
- Close: pinch the Close button on the reorder list.
- Par is fixed at 12, 10 and 24 for this Lens.
- Targets are big and highlight when aimed at.
- Voice: none.

## When things show
- Shelf cards: always present on their shelf edges. Full brightness when the user looks at that shelf; dim to a faint outline (about 30 percent) when they look away, so they can still find the cards. "Looking at" means the card is near the center of the view, within about 15 degrees (default).
- Card color: normal (light) at or above par, amber below par, red at zero.
- Reorder list: shows when Reorder is pressed. Lists each shelf under par and how many to order to get back to par, like "Croissants, order 5". If nothing is under par it says "All stocked". Hides when Close is pressed or by itself after 15 seconds.
- If something needs attention out of view: none. The cards dim instead of disappearing, so they stay findable.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinching a card's plus button adds one to its count, and pinching minus takes one away.
2. A card turns amber when its count drops below par, and red at zero.
3. Reorder lists every shelf under par with how many to order, or "All stocked" if none are.
4. Cards stay on the shelf edges at real size while I walk around in the preview.

## Out of scope
- Recognizing or counting real items automatically.
- Changing par levels (can come later).
- Saving counts between sessions, or sending an actual order.
- More than one display case.

## Risks and open questions
- Feel unproven: whether pinching small-ish card buttons is comfortable with hands actually full of trays, and how reliable real hand tracking is at that distance.
- In the preview, "looking at a shelf" follows where the camera points (your head), not your eyes. Real glasses would behave the same way, but it may dim cards you're glancing at sideways.
- The glasses' view is narrow, so from 1 m away you'll see about one or two shelves at a time and tilt your head to see the rest.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.
