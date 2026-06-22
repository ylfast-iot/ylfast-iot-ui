<script setup lang="ts">
import type { RuleEngineAlarmConfigApi } from '#/api/iot/rule-engine/alarm-config';
import type { SceneAction } from '#/api/iot/rule-engine/types';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getAlarmConfigTargetTypeSupports,
  queryAlarmConfigDetailPage,
} from '#/api/iot/rule-engine/alarm-config';

import { getAlarmBindings } from './utils';

interface AlarmOption {
  alarmId: string;
  alarmName?: string;
  description?: string;
  level?: number | string;
  state?: any;
  targetType?: string;
}

const props = defineProps<{
  action?: SceneAction;
  actionId: number;
  mode?: 'relieve' | 'trigger';
  open: boolean;
  targetType?: 'collector' | 'device' | 'scene';
}>();

const emit = defineEmits<{
  save: [value: SceneAction];
  'update:open': [value: boolean];
}>();

const selectorOpen = ref(false);
const selectorLoading = ref(false);
const selectorKeyword = ref('');
const selectorAlarms = ref<any[]>([]);
const selectedAlarmKeys = ref<string[]>([]);
const boundAlarms = ref<AlarmOption[]>([]);
const targetTypeOptions = ref<RuleEngineAlarmConfigApi.AlarmTargetTypeInfo[]>(
  [],
);
const selectorTargetType = ref<string>();
const selectorPagination = reactive({
  current: 1,
  pageSize: 9,
  total: 0,
});

const mode = computed<'relieve' | 'trigger'>(
  () => props.action?.alarm?.mode || props.mode || 'trigger',
);
const modalTitle = computed(() =>
  mode.value === 'relieve' ? '解除告警' : '触发告警',
);
const tableColumns = [
  { dataIndex: 'alarmName', title: '名称' },
  { dataIndex: 'targetType', title: '类型', width: 120 },
  { dataIndex: 'level', title: '级别', width: 100 },
  { dataIndex: 'state', title: '状态', width: 120 },
  { dataIndex: 'description', title: '说明', ellipsis: true },
  { dataIndex: 'action', title: '操作', width: 88 },
];

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    boundAlarms.value = getAlarmBindings(props.action);
    await loadTargetTypeOptions();
  },
);

function closeModal() {
  emit('update:open', false);
}

function getTargetTypeLabel(value?: string) {
  if (!value) return '-';
  return (
    targetTypeOptions.value.find((item) => item.id === value)?.name || value
  );
}

function getStateLabel(state?: any) {
  return state?.text || state || '-';
}

function removeBoundAlarm(alarmId: string) {
  boundAlarms.value = boundAlarms.value.filter(
    (item) => item.alarmId !== alarmId,
  );
}

async function loadTargetTypeOptions() {
  try {
    targetTypeOptions.value = await getAlarmConfigTargetTypeSupports();
  } catch {
    targetTypeOptions.value = [];
  }
}

function buildTargetTypeTerm() {
  if (selectorTargetType.value) {
    return {
      column: 'targetType',
      termType: 'eq',
      value: selectorTargetType.value,
    };
  }
  if (props.targetType === 'device') {
    return { column: 'targetType', termType: 'neq', value: 'collector' };
  }
  if (props.targetType === 'collector') {
    return {
      column: 'targetType',
      termType: 'in',
      value: ['collector', 'scene'],
    };
  }
  return { column: 'targetType', termType: 'eq', value: 'scene' };
}

async function loadSelectorAlarms() {
  selectorLoading.value = true;
  try {
    const terms: any[] = [buildTargetTypeTerm()];
    if (selectorKeyword.value.trim()) {
      terms.unshift({
        column: 'name',
        termType: 'like',
        value: selectorKeyword.value.trim(),
      });
    }
    const result = await queryAlarmConfigDetailPage({
      pageIndex: selectorPagination.current - 1,
      pageSize: selectorPagination.pageSize,
      terms: terms as any,
    });
    selectorAlarms.value = result.data || [];
    selectorPagination.total = result.total || 0;
  } finally {
    selectorLoading.value = false;
  }
}

