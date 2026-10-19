import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {PlusMinusScenario} from "./PlusMinusScenario"
import {CardColorScenario} from "./CardColorScenario"
import {ReorderScenario} from "./ReorderScenario"
import {CardPlacementScenario} from "./CardPlacementScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "c1-plus-minus", typename: PlusMinusScenario.getTypeName()},
    {id: "c2-card-color", typename: CardColorScenario.getTypeName()},
    {id: "c3-reorder", typename: ReorderScenario.getTypeName(), parameters: {check_autohide: "true"}},
    {
      id: "c4-card-placement",
      typename: CardPlacementScenario.getTypeName(),
      parameters: {label: "pose", sample_ms: "2000", min_camera_poses: "1"},
    },
  ]
}
