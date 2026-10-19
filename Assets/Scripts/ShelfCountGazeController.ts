/**
 * ShelfCountGazeController — dims shelf cards the user is not looking at.
 *
 * "Looking at" = the card is within focusAngleDeg of the center of the view (head direction).
 * Looked-at cards fade to full brightness; others fade to dimOpacity (faint outline).
 * Expects: cameraObject (the Specs camera). Main registers the cards via setCards().
 * Must not: change counts or colors — only focus opacity.
 */
import {ShelfCountCardUI} from "./ShelfCountCardUI"

@component
export class ShelfCountGazeController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountGazeController – look-to-brighten cards</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("The camera whose view direction defines 'looking at'")
  cameraObject: SceneObject
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("A card counts as looked-at within this angle of the view center (degrees)")
  @widget(new SliderWidget(5, 40, 1))
  focusAngleDeg: number = 15

  @input
  @hint("Opacity of cards outside the focus cone (brief: about 30%)")
  @widget(new SliderWidget(0.1, 1, 0.05))
  dimOpacity: number = 0.3

  @input
  @hint("Fade speed (opacity units per second)")
  @widget(new SliderWidget(0.5, 10, 0.5))
  fadeSpeed: number = 4
  @ui.group_end

  private cards: ShelfCountCardUI[] = []
  private opacities: number[] = []
  private focused: boolean[] = []

  setCards(cards: ShelfCountCardUI[]): void {
    this.cards = cards
    this.opacities = cards.map(() => 1)
    this.focused = cards.map(() => true)
  }

  /** For tests: is card i currently in the focus cone. */
  isFocused(index: number): boolean { return !!this.focused[index] }

  onAwake() {
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  private tick(): void {
    if (!this.cameraObject || this.cards.length === 0) return
    const camT = this.cameraObject.getTransform()
    const camPos = camT.getWorldPosition()
    const viewDir = camT.forward.uniformScale(-1).normalize()  // camera looks down -Z
    const cosLimit = Math.cos(this.focusAngleDeg * Math.PI / 180)
    const dt = getDeltaTime()
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]
      if (!card) continue
      const toCard = card.getSceneObject().getTransform().getWorldPosition().sub(camPos)
      const len = toCard.length
      const inCone = len > 0.001 && toCard.uniformScale(1 / len).dot(viewDir) >= cosLimit
      this.focused[i] = inCone
      const target = inCone ? 1 : this.dimOpacity
      const cur = this.opacities[i]
      const step = this.fadeSpeed * dt
      const next = Math.abs(target - cur) <= step ? target : cur + Math.sign(target - cur) * step
      if (next !== cur) {
        this.opacities[i] = next
        card.setFocusOpacity(next)
      }
    }
  }
}