async function openSelector() {
  selectorOpen.value = true;
  selectedAlarmKeys.value = [];
  selectorTargetType.value = undefined;
  selectorPagination.current = 1;
  await loadSelectorAlarms();
}

function toggleSelect(alarm: any) {
  const alarmId = String(alarm.id);
  if (selectedAlarmKeys.value.includes(alarmId)) {
    selectedAlarmKeys.value = selectedAlarmKeys.value.filter(
      (item) => item !== alarmId,
    );
    return;
  }
  selectedAlarmKeys.value = [...selectedAlarmKeys.value, alarmId];
}

function appendSelectedAlarms() {
  if (selectedAlarmKeys.value.length === 0) {
    message.warning('请选择告警配置');
    return;
  }
  const selectedMap = new Map(
    boundAlarms.value.map((item) => [item.alarmId, item]),
  );
  selectorAlarms.value.forEach((item) => {
    const alarmId = String(item.id);
    if (!selectedAlarmKeys.value.includes(alarmId)) return;
    selectedMap.set(alarmId, {
      alarmId,
      alarmName: item.name || item.alarmName || alarmId,
      description: item.description,
      level: item.level,
      state: item.state,
      targetType: item.targetType,
    });
  });
  boundAlarms.value = [...selectedMap.values()];
  selectorOpen.value = false;
}

function handleSave() {
  if (boundAlarms.value.length === 0) {
    message.warning('请至少绑定一条告警配置');
    return;
  }

  emit('save', {
    actionId: props.action?.actionId || props.actionId,
    alarm: { mode: mode.value },
    executor: 'alarm',
    options: {
      alarmId: boundAlarms.value[0]?.alarmId,
      alarmName: boundAlarms.value[0]?.alarmName,
      alarms: boundAlarms.value,
      name: modalTitle.value,
      summary: `已绑定 ${boundAlarms.value.length} 条告警`,
    },
    terms: props.action?.terms || [],
  });
  closeModal();
}
</script>

