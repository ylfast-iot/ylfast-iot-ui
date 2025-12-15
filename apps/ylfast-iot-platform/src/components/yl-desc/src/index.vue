<script setup lang="ts">
import type { YlDescActionType, YlDescProps, YlDescSchema } from './types';

import {
  computed,
  onMounted,
  ref,
  unref,
  useAttrs,
  useSlots,
  watch,
} from 'vue';

import { get, isFunction } from '@vben/utils';

import { Descriptions, DescriptionsItem } from 'ant-design-vue';

const props = withDefaults(defineProps<YlDescProps>(), {
  bordered: true,
  column: 3,
  layout: 'horizontal',
  size: 'middle',
  schemas: () => [],
  data: () => ({}),
});

const emit = defineEmits(['register']);

const attrs = useAttrs();
const slots = useSlots();

const propsRef = ref<Partial<YlDescProps>>({});
const schemaRef = ref<YlDescSchema[]>([]);

// Merge props
const getProps = computed(() => {
  return { ...props, ...unref(propsRef) } as YlDescProps;
});

// Initialize schemas
watch(
  () => props.schemas,
  (schemas) => {
    schemaRef.value = schemas || [];
  },
  { immediate: true },
);

// Get data
const getData = computed(() => {
  return getProps.value.data || {};
});

// Actions
function setDescProps(descProps: Partial<YlDescProps>) {
  propsRef.value = { ...unref(propsRef), ...descProps };
}

async function setProps(descProps: Partial<YlDescProps>) {
  setDescProps(descProps);
}

function getFieldsValue() {
  return unref(getData);
}

async function updateSchema(
  data: Partial<YlDescSchema> | Partial<YlDescSchema>[],
) {
  let updateData: Partial<YlDescSchema>[] = [];
  updateData = Array.isArray(data) ? data : [data];

  const hasField = (n: string, s: YlDescSchema) => n === s.field;

  updateData.forEach((item) => {
    unref(schemaRef).forEach((val) => {
      if (item.field && hasField(item.field, val)) {
        Object.assign(val, item);
      }
    });
  });
}

async function resetSchema(
  data: Partial<YlDescSchema> | Partial<YlDescSchema>[],
) {
  let updateData: Partial<YlDescSchema>[] = [];
  updateData = Array.isArray(data) ? data : [data];

  const hasField = (n: string, s: YlDescSchema) => n === s.field;

  // Reset to initial schemas from props if needed, but here we just update for now
  // or maybe we should keep a copy of initial schemas?
  // For simplicity, mimicking updateSchema but logically "reset" might mean something else.
  // In dc-form it typically resets to default values. Here we just update.
  updateData.forEach((item) => {
    unref(schemaRef).forEach((val) => {
      if (item.field && hasField(item.field, val)) {
        Object.assign(val, item);
      }
    });
  });
}

// Helpers
function renderContent(schema: YlDescSchema) {
  const { render, field, slot } = schema;
  const data = unref(getData);
  const value = get(data, field);

  if (slot) {
    return get(slots, slot)?.({ value, data, schema }) ?? value;
  }

  if (render && isFunction(render)) {
    return render(value, data);
  }
  return value;
}

function renderLabel(schema: YlDescSchema) {
  const { label, labelSlot } = schema;
  if (labelSlot) {
    return get(slots, labelSlot)?.({ schema }) ?? label;
  }
  return label;
}

function getShow(schema: YlDescSchema) {
  const { show } = schema;
  const data = unref(getData);
  if (show === undefined) return true;
  if (typeof show === 'boolean') return show;
  if (isFunction(show)) return show(data);
  return true;
}

const action: YlDescActionType = {
  setProps,
  setDescProps,
  updateSchema,
  resetSchema,
  getFieldsValue,
};

onMounted(() => {
  emit('register', action);
});

defineExpose(action);
</script>

<template>
  <Descriptions v-bind="{ ...getProps, ...attrs }">
    <template v-for="schema in schemaRef" :key="schema.field">
      <DescriptionsItem
        v-if="getShow(schema)"
        :span="schema.span || 1"
        :label-style="schema.labelStyle || getProps.labelStyle"
        :content-style="schema.contentStyle || getProps.contentStyle"
      >
        <template #label>
          <component
            :is="renderLabel(schema)"
            v-if="typeof renderLabel(schema) === 'object'"
          />
          <span v-else>{{ renderLabel(schema) }}</span>
        </template>

        <!-- Handle VNode return from render -->
        <component
          :is="renderContent(schema)"
          v-if="
            typeof renderContent(schema) === 'object' &&
            renderContent(schema) !== null
          "
        />
        <!-- Handle simple values -->
        <template v-else>{{ renderContent(schema) }}</template>
      </DescriptionsItem>
    </template>
  </Descriptions>
</template>
