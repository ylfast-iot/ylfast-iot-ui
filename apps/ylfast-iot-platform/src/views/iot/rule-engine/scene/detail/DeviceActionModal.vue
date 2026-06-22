<script setup lang="ts">
import type { SceneRuleModel } from './types';

import type { Term } from '#/adapter';
import type { SceneAction } from '#/api/iot/rule-engine/types';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Empty,
  Form,
  message,
  Modal,
  Pagination,
  Select,
  Steps,
  Table,
  TreeSelect,
} from 'ant-design-vue';

import { getDeviceDetailsPage } from '#/api/iot/device/instance';
import {
  getProductDetail,
  getProductDetailsPage,
} from '#/api/iot/device/product';
import { parseSceneVariables } from '#/api/iot/rule-engine/scene-utils';
import { getRelationTypesByObject } from '#/api/system/relation';
import { useYlDcForm } from '#/components/yl-dc-form';

import DeviceMessageValueInput from './action/DeviceMessageValueInput.vue';
import { parseProductMetadata } from './utils';

const props = defineProps<{
  action?: SceneAction;
  actionId: number;
  actionIndex?: number;
  branchIndex?: number;
  groupIndex?: number;
  open: boolean;
  scene?: SceneRuleModel;
}>();

const emit = defineEmits<{
  save: [value: SceneAction];
  'update:open': [value: boolean];
}>();

const current = ref(0);
const products = ref<any[]>([]);
const devices = ref<any[]>([]);
const builtinTree = ref<any[]>([]);
const relationOptions = ref<Array<{ label: string; value: string }>>([]);
const tagOptions = ref<Array<{ label: string; value: string }>>([]);
const metadata = ref(parseProductMetadata());
const productSearchTerms = ref<Term[]>([]);
const deviceSearchTerms = ref<Term[]>([]);

const productPagination = reactive({ current: 1, pageSize: 12, total: 0 });
const devicePagination = reactive({ current: 1, pageSize: 12, total: 0 });

const form = reactive({
  functionId: '',
  inputs: [] as Array<{ name: string; value: any }>,
  messageType: 'INVOKE_FUNCTION',
  productId: '',
  productName: '',
  properties: {} as Record<string, any>,
  relationKey: '',
  selector: 'all',
  selectorValues: [] as Array<{ name?: string; value?: string }>,
  upperKey: '',
});

const productSearchSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'productName',
    label: '产品名称',
    termTypes: ['like', 'eq'],
  },
  {
    component: 'Input',
    field: 'id',
    label: '产品ID',
    termTypes: ['like', 'eq'],
  },
];

const deviceSearchSchemas: YlDcFormSchema[] = [
  {
    component: 'Input',
    field: 'deviceName',
    label: '设备名称',
    termTypes: ['like', 'eq'],
  },
  {
    component: 'Input',
    field: 'id',
    label: '设备ID',
    termTypes: ['like', 'eq'],
  },
  { component: 'Input', field: 'sn', label: 'SN', termTypes: ['like', 'eq'] },
];

const [ProductSearchForm] = useYlDcForm({
  formSchemas: productSearchSchemas,
  layoutOption: {
    cols: 3,
    breakpoints: { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 },
  },
  showMoreButton: false,
});

const [DeviceSearchForm] = useYlDcForm({
  formSchemas: deviceSearchSchemas,
  layoutOption: {
    cols: 3,
    breakpoints: { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 },
  },
  showMoreButton: false,
});

const selectorCards = computed(() => [
  {
    description: '向当前产品下的全部设备发送动作。',
    title: '全部设备',
    value: 'all',
  },
  {
    description: '手动选择一个或多个具体设备。',
    title: '指定设备',
    value: 'fixed',
  },
  {
    description: '从触发器或前置动作的变量中动态取设备。',
    disabled: builtinLeafOptions.value.length === 0,
    title: '内置参数',
    value: 'context',
  },
  {
    description: '根据设备关系动态匹配目标设备。',
    disabled: relationOptions.value.length === 0,
    title: '按关系',
    value: 'relation',
  },
  {
    description: '通过产品标签动态匹配目标设备。',
    disabled: tagOptions.value.length === 0,
    title: '按标签',
    value: 'tag',
  },
]);

