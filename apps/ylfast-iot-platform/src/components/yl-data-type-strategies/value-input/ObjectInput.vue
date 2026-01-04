<script setup lang="ts">
import type { ConfigPropertyMetadata } from '#/types/config-metadata';
import type { ObjectDef } from '#/types/data-type';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { getFormItemComponent } from './registry';

const props = defineProps<{
  disabled?: boolean;
  prop: ConfigPropertyMetadata;
  value: any;
}>();

const emit = defineEmits(['update:value', 'change']);

const typeDef = computed(() => props.prop.type as ObjectDef);

const innerValue = computed({
  get: () => props.value || {},
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

function handleChildChange(key: string, val: any) {
  const newVal = { ...innerValue.value, [key]: val };
  innerValue.value = newVal;
}

// Convert ObjectProperty to ConfigPropertyMetadata structure for child input
function getChildProp(property: any): ConfigPropertyMetadata {
  return {
    ...property,
    type: property.valueType, // Map valueType to type for the input component
  };
}
</script>

<template>
  <div
    class="object-input overflow-hidden rounded-md border border-border"
    :class="{ 'opacity-60': disabled }"
  >
    <!-- Table Header -->
    <div
      v-if="typeDef.properties && typeDef.properties.length > 0"
      class="flex border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground"
    >
      <div class="w-1/3 border-r border-border px-3 py-2">
        {{ $t('dataType.strategies.object.name') }}
      </div>
      <div class="w-24 border-r border-border px-3 py-2">
        {{ $t('dataType.strategies.object.type') }}
      </div>
      <div class="flex-1 px-3 py-2">
        {{ $t('dataType.strategies.boolean.value') }}
      </div>
    </div>

    <!-- Table Body -->
    <div
      v-if="typeDef.properties && typeDef.properties.length > 0"
      class="flex flex-col bg-background"
    >
      <div
        v-for="property in typeDef.properties"
        :key="property.id"
        class="flex min-h-[40px] items-stretch border-b border-border last:border-b-0"
      >
        <!-- Name Column -->
        <div
          class="flex w-1/3 flex-col justify-center border-r border-border px-3 py-2 text-sm"
        >
          <div class="flex items-center">
            <template v-if="property.expands?.required">
              <span class="mr-1 text-destructive">* </span>
            </template>
            <span class="font-medium">{{ property.name || property.id }}</span>
          </div>
          <div
            v-if="property.name && property.id"
            class="text-xs text-muted-foreground"
          >
            {{ property.id }}
          </div>
        </div>

        <!-- Type Column -->
        <div
          class="flex w-24 items-center border-r border-border px-3 py-2 text-xs text-muted-foreground"
        >
          {{ $t(`dataType.types.${property.valueType.type}`) }}
        </div>

        <!-- Value Column -->
        <div class="flex flex-1 items-center px-3 py-2">
          <component
            :is="getFormItemComponent(property.valueType.type)"
            v-if="getFormItemComponent(property.valueType.type)"
            :prop="getChildProp(property)"
            :value="innerValue[property.id]"
            :disabled="disabled"
            class="w-full"
            @update:value="(val: any) => handleChildChange(property.id, val)"
            @change="(val: any) => handleChildChange(property.id, val)"
          />
          <div v-else class="text-sm italic text-muted-foreground">Unknown</div>
        </div>
      </div>
    </div>
    <div v-else class="py-4 text-center text-sm text-muted-foreground">
      No properties defined.
    </div>
  </div>
</template>
