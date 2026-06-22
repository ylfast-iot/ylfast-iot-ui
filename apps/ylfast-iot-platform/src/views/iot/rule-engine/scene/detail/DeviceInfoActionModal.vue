<script setup lang="ts">
import type { Term } from '#/adapter';
import type { SceneAction, SceneRuleModel } from '#/api/iot/rule-engine/types';
import type { SystemRelationApi } from '#/api/system/relation';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, h, reactive, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Steps,
  Tooltip,
  TreeSelect,
} from 'ant-design-vue';

import {
  getDeviceDetail,
  getDeviceDetailsPage,
} from '#/api/iot/device/instance';
import {
  getProductDetail,
  getProductDetailsPage,
} from '#/api/iot/device/product';
import { parseSceneVariables } from '#/api/iot/rule-engine/scene-utils';
import { SystemRelationApi as RelationApi } from '#/api/system/relation';
import { getFormItemComponent } from '#/components/yl-data-type-strategies/value-input';
import { useYlDcForm } from '#/components/yl-dc-form';

import { parseProductMetadata } from './utils';

type SelectorMode = 'context' | 'fixed' | 'relation' | 'tag';

interface SelectorCardItem {
  description: string;
  disabled?: boolean;
  icon: any;
  title: string;
  value: SelectorMode;
}

interface TagTermRow {
  column?: string;
  description?: string;
  key: number;
  name?: string;
  type: 'and' | 'or';
  value: any;
  valueType?: any;
}

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
const DiamondIcon = createIconifyIcon('lucide:diamond');
const BoxesIcon = createIconifyIcon('lucide:boxes');
const Share2Icon = createIconifyIcon('lucide:share-2');
const TagsIcon = createIconifyIcon('lucide:tags');

const current = ref(0);
const products = ref<any[]>([]);
const devices = ref<any[]>([]);
const builtinTree = ref<any[]>([]);
const relations = ref<SystemRelationApi.RelationEntity[]>([]);
const metadata = ref(parseProductMetadata());
const productTags = ref<any[]>([]);
const productSearchTerms = ref<Term[]>([]);
const deviceSearchTerms = ref<Term[]>([]);

const productPagination = reactive({ current: 1, pageSize: 12, total: 0 });
const devicePagination = reactive({ current: 1, pageSize: 12, total: 0 });

const form = reactive({
  configs: [
    'state',
    'onlineTime',
    'offlineTime',
    'deviceName',
    'productName',
  ] as string[],
  productId: '',
  productName: '',
  relation: '',
  selector: 'fixed' as SelectorMode,
  selectorValues: [] as string[],
  tagTerms: [createEmptyTagTerm()] as TagTermRow[],
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
    breakpoints: { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 },
    cols: 3,
  },
  showMoreButton: false,
});

const [DeviceSearchForm] = useYlDcForm({
  formSchemas: deviceSearchSchemas,
  layoutOption: {
    breakpoints: { xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 },
    cols: 3,
  },
  showMoreButton: false,
});

const builtinNodeMap = computed(() => {
  const map = new Map<string, any>();
  const walk = (list: any[] = []) => {
    for (const item of list) {
      map.set(item.value, item);
      walk(item.children || []);
    }
  };
  walk(builtinTree.value);
  return map;
});

const relationOptions = computed(() =>
  relations.value.map((item) => ({
    label: item.name,
    value: item.relation,
  })),
);

const availableSelectorCards = computed<SelectorCardItem[]>(() => {
  const triggerType = props.scene?.trigger?.type;
  const cards: SelectorCardItem[] = [
    {
      description: '手动选择一个或多个具体设备。',
      icon: DiamondIcon,
      title: '固定设备',
      value: 'fixed',
    },
  ];

  if (triggerType === 'device') {
    cards.push(
      {
        description: '使用场景上下文中的设备变量作为目标设备。',
        disabled: builtinTree.value.length === 0,
        icon: BoxesIcon,
        title: '按变量',
        value: 'context',
      },
      {
        description: '选择与触发设备存在指定关系的设备。',
        disabled: relations.value.length === 0,
        icon: Share2Icon,
        title: '按关系',
        value: 'relation',
      },
      {
        description: '通过产品标签条件动态匹配设备。',
        disabled: productTags.value.length === 0,
        icon: TagsIcon,
        title: '按标签',
        value: 'tag',
      },
    );
    return cards;
  }

  if ((props.actionIndex ?? 0) === 0) {
    cards.push({
      description: '通过产品标签条件动态匹配设备。',
      disabled: productTags.value.length === 0,
      icon: TagsIcon,
      title: '按标签',
      value: 'tag',
    });
    return cards;
  }

  cards.push(
    {
      description: '使用上一个动作输出的设备变量作为目标设备。',
      disabled: builtinTree.value.length === 0,
      icon: BoxesIcon,
      title: '按变量',
      value: 'context',
    },
    {
      description: '通过产品标签条件动态匹配设备。',
      disabled: productTags.value.length === 0,
      icon: TagsIcon,
      title: '按标签',
      value: 'tag',
    },
  );
  return cards;
});

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    resetForm();
    productPagination.current = 1;
    devicePagination.current = 1;
    productSearchTerms.value = [];
    deviceSearchTerms.value = [];
    await Promise.all([loadProducts(), loadBuiltinTree(), loadRelations()]);
    await restoreAction();
  },
);