const actionTypeCards = [
  {
    description: '调用设备功能，并配置入参。',
    title: '功能调用',
    value: 'INVOKE_FUNCTION',
  },
  {
    description: '读取设备属性当前值。',
    title: '读取属性',
    value: 'READ_PROPERTY',
  },
  {
    description: '设置设备属性值，支持固定值与内置参数。',
    title: '设置属性',
    value: 'WRITE_PROPERTY',
  },
];

const functionOptions = computed(() =>
  metadata.value.functions.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const readablePropertyOptions = computed(() =>
  metadata.value.properties
    .filter((item: any) => supportsPropertyAction(item, 'read'))
    .map((item) => ({ label: item.name, value: item.id })),
);

const writableProperties = computed(() =>
  metadata.value.properties.filter((item: any) =>
    supportsPropertyAction(item, 'write'),
  ),
);

const selectedFunction = computed(() =>
  metadata.value.functions.find((item) => item.id === form.functionId),
);

const selectedWritePropertyId = computed(
  () => Object.keys(form.properties || {})[0] || '',
);
const selectedWriteProperty = computed(() =>
  writableProperties.value.find(
    (item) => item.id === selectedWritePropertyId.value,
  ),
);

const builtinLeafOptions = computed(() => {
  const result: any[] = [];
  const walk = (nodes: any[] = []) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        walk(node.children);
      } else {
        result.push(node);
      }
    });
  };
  walk(builtinTree.value);
  return result;
});

const functionRows = computed(() =>
  (selectedFunction.value?.inputs || []).map((input: any) => ({
    id: input.id,
    name: input.name || input.id,
    required: !!input?.expands?.required,
    valueType: normalizeValueType(input.valueType),
    valueWrapper: form.inputs.find((item) => item.name === input.id)?.value || {
      source: 'fixed',
      value: undefined,
    },
  })),
);

const selectorValuesForTag = computed(() =>
  form.selectorValues.map((item) => String(item.value || '')),
);

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    resetForm();
    await Promise.all([loadProducts(), loadBuiltinTree()]);
    await restoreAction();
  },
);

watch(
  () => form.functionId,
  () => {
    if (form.messageType !== 'INVOKE_FUNCTION') return;
    const inputs = selectedFunction.value?.inputs || [];
    form.inputs = inputs.map((item: any) => {
      const existed = form.inputs.find((input) => input.name === item.id);
      return {
        name: item.id,
        value: existed?.value || { source: 'fixed', value: undefined },
      };
    });
  },
);

function resetForm() {
  current.value = 0;
  metadata.value = parseProductMetadata();
  products.value = [];
  devices.value = [];
  relationOptions.value = [];
  tagOptions.value = [];
  builtinTree.value = [];
  productSearchTerms.value = [];
  deviceSearchTerms.value = [];
  productPagination.current = 1;
  devicePagination.current = 1;
  Object.assign(form, {
    functionId: '',
    inputs: [],
    messageType: 'INVOKE_FUNCTION',
    productId: '',
    productName: '',
    properties: {},
    relationKey: '',
    selector: 'all',
    selectorValues: [],
    upperKey: '',
  });
}

async function restoreAction() {
  const device = props.action?.device as any;
  const messageConfig = device?.message || {};
  Object.assign(form, {
    functionId: messageConfig.functionId || '',
    inputs: normalizeInputs(messageConfig.inputs || messageConfig.params || []),
    messageType: messageConfig.messageType || 'INVOKE_FUNCTION',
    productId: device?.productId || '',
    productName: props.action?.options?.productName || '',
    properties: normalizePropertyPayload(messageConfig.properties),
    relationKey: device?.relation?.related?.relation || '',
    selector: device?.selector || 'all',
    selectorValues: Array.isArray(device?.selectorValues)
      ? device.selectorValues
      : [],
    upperKey: device?.upperKey || '',
  });

  if (form.productId) {
    await loadProductContext(form.productId);
  }
}

