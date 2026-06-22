import type {
  AlarmBindDraft,
  AlarmBindingOption,
  ProductMetadata,
  SceneRuleModel,
} from './types';

import type { Term } from '#/adapter';
import type { RuleEngineSceneApi } from '#/api/iot/rule-engine/scene';
import type {
  DeviceOperation,
  SceneAction,
  SceneActions,
  SceneConditionAction,
  TermColumn,
  Variable,
} from '#/api/iot/rule-engine/types';

const ACTIVE_DEVICE_OPERATORS = new Set([
  'invokeFunction',
  'readProperty',
  'writeProperty',
]);

export function createEmptyRule(triggerType = 'manual'): SceneRuleModel {
  return normalizeRule({
    branches: [],
    name: '',
    options: {},
    trigger: { type: triggerType },
  });
}

export function normalizeRule(
  source: Partial<RuleEngineSceneApi.SceneEntity | SceneRuleModel>,
): SceneRuleModel {
  const entity = source as Partial<RuleEngineSceneApi.SceneEntity>;
  const triggerType =
    source.trigger?.type ||
    entity.triggerType ||
    String(source.trigger?.configuration?.type || 'manual');

  const rule: SceneRuleModel = {
    actions: source.actions || [],
    branches: normalizeBranches(source.branches),
    description: source.description || '',
    features: source.features || [],
    id: source.id,
    name: source.name || '',
    options: source.options || {},
    parallel: source.parallel,
    terms: source.terms || [],
    trigger: {
      ...source.trigger,
      type: triggerType,
    },
  };

  ensureStableActionIds(rule);
  return rule;
}

export function normalizeBranches(
  branches: SceneConditionAction[] = [],
): SceneConditionAction[] {
  if (branches.length === 0) {
    const branch: SceneConditionAction = {
      branchId: 1,
      branchName: '默认分支',
      when: [],
    };
    setBranchGroups(branch, createDefaultGroups());
    return [branch];
  }

  return branches.map((branch, index) => {
    const normalizedBranch: SceneConditionAction = {
      ...branch,
      branchId: branch.branchId ?? index + 1,
      branchName:
        branch.branchName || (index === 0 ? '默认分支' : `条件${index + 1}`),
      when: normalizeTerms(branch.when || branch.options?.when || []),
    };
    setBranchGroups(normalizedBranch, normalizeGroups(branch.then));
    return normalizedBranch;
  });
}

export function createDefaultGroups(): SceneActions[] {
  return [
    { actions: [], parallel: false },
    { actions: [], parallel: true },
  ];
}

export function setBranchGroups(
  branch: SceneConditionAction,
  groups: SceneActions[],
) {
  Reflect.set(branch, 'then', groups);
}

export function normalizeGroups(groups: SceneActions[] = []): SceneActions[] {
  const serial = groups.find((item) => !item.parallel);
  const parallel = groups.find((item) => item.parallel);
  return [
    { actions: serial?.actions || [], parallel: false },
    { actions: parallel?.actions || [], parallel: true },
  ];
}

export function ensureStableActionIds(rule: SceneRuleModel) {
  let maxId = getMaxActionId(rule);
  walkActions(rule, (action) => {
    if (!action.actionId) {
      maxId += 1;
      action.actionId = maxId;
    }
  });
}

export function getMaxActionId(rule: SceneRuleModel) {
  let maxId = 0;
  walkActions(rule, (action) => {
    maxId = Math.max(maxId, action.actionId || 0);
  });
  return maxId;
}

export function nextActionId(rule: SceneRuleModel) {
  return getMaxActionId(rule) + 1;
}

export function walkActions(
  rule: SceneRuleModel,
  visitor: (
    action: SceneAction,
    branch: SceneConditionAction,
    group: SceneActions,
  ) => void,
) {
  for (const branch of rule.branches || []) {
    for (const group of branch.then || []) {
      for (const action of group.actions || []) {
        visitor(action, branch, group);
      }
    }
  }
}

export function collectAlarmBinds(rule: SceneRuleModel): AlarmBindDraft[] {
  const binds: AlarmBindDraft[] = [];
  walkActions(rule, (action) => {
    const alarms = getAlarmBindings(action);
    const actionId = action.actionId;
    if (action.executor === 'alarm' && alarms.length > 0 && actionId) {
      alarms.forEach((alarm) => {
        binds.push({
          actionId,
          alarmId: alarm.alarmId,
          alarmName: alarm.alarmName,
        });
      });
    }
  });
  return binds;
}

export function getAlarmBindings(action?: SceneAction): AlarmBindingOption[] {
  const alarms = Array.isArray(action?.options?.alarms)
    ? action?.options?.alarms
    : [];
  if (alarms.length > 0) {
    return alarms
      .map((item: any) => ({
        alarmId: String(item.alarmId || item.id || ''),
        alarmName: item.alarmName || item.name,
        description: item.description,
        level: item.level,
        state: item.state,
        targetType: item.targetType,
      }))
      .filter((item: AlarmBindingOption) => !!item.alarmId);
  }

  const legacyAlarmId = String(action?.options?.alarmId || '');
  if (!legacyAlarmId) return [];
  return [
    {
      alarmId: legacyAlarmId,
      alarmName: String(action?.options?.alarmName || ''),
    },
  ];
}