watch(
  availableSelectorCards,
  (cards) => {
    const currentCard = cards.find(
      (item) => item.value === form.selector && !item.disabled,
    );
    if (currentCard) return;
    form.selector = cards.find((item) => !item.disabled)?.value || 'fixed';
  },
  { deep: true, immediate: true },
);

function createEmptyTagTerm(type: 'and' | 'or' = 'and'): TagTermRow {
  return {
    key: Date.now() + Math.round(Math.random() * 1000),
    type,
    value: undefined,
  };
}

function resetForm() {
  current.value = 0;
  metadata.value = parseProductMetadata();
  productTags.value = [];
  Object.assign(form, {
    configs: [
      'state',
      'onlineTime',
      'offlineTime',
      'deviceName',
      'productName',
    ],
    productId: '',
    productName: '',
    relation: '',
    selector: 'fixed',
    selectorValues: [],
    tagTerms: [createEmptyTagTerm()],
    upperKey: '',
  });
}

async function restoreAction() {
  const config: any = props.action?.configuration || {};
  const selector: any = config.selector || {};
  Object.assign(form, {
    configs: config.configs || [
      'state',
      'onlineTime',
      'offlineTime',
      'deviceName',
      'productName',
    ],
    productId: config.productId || '',
    productName: props.action?.options?.productName || '',
    relation: selector.selectorValues?.[0]?.value?.relation || '',
    selector: normalizeSelectorMode(selector.selector),
    selectorValues:
      selector.selectorValues
        ?.filter((item: any) => typeof item?.value === 'string')
        .map((item: any) => item.value) || [],
    tagTerms: normalizeTagTerms(selector.selectorValues?.[0]?.value),
    upperKey: selector.upperKey || '',
  });

  if (form.productId) {
    await loadProductContext(form.productId);
  }
}

function normalizeSelectorMode(value?: string): SelectorMode {
  if (value === 'context' || value === 'relation' || value === 'tag')
    return value;
  return 'fixed';
}

