<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { QueryParamEntity } from '#/adapter';
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type { DeviceStoreStrategyMode } from '#/enums/device';
import type { DeviceMetadata } from '#/types/metadata';

import { computed, nextTick, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Radio,
  RadioGroup,
  Select,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getDevicePropertiesPage,
  getEventDataPage,
  getPropertyDataPage,
} from '#/api/iot/device/data';
import { YlDateRangePicker } from '#/components/yl-date-range-picker';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import {
  DEVICE_STORE_STRATEGY_MODE,
  DEVICE_STORE_STRATEGY_MODE_ENUMS,
} from '#/enums/device';
import { parseMetadata } from '#/views/iot/device/instance/detail/helper';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
}>();

const metadata = computed<DeviceMetadata>(() =>
  parseMetadata(props.device.tsl),
);

// Icons
const SearchIcon = createIconifyIcon('lucide:search');
const ActivityIcon = createIconifyIcon('lucide:activity');
const BellIcon = createIconifyIcon('lucide:bell');
const CheckIcon = createIconifyIcon('lucide:check');

// --- State ---
const queryType = ref<'event' | 'property'>('property');
const timeRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(1, 'hour'), dayjs()]);
const propSearchText = ref('');
const searching = ref(false);

// Property Query State
const selectedProperties = ref<string[]>([]); // For COLUMN mode
const selectedProperty = ref<string | undefined>(undefined); // For ROW mode

// Event Query State
const selectedEventId = ref<string | undefined>(undefined);
const selectedEventProp = ref<string | undefined>(undefined);

const currentEvent = computed(() => {
  return metadata.value.events?.find((e) => e.id === selectedEventId.value);
});

const eventOutputProps = computed(() => {
  if (currentEvent.value?.output?.type === 'OBJECT') {
    return (currentEvent.value.output as any).properties || [];
  }
  return [];
});

// Filtered items for the grid selection
const filteredItems = computed(() => {
  const search = propSearchText.value.toLowerCase();
  if (queryType.value === 'property') {
    const props = metadata.value.properties || [];
    return props
      .filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.id.toLowerCase().includes(search),
      )
      .map((p) => ({ id: p.id, name: p.name }));
  } else {
    return eventOutputProps.value
      .filter(
        (p: any) =>
          p.name.toLowerCase().includes(search) ||
          p.id.toLowerCase().includes(search),
      )
      .map((p: any) => ({ id: p.id, name: p.name }));
  }
});

function toggleItem(id: string) {
  if (queryType.value === 'property') {
    if (storeMode.value === 'COLUMN') {
      const index = selectedProperties.value.indexOf(id);
      if (index === -1) {
        selectedProperties.value.push(id);
      } else {
        selectedProperties.value.splice(index, 1);
      }
    } else {
      selectedProperty.value = selectedProperty.value === id ? undefined : id;
    }
  } else {
    selectedEventProp.value = selectedEventProp.value === id ? undefined : id;
  }
}

function handleSelectAll() {
  if (queryType.value === 'property' && storeMode.value === 'COLUMN') {
    const allIds = filteredItems.value.map((i: any) => i.id);
    const isAllSelected = allIds.every((id: any) =>
      selectedProperties.value.includes(id),
    );
    if (isAllSelected) {
      selectedProperties.value = selectedProperties.value.filter(
        (id) => !allIds.includes(id),
      );
    } else {
      const newSelected = [...selectedProperties.value];
      allIds.forEach((id: any) => {
        if (!newSelected.includes(id)) newSelected.push(id);
      });
      selectedProperties.value = newSelected;
    }
  }
}

// Storage Strategy
const storeMode = computed(
  () => props.device.storeStrategyMode || DEVICE_STORE_STRATEGY_MODE.NONE,
);

const currentStoreModeInfo = computed(() => {
  const mode = storeMode.value as DeviceStoreStrategyMode;
  return DEVICE_STORE_STRATEGY_MODE_ENUMS[mode];
});

