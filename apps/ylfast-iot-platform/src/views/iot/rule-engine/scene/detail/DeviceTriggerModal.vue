<script setup lang="ts">
/* eslint-disable vue/no-use-v-if-with-v-for */
import type { Term } from '#/adapter';
import type {
  DeviceOperation,
  DeviceTrigger,
} from '#/api/iot/rule-engine/types';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

import { computed, reactive, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Steps,
} from 'ant-design-vue';

import { getDeviceDetailsPage } from '#/api/iot/device/instance';
import {
  getProductDetail,
  getProductDetailsPage,
} from '#/api/iot/device/product';
import { useYlDcForm } from '#/components/yl-dc-form';

import { isActiveDeviceOperation, parseProductMetadata } from './utils';

const props = defineProps<{
  device?: DeviceTrigger;
  open: boolean;
}>();

const emit = defineEmits<{
  save: [value: DeviceTrigger, options: Record<string, unknown>];
  'update:open': [value: boolean];
}>();

const modalBodyStyle = {
  height: '80vh',
  overflow: 'hidden',
  padding: '0 0 8px',
};

const current = ref(0);
const loading = ref(false);
const products = ref<any[]>([]);
const devices = ref<any[]>([]);
const productPageLoaded = ref(false);
const devicePageLoaded = ref(false);
const productSearchTerms = ref<Term[]>([]);
const deviceSearchTerms = ref<Term[]>([]);
const metadata = ref(parseProductMetadata());
const state = reactive<any>({
  cron: '',
  eventId: undefined,
  functionId: undefined,
  functionParams: {},
  operator: 'online',
  productId: undefined,
  productName: '',
  propertyId: undefined,
  propertyValue: '',
  selector: 'all',
  selectorValues: [],
});
const productPagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
});
const devicePagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
});

