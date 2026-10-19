/**
 * ShelfCountCardUI — one shelf card (UIKit BackPlate + FlexLayout + two UIKit Buttons).
 *
 * Owns: the card's visuals only (name, big count, "8 of 12" par line, minus/plus buttons,
 * background tint for normal/amber/red, focus dimming).
 * Expects: mounted on an authored SceneObject named "Card_<shelfKey>" on the front edge of
 * its shelf. Runtime children are named for LEAF: "Btn_Minus_<key>", "Btn_Plus_<key>",
 * "Count_<key>", "Par_<key>", "Name_<key>".
 * Size note: ~300 lines because it carries the module-scope type scale plus button/text helpers;
 * splitting them out would scatter one self-contained view.
 * Must not: hold domain state or decide counts. Main pushes state via setCount(); the card
 * reports intent through onPlus / onMinus. Pinching the card body does nothing.
 */
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"

// ── Typography: single source of truth for text size + weight ────────────────
const FONT_SIZE_SCALE = 1.0
type TextRole =
  | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700},
  Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700},
  Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700},
  Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500},
  Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500},
  Caption: {size: 38, weight: 500},
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

const PAD = 1.0             // card inner padding (cm)
const NAME_H = 1.5          // item-name row height (cm)
const ROW_GAP = 0.3         // name row → button row gap (cm)
const CONTENT_Z = 0.6       // content lift over the BackPlate face (depth tie-break)
const LAYOUT_Z_LIFT = 0.02
const BUTTON_LABEL_Z = 0.08 // label lift over the Button face

export type CardVisualState = "normal" | "amber" | "red"