// --- Table Logic ---
const getGridColumns = () => {
  if (queryType.value === 'property') {
    if (storeMode.value === DEVICE_STORE_STRATEGY_MODE.COLUMN) {
      const cols: any[] = [
        { type: 'seq', width: 60 },
        {
          field: 'timestamp',
          title: $t('device.instance.history.reportTime'),
          width: 180,
          formatter: 'formatDateTime',
        },
      ];
      // Dynamic columns based on selected properties
      selectedProperties.value.forEach((id) => {
        const prop = metadata.value.properties?.find((p) => p.id === id);
        cols.push({
          field: id,
          title: `${prop?.name || id} (${id})`,
          minWidth: 150,
        });
      });
      return cols;
    } else {
      // ROW Mode
      return [
        { type: 'seq', width: 60 },
        {
          field: 'timestamp',
          title: $t('device.instance.history.reportTime'),
          width: 180,
          formatter: 'formatDateTime',
        },
        {
          field: 'propertyName',
          title: $t('device.instance.history.propertyName'),
          width: 150,
        },
        {
          field: 'value',
          title: $t('device.instance.history.propertyValue'),
          minWidth: 150,
        },
        {
          field: 'formatValue',
          title: $t('device.instance.history.formatValue'),
          minWidth: 150,
        },
      ];
    }
  } else {
    // Event Mode
    const baseCols: any[] = [
      { type: 'seq', width: 60 },
      {
        field: 'timestamp',
        title: $t('device.instance.history.reportTime'),
        width: 180,
        formatter: 'formatDateTime',
      },
    ];

    if (currentEvent.value?.output?.type === 'OBJECT') {
      const properties = (currentEvent.value.output as any).properties || [];
      properties.forEach((p: any) => {
        baseCols.push({
          field: p.id,
          title: `${p.name} (${p.id})`,
          minWidth: 150,
          formatter: ({ row }: any) => {
            const val = row[p.id] ?? row.value?.[p.id];
            return val === undefined ? '--' : val;
          },
        });
      });
    } else {
      baseCols.push({
        field: 'value',
        title: $t('device.instance.history.dataValue'),
        minWidth: 150,
      });
    }
    return baseCols;
  }
};

const gridQuery = async (params: any) => {
  if (storeMode.value === DEVICE_STORE_STRATEGY_MODE.NONE)
    return { items: [], total: 0 };
  if (!timeRange.value || timeRange.value.length !== 2)
    return { items: [], total: 0 };

  searching.value = true;
  const { page } = params;
  const commonParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms: [
      {
        column: 'timestamp',
        termType: 'btw',
        value: timeRange.value.map((d) => d.valueOf()),
      },
    ],
    sorts: [{ name: 'timestamp', order: 'desc' }],
  };

  try {
    if (queryType.value === 'property') {
      if (storeMode.value === DEVICE_STORE_STRATEGY_MODE.COLUMN) {
        if (selectedProperties.value.length === 0)
          return { items: [], total: 0 };

        // Use top-level includes for selected properties
        const queryParams: QueryParamEntity = {
          ...commonParams,
          includes: [...selectedProperties.value, 'timestamp'],
        };

        const res = await getDevicePropertiesPage(props.device.id, queryParams);
        return { items: res.data, total: res.total };
      } else {
        if (!selectedProperty.value) return { items: [], total: 0 };
        const res = await getPropertyDataPage(
          props.device.id,
          selectedProperty.value,
          commonParams,
        );
        return { items: res.data, total: res.total };
      }
    } else {
      // Event Query
      if (!selectedEventId.value) return { items: [], total: 0 };
      const res = await getEventDataPage(
        props.device.id,
        selectedEventId.value,
        commonParams,
      );
      return { items: res.data, total: res.total };
    }
  } catch (error) {
    console.error(error);
    return { items: [], total: 0 };
  } finally {
    searching.value = false;
  }
};

const [TableCard, gridApi] = useYlVxeTableCard<any>({
  mode: 'table',
  showSearchForm: false,
  gridOptions: {
    columns: getGridColumns(),
    height: 'auto',
    proxyConfig: {
      enabled: true,
      ajax: {
        query: gridQuery,
      },
      response: {
        result: 'items',
        total: 'total',
      },
    },
    pagerConfig: { enabled: true },
    toolbarConfig: { refresh: true, custom: true },
  },
});