const operationOptions = [
  {
    icon: createIconifyIcon('lucide:plug-zap'),
    label: '设备上线',
    value: 'online',
  },
  {
    icon: createIconifyIcon('lucide:plug'),
    label: '设备离线',
    value: 'offline',
  },
  {
    icon: createIconifyIcon('lucide:badge-info'),
    label: '事件上报',
    value: 'reportEvent',
  },
  {
    icon: createIconifyIcon('lucide:database-zap'),
    label: '属性上报',
    value: 'reportProperty',
  },
  {
    icon: createIconifyIcon('lucide:scan-search'),
    label: '读取属性',
    value: 'readProperty',
  },
  {
    icon: createIconifyIcon('lucide:square-pen'),
    label: '修改属性',
    value: 'writeProperty',
  },
  {
    icon: createIconifyIcon('lucide:boxes'),
    label: '功能调用',
    value: 'invokeFunction',
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
  {
    component: 'Input',
    field: 'sn',
    label: 'SN',
    termTypes: ['like', 'eq'],
  },
];

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

const propertyOptions = computed(() =>
  metadata.value.properties.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const readPropertyOptions = computed(() =>
  metadata.value.properties
    .filter((item: any) => item?.expands?.type?.includes?.('read'))
    .map((item) => ({ label: item.name, value: item.id })),
);

const writePropertyOptions = computed(() =>
  metadata.value.properties
    .filter((item: any) => item?.expands?.type?.includes?.('write'))
    .map((item) => ({ label: item.name, value: item.id })),
);

const reportPropertyOptions = computed(() =>
  metadata.value.properties
    .filter(
      (item: any) =>
        item?.expands?.type?.includes?.('report') || !item?.expands?.type,
    )
    .map((item) => ({ label: item.name, value: item.id })),
);

const eventOptions = computed(() =>
  metadata.value.events.map((item) => ({ label: item.name, value: item.id })),
);

const functionOptions = computed(() =>
  metadata.value.functions.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const selectedFunction = computed(() =>
  metadata.value.functions.find((item) => item.id === state.functionId),
);

const currentPropertyOptions = computed(() => {
  if (state.operator === 'readProperty') return readPropertyOptions.value;
  if (state.operator === 'writeProperty') return writePropertyOptions.value;
  if (state.operator === 'reportProperty') return reportPropertyOptions.value;
  return propertyOptions.value;
});

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    current.value = 0;
    productPageLoaded.value = false;
    devicePageLoaded.value = false;
    productPagination.current = 1;
    devicePagination.current = 1;
    productSearchTerms.value = [];
    deviceSearchTerms.value = [];
    Object.assign(state, {
      cron: props.device?.operation?.timer?.cron || '',
      eventId: props.device?.operation?.eventId,
      functionId: props.device?.operation?.functionId,
      functionParams: Object.fromEntries(
        (props.device?.operation?.functionParameters || []).map((item) => [
          item.name,
          item.value,
        ]),
      ),
      operator: props.device?.operation?.operator || 'online',
      productId: props.device?.productId,
      propertyId:
        props.device?.operation?.readProperties?.[0] ||
        Object.keys(props.device?.operation?.writeProperties || {})[0],
      propertyValue: Object.values(
        props.device?.operation?.writeProperties || {},
      )[0],
      selector: props.device?.selector || 'all',
      selectorValues:
        props.device?.selectorValues?.map((item) => item.value) || [],
    });
    await loadProducts();
    if (state.productId) await loadProductContext(state.productId);
  },
);

watch(
  () => state.operator,
  (operator) => {
    if (operator !== 'reportEvent') state.eventId = undefined;
    if (operator !== 'invokeFunction') {
      state.functionId = undefined;
      state.functionParams = {};
    }
    if (!['readProperty', 'writeProperty'].includes(operator)) {
      state.propertyId = undefined;
    }
    if (operator !== 'writeProperty') {
      state.propertyValue = '';
    }
    if (
      !['invokeFunction', 'readProperty', 'writeProperty'].includes(operator)
    ) {
      state.cron = '';
    }
  },
);

async function loadProducts() {
  loading.value = true;
  try {
    const result = await getProductDetailsPage({
      pageIndex: productPagination.current - 1,
      pageSize: productPagination.pageSize,
      terms: productSearchTerms.value as any,
    });
    products.value = result.data || [];
    productPagination.total = result.total || 0;
    productPageLoaded.value = true;
  } finally {
    loading.value = false;
  }
}

async function loadProductContext(productId: string) {
  const product = await getProductDetail(productId);
  state.productName = product.productName || product.name || productId;
  metadata.value = parseProductMetadata(product.tsl || product.metadata);
  await loadDevices();
}

async function loadDevices() {
  if (!state.productId) return;
  const result = await getDeviceDetailsPage({
    pageIndex: devicePagination.current - 1,
    pageSize: devicePagination.pageSize,
    terms: [
      { column: 'productId', termType: 'eq', value: state.productId },
      ...deviceSearchTerms.value,
    ] as any,
  });
  devices.value = result.data || [];
  devicePagination.total = result.total || 0;
  devicePageLoaded.value = true;
}

async function handleProductChange(productId: string) {
  state.productId = productId;
  state.selectorValues = [];
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

function handleProductPageChange(page: number, pageSize: number) {
  productPagination.current = page;
  productPagination.pageSize = pageSize;
  loadProducts();
}

function handleDevicePageChange(page: number, pageSize: number) {
  devicePagination.current = page;
  devicePagination.pageSize = pageSize;
  loadDevices();
}

function toggleDevice(device: any) {
  const values = state.selectorValues || [];
  state.selectorValues = values.includes(device.id)
    ? values.filter((id: string) => id !== device.id)
    : [...values, device.id];
}

function isOperationAvailable(value: string) {
  if (['offline', 'online'].includes(value)) return true;
  if (value === 'reportEvent') return eventOptions.value.length > 0;
  if (value === 'readProperty') return readPropertyOptions.value.length > 0;
  if (value === 'writeProperty') return writePropertyOptions.value.length > 0;
  if (value === 'reportProperty') return reportPropertyOptions.value.length > 0;
  if (value === 'invokeFunction') return functionOptions.value.length > 0;
  return true;
}

function selectOperation(value: string) {
  if (!isOperationAvailable(value)) return;
  state.operator = value;
}

function handleNext() {
  if (current.value === 0 && !state.productId) {
    message.warning('请选择产品');
    return;
  }
  if (
    current.value === 1 &&
    state.selector === 'fixed' &&
    !state.selectorValues?.length
  ) {
    message.warning('请选择设备');
    return;
  }
  current.value += 1;
}

function createOperation(): DeviceOperation {
  const operation: DeviceOperation = { operator: state.operator };
  if (state.operator === 'reportEvent') operation.eventId = state.eventId;
  if (state.operator === 'readProperty') {
    operation.readProperties = state.propertyId ? [state.propertyId] : [];
  }
  if (state.operator === 'writeProperty') {
    operation.writeProperties = state.propertyId
      ? { [state.propertyId]: state.propertyValue }
      : {};
  }
  if (state.operator === 'invokeFunction') {
    const fun = metadata.value.functions.find(
      (item) => item.id === state.functionId,
    );
    operation.functionId = state.functionId;
    operation.functionParameters = (fun?.inputs || []).map((item) => ({
      name: item.id,
      value: state.functionParams[item.id],
    }));
  }
  if (isActiveDeviceOperation(operation)) {
    operation.timer = { cron: state.cron, trigger: 'cron' };
  }
  return operation;
}

function validateStep3() {
  if (!isOperationAvailable(state.operator)) {
    message.warning('当前产品不支持该触发类型');
    return false;
  }
  if (state.operator === 'reportEvent' && !state.eventId) {
    message.warning('请选择事件');
    return false;
  }
  if (
    ['readProperty', 'writeProperty'].includes(state.operator) &&
    !state.propertyId
  ) {
    message.warning('请选择属性');
    return false;
  }
  if (state.operator === 'invokeFunction' && !state.functionId) {
    message.warning('请选择功能');
    return false;
  }
  if (
    ['invokeFunction', 'readProperty', 'writeProperty'].includes(
      state.operator,
    ) &&
    !state.cron
  ) {
    message.warning('请配置主动触发 Cron');
    return false;
  }
  if (
    state.operator === 'writeProperty' &&
    !state.propertyValue &&
    state.propertyValue !== 0
  ) {
    message.warning('请输入属性值');
    return false;
  }
  return true;
}

function handleOk() {
  if (!validateStep3()) return;
  const values = state.selectorValues || [];
  const selectedDevices = devices.value.filter((item) =>
    values.includes(item.id),
  );
  const device: DeviceTrigger = {
    operation: createOperation(),
    productId: state.productId,
    selector: state.selector,
    selectorValues:
      state.selector === 'fixed'
        ? selectedDevices.map((item) => ({
            name: item.deviceName || item.name || item.id,
            value: item.id,
          }))
        : [],
    source: state.selector === 'fixed' ? 'fixed' : undefined,
  } as DeviceTrigger;

  emit('save', device, {
    productName: state.productName,
    selectorName: state.selector === 'all' ? '全部设备' : '指定设备',
    triggerName:
      operationOptions.find((item) => item.value === state.operator)?.label ||
      state.operator,
  });
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :body-style="modalBodyStyle"
    :confirm-loading="loading"
    :open="open"
    title="触发规则"
    width="980px"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <Steps
      :current="current"
      class="trigger-steps"
      :items="[
        { title: '选择产品' },
        { title: '选择设备' },
        { title: '触发类型' },
      ]"
    />

    <div v-show="current === 0" class="modal-step selector-step">
      <ProductSearchForm
        class="product-search-form"
        @reset="handleProductReset"
        @search="handleProductSearch"
      />
      <div class="selector-list">
        <div class="card-grid fixed-grid product-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="select-card"
            :class="{ active: state.productId === product.id }"
            @click="handleProductChange(product.id)"
          >
            <div class="card-cube">P</div>
            <div class="min-w-0">
              <div class="truncate text-base font-semibold">
                {{ product.productName || product.name || product.id }}
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                设备类型：{{
                  product.deviceType?.text || product.deviceType?.value || '-'
                }}
              </div>
              <div class="text-xs text-muted-foreground">
                接入方式：{{ product.transport || product.channel || '-' }}
              </div>
            </div>
            <div class="card-status">正常</div>
          </div>
        </div>
      </div>
      <div v-if="productPageLoaded" class="card-pager">
        <Pagination
          :current="productPagination.current"
          :page-size="productPagination.pageSize"
          :show-size-changer="true"
          :total="productPagination.total"
          @change="handleProductPageChange"
          @show-size-change="handleProductPageChange"
        />
      </div>
    </div>

    <div v-show="current === 1" class="modal-step selector-step">
      <div class="selector-mode-grid">
        <div
          class="selector-mode-card"
          :class="{ active: state.selector === 'fixed' }"
          @click="state.selector = 'fixed'"
        >
          <div>
            <div class="font-medium">自定义</div>
            <div class="mt-1 text-xs text-muted-foreground">选择指定设备</div>
          </div>
          <div class="mode-icon">◇</div>
        </div>
        <div
          class="selector-mode-card"
          :class="{ active: state.selector === 'all' }"
          @click="state.selector = 'all'"
        >
          <div>
            <div class="font-medium">全部</div>
            <div class="mt-1 text-xs text-muted-foreground">产品下全部设备</div>
          </div>
          <div class="mode-icon">☷</div>
        </div>
      </div>

      <template v-if="state.selector === 'fixed'">
        <DeviceSearchForm
          class="device-search-form"
          @reset="handleDeviceReset"
          @search="handleDeviceSearch"
        />
        <div class="selector-list">
          <div class="card-grid fixed-grid device-grid">
            <div
              v-for="deviceItem in devices"
              :key="deviceItem.id"
              class="select-card"
              :class="{ active: state.selectorValues.includes(deviceItem.id) }"
              @click="toggleDevice(deviceItem)"
            >
              <div class="card-cube">D</div>
              <div class="min-w-0">
                <div class="truncate text-base font-semibold">
                  {{
                    deviceItem.deviceName || deviceItem.name || deviceItem.id
                  }}
                </div>
                <div class="mt-2 text-xs text-muted-foreground">
                  产品名称：{{ device.productName || state.productName || '-' }}
                </div>
                <div class="text-xs text-muted-foreground">
                  设备类型：{{
                    deviceItem.deviceType?.text ||
                    deviceItem.deviceType?.value ||
                    '-'
                  }}
                </div>
              </div>
              <div class="card-status">
                {{
                  deviceItem.deviceState?.text ||
                  deviceItem.deviceState?.value ||
                  '在线'
                }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="devicePageLoaded" class="card-pager">
          <Pagination
            :current="devicePagination.current"
            :page-size="devicePagination.pageSize"
            :show-size-changer="true"
            :total="devicePagination.total"
            @change="handleDevicePageChange"
            @show-size-change="handleDevicePageChange"
          />
        </div>
      </template>
    </div>

    <div v-show="current === 2" class="modal-step operation-step">
      <Alert class="mb-4" message="只能依据产品物模型配置触发规则" show-icon />
      <div class="operation-grid">
        <div
          v-for="item in operationOptions"
          :key="item.value"
          class="operation-card"
          :class="{
            active: state.operator === item.value,
            disabled: !isOperationAvailable(item.value),
          }"
          @click="selectOperation(item.value)"
        >
          <div class="operation-icon">
            <component :is="item.icon" class="operation-icon-inner" />
          </div>
          <div class="operation-name">{{ item.label }}</div>
        </div>
      </div>

      <div class="operation-form">
        <Select
          v-if="state.operator === 'reportEvent'"
          v-model:value="state.eventId"
          class="operation-input"
          :options="eventOptions"
          placeholder="请选择事件"
        />

        <Select
          v-if="['readProperty', 'writeProperty'].includes(state.operator)"
          v-model:value="state.propertyId"
          class="operation-input"
          :options="currentPropertyOptions"
          placeholder="请选择属性"
        />

        <Select
          v-if="state.operator === 'invokeFunction'"
          v-model:value="state.functionId"
          class="operation-input"
          :options="functionOptions"
          placeholder="请选择功能"
        />

        <Input
          v-if="
            ['invokeFunction', 'readProperty', 'writeProperty'].includes(
              state.operator,
            )
          "
          v-model:value="state.cron"
          class="operation-input"
          placeholder="主动触发 Cron，例如：0/5 * * * ?"
        />

        <Input
          v-if="state.operator === 'writeProperty'"
          v-model:value="state.propertyValue"
          class="operation-input"
          placeholder="请输入属性值"
        />

        <Input
          v-for="item in selectedFunction?.inputs || []"
          v-if="state.operator === 'invokeFunction'"
          :key="item.id"
          :value="state.functionParams[item.id]"
          class="operation-input"
          :placeholder="`请输入${item.name || item.id}`"
          @update:value="state.functionParams[item.id] = $event"
        />
      </div>
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
.modal-step {
  min-height: 356px;
}

.selector-step {
  display: flex;
  flex-direction: column;
  height: calc(80vh - 120px);
  min-height: 0;
}

.operation-step {
  padding-top: 14px;
}

.trigger-steps {
  margin-bottom: 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 112px;
  gap: 16px;
  align-content: start;
}

.fixed-grid {
  padding-right: 6px;
}

.product-grid {
  min-height: 456px;
}

.device-grid {
  min-height: 456px;
}

.selector-list {
  flex: 1;
  min-height: 0;
  padding-bottom: 8px;
  overflow-y: auto;
}

.select-card {
  position: relative;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 18px;
  align-items: center;
  height: 112px;
  padding: 18px 22px;
  overflow: hidden;
  cursor: pointer;
  background:
    linear-gradient(110deg, transparent 55%, rgb(22 119 255 / 6%) 55%), #fff;
  border: 1px solid #e5e7eb;
  transition: border-color 0.2s ease;
}

.select-card.active {
  border-color: #1677ff;
}

.card-cube {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  font-weight: 700;
  color: #1677ff;
  background: #eef4ff;
  border: 1px solid #adc6ff;
  border-radius: 10px;
}

.card-status {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 12px;
  color: #1d39c4;
}

.selector-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 240px));
  gap: 24px;
  margin-bottom: 14px;
}

.selector-mode-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 18px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
}

.selector-mode-card.active {
  border-color: #1677ff;
}

.mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #fff;
  background: linear-gradient(135deg, #597ef7, #2f54eb);
  border-radius: 6px;
}

.device-search-form {
  margin-bottom: 12px;
}

.product-search-form {
  margin-bottom: 12px;
}

.card-pager {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-top: 12px;
  margin-top: auto;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.operation-step :deep(.ant-alert) {
  margin-bottom: 18px;
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.operation-card {
  display: flex;
  align-items: center;
  min-height: 76px;
  padding: 16px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.operation-card.active {
  color: #1677ff;
  border-color: #1677ff;
}

.operation-card.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.operation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin-right: 14px;
  color: #1677ff;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
}

.operation-icon-inner {
  width: 20px;
  height: 20px;
}

.operation-name {
  font-size: 14px;
}

.operation-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.operation-input {
  width: 100%;
}

:deep(.device-search-form .yl-dc-form-container) {
  padding: 0;
}

:deep(.product-search-form .yl-dc-form-container) {
  padding: 0;
}
</style>