function normalizeTagTerms(value: any) {
  const list = Array.isArray(value) ? value : [];
  if (list.length === 0) return [createEmptyTagTerm()];
  return list.map((item: any, index: number) => {
    const definition = productTags.value.find((tag) => tag.id === item.column);
    return {
      column: item.column,
      description: definition?.description,
      key: Date.now() + index,
      name: definition?.name || item.column,
      type: index === 0 ? 'and' : item.type || 'and',
      value: item.value,
      valueType: definition?.valueType,
    } satisfies TagTermRow;
  });
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

async function loadProductContext(productId: string) {
  const product = await getProductDetail(productId);
  form.productName = product.productName || product.name || productId;
  metadata.value = parseProductMetadata(product.tsl);
  productTags.value = parseProductTags(product);
  form.tagTerms = normalizeTagTerms(
    props.action?.configuration?.selector?.selectorValues?.[0]?.value,
  );
  await loadDevices();
}

async function loadBuiltinTree() {
  if (!props.scene) {
    builtinTree.value = [];
    return;
  }
  const result = await parseSceneVariables(props.scene, {
    action: props.actionIndex ?? 0,
    branch: props.branchIndex,
    branchGroup: props.groupIndex,
  });
  builtinTree.value = buildVariableTree(result || []);
}

async function loadRelations() {
  relations.value = await queryRelations([
    { column: 'objectType', termType: 'eq', value: 'device' },
  ]);
  if (relations.value.length > 0) return;
  relations.value = await queryRelations([
    { column: 'objectTypeName', termType: 'eq', value: '设备' },
  ]);
}

async function queryRelations(terms: Array<Record<string, any>>) {
  try {
    const result = await RelationApi.basicCrudApis.postQuery({
      pageIndex: 0,
      pageSize: 200,
      sorts: [{ name: 'createTime', order: 'desc' }],
      terms,
    } as any);
    return result.data || [];
  } catch {
    return [];
  }
}

function buildVariableTree(list: any[]) {
  return list.map((item) => {
    const children = buildVariableTree(item.children || []);
    const fullTitle = item.fullName || item.name || item.id;
    const title = item.name || getLeafName(fullTitle);
    const description =
      item.description || (fullTitle === title ? '' : fullTitle);
    return {
      children,
      column: item.column || item.id,
      description,
      disabled: children.length > 0,
      fullTitle,
      key: item.id,
      selectedLabel: title,
      title,
      value: item.id,
      variableType: item.type || item?.options?.valueType?.type,
    };
  });
}

function getLeafName(value?: string) {
  const text = String(value || '');
  const normalized = text.replace(/^.*\[/, '').replace(/\].*$/, '');
  const segments = normalized.split('.').filter(Boolean);
  return segments[segments.length - 1] || normalized || text;
}

function parseProductTags(product: any) {
  const sources = [product?.metadata, product?.tsl];
  for (const raw of sources) {
    if (!raw) continue;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
      if (tags.length > 0) {
        return tags.map((item: any) => ({
          description: item.description || item.name,
          id: item.id || item.property || item.name,
          name: item.name || item.id || item.property,
          valueType: item.valueType || item.type || { type: 'STRING' },
        }));
      }
    } catch {
      continue;
    }
  }
  return [];
}

function handleProductSearch(terms: Term[]) {
  productPagination.current = 1;
  productSearchTerms.value = terms || [];
  loadProducts();
}

function handleProductReset(terms: Term[]) {
  productPagination.current = 1;
  productSearchTerms.value = terms || [];
  loadProducts();
}

function handleDeviceSearch(terms: Term[]) {
  devicePagination.current = 1;
  deviceSearchTerms.value = terms || [];
  loadDevices();
}

function handleDeviceReset(terms: Term[]) {
  devicePagination.current = 1;
  deviceSearchTerms.value = terms || [];
  loadDevices();
}

async function handleProductChange(productId: string) {
  form.productId = productId;
  form.productName = '';
  form.relation = '';
  form.selectorValues = [];
  form.tagTerms = [createEmptyTagTerm()];
  form.upperKey = '';
  devicePagination.current = 1;
  deviceSearchTerms.value = [];
  await loadProductContext(productId);
}

function changeSelector(next: SelectorMode) {
  const target = availableSelectorCards.value.find(
    (item) => item.value === next,
  );
  if (!target || target.disabled) return;
  form.selector = next;
}

function toggleDevice(device: any) {
  form.selectorValues = form.selectorValues.includes(device.id)
    ? form.selectorValues.filter((id) => id !== device.id)
    : [...form.selectorValues, device.id];
}

function handleNext() {
  if (!form.productId) {
    message.warning('请选择产品');
    return;
  }
  current.value = 1;
}

function validateSelector() {
  if (form.selector === 'fixed' && form.selectorValues.length === 0) {
    message.warning('请选择设备');
    return false;
  }
  if (form.selector === 'context' && !form.upperKey) {
    message.warning('请选择变量');
    return false;
  }
  if (form.selector === 'relation' && !form.relation) {
    message.warning('请选择关系');
    return false;
  }
  if (form.selector === 'tag') {
    const invalid = form.tagTerms.some(
      (item) => !item.column || !hasValue(item.value),
    );
    if (invalid) {
      message.warning('请完整配置标签条件');
      return false;
    }
  }
  return true;
}

function hasValue(value: any) {
  if (value === 0 || value === false) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object' && 'value' in value) {
    return hasValue(value.value);
  }
  return value !== undefined && value !== null && value !== '';
}

