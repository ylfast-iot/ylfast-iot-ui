import type { Term } from '#/adapter';
import type { RuleEngineSceneApi } from '#/api/iot/rule-engine/scene';
import type {
  SceneAction,
  SceneActions,
  SceneConditionAction,
  TermColumn,
} from '#/api/iot/rule-engine/types';

export type SceneRuleModel = RuleEngineSceneApi.SceneRule;

export type SceneActionExecutor =
  | 'alarm'
  | 'delay'
  | 'device'
  | 'device-data'
  | 'notify';

export interface SceneEditorContext {
  termColumns: TermColumn[];
  variables: TermColumn[];
}

export interface ActionEditPayload {
  action?: SceneAction;
  actionIndex?: number;
  branchIndex: number;
  groupIndex: number;
  parallel: boolean;
}

export interface ActionSavePayload {
  action: SceneAction;
  actionIndex?: number;
  branchIndex: number;
  groupIndex: number;
}

export interface AlarmBindDraft {
  actionId: number;
  alarmId: string;
  alarmName?: string;
}

export interface AlarmBindingOption {
  alarmId: string;
  alarmName?: string;
  description?: string;
  level?: number | string;
  state?: Record<string, any> | string;
  targetType?: string;
}

export interface DeviceSelectOption {
  label: string;
  value: string;
}

export interface MetadataItem {
  id: string;
  name: string;
  valueType?: Record<string, unknown>;
}

export interface ProductMetadata {
  events: MetadataItem[];
  functions: Array<MetadataItem & { inputs?: MetadataItem[] }>;
  properties: MetadataItem[];
}

export interface TermEditorProps {
  columns: TermColumn[];
  terms: Term[];
}

export interface NormalizedActionGroup extends SceneActions {
  actions: SceneAction[];
}

export interface NormalizedBranch extends SceneConditionAction {
  then: NormalizedActionGroup[];
  when: Term[];
}