function normalizeInputs(list: any[]) {
  return (list || []).map((item: any) => ({
    name: item.name,
    value:
      item.value && typeof item.value === 'object' && 'source' in item.value
        ? item.value
        : { source: 'fixed', value: item.value },
  }));
}

function normalizePropertyPayload(properties: any) {
  if (!properties) return {};
  if (Array.isArray(properties))
    return properties[0] ? { [properties[0]]: undefined } : {};
  const propertyId = Object.keys(properties)[0];
  if (!propertyId) return {};
  const value = properties[propertyId];
  return {
    [propertyId]:
      value && typeof value === 'object' && 'source' in value
        ? value
        : { source: 'fixed', value },
  };
}

function normalizeValueType(valueType: any) {
  return {
    ...valueType,
    type: String(valueType?.type || 'STRING').toUpperCase(),
  };
}

function supportsPropertyAction(item: any, action: 'read' | 'write') {
  const type = item?.expands?.type;
  return Array.isArray(type) ? type.includes(action) : true;
}

async function loadProducts() {
  const result = await getProductDetailsPage({
    pageIndex: productPagination.current - 1,
    pageSize: productPagination.pageSize,
    terms: productSearchTerms.value as any,
  });
  products.value = result.data || [];
  productPagination.total = result.total || 0;
}

async function loadDevices() {
  if (!form.productId) return;
  const result = await getDeviceDetailsPage({
    pageIndex: devicePagination.current - 1,
    pageSize: devicePagination.pageSize,
    terms: [
      { column: 'productId', termType: 'eq', value: form.productId },
      ...deviceSearchTerms.value,
    ] as any,
  });
  devices.value = result.data || [];
  devicePagination.total = result.total || 0;
}

async function loadBuiltinTree() {
  if (!props.scene) {
    builtinTree.value = [];
    return;
  }
  const variables = await parseSceneVariables(props.scene, {
    action: props.actionIndex ?? 0,
    branch: props.branchIndex,
    branchGroup: props.groupIndex,
  });
  builtinTree.value = buildBuiltinTree(variables || []);
}

function buildBuiltinTree(list: any[]) {
  return list.map((item) => ({
    children: buildBuiltinTree(item.children || []),
    description: item.description,
    disabled: !!item.children?.length,
    key: item.id,
    title: item.fullName || item.name,
    value: item.id,
  }));
}

async function loadProductContext(productId: string) {
  const product = await getProductDetail(productId);
  form.productName = product.productName || product.name || productId;
  metadata.value = parseProductMetadata(product.tsl);
  tagOptions.value = parseTagOptions(product.metadata);
  relationOptions.value = await loadRelationOptions();
  await loadDevices();
}

function parseTagOptions(metadataText?: string) {
  try {
    const metadata = JSON.parse(metadataText || '{}');
    const tags = Array.isArray(metadata?.tags) ? metadata.tags : [];
    return tags.map((item: any) => ({
      label: item.name || item.id || item.value,
      value: item.id || item.value || item.name,
    }));
  } catch {
    return [];
  }
}

async function loadRelationOptions() {
  try {
    const relations = await getRelationTypesByObject('device');
    return (relations || []).map((item) => ({
      label: item.name || item.id,
      value: item.id,
    }));
  } catch {
    return [];
  }
}

async function handleProductChange(productId: string) {
  form.productId = productId;
  form.selector = 'all';
  form.selectorValues = [];
  form.upperKey = '';
  form.relationKey = '';
  form.functionId = '';
  form.inputs = [];
  form.properties = {};
  devicePagination.current = 1;
  deviceSearchTerms.value = [];
  await loadProductContext(productId);
}

function handleProductSearch(terms: Term[]) {
  productPagination.current = 1;
  productSearchTerms.value = terms || [];
  loadProducts();
}

function handleProductReset(terms: Term[]) {
  handleProductSearch(terms);
}

