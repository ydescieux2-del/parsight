/**
 * ShelfCountState — pure shelf-count logic. No scene access.
 *
 * Owns: per-shelf counts, par levels, card color state, reorder list text.
 * Rules (design brief): count never below 0, may exceed par; amber below par,
 * red at zero, normal at/above par. Start of Day sets every shelf to par.
 * Must not: touch SceneObjects, UI, audio, or timers.
 */

export type CardState = "normal" | "amber" | "red"

export interface ShelfDef {
  key: string        // stable id used in SceneObject names, e.g. "Flushes"
  name: string       // display name, e.g. "IV Start Kits"
  par: number
  count: number
}

export class ShelfCountState {
  private shelves: ShelfDef[]

  constructor(shelves: ShelfDef[]) {
    this.shelves = shelves.map((s) => ({
      key: s.key,
      name: s.name,
      par: Math.max(0, Math.floor(s.par)),
      count: Math.max(0, Math.floor(s.count)),
    }))
  }

  get keys(): string[] {
    return this.shelves.map((s) => s.key)
  }

  shelf(key: string): ShelfDef | null {
    for (const s of this.shelves) if (s.key === key) return s
    return null
  }

  count(key: string): number {
    const s = this.shelf(key)
    return s ? s.count : -1
  }

  par(key: string): number {
    const s = this.shelf(key)
    return s ? s.par : -1
  }

  increment(key: string): number {
    const s = this.shelf(key)
    if (!s) return -1
    s.count += 1
    return s.count
  }

  /** Never goes below 0. Returns the new count (unchanged when already 0). */
  decrement(key: string): number {
    const s = this.shelf(key)
    if (!s) return -1
    if (s.count > 0) s.count -= 1
    return s.count
  }

  startOfDay(): void {
    for (const s of this.shelves) s.count = s.par
  }

  cardState(key: string): CardState {
    const s = this.shelf(key)
    if (!s) return "normal"
    if (s.count <= 0) return "red"
    if (s.count < s.par) return "amber"
    return "normal"
  }

  /** One line per shelf under par, e.g. "Saline Flushes 10 mL, pull 14"; or the all-at-par message. */
  reorderText(allStockedText: string): string {
    const lines: string[] = []
    for (const s of this.shelves) {
      if (s.count < s.par) lines.push(s.name + ", pull " + (s.par - s.count))
    }
    return lines.length > 0 ? lines.join("\n") : allStockedText
  }
}
