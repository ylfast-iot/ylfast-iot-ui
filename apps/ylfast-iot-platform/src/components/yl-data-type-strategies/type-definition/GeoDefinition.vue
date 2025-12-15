<script setup lang="ts">
import type { GeoTypeDef } from '#/types/data-type';

import { $t } from '@vben/locales';

import { Form, FormItem, Input } from 'ant-design-vue';

defineProps<{
  disabled?: boolean;
  value: GeoTypeDef;
}>();

const emit = defineEmits(['update:value', 'change']);
</script>

<template>
  <div class="geo-definition rounded border border-border bg-card p-4">
    <Form layout="vertical">
      <FormItem :label="$t('dataType.strategies.geo.latProperty')">
        <Input
          :value="value.latProperty"
          :placeholder="$t('dataType.strategies.geo.placeholders.latProperty')"
          :disabled="disabled"
          @update:value="
            (val) => {
              const newValue = { ...value, latProperty: val };
              emit('update:value', newValue);
              emit('change', newValue);
            }
          "
        />
      </FormItem>
      <FormItem :label="$t('dataType.strategies.geo.lngProperty')">
        <Input
          :value="value.lngProperty"
          :placeholder="$t('dataType.strategies.geo.placeholders.lngProperty')"
          :disabled="disabled"
          @update:value="
            (val) => {
              const newValue = { ...value, lngProperty: val };
              emit('update:value', newValue);
              emit('change', newValue);
            }
          "
        />
      </FormItem>
    </Form>
  </div>
</template>