function handleDeviceSearch(terms: Term[]) {
  devicePagination.current = 1;
  deviceSearchTerms.value = terms || [];
  loadDevices();
}

function handleDeviceReset(terms: Term[]) {
  handleDeviceSearch(terms);
}

function toggleDevice(device: any) {
  const exists = form.selectorValues.some((item) => item.value === device.id);
  form.selectorValues = exists
    ? form.selectorValues.filter((item) => item.value !== device.id)
    : [
        ...form.selectorValues,
        {
          name: device.deviceName || device.name || device.id,
          value: device.id,
        },
      ];
}

function handleSelectorChange(value: string) {
  form.selector = value;
  form.selectorValues = [];
  form.upperKey = '';
  form.relationKey = '';
}

function handleTagChange(values: string[]) {
  form.selectorValues = values.map((value) => ({
    name: tagOptions.value.find((item) => item.value === value)?.label || value,
    value,
  }));
}

function selectMessageType(type: string) {
  form.messageType = type;
  form.functionId = '';
  form.inputs = [];
  form.properties = {};
}

function updateInputValue(name: string, value: any) {
  const currentValue = form.inputs.find((item) => item.name === name);
  if (currentValue) {
    currentValue.value = value;
  } else {
    form.inputs.push({ name, value });
  }
}

function updateWriteProperty(propertyId: string) {
  form.properties = {
    [propertyId]: form.properties[propertyId] || {
      source: 'fixed',
      value: undefined,
    },
  };
}

function updateWritePropertyValue(value: any) {
  if (!selectedWritePropertyId.value) return;
  form.properties = {
    [selectedWritePropertyId.value]: value,
  };
}

function hasValue(value: any) {
  if (!value) return false;
  if (value.source === 'upper') return !!value.upperKey;
  if (value.source === 'relation') return !!value.relation || !!value.value;
  return (
    value.value !== undefined && value.value !== null && value.value !== ''
  );
}

function validateSelectorStep() {
  if (form.selector === 'fixed' && form.selectorValues.length === 0) {
    message.warning('请选择设备');
    return false;
  }
  if (form.selector === 'context' && !form.upperKey) {
    message.warning('请选择内置参数');
    return false;
  }
  if (form.selector === 'relation' && !form.relationKey) {
    message.warning('请选择关系');
    return false;
  }
  if (form.selector === 'tag' && form.selectorValues.length === 0) {
    message.warning('请选择标签');
    return false;
  }
  return true;
}

function handleNext() {
  if (current.value === 0 && !form.productId) {
    message.warning('请选择产品');
    return;
  }
  if (current.value === 1 && !validateSelectorStep()) {
    return;
  }
  current.value += 1;
}

function validateActionStep() {
  if (form.messageType === 'INVOKE_FUNCTION') {
    if (!form.functionId) {
      message.warning('请选择功能');
      return false;
    }
    for (const row of functionRows.value) {
      const value = form.inputs.find((item) => item.name === row.id)?.value;
      if (row.required && !hasValue(value)) {
        message.warning(`请完成参数“${row.name}”的配置`);
        return false;
      }
    }
    return true;
  }

  if (form.messageType === 'READ_PROPERTY') {
    if (Object.keys(form.properties || {}).length === 0) {
      message.warning('请选择属性');
      return false;
    }
    return true;
  }

  if (!selectedWritePropertyId.value) {
    message.warning('请选择属性');
    return false;
  }
  if (!hasValue(form.properties[selectedWritePropertyId.value])) {
    message.warning('请设置属性值');
    return false;
  }
  return true;
}

function createMessagePayload() {
  if (form.messageType === 'READ_PROPERTY') {
    return {
      messageType: 'READ_PROPERTY',
      properties: Object.keys(form.properties || {}),
    };
  }
  if (form.messageType === 'WRITE_PROPERTY') {
    return {
      messageType: 'WRITE_PROPERTY',
      properties: form.properties,
    };
  }
  return {
    functionId: form.functionId,
    inputs: normalizeInputs(form.inputs),
    messageType: 'INVOKE_FUNCTION',
  };
}

