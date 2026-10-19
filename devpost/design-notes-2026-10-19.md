# Walkthrough notes, 2026-10-19 (Claude, from the preview)

Viewed from the user's start position (eye level ~1.5 m, 1 m from the shelf), looking at each shelf in turn.
Status: all 5 applied 2026-10-19, plus the same text-size fix on the Pull List. All 4 LEAF tests re-run and PASS (c4 now also checks the tilt).

## What works
- The shelf reads as a hospital wire supply unit: chrome wire decks, blue bins, syringes standing in the top bins, kit pouches in the middle, overstock cases on the floor deck.
- The top card (amber, "26") and the bottom card (red, "0") are the first things your eye lands on. Color state reads instantly.
- Cards dim when you look away and brighten when you look at them, as designed.

## Proposed changes
1. **Cards look like they belong to the shelf below.** Each card hangs just under its shelf deck, so it sits in front of the next shelf's stock (the flushes card covers the IV kit pouches). Option: raise each card so its top edge lines up with the shelf's front lip (like a real bin label holder), about 4 cm higher. **Applied:** cards moved up 4 cm (center 1 cm below the deck).
2. **Small text is hard to read from 1 m.** The count is fine; the item name and "26 of 40" are not. Option: make the item name and par line about 1.5x larger, keeping the card at 16 x 9 cm by shrinking the gap above the count. **Applied:** name 1.5x, par line 1.25x (1.5x ran under the buttons), top/bottom padding trimmed so the card stays 16 x 8.8 cm.
3. **The bottom card is read at a steep angle.** At 35 cm high you look down about 50 degrees, and the card faces straight out. Option: tilt the lower two cards back 15 to 25 degrees toward the eye. **Applied:** middle 20, bottom 25 degrees.
4. **Control panel labels are small.** "Restocked to Par" and "Pull List" are hard to read from the start view. Option: larger label text, or a slightly bigger panel. **Applied:** labels 1.6x, panel widened to fit.
5. **Demo cleanliness.** The LEAF test overlay text ("c4-card-placement PASSED") shows at the top of the preview. Hide it before recording the video. **Resolved:** it only appears after a test run; refreshing the preview clears it.
6. **Pull List text was the smallest in the UI** after fixes 2 and 4. **Applied:** title, list lines and Close label ~1.5x, panel widened from 26 to 32 cm.