async function handleOk() {
  if (!validateSelector()) return;
  const selectedDevices = devices.value.filter((item) =>
    form.selectorValues.includes(item.id),
  );
  const deviceNames = selectedDevices.map(
    (item) => item.deviceName || item.name || item.id,
  );
  const targetName = getTargetName();
  const metadataConfig = await buildMetadataConfiguration(selectedDevices);

  emit('save', {
    actionId: props.action?.actionId || props.actionId,
    configuration: {
      ...metadataConfig,
      configs: [
        'state',
        'onlineTime',
        'offlineTime',
        'deviceName',
        'productName',
      ],
      productId: form.productId,
      selector: buildSelectorPayload(selectedDevices),
    },
    executor: 'device-data',
    options: {
      deviceNames,
      name: '设备信息',
      productName: form.productName,
      selectorName: getSelectorLabel(),
      summary: `获取 ${targetName} 的设备信息`,
      targetName,
    },
    terms: props.action?.terms || [],
  });
  emit('update:open', false);
}

function buildSelectorPayload(selectedDevices: any[]) {
  if (form.selector === 'context') {
    return {
      selector: 'context',
      source: 'upper',
      upperKey: form.upperKey,
    };
  }

  if (form.selector === 'relation') {
    const relation = relations.value.find(
      (item) => item.relation === form.relation,
    );
    return {
      selector: 'relation',
      selectorValues: relation
        ? [
            {
              name: relation.name,
              value: {
                objectType: relation.targetType || 'device',
                relation: relation.relation,
              },
            },
          ]
        : [],
      source: 'upper',
      upperKey: 'scene.deviceId',
    };
  }

  if (form.selector === 'tag') {
    return {
      selector: 'tag',
      selectorValues: [
        {
          name: getTagDisplayName(),
          value: form.tagTerms.map((item, index) => ({
            column: item.column,
            type: index === 0 ? 'and' : item.type,
            value: item.value,
          })),
        },
      ],
      source: 'fixed',
    };
  }

  return {
    selector: 'fixed',
    selectorValues: selectedDevices.map((item) => ({
      name: item.deviceName || item.name || item.id,
      value: item.id,
    })),
    source: 'fixed',
  };
}

function getSelectorLabel() {
  const card = availableSelectorCards.value.find(
    (item) => item.value === form.selector,
  );
  return card?.title || '固定设备';
}

function getTargetName() {
  if (form.selector === 'context') {
    return builtinNodeMap.value.get(form.upperKey)?.fullTitle || '变量设备';
  }
  if (form.selector === 'relation') {
    return (
      relations.value.find((item) => item.relation === form.relation)?.name ||
      '关系设备'
    );
  }
  if (form.selector === 'tag') {
    return getTagDisplayName();
  }
  const selectedDevices = devices.value
    .filter((item) => form.selectorValues.includes(item.id))
    .map((item) => item.deviceName || item.name || item.id);
  return selectedDevices.length > 0
    ? selectedDevices.join(' / ')
    : form.productName || '设备';
}

function getTagDisplayName() {
  return form.tagTerms
    .map((item, index) => {
      const prefix = index === 0 ? '' : (item.type === 'or' ? ' 或 ' : ' 且 ');
      return `${prefix}${item.name || item.column}=${formatTagValue(item.value)}`;
    })
    .join('');
}

function formatTagValue(value: any) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object' && 'value' in value)
    return String(value.value ?? '');
  return String(value ?? '');
}

function getTreeNodeTitle(data: any) {
  return h('div', { class: 'selector-tree-title' }, [
    h('span', { class: 'selector-tree-name' }, data.title),
    data.description
      ? h('span', { class: 'selector-tree-desc' }, data.description)
      : null,
  ]);
}