function createActionSummary() {
  if (form.messageType === 'READ_PROPERTY') {
    const propertyId = Object.keys(form.properties || {})[0];
    const property = readablePropertyOptions.value.find(
      (item) => item.value === propertyId,
    );
    return `读取 ${property?.label || '属性'}`;
  }
  if (form.messageType === 'WRITE_PROPERTY') {
    return `设置 ${selectedWriteProperty.value?.name || '属性'}`;
  }
  return `调用 ${selectedFunction.value?.name || '功能'}`;
}

function createSelectorSummary() {
  if (form.selector === 'fixed') {
    return form.selectorValues
      .map((item) => item.name || item.value)
      .join(' / ');
  }
  if (form.selector === 'context') {
    return (
      builtinLeafOptions.value.find((item) => item.value === form.upperKey)
        ?.title || '内置参数'
    );
  }
  if (form.selector === 'relation') {
    return (
      relationOptions.value.find((item) => item.value === form.relationKey)
        ?.label || '按关系'
    );
  }
  if (form.selector === 'tag') {
    return form.selectorValues
      .map((item) => item.name || item.value)
      .join(' / ');
  }
  return '全部设备';
}

function createOtherColumns() {
  const otherColumns = (form.inputs || [])
    .map((item) => item.value?.upperKey)
    .filter(Boolean);
  const propertyValue = form.properties[selectedWritePropertyId.value];
  if (propertyValue?.upperKey) {
    otherColumns.push(propertyValue.upperKey);
  }
  if (form.upperKey) {
    otherColumns.push(form.upperKey);
  }
  return [...new Set(otherColumns)];
}

function createColumnMap() {
  const columnMap: Record<string, string> = {};
  (form.inputs || []).forEach((item) => {
    if (item.value?.source === 'upper' && item.value?.upperKey) {
      columnMap[item.name] = item.value.upperKey;
    }
  });
  const propertyValue = form.properties[selectedWritePropertyId.value];
  if (
    selectedWritePropertyId.value &&
    propertyValue?.source === 'upper' &&
    propertyValue?.upperKey
  ) {
    columnMap[selectedWritePropertyId.value] = propertyValue.upperKey;
  }
  return columnMap;
}

function handleOk() {
  if (!validateActionStep()) return;
  const selectorSummary = createSelectorSummary();
  emit('save', {
    actionId: props.action?.actionId || props.actionId,
    device: {
      message: createMessagePayload(),
      productId: form.productId,
      relation:
        form.selector === 'relation'
          ? {
              related: {
                objectType: 'device',
                relation: form.relationKey,
              },
            }
          : undefined,
      selector: form.selector,
      selectorValues: ['fixed', 'tag'].includes(form.selector)
        ? form.selectorValues
        : [],
      source:
        form.selector === 'context'
          ? 'upper'
          : (form.selector === 'relation'
            ? 'relation'
            : 'fixed'),
      upperKey: form.selector === 'context' ? form.upperKey : undefined,
    } as any,
    executor: 'device',
    options: {
      columnMap: createColumnMap(),
      name: '设备输出',
      otherColumns: createOtherColumns(),
      productName: form.productName,
      propertiesValue:
        form.messageType === 'WRITE_PROPERTY'
          ? form.properties[selectedWritePropertyId.value]
          : undefined,
      selector: form.selector,
      summary: `${selectorSummary} / ${createActionSummary()}`,
      targetName: selectorSummary,
      type: form.messageType,
    },
    terms: props.action?.terms || [],
  });
  emit('update:open', false);
}

const functionColumns = [
  { dataIndex: 'name', title: '参数名称', width: 180 },
  { dataIndex: 'valueType', title: '类型', width: 120 },
  { dataIndex: 'value', title: '值' },
];
</script>

