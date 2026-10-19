/**
 * ShelfCountReorderUI — reorder list panel just above the control panel (UIKit BackPlate +
 * FlexLayout column + UIKit Close Button).
 *
 * Expects: mounted on the authored "ReorderPanel" SceneObject. It builds a runtime child
 * "ReorderList" (the visible panel, toggled by show/hide) containing "ReorderTitle",
 * "ReorderText" and "Btn_CloseReorder" — stable names for LEAF.
 * Must not: compute reorder lines or run the auto-hide timer — Main owns both.
 * Starts hidden; the hide is applied on the first frame (after every UIKit child ran its
 * OnStart init) so the Close button is fully initialized when the list is first shown.
 */
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"

const FONT_SIZE_SCALE = 1.0
type TextRole = "Headline2" | "Button" | "Body"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Headline2: {size: 48, weight: 700},
  Button: {size: 39, weight: 500},
  Body: {size: 39, weight: 500},
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

// Light slate plate (same as a card at par): the display is additive, so a dark plate
// would read as see-through on glasses.
const PLATE_COLOR = new vec4(0.42, 0.46, 0.52, 0.9)
const PLATE_BORDER = new vec4(0.77, 0.81, 0.87, 1)

const PAD = 1.2
const CONTENT_Z = 0.6
const LAYOUT_Z_LIFT = 0.02
const BUTTON_LABEL_Z = 0.08
const TITLE_H = 2.2
const BODY_H = 5.6   // fits three lines at Body size
const CLOSE_W = 9
const CLOSE_H = 4
const ROW_GAP = 0.6

@component
export class ShelfCountReorderUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountReorderUI – reorder list panel</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Panel title")
  title: string = "Pull List"

  @input
  @hint("Close button label")
  closeLabel: string = "Close"

  @input
  @hint("Panel width in cm; sized for 'Saline Flushes 10 mL, pull 40'")
  @widget(new SliderWidget(18, 40, 1))
  panelWidthCm: number = 26
  @ui.group_end

  private _onClose = new Event<void>()
  get onClose(): PublicApi<void> { return this._onClose.publicApi() }

  private listRoot: SceneObject
  private bodyText: Text
  private wantVisible = false
  private hideApplied = false
  private pendingText = ""

  get isVisible(): boolean { return this.wantVisible }
  get currentText(): string { return this.bodyText ? this.bodyText.text : this.pendingText }

  onAwake() {
    this.build()
    const upd = this.createEvent("UpdateEvent")
    upd.bind(() => {
      if (this.hideApplied) return
      this.hideApplied = true
      this.listRoot.enabled = this.wantVisible
    })
  }

  show(text: string): void {
    this.setText(text)
    this.wantVisible = true
    if (this.listRoot) this.listRoot.enabled = true
  }

  hide(): void {
    this.wantVisible = false
    if (this.listRoot && this.hideApplied) this.listRoot.enabled = false
  }

  setText(text: string): void {
    this.pendingText = text
    if (this.bodyText) this.bodyText.text = text
  }

  private build(): void {
    const W = this.panelWidthCm
    const innerW = W - PAD * 2
    const H = PAD * 2 + TITLE_H + BODY_H + CLOSE_H + ROW_GAP * 2

    this.listRoot = this.obj(this.sceneObject, "ReorderList")
    this.listRoot.createComponent("Component.Canvas")
    const plate = this.listRoot.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "simple"
    plate.size = new vec2(W, H)
    plate.onInitialized.add(() => {
      plate.size = new vec2(W, H)
      const rect = this.listRoot.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
      if (rect) {
        rect.gradient = false
        rect.backgroundColor = PLATE_COLOR
        rect.border = true
        rect.borderSize = 0.12
        rect.borderColor = PLATE_BORDER
      }
    })

    const content = this.obj(this.listRoot, "ReorderContent", new vec3(0, 0, CONTENT_Z))
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

    const titleObj = this.obj(content, "ReorderTitle")
    this.makeText(titleObj, this.title, "Headline2", innerW, TITLE_H)
    const titleItem = this.item(titleObj, innerW, TITLE_H)

    const bodyObj = this.obj(content, "ReorderText")
    this.bodyText = this.makeText(bodyObj, this.pendingText, "Body", innerW, BODY_H)
    const bodyItem = this.item(bodyObj, innerW, BODY_H)

    const closeObj = this.obj(content, "Btn_CloseReorder")
    this.liftInZ(closeObj, LAYOUT_Z_LIFT)
    const btn = closeObj.createComponent(Button.getTypeName()) as Button
    btn.setVariant({theme: "SnapOS3", style: "Secondary"})  // outline only, so the light plate shows through
    btn.size = new vec3(CLOSE_W, CLOSE_H, 1)
    btn.onInitialized.add(() => { btn.size = new vec3(CLOSE_W, CLOSE_H, 1) })
    const labelObj = this.obj(closeObj, "Btn_CloseReorder_Label", new vec3(0, 0, BUTTON_LABEL_Z))
    this.makeText(labelObj, this.closeLabel, "Button", CLOSE_W - 0.5, 2.4)
    const closeItem = this.item(closeObj, CLOSE_W, CLOSE_H)
    btn.onTriggerUp.add(() => this._onClose.invoke())

    col.onInitialized.add(() => col.addItems([titleItem, bodyItem, closeItem]))
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

  private item(so: SceneObject, w: number, h: number): FlexItem {
    const it = so.createComponent(FlexItem.getTypeName()) as FlexItem
    it.overrideWidth = w
    it.overrideHeight = h
    return it
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