function filterTreeNode(input: string, node: any) {
  const text = [
    node?.title,
    node?.description,
    node?.fullTitle,
    node?.column,
    node?.value,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(input.toLowerCase());
}

function getSelectedVariableText() {
  const node = builtinNodeMap.value.get(form.upperKey);
  return node ? `${node.title} ${node.description || ''}`.trim() : '';
}

function buildMetadataIds(metadataSource?: string) {
  const parsed = parseProductMetadata(metadataSource);
  return {
    events: parsed.events.map((item) => item.id),
    functions: parsed.functions.map((item) => item.id),
    properties: parsed.properties.map((item) => item.id),
    tags: productTags.value.map((item) => item.id),
  };
}

async function buildMetadataConfiguration(selectedDevices: any[]) {
  if (form.selector === 'fixed' && selectedDevices.length === 1) {
    const detail = await getDeviceDetail(selectedDevices[0].id);
    return buildMetadataIds(detail.tsl || detail.productTsl);
  }
  return buildMetadataIds(
    JSON.stringify({
      events: metadata.value.events,
      functions: metadata.value.functions,
      properties: metadata.value.properties,
      tags: productTags.value,
    }),
  );
}

function updateTagColumn(index: number, column?: string) {
  const definition = productTags.value.find((item) => item.id === column);
  form.tagTerms[index] = {
    ...form.tagTerms[index],
    column,
    description: definition?.description,
    name: definition?.name,
    value: undefined,
    valueType: definition?.valueType,
  };
}

function updateTagValue(index: number, value: any) {
  form.tagTerms[index] = {
    ...form.tagTerms[index],
    value,
  };
}

function addTagTerm() {
  form.tagTerms.push(createEmptyTagTerm('and'));
}

function removeTagTerm(index: number) {
  if (form.tagTerms.length <= 1) return;
  form.tagTerms.splice(index, 1);
}

function tagValueComponent(row: TagTermRow) {
  const type = normalizeValueType(row.valueType);
  return getFormItemComponent(type.type) || Input;
}

function normalizeValueType(valueType: any) {
  if (!valueType) return { type: 'STRING' };
  if (typeof valueType === 'string') return { type: valueType.toUpperCase() };
  const type = String(valueType.type || valueType.id || 'STRING').toUpperCase();
  const elements =
    valueType.elements || valueType.enums || valueType.expands?.elements || [];
  return {
    ...valueType,
    elements: Array.isArray(elements)
      ? elements.map((item: any) => ({
          label:
            item.text ||
            item.name ||
            item.label ||
            String(item.value ?? item.id ?? ''),
          value: item.value ?? item.id,
        }))
      : [],
    type,
  };
}

function createTagValueProp(row: TagTermRow) {
  return {
    description: row.description,
    name: row.name || '标签值',
    property: row.column || 'value',
    type: normalizeValueType(row.valueType),
    value: row.value,
  };
}

function getCardStatusText(item: any, type: 'device' | 'product') {
  const direct =
    item?.state?.text ||
    item?.state?.name ||
    item?.state?.value ||
    item?.status?.text ||
    item?.status?.name ||
    item?.status?.value;

  if (direct) {
    return String(direct);
  }

  if (type === 'device') {
    if (item?.online === true) return '在线';
    if (item?.online === false) return '离线';
  }

  return '';
}

function getCardStatusTone(statusText: string) {
  if (!statusText) return 'muted';
  if (/正常|在线|启用|success|enabled|active/i.test(statusText))
    return 'success';
  if (/离线|禁用|停用|异常|失败|offline|disabled|error/i.test(statusText))
    return 'danger';
  return 'muted';
}
</script>

<template>
  <Modal
    :open="open"
    title="设备信息"
    width="960px"
    :mask-closable="false"
    :body-style="{
      height: '60vh',
      overflow: 'hidden',
      padding: '18px 24px 8px',
    }"
    @cancel="emit('update:open', false)"
  >
    <Steps
      :current="current"
      class="modal-steps"
      :items="[{ title: '选择产品' }, { title: '选择设备' }]"
    />

    <div v-if="current === 0" class="modal-step selector-step">
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
            <div class="card-content min-w-0">
              <div class="card-slice"></div>
              <div class="card-head">
                <div class="card-title truncate">
                  {{ product.productName || product.name || product.id }}
                </div>
                <span
                  v-if="getCardStatusText(product, 'product')"
                  class="card-status"
                  :class="`is-${getCardStatusTone(getCardStatusText(product, 'product'))}`"
                >
                  {{ getCardStatusText(product, 'product') }}
                </span>
              </div>
              <div class="card-meta">
                <span>设备类型：{{
                    product.deviceType?.text || product.deviceType?.value || '-'
                  }}</span>
                <span>接入方式：{{
                    product.transport || product.channel || '-'
                  }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-pager">
        <Pagination
          :current="productPagination.current"
          :page-size="productPagination.pageSize"
          :show-size-changer="true"
          :total="productPagination.total"
          @change="
            (page, pageSize) => {
              productPagination.current = page;
              productPagination.pageSize = pageSize;
              loadProducts();
            }
          "
          @show-size-change="
            (page, pageSize) => {
              productPagination.current = page;
              productPagination.pageSize = pageSize;
              loadProducts();
            }
          "
        />
      </div>
    </div>

    <div v-else class="modal-step selector-step">
      <div class="selector-card-row">
        <div
          v-for="item in availableSelectorCards"
          :key="item.value"
          class="selector-mode-card"
          :class="{
            active: form.selector === item.value,
            disabled: item.disabled,
          }"
          @click="changeSelector(item.value)"
        >
          <div class="selector-mode-content">
            <div class="selector-mode-title">{{ item.title }}</div>
            <div class="selector-mode-desc">{{ item.description }}</div>
          </div>
          <div class="selector-mode-icon">
            <component :is="item.icon" class="size-4.5" />
          </div>
        </div>
      </div>

      <div class="selector-pane">
        <template v-if="form.selector === 'fixed'">
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
                :class="{ active: form.selectorValues.includes(device.id) }"
                @click="toggleDevice(device)"
              >
                <div class="card-cube">D</div>
                <div class="card-content min-w-0">
                  <div class="card-slice"></div>
                  <div class="card-head">
                    <div class="card-title truncate">
                      {{ device.deviceName || device.name || device.id }}
                    </div>
                    <span
                      v-if="getCardStatusText(device, 'device')"
                      class="card-status"
                      :class="`is-${getCardStatusTone(getCardStatusText(device, 'device'))}`"
                    >
                      {{ getCardStatusText(device, 'device') }}
                    </span>
                  </div>
                  <div class="card-meta">
                    <span>产品名称：{{
                        device.productName || form.productName || '-'
                      }}</span>
                    <span>设备类型：{{
                        device.deviceType?.text ||
                        device.deviceType?.value ||
                        '-'
                      }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-pager">
            <Pagination
              :current="devicePagination.current"
              :page-size="devicePagination.pageSize"
              :show-size-changer="true"
              :total="devicePagination.total"
              @change="
                (page, pageSize) => {
                  devicePagination.current = page;
                  devicePagination.pageSize = pageSize;
                  loadDevices();
                }
              "
              @show-size-change="
                (page, pageSize) => {
                  devicePagination.current = page;
                  devicePagination.pageSize = pageSize;
                  loadDevices();
                }
              "
            />
          </div>
        </template>

        <template v-else-if="form.selector === 'context'">
          <div class="inline-panel">
            <div class="panel-label">设备来源变量</div>
            <Tooltip :title="getSelectedVariableText() || undefined">
              <TreeSelect
                :value="form.upperKey"
                class="w-full"
                :tree-data="builtinTree"
                :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
                placeholder="请选择设备变量"
                show-search
                tree-default-expand-all
                tree-node-filter-prop="title"
                tree-node-label-prop="selectedLabel"
                :tree-title-render="getTreeNodeTitle"
                :filter-tree-node="filterTreeNode"
                @update:value="form.upperKey = String($event || '')"
              />
            </Tooltip>
            <Empty
              v-if="builtinTree.length === 0"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="当前场景没有可用的设备变量"
            />
          </div>
        </template>

        <template v-else-if="form.selector === 'relation'">
          <div class="inline-panel">
            <div class="panel-label">关系类型</div>
            <Select
              :value="form.relation"
              class="w-full"
              :options="relationOptions"
              placeholder="请选择关系"
              @update:value="form.relation = String($event || '')"
            />
            <div class="panel-hint">
              关系设备默认以触发设备或上游设备变量作为关联源。
            </div>
          </div>
        </template>

        <template v-else>
          <div class="tag-panel">
            <div
              v-for="(item, index) in form.tagTerms"
              :key="item.key"
              class="tag-row"
            >
              <Select
                v-if="index > 0"
                class="tag-relation"
                :value="item.type"
                :options="[
                  { label: '并且', value: 'and' },
                  { label: '或者', value: 'or' },
                ]"
                @update:value="
                  form.tagTerms[index].type = String($event || 'and') as any
                "
              />
              <span v-else class="tag-first-label">当</span>
              <Select
                class="tag-column"
                :value="item.column"
                :options="
                  productTags.map((tag) => ({ label: tag.name, value: tag.id }))
                "
                placeholder="请选择标签"
                @update:value="updateTagColumn(index, String($event || ''))"
              />
              <component
                :is="tagValueComponent(item)"
                class="tag-value"
                :prop="createTagValueProp(item)"
                :value="item.value"
                @update:value="updateTagValue(index, $event)"
                @change="updateTagValue(index, $event)"
              />
              <Button
                v-if="form.tagTerms.length > 1"
                class="tag-delete"
                danger
                type="text"
                @click="removeTagTerm(index)"
              >
                删除
              </Button>
            </div>
            <Button type="dashed" @click="addTagTerm">添加标签条件</Button>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <Button @click="emit('update:open', false)">取消</Button>
      <Button v-if="current > 0" @click="current = 0">上一步</Button>
      <Button v-if="current === 0" type="primary" @click="handleNext">
        下一步
      </Button>
      <Button v-else type="primary" @click="handleOk">确定</Button>
    </template>
  </Modal>