@component
export class ShelfCountCardUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountCardUI – shelf-edge count card</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Stable id for this shelf. Used in runtime object names (Btn_Plus_<key>, Count_<key>) and by the manager.")
  shelfKey: string = "Flushes"

  @input
  @hint("Item name shown at the top of the card")
  itemName: string = "Saline Flushes 10 mL"

  @input
  @hint("Plus/minus button edge length in cm (brief: about 5 cm)")
  @widget(new SliderWidget(3, 8, 0.5))
  buttonSizeCm: number = 5

  @input
  @hint("Gap between minus and plus in cm; the count sits in this gap (brief: about 3 cm, needs ~4 cm for '24 of 24')")
  @widget(new SliderWidget(3, 8, 0.5))
  buttonGapCm: number = 4

  @input("vec4", "{0.42,0.46,0.52,0.9}")
  @hint("Card background at or above par (light, additive-friendly)")
  @widget(new ColorWidget())
  normalColor: vec4

  @input("vec4", "{0.85,0.55,0.08,0.95}")
  @hint("Card background below par")
  @widget(new ColorWidget())
  amberColor: vec4

  @input("vec4", "{0.85,0.18,0.15,0.95}")
  @hint("Card background at zero")
  @widget(new ColorWidget())
  redColor: vec4
  @ui.group_end

  private _onPlus = new Event<void>()
  private _onMinus = new Event<void>()
  get onPlus(): PublicApi<void> { return this._onPlus.publicApi() }
  get onMinus(): PublicApi<void> { return this._onMinus.publicApi() }

  private backPlate: BackPlate
  private rect: RoundedRectangle | null = null
  private countText: Text
  private parText: Text
  private nameText: Text
  private minusBtn: Button
  private plusBtn: Button
  private visualState: CardVisualState = "normal"
  private focusOpacity = 1
  private pendingCount = 0
  private pendingPar = 0

  get cardWidth(): number { return this.buttonSizeCm * 2 + this.buttonGapCm + PAD * 2 }
  get cardHeight(): number { return PAD * 2 + NAME_H + ROW_GAP + this.buttonSizeCm }
  get currentVisualState(): CardVisualState { return this.visualState }
  get currentOpacity(): number { return this.focusOpacity }

  onAwake() {
    this.buildCard()
  }

  /** Main → card: push the count, par and color state. */
  setCount(count: number, par: number, state: CardVisualState): void {
    this.pendingCount = count
    this.pendingPar = par
    this.visualState = state
    if (this.countText) this.countText.text = "" + count
    if (this.parText) this.parText.text = count + " of " + par
    this.applyColors()
  }

  /** Gaze → card: 1 = looked at, ~0.3 = faint outline. */
  setFocusOpacity(opacity: number): void {
    this.focusOpacity = Math.max(0, Math.min(1, opacity))
    this.applyColors()
  }

  private buildCard(): void {
    const W = this.cardWidth
    const H = this.cardHeight
    const b = this.buttonSizeCm
    const key = this.shelfKey

    this.sceneObject.createComponent("Component.Canvas")
    // BackPlate first so the Canvas hierarchy pass paints it behind the content.
    this.backPlate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    this.backPlate.style = "simple"
    this.backPlate.size = new vec2(W, H)
    this.backPlate.onInitialized.add(() => {
      this.backPlate.size = new vec2(W, H)
      this.rect = this.sceneObject.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
      if (this.rect) {
        this.rect.gradient = false
        this.rect.border = true
        this.rect.borderSize = 0.12
      }
      this.applyColors()
    })

    const content = this.obj(this.sceneObject, "Content_" + key, new vec3(0, 0, CONTENT_Z))
    const col = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    col.onInitialized.add(() => {
      col.width = W
      col.height = H
      col.direction = FlexDirection.Column
      col.alignItems = FlexAlign.Center
      col.justifyContent = FlexJustify.Start
      col.rowGap = ROW_GAP
      col.paddingTop = PAD
      col.paddingBottom = PAD
      col.paddingLeft = PAD
      col.paddingRight = PAD
    })

    // Row 1: item name
    const nameObj = this.obj(content, "Name_" + key)
    this.nameText = this.makeText(nameObj, this.itemName, "Subheadline", W - PAD * 2, NAME_H)
    const nameItem = nameObj.createComponent(FlexItem.getTypeName()) as FlexItem
    nameItem.overrideWidth = W - PAD * 2
    nameItem.overrideHeight = NAME_H

    // Row 2: [ - ]  count / "8 of 12"  [ + ]
    const rowObj = this.obj(content, "ButtonRow_" + key)
    this.liftInZ(rowObj, LAYOUT_Z_LIFT)
    const row = rowObj.createComponent(FlexLayout.getTypeName()) as FlexLayout
    const rowItem = rowObj.createComponent(FlexItem.getTypeName()) as FlexItem
    rowItem.overrideWidth = W - PAD * 2
    rowItem.overrideHeight = b
    row.onInitialized.add(() => {
      row.width = W - PAD * 2
      row.height = b
      row.direction = FlexDirection.Row
      row.alignItems = FlexAlign.Center
      row.justifyContent = FlexJustify.Center
      row.columnGap = 0
    })

    const rowItems: FlexItem[] = []
    const minus = this.makeButton(rowObj, "Btn_Minus_" + key, "-", b, () => this._onMinus.invoke())
    this.minusBtn = minus.btn
    rowItems.push(minus.item)

    const midObj = this.obj(rowObj, "CountBlock_" + key)
    this.liftInZ(midObj, LAYOUT_Z_LIFT)
    const mid = midObj.createComponent(FlexLayout.getTypeName()) as FlexLayout
    const midItem = midObj.createComponent(FlexItem.getTypeName()) as FlexItem
    midItem.overrideWidth = this.buttonGapCm
    midItem.overrideHeight = b
    const countH = b * 0.62
    const parH = b - countH
    mid.onInitialized.add(() => {
      mid.width = this.buttonGapCm
      mid.height = b
      mid.direction = FlexDirection.Column
      mid.alignItems = FlexAlign.Center
      mid.justifyContent = FlexJustify.Center
    })
    const countObj = this.obj(midObj, "Count_" + key)
    this.countText = this.makeText(countObj, "" + this.pendingCount, "Title1", this.buttonGapCm, countH)
    const countItem = countObj.createComponent(FlexItem.getTypeName()) as FlexItem
    countItem.overrideWidth = this.buttonGapCm
    countItem.overrideHeight = countH
    const parObj = this.obj(midObj, "Par_" + key)
    this.parText = this.makeText(parObj, this.pendingCount + " of " + this.pendingPar, "Caption", this.buttonGapCm, parH)
    const parItem = parObj.createComponent(FlexItem.getTypeName()) as FlexItem
    parItem.overrideWidth = this.buttonGapCm
    parItem.overrideHeight = parH
    mid.onInitialized.add(() => mid.addItems([countItem, parItem]))
    rowItems.push(midItem)

    const plus = this.makeButton(rowObj, "Btn_Plus_" + key, "+", b, () => this._onPlus.invoke())
    this.plusBtn = plus.btn
    rowItems.push(plus.item)
    row.onInitialized.add(() => row.addItems(rowItems))

    col.onInitialized.add(() => col.addItems([nameItem, rowItem]))
  }

  private makeButton(parent: SceneObject, name: string, label: string, size: number,
      onClick: () => void): {btn: Button; item: FlexItem} {
    const so = this.obj(parent, name)
    this.liftInZ(so, LAYOUT_Z_LIFT)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.setVariant({theme: "SnapOS3", style: "Secondary"})  // outline only, so the card color shows through
    btn.size = new vec3(size, size, 1)
    btn.onInitialized.add(() => {
      btn.size = new vec3(size, size, 1)
      btn.opacity = this.focusOpacity
    })
    const labelObj = this.obj(so, name + "_Label", new vec3(0, 0, BUTTON_LABEL_Z))
    this.makeText(labelObj, label, "Title1", size - 0.5, size - 0.5)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = size
    item.overrideHeight = size
    btn.onTriggerUp.add(onClick)
    return {btn, item}
  }

  private makeText(so: SceneObject, value: string, role: TextRole, w: number, h: number): Text {
    const t = so.createComponent("Component.Text") as Text
    t.text = value
    t.depthTest = true
    applyTextRole(t, role)
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
    t.textFill.color = new vec4(1, 1, 1, 1)
    return t
  }

  private applyColors(): void {
    const a = this.focusOpacity
    const base = this.visualState === "red" ? this.redColor
      : this.visualState === "amber" ? this.amberColor : this.normalColor
    if (this.rect) {
      this.rect.backgroundColor = new vec4(base.x, base.y, base.z, base.w)
      this.rect.borderColor = new vec4(
        Math.min(1, base.x + 0.35), Math.min(1, base.y + 0.35), Math.min(1, base.z + 0.35), 1)
      this.rect.opacity = a
    }
    const white = new vec4(1, 1, 1, a)
    if (this.nameText) this.nameText.textFill.color = white
    if (this.countText) this.countText.textFill.color = white
    if (this.parText) this.parText.textFill.color = new vec4(1, 1, 1, 0.85 * a)
    if (this.minusBtn && this.minusBtn.initialized) this.minusBtn.opacity = a
    if (this.plusBtn && this.plusBtn.initialized) this.plusBtn.opacity = a
    this.setLabelAlpha(this.minusBtn, a)
    this.setLabelAlpha(this.plusBtn, a)
  }

  private setLabelAlpha(btn: Button, a: number): void {
    if (!btn) return
    const so = btn.getSceneObject()
    for (let i = 0; i < so.getChildrenCount(); i++) {
      const t = so.getChild(i).getComponent("Component.Text") as Text
      if (t) t.textFill.color = new vec4(1, 1, 1, a)
    }
  }

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    if (position) so.getTransform().setLocalPosition(position)
    return so
  }

  private liftInZ(so: SceneObject, dz: number): void {
    const t = so.getTransform()
    const p = t.getLocalPosition()
    t.setLocalPosition(new vec3(p.x, p.y, p.z + dz))
  }
}
