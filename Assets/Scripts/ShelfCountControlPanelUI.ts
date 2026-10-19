/**
 * ShelfCountControlPanelUI — small panel on top of the supply shelf unit (UIKit BackPlate +
 * FlexLayout row + two UIKit Buttons): Restocked to Par (left), Pull List (right).
 *
 * Expects: mounted on the authored "ControlPanel" SceneObject. Runtime button objects are
 * named "Btn_StartOfDay" and "Btn_Reorder" for LEAF.
 * Must not: change counts itself. It only emits onStartOfDay / onReorder.
 */
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"

const FONT_SIZE_SCALE = 1.0
type TextRole = "Button" | "Label" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Button: {size: 39, weight: 500},
  Label: {size: 62, weight: 600},  // panel button labels, read from ~1 m
  Body: {size: 39, weight: 500},
  Caption: {size: 38, weight: 500},
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

// Light slate plate (same as a card at par): the display is additive, so a dark plate
// would read as see-through on glasses.
const PLATE_COLOR = new vec4(0.42, 0.46, 0.52, 0.9)
const PLATE_BORDER = new vec4(0.77, 0.81, 0.87, 1)

const PAD = 1.0
const CONTENT_Z = 0.6
const LAYOUT_Z_LIFT = 0.02
const BUTTON_LABEL_Z = 0.08

@component
export class ShelfCountControlPanelUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountControlPanelUI – Restocked to Par / Pull List</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Label of the left button")
  startOfDayLabel: string = "Restocked to Par"

  @input
  @hint("Label of the right button")
  reorderLabel: string = "Pull List"

  @input
  @hint("Button height in cm (big pinch targets)")
  @widget(new SliderWidget(3, 7, 0.5))
  buttonHeightCm: number = 4.5
  @ui.group_end

  private _onStartOfDay = new Event<void>()
  private _onReorder = new Event<void>()
  get onStartOfDay(): PublicApi<void> { return this._onStartOfDay.publicApi() }
  get onReorder(): PublicApi<void> { return this._onReorder.publicApi() }

  onAwake() {
    const h = this.buttonHeightCm
    const w1 = Math.max(8, this.startOfDayLabel.length * 0.9 + 2)
    const w2 = Math.max(8, this.reorderLabel.length * 0.9 + 2)
    const gap = 2
    const W = w1 + w2 + gap + PAD * 2
    const H = h + PAD * 2

    this.sceneObject.createComponent("Component.Canvas")
    const plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "simple"
    plate.size = new vec2(W, H)
    plate.onInitialized.add(() => {
      plate.size = new vec2(W, H)
      const rect = this.sceneObject.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
      if (rect) {
        rect.gradient = false
        rect.backgroundColor = PLATE_COLOR
        rect.border = true
        rect.borderSize = 0.12
        rect.borderColor = PLATE_BORDER
      }
    })

    const content = this.obj(this.sceneObject, "ControlContent", new vec3(0, 0, CONTENT_Z))
    const row = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    row.onInitialized.add(() => {
      row.width = W
      row.height = H
      row.direction = FlexDirection.Row
      row.alignItems = FlexAlign.Center
      row.justifyContent = FlexJustify.Center
      row.columnGap = gap
      row.paddingLeft = PAD
      row.paddingRight = PAD
      row.paddingTop = PAD
      row.paddingBottom = PAD
    })
    const a = this.makeButton(content, "Btn_StartOfDay", this.startOfDayLabel, w1, h, () => this._onStartOfDay.invoke())
    const b = this.makeButton(content, "Btn_Reorder", this.reorderLabel, w2, h, () => this._onReorder.invoke())
    row.onInitialized.add(() => row.addItems([a, b]))
  }

  private makeButton(parent: SceneObject, name: string, label: string, w: number, h: number,
      onClick: () => void): FlexItem {
    const so = this.obj(parent, name)
    this.liftInZ(so, LAYOUT_Z_LIFT)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.setVariant({theme: "SnapOS3", style: "Secondary"})  // outline only, so the light plate shows through
    btn.size = new vec3(w, h, 1)
    btn.onInitialized.add(() => { btn.size = new vec3(w, h, 1) })
    const labelObj = this.obj(so, name + "_Label", new vec3(0, 0, BUTTON_LABEL_Z))
    const t = labelObj.createComponent("Component.Text") as Text
    t.text = label
    t.depthTest = true
    applyTextRole(t, "Label")
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-(w - 0.5) / 2, (w - 0.5) / 2, -1.8, 1.8)
    t.textFill.color = new vec4(1, 1, 1, 1)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = w
    item.overrideHeight = h
    btn.onTriggerUp.add(onClick)
    return item
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