export function buildSavePayload(rule: SceneRuleModel): SceneRuleModel {
  const payload = structuredClone(rule) as SceneRuleModel;
  payload.branches = normalizeBranches(payload.branches).map((branch) => {
    const normalizedBranch: SceneConditionAction = {
      ...branch,
      options: {
        ...branch.options,
        when: normalizeTerms(branch.when || []),
      },
      when: normalizeTerms(branch.when || []),
    };
    setBranchGroups(
      normalizedBranch,
      normalizeGroups(branch.then).map((group) => ({
        actions: (group.actions || []).map((action) => cleanAction(action)),
        parallel: !!group.parallel,
      })),
    );
    return normalizedBranch;
  });
  payload.actions = [];
  payload.features = computeSceneFeatures(payload.branches);
  return payload;
}

export function cleanAction(action: SceneAction): SceneAction {
  const options = mergeActionOptionColumns({
    ...action.options,
    when: normalizeTerms(action.terms || []),
  });
  return {
    actionId: action.actionId,
    alarm: action.alarm,
    configuration: action.configuration,
    delay: action.delay,
    device: action.device,
    executor: action.executor,
    notify: action.notify,
    options,
    terms: normalizeTerms(action.terms || []),
  };
}

export function normalizeTerms(terms: any[] = []) {
  return (terms || []).map((term) => {
    const next = { ...term };
    if (Array.isArray(next.terms)) {
      next.terms = normalizeTerms(next.terms);
    }
    return next;
  });
}

export function computeSceneFeatures(
  branches: SceneConditionAction[] = [],
): string[] {
  const features = new Set<string>();
  normalizeBranches(branches).forEach((branch) => {
    branch.then?.forEach((group) => {
      group.actions?.forEach((action) => {
        if (action.executor === 'alarm') {
          features.add(
            action.alarm?.mode === 'relieve' ? 'alarmReliever' : 'alarmTrigger',
          );
        }
        if (action.options) {
          action.options = mergeActionOptionColumns(action.options);
        }
      });
    });
  });
  return features.size > 0 ? [...features] : ['none'];
}

export function mergeActionOptionColumns(options: Record<string, any>) {
  const columnMapKeys = Object.values(options?.columnMap || {}).filter(Boolean);
  const columns = new Set([...(options?.columns || []), ...columnMapKeys]);
  return {
    ...options,
    columns: [...columns],
  };
}

export function serializeRuleForCompare(rule: SceneRuleModel) {
  return JSON.stringify(buildSavePayload(rule));
}

export function validateRule(rule: SceneRuleModel): string | undefined {
  if (!rule.name?.trim()) return '请输入场景名称';
  if (!rule.trigger?.type) return '请选择触发方式';

  if (rule.trigger.type === 'device') {
    const device = rule.trigger.device;
    if (!device?.productId) return '请配置设备触发规则';
    if (!device.operation?.operator) return '请选择设备触发类型';
    if (isActiveDeviceOperation(device.operation) && !device.operation.timer) {
      return '设备主动触发必须配置定时规则';
    }
  }

  if (rule.trigger.type === 'timer' && !hasTimerConfig(rule.trigger.timer)) {
    return '请配置定时触发规则';
  }

  let actionCount = 0;
  let actionError: string | undefined;
  walkActions(rule, (action, _branch, group) => {
    actionCount += 1;
    if (group.parallel && action.executor === 'delay') {
      actionError = '并行动作不支持延迟执行';
    }
    actionError ||= validateAction(action);
  });

  if (actionError) return actionError;
  if (actionCount === 0) return '请至少配置一个执行动作';
  return undefined;
}

export function validateAction(action: SceneAction): string | undefined {
  if (!action.executor) return '请选择动作类型';
  if (action.executor === 'delay' && !action.delay?.time)
    return '请配置延迟时间';
  if (
    action.executor === 'notify' &&
    (!action.notify?.notifierId || !action.notify?.templateId)
  ) {
    return '请完整配置消息通知';
  }
  if (action.executor === 'alarm' && getAlarmBindings(action).length === 0) {
    return '请选择告警配置';
  }
  if (action.executor === 'device' && !action.device?.productId) {
    return '请完整配置设备输出动作';
  }
  if (action.executor === 'device-data' && !action.configuration?.productId) {
    return '请完整配置设备信息动作';
  }
  return undefined;
}

export function isActiveDeviceOperation(operation?: DeviceOperation) {
  return (
    !!operation?.operator && ACTIVE_DEVICE_OPERATORS.has(operation.operator)
  );
}

