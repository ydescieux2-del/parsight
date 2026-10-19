/**
 * ShelfCountMain — orchestrator and single owner of shelf-count state.
 *
 * Owns: ShelfCountState (counts/par), reorder-list visibility + 15 s auto-hide timer, and the
 * find state (which item is being found) + its 20 s timeout.
 * Expects (wired in the scene): three ShelfCountCardUI cards, the supply (control) panel, the
 * reorder panel, the audio controller, the gaze controller, and for finding: the find panel,
 * bin highlight, arrow and take detector.
 * Flow: card onPlus/onMinus → state → card.setCount + tone; supply panel Restocked to Par /
 * Pull List → state / pull-list panel; Close or timeout → hide. Find panel → highlight bins +
 * card + arrow; a detected take → count − 1 and clears that item's highlight.
 * Must not: build UI or text (UI modules do that).
 *
 * Public state API (for LEAF / other scripts), keys = "Flushes" | "IVStart" | "Foley":
 *   getCount(key), getPar(key), getCardState(key) → "normal" | "amber" | "red",
 *   getCardOpacity(key), getReorderText(), isReorderVisible(), getStateJson(),
 *   plus(key), minus(key), startOfDay(), openReorder(), closeReorder(),
 *   find(key), clearFind(), take(key), getFoundKey()
 */
import {ShelfCountAudioController} from "./ShelfCountAudioController"
import {ShelfCountCardUI} from "./ShelfCountCardUI"
import {ShelfCountControlPanelUI} from "./ShelfCountControlPanelUI"
import {ShelfCountFindArrow} from "./ShelfCountFindArrow"
import {ShelfCountFindHighlight} from "./ShelfCountFindHighlight"
import {ShelfCountFindPanelUI} from "./ShelfCountFindPanelUI"
import {ShelfCountGazeController} from "./ShelfCountGazeController"
import {ShelfCountReorderUI} from "./ShelfCountReorderUI"
import {ShelfCountTakeDetector} from "./ShelfCountTakeDetector"
import {CardState, ShelfCountState} from "./ShelfCountState"

// Par levels are fixed for this Lens (design brief: "Par is fixed at 40, 20 and 8").
const PAR: {[key: string]: number} = {Flushes: 40, IVStart: 20, Foley: 8}

