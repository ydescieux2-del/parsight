import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {PlusMinusScenario} from "./PlusMinusScenario"
import {CardColorScenario} from "./CardColorScenario"
import {ReorderScenario} from "./ReorderScenario"
import {CardPlacementScenario} from "./CardPlacementScenario"
import {FindScenario} from "./FindScenario"
import {FindArrowScenario} from "./FindArrowScenario"
import {TakeScenario} from "./TakeScenario"

// Ids follow the done criteria in devpost/design-brief.md (v3).
@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "c1-find", typename: FindScenario.getTypeName(), parameters: {check_timeout: "true"}},
    {id: "c2-find-arrow", typename: FindArrowScenario.getTypeName(), parameters: {key: "Foley", expect: "visible"}},
    {id: "c3-take", typename: TakeScenario.getTypeName()},
    {id: "c4a-card-color", typename: CardColorScenario.getTypeName()},
    {id: "c4b-pull-list", typename: ReorderScenario.getTypeName(), parameters: {check_autohide: "true"}},
    {
      id: "c5-card-placement",
      typename: CardPlacementScenario.getTypeName(),
      parameters: {label: "pose", sample_ms: "2000", min_camera_poses: "1"},
    },
    {id: "extra-plus-minus", typename: PlusMinusScenario.getTypeName()},
  ]
}
