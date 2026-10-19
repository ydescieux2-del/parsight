/**
 * ShelfCountFindPanelUI — the Find panel on top of the supply shelf (UIKit BackPlate + FlexLayout
 * row + one UIKit Button per item). Stands in for voice ("find Foley kit") in the preview.
 *
 * Expects: mounted on the authored "FindPanel" SceneObject. Runtime button objects are named
 * "Btn_Find_<key>" for LEAF. Keys and labels are parallel lists.
 * Must not: change find state itself. It only emits onFind(key); Main decides, then calls
 * setActive() so the pressed item's label glows.
 */
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"

const LABEL_SIZE = 62       // same as the supply panel labels, read from ~1 m
const CAPTION_SIZE = 50
const PLATE_COLOR = new vec4(0.42, 0.46, 0.52, 0.9)
const PLATE_BORDER = new vec4(0.77, 0.81, 0.87, 1)
const ACTIVE_LABEL = new vec4(0.45, 1.0, 1.0, 1)   // matches the bin glow
const IDLE_LABEL = new vec4(1, 1, 1, 1)
const PAD = 1.0
const GAP = 1.6
const CONTENT_Z = 0.6
const LAYOUT_Z_LIFT = 0.02
const BUTTON_LABEL_Z = 0.08

@component
export class ShelfCountFindPanelUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountFindPanelUI – find an item</span>')
  @ui.separator
  @input
  @hint("Shelf keys, in button order")
  keys: string[] = ["Flushes", "IVStart", "Foley"]

  @input
  @hint("Button labels, same order as keys")
  labels: string[] = ["Saline Flush", "IV Start Kit", "Foley Kit"]

  @input
  @hint("Button height in cm (big pinch targets)")
  @widget(new SliderWidget(3, 7, 0.5))
  buttonHeightCm: number = 4.5

  private _onFind = new Event<string>()
  get onFind(): PublicApi<string> { return this._onFind.publicApi() }

  private labelTexts: {[key: string]: Text} = {}

  onAwake() {
    const h = this.buttonHeightCm
    const widths = this.labels.map((l) => Math.max(8, l.length * 0.9 + 2))
    const captionW = 6
    const W = captionW + widths.reduce((a, b) => a + b, 0) + GAP * this.labels.length + PAD * 2
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

    const content = this.obj(this.sceneObject, "FindContent", new vec3(0, 0, CONTENT_Z))
    const row = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    row.onInitialized.add(() => {
      row.width = W
      row.height = H
      row.direction = FlexDirection.Row
      row.alignItems = FlexAlign.Center
      row.justifyContent = FlexJustify.Center
      row.columnGap = GAP
      row.paddingLeft = PAD
      row.paddingRight = PAD
      row.paddingTop = PAD
      row.paddingBottom = PAD
    })

    const items: FlexItem[] = []
    const captionObj = this.obj(content, "FindCaption")
    this.liftInZ(captionObj, LAYOUT_Z_LIFT)
    this.makeText(captionObj, "Find", CAPTION_SIZE, captionW, h)
    items.push(this.item(captionObj, captionW, h))
    this.keys.forEach((key, i) => {
      items.push(this.makeButton(content, key, this.labels[i] ?? key, widths[i], h))
    })
    row.onInitialized.add(() => row.addItems(items))
  }

  /** Main -> panel: glow the label of the item being found (null = none). */
  setActive(key: string | null): void {
    for (const k of Object.keys(this.labelTexts)) {
      this.labelTexts[k].textFill.color = k === key ? ACTIVE_LABEL : IDLE_LABEL
    }
  }

  private makeButton(parent: SceneObject, key: string, label: string, w: number, h: number): FlexItem {
    const so = this.obj(parent, "Btn_Find_" + key)
    this.liftInZ(so, LAYOUT_Z_LIFT)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.setVariant({theme: "SnapOS3", style: "Secondary"})  // outline only, so the light plate shows through
    btn.size = new vec3(w, h, 1)
    btn.onInitialized.add(() => { btn.size = new vec3(w, h, 1) })
    const labelObj = this.obj(so, "Btn_Find_" + key + "_Label", new vec3(0, 0, BUTTON_LABEL_Z))
    this.labelTexts[key] = this.makeText(labelObj, label, LABEL_SIZE, w - 0.5, 3.6)
    btn.onTriggerUp.add(() => this._onFind.invoke(key))
    return this.item(so, w, h)
  }

  private makeText(so: SceneObject, value: string, size: number, w: number, h: number): Text {
    const t = so.createComponent("Component.Text") as Text
    t.text = value
    t.depthTest = true
    t.size = size
    ;(t as Text & {weight?: number}).weight = 600
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
    t.textFill.color = IDLE_LABEL
    return t
  }

  private item(so: SceneObject, w: number, h: number): FlexItem {
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = w
    item.overrideHeight = h
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