@component
export class ShelfCountMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountMain – shelf counts, pull list</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Top-shelf card (saline flushes)")
  cardTop: ShelfCountCardUI

  @input
  @hint("Middle-shelf card (IV start kits)")
  cardMiddle: ShelfCountCardUI

  @input
  @hint("Bottom-shelf card (Foley catheter kits)")
  cardBottom: ShelfCountCardUI

  @input
  @hint("Control panel on top of the shelf unit (Restocked to Par / Pull List)")
  controlPanel: ShelfCountControlPanelUI

  @input
  @hint("Pull list panel above the control panel")
  reorderPanel: ShelfCountReorderUI

  @input
  @hint("Plays the plus/minus tones")
  audio: ShelfCountAudioController

  @input
  @hint("Dims cards outside the view center")
  gaze: ShelfCountGazeController

  @input
  @hint("Find panel on top of the shelf (stands in for voice)")
  findPanel: ShelfCountFindPanelUI

  @input
  @hint("Glowing outlines around the found item's bins")
  findHighlight: ShelfCountFindHighlight

  @input
  @hint("Arrow toward the found bins when they are out of view")
  findArrow: ShelfCountFindArrow

  @input
  @hint("Counts a take when a hand reaches into a bin and back out")
  takeDetector: ShelfCountTakeDetector
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Starting count on the top shelf when the Lens opens (default: 26, below par)")
  @widget(new SliderWidget(0, 60, 1))
  startCountTop: number = 26

  @input
  @hint("Starting count on the middle shelf (default: 20, at par)")
  @widget(new SliderWidget(0, 60, 1))
  startCountMiddle: number = 20

  @input
  @hint("Starting count on the bottom shelf (default: 0, empty)")
  @widget(new SliderWidget(0, 60, 1))
  startCountBottom: number = 0

  @input
  @hint("Seconds before the pull list hides by itself")
  @widget(new SliderWidget(3, 60, 1))
  reorderAutoHideSeconds: number = 15

  @input
  @hint("Seconds before a find highlight clears by itself (brief: 20)")
  @widget(new SliderWidget(5, 60, 1))
  findTimeoutSeconds: number = 20

  @input
  @hint("Pull list text when nothing is under par")
  allStockedText: string = "All at par"
  @ui.group_end

  private state: ShelfCountState
  private cards: {[key: string]: ShelfCountCardUI} = {}
  private reorderVisible = false
  private hideTimer: DelayedCallbackEvent
  private findTimer: DelayedCallbackEvent
  private foundKey: string | null = null

  onAwake() {
    this.hideTimer = this.createEvent("DelayedCallbackEvent")
    this.hideTimer.bind(() => this.closeReorder())
    this.findTimer = this.createEvent("DelayedCallbackEvent")
    this.findTimer.bind(() => this.clearFind())
    // Wire in OnStart: sibling/child script components are guaranteed awake by then.
    this.createEvent("OnStartEvent").bind(() => this.init())
  }

  private init(): void {
    if (!this.cardTop || !this.cardMiddle || !this.cardBottom || !this.controlPanel || !this.reorderPanel) {
      print("[ShelfCountMain] ERROR: required @input not wired (cards / controlPanel / reorderPanel)")
      return
    }
    const top = this.cardTop, mid = this.cardMiddle, bot = this.cardBottom
    this.state = new ShelfCountState([
      {key: top.shelfKey, name: top.itemName, par: PAR[top.shelfKey] ?? 0, count: this.startCountTop},
      {key: mid.shelfKey, name: mid.itemName, par: PAR[mid.shelfKey] ?? 0, count: this.startCountMiddle},
      {key: bot.shelfKey, name: bot.itemName, par: PAR[bot.shelfKey] ?? 0, count: this.startCountBottom},
    ])
    for (const card of [top, mid, bot]) {
      const key = card.shelfKey
      this.cards[key] = card
      card.onPlus.add(() => this.plus(key))
      card.onMinus.add(() => this.minus(key))
    }
    this.controlPanel.onStartOfDay.add(() => this.startOfDay())
    this.controlPanel.onReorder.add(() => this.openReorder())
    this.reorderPanel.onClose.add(() => this.closeReorder())
    if (this.gaze) this.gaze.setCards([top, mid, bot])
    if (this.findPanel) this.findPanel.onFind.add((key) => this.find(key))
    if (this.takeDetector) this.takeDetector.onTake.add((key) => this.take(key))

    this.refreshAll()
    print("[ShelfCountMain] ready " + this.getStateJson())
  }

  // ── Public actions ─────────────────────────────────────────────────────────
  plus(key: string): void {
    if (!this.state || this.state.increment(key) < 0) return
    if (this.audio) this.audio.playPlus()
    this.refresh(key)
  }

  minus(key: string): void {
    if (!this.state) return
    const before = this.state.count(key)
    if (before <= 0) return
    this.state.decrement(key)
    if (this.audio) this.audio.playMinus()
    this.refresh(key)
  }

  /** Find an item: light its bins and card. Finding the item already lit turns it off. */
  find(key: string): void {
    if (!this.state || !this.cards[key]) return
    if (this.foundKey === key) return this.clearFind()
    this.setFound(key)
    this.findTimer.reset(this.findTimeoutSeconds)
  }

  clearFind(): void {
    this.setFound(null)
  }

  /** A hand took one item from this shelf. Empty shelf: nothing happens. */
  take(key: string): void {
    if (!this.state || this.state.count(key) <= 0) return
    this.minus(key)
    if (this.foundKey === key) this.clearFind()
  }

  startOfDay(): void {
    if (!this.state) return
    this.state.startOfDay()
    this.refreshAll()
  }

  openReorder(): void {
    if (!this.state) return
    this.reorderVisible = true
    this.reorderPanel.show(this.getReorderText())
    this.hideTimer.reset(this.reorderAutoHideSeconds)
  }

  closeReorder(): void {
    this.reorderVisible = false
    if (this.reorderPanel) this.reorderPanel.hide()
  }

  // ── Public state API ───────────────────────────────────────────────────────
  getCount(key: string): number { return this.state ? this.state.count(key) : -1 }
  getPar(key: string): number { return this.state ? this.state.par(key) : -1 }
  getCardState(key: string): CardState { return this.state ? this.state.cardState(key) : "normal" }
  getReorderText(): string { return this.state ? this.state.reorderText(this.allStockedText) : "" }
  isReorderVisible(): boolean { return this.reorderVisible }
  getFoundKey(): string | null { return this.foundKey }
  /** Gaze focus opacity of a card: 1 = looked at, ~0.3 = dimmed. */
  getCardOpacity(key: string): number { return this.cards[key] ? this.cards[key].currentOpacity : -1 }
  getShelfKeys(): string[] { return this.state ? this.state.keys : [] }

  getStateJson(): string {
    const counts: {[k: string]: number} = {}
    const cardStates: {[k: string]: string} = {}
    const cardOpacity: {[k: string]: number} = {}
    for (const k of this.getShelfKeys()) {
      counts[k] = this.getCount(k)
      cardStates[k] = this.getCardState(k)
      cardOpacity[k] = Math.round(this.getCardOpacity(k) * 100) / 100
    }
    return JSON.stringify({
      counts,
      cardStates,
      cardOpacity,
      reorderText: this.getReorderText(),
      reorderVisible: this.reorderVisible,
      foundKey: this.foundKey,
    })
  }

  // ── View sync ──────────────────────────────────────────────────────────────
  private refresh(key: string): void {
    const card = this.cards[key]
    if (card) card.setCount(this.state.count(key), this.state.par(key), this.state.cardState(key))
    if (this.reorderVisible) this.reorderPanel.setText(this.getReorderText())
  }

  private setFound(key: string | null): void {
    this.foundKey = key
    for (const k of Object.keys(this.cards)) this.cards[k].setFound(k === key)
    if (this.findHighlight) this.findHighlight.show(key)
    if (this.findArrow) this.findArrow.setTarget(key)
    if (this.findPanel) this.findPanel.setActive(key)
    if (this.gaze) this.gaze.setPinned(key ? this.cards[key] : null)
  }

  private refreshAll(): void {
    for (const k of this.state.keys) this.refresh(k)
  }
}