function handleSearch() {
  // @ts-ignore
  gridApi.setGridOptions({
    columns: getGridColumns(),
  });
  gridApi.reload();
}

const initDone = ref(false);
function initDefaults() {
  if (!metadata.value) return;

  if (queryType.value === 'property') {
    const props = metadata.value.properties || [];
    if (storeMode.value === 'COLUMN') {
      selectedProperties.value = props.map((p) => p.id);
    } else {
      selectedProperty.value = props[0]?.id;
    }
  } else {
    const evts = metadata.value.events || [];
    if (evts.length > 0) {
      selectedEventId.value = evts[0]?.id;
      // nextTick to wait for eventOutputProps computed to update
      nextTick(() => {
        if (eventOutputProps.value.length > 0) {
          selectedEventProp.value = eventOutputProps.value[0]?.id;
        }
      });
    }
  }
}

// Auto-init and search
watch(
  metadata,
  (val) => {
    if (val && !initDone.value && storeMode.value !== 'NONE') {
      initDefaults();
      // Use nextTick to ensure refs are updated before column generation
      nextTick(() => {
        handleSearch();
        initDone.value = true;
      });
    }
  },
  { immediate: true },
);

// Watchers to clear selections on type change
watch(queryType, () => {
  selectedProperties.value = [];
  selectedProperty.value = undefined;
  selectedEventId.value = undefined;
  selectedEventProp.value = undefined;

  // Re-init defaults for the new type
  initDefaults();
  nextTick(() => {
    handleSearch();
  });
});

