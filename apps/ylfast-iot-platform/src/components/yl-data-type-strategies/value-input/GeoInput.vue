<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { GeoTypeDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { InputNumber } from 'ant-design-vue';

import { getComponentProps, isDisabled } from '#/utils/config-metadata';

const props = defineProps<{
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const typeDef = computed(() => props.prop.type as GeoTypeDef);
const latProp = computed(() => typeDef.value.latProperty || 'lat');
const lngProp = computed(() => typeDef.value.lngProperty || 'lon');

const innerValue = computed({
  get: () => props.value || {},
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

function updateField(field: string, val: null | number) {
  const newValue = { ...innerValue.value, [field]: val };
  innerValue.value = newValue;
}
</script>

<template>
  <div class="flex gap-2">
    <InputNumber
      :value="innerValue[latProp]"
      :placeholder="$t('dataType.strategies.geo.lat')"
      :disabled="isDisabled(prop)"
      class="flex-1"
      @update:value="(val) => updateField(latProp, val as number)"
      v-bind="getComponentProps(prop)"
    >
      <template #addonBefore>
        {{ $t('dataType.strategies.geo.lat') }}
      </template>
    </InputNumber>
    <InputNumber
      :value="innerValue[lngProp]"
      :placeholder="$t('dataType.strategies.geo.lon')"
      :disabled="isDisabled(prop)"
      class="flex-1"
      @update:value="(val) => updateField(lngProp, val as number)"
      v-bind="getComponentProps(prop)"
    >
      <template #addonBefore>
        {{ $t('dataType.strategies.geo.lon') }}
      </template>
    </InputNumber>
  </div>
</template>