<template>
  <Modal
    :open="open"
    :title="modalTitle"
    width="1000px"
    :destroy-on-close="true"
    :mask-closable="false"
    :body-style="{
      height: '60vh',
      overflow: 'hidden',
      padding: '18px 24px 12px',
    }"
    @cancel="closeModal"
  >
    <div class="alarm-modal-body">
      <div class="alarm-toolbar">
        <Button type="link" @click="openSelector">+ 新增告警</Button>
      </div>

      <div class="alarm-total">
        已绑定 <span>{{ boundAlarms.length }}</span> 条告警
      </div>
      <div class="alarm-tip">
        {{
          mode === 'relieve'
            ? '解除当前动作已绑定的告警配置。'
            : '触发当前动作已绑定的告警配置。'
        }}
      </div>

      <div class="alarm-list">
        <Table
          v-if="boundAlarms.length > 0"
          :columns="tableColumns"
          :data-source="boundAlarms"
          :pagination="false"
          :row-key="(record: AlarmOption) => record.alarmId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'alarmName'">
              <div class="alarm-name-cell">
                <div class="alarm-name-text">
                  {{ record.alarmName || record.alarmId }}
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'targetType'">
              {{ getTargetTypeLabel(record.targetType) }}
            </template>
            <template v-else-if="column.dataIndex === 'level'">
              {{ record.level ?? '-' }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag
                :color="
                  getStateLabel(record.state) === 'disabled'
                    ? 'error'
                    : 'processing'
                "
              >
                {{ getStateLabel(record.state) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'description'">
              {{ record.description || '-' }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Popconfirm
                title="确认移除该告警绑定吗？"
                ok-text="移除"
                cancel-text="取消"
                @confirm="removeBoundAlarm(record.alarmId)"
              >
                <Button danger type="link">移除</Button>
              </Popconfirm>
            </template>
          </template>
        </Table>
        <Empty v-else description="当前动作尚未绑定告警配置" />
      </div>
    </div>

    <template #footer>
      <Button @click="closeModal">取消</Button>
      <Button type="primary" @click="handleSave">确定</Button>
    </template>
  </Modal>

  <Modal
    :open="selectorOpen"
    title="选择告警配置"
    width="1000px"
    :mask-closable="false"
    :body-style="{
      height: '60vh',
      overflow: 'hidden',
      padding: '18px 24px 12px',
    }"
    @cancel="selectorOpen = false"
    @ok="appendSelectedAlarms"
  >
    <div class="alarm-selector-body">
      <div class="alarm-selector-search">
        <Select
          v-model:value="selectorTargetType"
          allow-clear
          class="alarm-type-select"
          :options="
            targetTypeOptions.map((item) => ({
              label: item.name,
              value: item.id,
            }))
          "
          placeholder="告警类型"
          @change="
            () => {
              selectorPagination.current = 1;
              loadSelectorAlarms();
            }
          "
        />
        <Input.Search
          v-model:value="selectorKeyword"
          allow-clear
          placeholder="请输入告警名称"
          style="max-width: 320px"
          @search="
            () => {
              selectorPagination.current = 1;
              loadSelectorAlarms();
            }
          "
        />
      </div>

      <Spin :spinning="selectorLoading" class="selector-spin">
        <div class="alarm-selector-list">
          <div v-if="selectorAlarms.length > 0" class="alarm-grid">
            <div
              v-for="alarm in selectorAlarms"
              :key="alarm.id"
              class="alarm-card"
              :class="{ active: selectedAlarmKeys.includes(String(alarm.id)) }"
              @click="toggleSelect(alarm)"
            >
              <div class="alarm-card-title-row">
                <div class="alarm-card-title">
                  {{ alarm.name || alarm.alarmName || alarm.id }}
                </div>
                <Tag
                  v-if="selectedAlarmKeys.includes(String(alarm.id))"
                  color="processing"
                >
                  已选择
                </Tag>
              </div>
              <div class="alarm-card-meta">
                <span>级别：{{ alarm.level ?? '-' }}</span>
                <span>类型：{{ getTargetTypeLabel(alarm.targetType) }}</span>
              </div>
              <div class="alarm-card-meta">
                状态：{{ getStateLabel(alarm.state) }}
              </div>
              <div class="alarm-card-desc">
                {{ alarm.description || '暂无说明' }}
              </div>
            </div>
          </div>
          <Empty v-else description="暂无告警配置" />
        </div>
      </Spin>

      <div class="alarm-pager">
        <Pagination
          :current="selectorPagination.current"
          :page-size="selectorPagination.pageSize"
          :show-size-changer="true"
          :total="selectorPagination.total"
          @change="
            (page, pageSize) => {
              selectorPagination.current = page;
              selectorPagination.pageSize = pageSize;
              loadSelectorAlarms();
            }
          "
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.alarm-modal-body,
.alarm-selector-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.alarm-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.alarm-total {
  font-size: 16px;
  color: #262626;
}

.alarm-total span {
  color: #1677ff;
}

.alarm-tip {
  margin: 6px 0 12px;
  font-size: 12px;
  color: #8c8c8c;
}

.alarm-list,
.alarm-selector-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.alarm-name-cell {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.alarm-name-text {
  font-weight: 500;
  color: #262626;
}

.alarm-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.alarm-card {
  position: relative;
  min-height: 132px;
  padding: 16px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.alarm-card:hover {
  border-color: #1677ff;
}

.alarm-card.active {
  background: #f8fbff;
  border-color: #1677ff;
}

.alarm-card-title-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

.alarm-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.alarm-card-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.alarm-card-desc {
  margin-top: 12px;
  font-size: 12px;
  color: #595959;
}

.alarm-selector-search {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.alarm-type-select {
  width: 200px;
}

.selector-spin {
  flex: 1;
  min-height: 0;
}

.alarm-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  margin-top: 14px;
  border-top: 1px solid #f0f0f0;
}
</style>