<template>
  <Modal
    :body-style="{
      height: '60vh',
      overflow: 'hidden',
      padding: '18px 24px 8px',
    }"
    :mask-closable="false"
    :open="open"
    title="设备输出"
    width="980px"
    @cancel="emit('update:open', false)"
  >
    <Steps
      :current="current"
      class="action-steps"
      :items="[
        { title: '选择产品' },
        { title: '选择设备' },
        { title: '执行动作' },
      ]"
    />

    <div v-if="current === 0" class="step-panel">
      <ProductSearchForm
        class="search-form"
        @reset="handleProductReset"
        @search="handleProductSearch"
      />
      <div class="selector-list">
        <div class="card-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="select-card"
            :class="{ active: form.productId === product.id }"
            @click="handleProductChange(product.id)"
          >
            <div class="card-cube">P</div>
            <div class="min-w-0">
              <div class="card-title">
                {{ product.productName || product.name || product.id }}
              </div>
              <div class="card-desc">
                设备类型：{{
                  product.deviceType?.text || product.deviceType?.value || '-'
                }}
              </div>
              <div class="card-desc">
                接入方式：{{ product.transport || product.channel || '-' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-pager">
        <Pagination
          :current="productPagination.current"
          :page-size="productPagination.pageSize"
          :total="productPagination.total"
          @change="
            (page, pageSize) => {
              productPagination.current = page;
              productPagination.pageSize = pageSize;
              loadProducts();
            }
          "
        />
      </div>
    </div>

    <div v-else-if="current === 1" class="step-panel">
      <div class="selector-type-grid">
        <div
          v-for="item in selectorCards"
          :key="item.value"
          class="selector-type-card"
          :class="{
            active: form.selector === item.value,
            disabled: item.disabled,
          }"
          @click="!item.disabled && handleSelectorChange(item.value)"
        >
          <div class="selector-type-title">{{ item.title }}</div>
          <div class="selector-type-desc">{{ item.description }}</div>
        </div>
      </div>

      <div v-if="form.selector === 'fixed'" class="selector-body">
        <DeviceSearchForm
          class="search-form"
          @reset="handleDeviceReset"
          @search="handleDeviceSearch"
        />
        <div class="selector-list">
          <div class="card-grid">
            <div
              v-for="device in devices"
              :key="device.id"
              class="select-card"
              :class="{
                active: form.selectorValues.some(
                  (item) => item.value === device.id,
                ),
              }"
              @click="toggleDevice(device)"
            >
              <div class="card-cube">D</div>
              <div class="min-w-0">
                <div class="card-title">
                  {{ device.deviceName || device.name || device.id }}
                </div>
                <div class="card-desc">
                  产品名称：{{ device.productName || form.productName || '-' }}
                </div>
                <div class="card-desc">
                  设备类型：{{
                    device.deviceType?.text || device.deviceType?.value || '-'
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-pager">
          <Pagination
            :current="devicePagination.current"
            :page-size="devicePagination.pageSize"
            :total="devicePagination.total"
            @change="
              (page, pageSize) => {
                devicePagination.current = page;
                devicePagination.pageSize = pageSize;
                loadDevices();
              }
            "
          />
        </div>
      </div>

      <div v-else-if="form.selector === 'context'" class="selector-form">
        <TreeSelect
          v-model:value="form.upperKey"
          :field-names="{
            label: 'title',
            value: 'value',
            children: 'children',
          }"
          :tree-data="builtinTree"
          placeholder="请选择内置参数"
          style="width: 100%"
          tree-default-expand-all
        />
      </div>

      <div v-else-if="form.selector === 'relation'" class="selector-form">
        <Select
          v-model:value="form.relationKey"
          :options="relationOptions"
          placeholder="请选择关系"
          style="width: 100%"
        />
      </div>

      <div v-else-if="form.selector === 'tag'" class="selector-form">
        <Select
          :options="tagOptions"
          :value="selectorValuesForTag"
          mode="multiple"
          placeholder="请选择标签"
          style="width: 100%"
          @update:value="handleTagChange"
        />
      </div>
    </div>

    <div v-else class="step-panel">
      <div class="selector-type-grid action-type-grid">
        <div
          v-for="item in actionTypeCards"
          :key="item.value"
          class="selector-type-card"
          :class="{ active: form.messageType === item.value }"
          @click="selectMessageType(item.value)"
        >
          <div class="selector-type-title">{{ item.title }}</div>
          <div class="selector-type-desc">{{ item.description }}</div>
        </div>
      </div>

      <Form layout="vertical">
        <Form.Item
          v-if="form.messageType === 'INVOKE_FUNCTION'"
          label="功能调用"
          required
        >
          <Select
            v-model:value="form.functionId"
            :options="functionOptions"
            placeholder="请选择功能"
          />
        </Form.Item>

        <Table
          v-if="form.messageType === 'INVOKE_FUNCTION' && selectedFunction"
          :columns="functionColumns"
          :data-source="functionRows"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'valueType'">
              {{ record.valueType?.type || '-' }}
            </template>
            <template v-else-if="column.dataIndex === 'value'">
              <DeviceMessageValueInput
                :builtin-tree="builtinTree"
                :model-value="record.valueWrapper"
                :name="record.name"
                :required="record.required"
                :type="record.valueType"
                @update:model-value="updateInputValue(record.id, $event)"
              />
            </template>
          </template>
        </Table>

        <Form.Item
          v-if="form.messageType === 'READ_PROPERTY'"
          label="读取属性"
          required
        >
          <Select
            :options="readablePropertyOptions"
            :value="Object.keys(form.properties || {})[0]"
            placeholder="请选择属性"
            @update:value="
              form.properties = $event ? { [$event]: undefined } : {}
            "
          />
        </Form.Item>

        <template v-if="form.messageType === 'WRITE_PROPERTY'">
          <Form.Item label="设置属性" required>
            <Select
              :options="
                writableProperties.map((item: any) => ({
                  label: item.name,
                  value: item.id,
                }))
              "
              :value="selectedWritePropertyId"
              placeholder="请选择属性"
              @update:value="updateWriteProperty"
            />
          </Form.Item>
          <Form.Item v-if="selectedWriteProperty" label="属性值" required>
            <DeviceMessageValueInput
              :builtin-tree="builtinTree"
              :model-value="form.properties[selectedWritePropertyId]"
              :name="selectedWriteProperty.name"
              required
              :type="normalizeValueType(selectedWriteProperty.valueType)"
              @update:model-value="updateWritePropertyValue"
            />
          </Form.Item>
        </template>
      </Form>

      <Empty
        v-if="form.messageType === 'INVOKE_FUNCTION' && !selectedFunction"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        description="请选择一个功能后再配置参数"
      />
    </div>

    <template #footer>
      <Button @click="emit('update:open', false)">取消</Button>
      <Button v-if="current > 0" @click="current -= 1">上一步</Button>
      <Button v-if="current < 2" type="primary" @click="handleNext">
        下一步
      </Button>
      <Button v-else type="primary" @click="handleOk">确定</Button>
    </template>
  </Modal>
</template>

<style scoped>
.action-steps {
  margin-bottom: 20px;
}

.step-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(60vh - 64px);
}

.selector-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.search-form {
  flex: 0 0 auto;
}

.card-grid,
.selector-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.card-grid {
  padding: 2px;
}

.select-card,
.selector-type-card {
  min-height: 96px;
  padding: 14px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.select-card {
  display: flex;
  gap: 12px;
}

.select-card:hover,
.selector-type-card:hover {
  border-color: #91caff;
}

.select-card.active,
.selector-type-card.active {
  background: #f6fbff;
  border-color: #1677ff;
}

.selector-type-card.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.card-cube {
  display: flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-weight: 700;
  color: #1677ff;
  background: #f0f7ff;
  border-radius: 10px;
}

.card-title,
.selector-type-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  white-space: nowrap;
}

.card-desc,
.selector-type-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #8c8c8c;
}

.selector-form {
  display: flex;
  align-items: flex-start;
  min-height: 0;
  padding-top: 8px;
}

.card-pager {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-top: 4px;
}

.action-type-grid {
  margin-bottom: 8px;
}

@media (max-width: 1400px) {
  .card-grid,
  .selector-type-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .card-grid,
  .selector-type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
