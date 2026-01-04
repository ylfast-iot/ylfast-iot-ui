<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Form,
  FormItem,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Textarea,
} from 'ant-design-vue';

import AccessTypeSelector from './AccessTypeSelector.vue';

// Define the shape of the source object based on DevicePropertyMetadata['source']
interface SourceData {
  accessType: string[];
  type: 'DEVICE' | 'RULE';
  rule?: {
    configuration: {
      convertScripts?: {
        decode: string;
        encode: string;
      };
      scriptEngineType?: 'javascript';
      scriptType?: 'javascript';
    };
    mode: 'advanced' | 'simple';
  };
}

const props = defineProps<{
  disabled?: boolean;
  value: SourceData;
}>();

const emit = defineEmits(['update:value', 'change']);

const SettingOutlined = createIconifyIcon('ant-design:setting-outlined');

// Local state for the value to allow immediate updates
const localValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

// Popover control
const popoverOpen = ref(false);

// Modal control
const [RuleModal, modalApi] = useVbenModal({
  title: $t('thingModel.property.ruleConfig'),
  draggable: true,
  closeOnClickModal: false,
  destroyOnClose: false,
  class: 'w-3/5',
  onConfirm: () => {
    modalApi.close();
  },
});

function handleSettingClick() {
  if (localValue.value.type === 'DEVICE') {
    popoverOpen.value = true;
  } else {
    // Initialize rule structure if missing
    if (!localValue.value.rule) {
      localValue.value.rule = {
        mode: 'simple',
        configuration: {
          scriptEngineType: 'javascript',
          scriptType: 'javascript',
          convertScripts: { decode: '', encode: '' },
        },
      };
    }
    modalApi.open();
  }
}
</script>

<template>
  <div class="flex w-full items-center gap-1">
    <RuleModal>
      <div class="flex flex-col gap-4 p-4">
        <!-- Reused Access Selector in Modal -->
        <div>
          <div class="mb-2 text-sm font-medium">
            {{ $t('thingModel.property.accessMode') }}
          </div>
          <AccessTypeSelector
            v-model:value="localValue.accessType"
            :disabled="disabled"
          />
        </div>

        <!-- Rule Config -->
        <Form layout="vertical" v-if="localValue.rule">
          <FormItem :label="$t('thingModel.property.ruleMode')">
            <RadioGroup
              v-model:value="localValue.rule.mode"
              :disabled="disabled"
            >
              <Radio value="simple">
                {{ $t('thingModel.property.ruleSimple') }}
              </Radio>
              <Radio value="advanced">
                {{ $t('thingModel.property.ruleAdvanced') }}
              </Radio>
            </RadioGroup>
          </FormItem>

          <template v-if="localValue.rule.configuration.convertScripts">
            <FormItem :label="$t('thingModel.property.ruleEncode')">
              <Textarea
                v-model:value="
                  localValue.rule.configuration.convertScripts.encode
                "
                :rows="4"
                placeholder="function encode(value) { ... }"
                :disabled="disabled"
              />
            </FormItem>
            <FormItem :label="$t('thingModel.property.ruleDecode')">
              <Textarea
                v-model:value="
                  localValue.rule.configuration.convertScripts.decode
                "
                :rows="4"
                placeholder="function decode(value) { ... }"
                :disabled="disabled"
              />
            </FormItem>
          </template>
        </Form>
      </div>
    </RuleModal>

    <Select
      v-model:value="localValue.type"
      class="!h-8 flex-1"
      :options="[
        { value: 'DEVICE', label: $t('thingModel.property.sourceDevice') },
        { value: 'RULE', label: $t('thingModel.property.sourceRule') },
      ]"
      :disabled="disabled"
    />

    <Popover
      v-model:open="popoverOpen"
      trigger="click"
      placement="bottomRight"
      overlay-class-name="source-config-popover"
      :arrow="false"
      v-if="localValue.type === 'DEVICE'"
    >
      <template #content>
        <div class="w-80 p-2">
          <div class="mb-2 text-sm font-medium">
            {{ $t('thingModel.property.accessMode') }}
          </div>
          <AccessTypeSelector
            v-model:value="localValue.accessType"
            :disabled="disabled"
          />
          <div class="mt-4 flex justify-end">
            <div
              class="cursor-pointer text-primary hover:text-primary/80"
              @click="popoverOpen = false"
            >
              {{ $t('thingModel.common.save') }}
            </div>
          </div>
        </div>
      </template>
      <div
        class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        @click.stop
      >
        <SettingOutlined />
      </div>
    </Popover>

    <!-- For RULE, we don't use Popover, just direct click to open Modal -->
    <div
      v-else
      class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      @click.stop="handleSettingClick"
    >
      <SettingOutlined />
    </div>
  </div>
</template>