</template>

<style scoped>
.modal-steps {
  margin-bottom: 20px;
}

.modal-step {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(60vh - 86px);
  padding-top: 10px;
}

.search-form {
  padding: 0 0 4px;
}

.selector-pane,
.selector-list {
  flex: 1;
  min-height: 0;
}

.selector-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-list {
  padding-right: 2px;
  padding-bottom: 8px;
  overflow-y: auto;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.select-card {
  position: relative;
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  min-height: 88px;
  padding: 14px 18px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
  border: 1px solid #d9e3f0;
  border-radius: 0;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.select-card:hover {
  border-color: #9dc1ff;
  box-shadow: 0 8px 18px rgb(22 119 255 / 8%);
}

.select-card.active {
  background: linear-gradient(180deg, #fafdff 0%, #f2f7ff 100%);
  border-color: #1677ff;
  box-shadow: 0 0 0 1px rgb(22 119 255 / 10%);
}

.card-cube {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 20px;
  font-weight: 700;
  color: #1677ff;
  background: linear-gradient(180deg, #edf4ff 0%, #f8fbff 100%);
  border: 1px solid #9dc1ff;
  border-radius: 12px;
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: #1f2937;
}

.card-status {
  flex: none;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.card-status.is-success {
  color: #2f5fe3;
}

.card-status.is-danger {
  color: #d4380d;
}

.card-status.is-muted {
  color: #94a3b8;
}

.card-slice {
  position: absolute;
  top: -14px;
  right: 58px;
  z-index: 0;
  width: 96px;
  height: calc(100% + 28px);
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgb(240 246 255 / 95%) 0%,
    rgb(232 240 252 / 85%) 100%
  );
  clip-path: polygon(34% 0, 100% 0, 66% 100%, 0 100%);
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.45;
  color: #6b7280;
}

.card-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.selector-card-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.selector-mode-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 84px;
  padding: 16px;
  cursor: pointer;
  background: #fbfcfe;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.selector-mode-card:hover:not(.disabled) {
  background: #fff;
  border-color: #91caff;
}

.selector-mode-card.active {
  background: #f4f8ff;
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgb(22 119 255 / 10%);
}

.selector-mode-card.disabled {
  cursor: not-allowed;
  background: #f7f8fa;
  border-color: #eceff3;
  opacity: 0.56;
}

.selector-mode-content {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.selector-mode-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: #1f2937;
}

.selector-mode-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.selector-mode-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #2563eb;
  background: #e9f1ff;
  border: 1px solid #d7e6ff;
  border-radius: 12px;
}

.selector-mode-card.active .selector-mode-icon {
  color: #fff;
  background: #4c6fff;
  border-color: #4c6fff;
}

.selector-mode-card.disabled .selector-mode-icon {
  color: #9ca3af;
  background: #eef1f5;
  border-color: #e2e8f0;
}

@media (max-width: 900px) {
  .selector-card-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .selector-card-row {
    grid-template-columns: 1fr;
  }
}

.inline-panel,
.tag-panel {
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
}

.panel-label {
  margin-bottom: 12px;
  font-weight: 600;
  color: #1f1f1f;
}

.panel-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #8c8c8c;
}

.tag-value {
  width: 100%;
}

.tag-row {
  display: grid;
  grid-template-columns: 64px 160px 1fr auto;
  gap: 10px;
  align-items: center;
}

.tag-row + .tag-row {
  margin-top: 12px;
}

.tag-first-label {
  font-size: 13px;
  color: #595959;
}

.tag-delete {
  padding: 0;
}

.tag-value :deep(.ant-select),
.tag-value :deep(.ant-select-selector),
.tag-value :deep(.ant-input),
.tag-value :deep(.ant-input-number),
.tag-value :deep(.ant-picker) {
  width: 100%;
}

:global(.selector-tree-title) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  min-width: 0;
}

:global(.selector-tree-name) {
  font-weight: 500;
  color: #262626;
}

:global(.selector-tree-desc) {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