export function hasTimerConfig(timer?: any) {
  return !!(
    timer?.cron ||
    timer?.once ||
    timer?.period ||
    timer?.periods ||
    timer?.multi
  );
}

export function parseProductMetadata(tsl?: string): ProductMetadata {
  const empty: ProductMetadata = { events: [], functions: [], properties: [] };
  if (!tsl) return empty;
  try {
    const metadata = JSON.parse(tsl);
    return {
      events: normalizeMetadataList(metadata.events),
      functions: normalizeMetadataList(metadata.functions).map((item) => ({
        ...item,
        inputs: normalizeMetadataList(
          (item as any).inputs || (item as any).args,
        ),
      })),
      properties: normalizeMetadataList(metadata.properties),
    };
  } catch {
    return empty;
  }
}

function normalizeMetadataList(list: unknown): any[] {
  if (!Array.isArray(list)) return [];
  return list.map((item: any) => ({
    ...item,
    id: item.id || item.property || item.name,
    name: item.name || item.id || item.property,
  }));
}

export function createTerm(
  column = '',
  termType = 'eq',
  value: unknown = '',
): Term {
  return { column, termType: termType as any, value } as Term;
}

export function actionName(action: SceneAction) {
  const names: Record<string, string> = {
    alarm: action.alarm?.mode === 'relieve' ? '解除告警' : '触发告警',
    delay: '延迟执行',
    device: '设备输出',
    'device-data': '设备信息',
    notify: '消息通知',
  };
  return names[action.executor] || action.executor || '未配置动作';
}

export function variableTreeToTermColumns(
  variables: Variable[] = [],
): TermColumn[] {
  return variables
    .map((item) => toVariableTermColumn(item))
    .filter((item): item is TermColumn => !!item);
}

function toVariableTermColumn(variable: Variable): TermColumn | undefined {
  const columnKey = String(
    variable.id || variable.column || variable.code || '',
  ).trim();
  const children = (variable.children || [])
    .map((item) => toVariableTermColumn(item))
    .filter((item): item is TermColumn => !!item);

  if (!columnKey && children.length === 0) {
    return undefined;
  }

  const rawValueType =
    variable.options?.valueType ||
    variable.options?.dataType ||
    variable.type ||
    'STRING';
  const valueTypeOptions = extractValueTypeOptions(rawValueType);
  const displayName = normalizeVariableDisplayName(
    variable.name || variable.fullName || variable.description || columnKey,
  );
  const displayFullName = normalizeVariableFullName(
    variable.fullName || variable.description || variable.name || columnKey,
  );
  const displayDescription = normalizeVariableDescription(
    variable.description,
    displayFullName,
  );

  return {
    children,
    code: variable.code || columnKey,
    column: columnKey,
    dataType: normalizeVariableDataType(rawValueType),
    description: displayDescription,
    fullName: displayFullName,
    name: displayName,
    options: valueTypeOptions,
    others: variable.options as Record<string, unknown> | undefined,
    termTypes: variable.termTypes,
    valueType: rawValueType,
  } as TermColumn & { valueType?: unknown };
}

function normalizeVariableDataType(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const type = record.type || record.id;
    if (typeof type === 'string') {
      return type.toUpperCase();
    }
  }
  return 'STRING';
}

function extractValueTypeOptions(valueType: unknown) {
  if (!valueType || typeof valueType !== 'object') {
    return undefined;
  }

  const record = valueType as Record<string, unknown>;
  const candidates = [
    record.elements,
    record.enums,
    (record.expands as Record<string, unknown> | undefined)?.elements,
    (record.expands as Record<string, unknown> | undefined)?.enums,
  ];

  const rawOptions = candidates.find((item) => Array.isArray(item)) as
    | Array<Record<string, unknown>>
    | undefined;
  if (!rawOptions?.length) {
    return undefined;
  }

  return rawOptions.map((item) => ({
    id: item.id ?? item.value,
    name: item.text ?? item.label ?? item.name ?? item.value,
    value: item.value ?? item.id,
  }));
}

function normalizeVariableDisplayName(value?: string) {
  const normalized = normalizeBracketVariableText(value);
  if (!normalized) {
    return value || '';
  }
  const segments = normalized.split('.').filter(Boolean);
  return segments[segments.length - 1] || normalized;
}

function normalizeVariableFullName(value?: string) {
  return normalizeBracketVariableText(value) || value || '';
}

function normalizeVariableDescription(value?: string, fallback?: string) {
  const normalized = value?.trim();
  if (normalized) {
    return normalized;
  }
  return fallback || '';
}

function normalizeBracketVariableText(value?: string) {
  if (!value) {
    return '';
  }

  const matched = value.match(/^[^[]*\[(.+)\](?:信息|输出结果)?$/);
  if (matched?.[1]) {
    return matched[1];
  }

  return value
    .replace(/^设备\[/, '')
    .replace(/^告警\[/, '')
    .replace(/\]信息$/, '')
    .replace(/\]输出结果$/, '');
}