watch(selectedEventId, (val) => {
  selectedEventProp.value = undefined;
  if (val) {
    nextTick(() => {
      if (eventOutputProps.value.length > 0) {
        selectedEventProp.value = eventOutputProps.value[0]?.id;
      }
    });
  }
});
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <!-- Storage Strategy Alert -->
    <Alert
      v-if="storeMode === 'NONE'"
      type="warning"
      show-icon
      :message="$t('device.instance.history.noStrategy')"
    />

    <template v-if="storeMode !== DEVICE_STORE_STRATEGY_MODE.NONE">
      <Alert type="info" show-icon>
        <template #message>
          <div class="flex items-center gap-2">
            <span>{{ $t('device.instance.history.currentStrategy') }}</span>
            <Tag color="blue">{{ currentStoreModeInfo?.label }}</Tag>
            <span class="text-xs text-muted-foreground">
              ({{
                storeMode === DEVICE_STORE_STRATEGY_MODE.COLUMN
                  ? $t('device.instance.history.columnModeDesc')
                  : $t('device.instance.history.rowModeDesc')
              }})
            </span>
          </div>
        </template>
      </Alert>

      <!-- Filters Card -->
      <Card size="small" class="shadow-sm">
        <div class="flex flex-col gap-4">
          <!-- Row 1: Query Type & Main Select -->
          <div class="flex flex-wrap items-center gap-8">
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-muted-foreground">
                {{ $t('device.instance.history.queryType') }}:
              </span>
              <RadioGroup v-model:value="queryType" button-style="solid">
                <Radio.Button value="property">
                  <div class="flex items-center gap-1.5">
                    <ActivityIcon class="size-3.5" />
                    {{ $t('device.instance.history.deviceProperty') }}
                  </div>
                </Radio.Button>
                <Radio.Button value="event">
                  <div class="flex items-center gap-1.5">
                    <BellIcon class="size-3.5" />
                    {{ $t('device.instance.history.deviceEvent') }}
                  </div>
                </Radio.Button>
              </RadioGroup>
            </div>

            <!-- Event Selection (Dropdown) -->
            <div v-if="queryType === 'event'" class="flex items-center gap-3">
              <span class="text-sm font-bold text-muted-foreground">
                {{ $t('device.instance.history.selectQueryItem') }}:
              </span>
              <Select
                v-model:value="selectedEventId"
                :placeholder="
                  $t('device.instance.history.selectEventPlaceholder')
                "
                class="w-72"
                allow-clear
              >
                <Select.Option
                  v-for="e in metadata.events"
                  :key="e.id"
                  :value="e.id"
                >
                  {{ e.name }} ({{ e.id }})
                </Select.Option>
              </Select>
            </div>
          </div>

          <!-- Row 2: Searchable Selection Area -->
          <div
            v-if="
              queryType === 'property' ||
              (queryType === 'event' && selectedEventId)
            "
            class="flex flex-col gap-3 rounded-lg border border-dashed border-border/60 bg-muted/5 p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <span
                  class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80"
                >
                  {{
                    $t(
                      queryType === 'property'
                        ? 'device.instance.history.selectProperty'
                        : 'device.instance.history.selectQueryItem',
                    )
                  }}
                </span>
                <Input
                  v-model:value="propSearchText"
                  :placeholder="$t('device.instance.history.searchPlaceholder')"
                  class="w-72"
                  allow-clear
                >
                  <template #prefix>
                    <SearchIcon class="size-4 text-muted-foreground/60" />
                  </template>
                </Input>
              </div>
              <div
                v-if="
                  queryType === 'property' &&
                  storeMode === DEVICE_STORE_STRATEGY_MODE.COLUMN
                "
                class="flex items-center gap-3"
              >
                <Button
                  size="small"
                  type="link"
                  class="px-0"
                  @click="handleSelectAll"
                >
                  {{ $t('device.instance.history.selectAll') }}
                </Button>
                <Tag
                  color="blue"
                  class="m-0 border-none bg-primary/10 px-2 py-0 text-[10px] text-primary"
                >
                  {{
                    $t('device.instance.history.selectedCount', {
                      count: selectedProperties.length,
                    })
                  }}
                </Tag>
              </div>
            </div>

            <!-- Selection Grid -->
            <div class="mt-1 max-h-[160px] overflow-y-auto pr-1">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="item in filteredItems"
                  :key="item.id"
                  class="group flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all hover:shadow-sm"
                  :class="[
                    (
                      queryType === 'property' &&
                      storeMode === DEVICE_STORE_STRATEGY_MODE.COLUMN
                        ? selectedProperties.includes(item.id)
                        : queryType === 'property'
                          ? selectedProperty === item.id
                          : selectedEventProp === item.id
                    )
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                  ]"
                  @click="toggleItem(item.id)"
                >
                  <div
                    v-if="
                      queryType === 'property' &&
                      storeMode === DEVICE_STORE_STRATEGY_MODE.COLUMN
                    "
                    class="flex h-3.5 w-3.5 items-center justify-center rounded-sm border transition-colors"
                    :class="[
                      selectedProperties.includes(item.id)
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-transparent group-hover:border-primary/50',
                    ]"
                  >
                    <CheckIcon
                      v-if="selectedProperties.includes(item.id)"
                      class="size-2.5"
                    />
                  </div>
                  <span class="font-medium">{{ item.name }}</span>
                  <span class="font-mono text-[10px] opacity-50">{{
                    item.id
                  }}</span>
                </div>
                <div
                  v-if="filteredItems.length === 0"
                  class="w-full py-6 text-center text-xs text-muted-foreground"
                >
                  {{ $t('device.instance.history.noMatch') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Row 3: Time Range & Search Action -->
          <div
            class="flex items-center justify-between border-t border-border/50 pt-4"
          >
            <div class="flex flex-1 items-center gap-3">
              <span class="text-sm font-bold text-muted-foreground">
                {{ $t('device.instance.history.timeRange') }}:
              </span>
              <div class="flex-1">
                <YlDateRangePicker
                  v-model:value="timeRange"
                  align="start"
                  @change="handleSearch"
                />
              </div>
            </div>

            <Button
              type="primary"
              class="ml-4 font-bold"
              :loading="searching"
              @click="handleSearch"
            >
              <template #icon><SearchIcon /></template>
              {{ $t('device.instance.history.startQuery') }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- Content Table -->
      <div class="flex-1 overflow-hidden">
        <TableCard class="h-full" />
      </div>
    </template>

    <!-- Empty State for NONE Mode -->
    <div
      v-else
      class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/5"
    >
      <Empty :description="$t('device.instance.history.emptyHistory')" />
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-card-body) {
  padding: 16px;
}
</style>
