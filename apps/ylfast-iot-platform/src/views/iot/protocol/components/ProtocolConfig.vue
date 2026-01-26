<script setup lang="ts">
import type { ConfigMetadata } from '#/types/config-metadata';

import { computed, h, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Upload } from 'ant-design-vue';

import { uploadProtocol } from '#/api/iot/protocol';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';

import ScriptProtocolEditor from './ScriptProtocolEditor.vue';

const props = defineProps<{
  protocolType?: string;
  register?: any;
  value?: Record<string, any>;
}>();

const emit = defineEmits(['update:value', 'success']);

const UploadIcon = createIconifyIcon('lucide:upload');

const model = ref<Record<string, any>>({});
const uploading = ref(false);

// Sync prop value to model
watch(
  () => props.value,
  (val) => {
    if (val && JSON.stringify(val) !== JSON.stringify(model.value)) {
      model.value = { ...val };
    }
  },
  { deep: true, immediate: true },
);

// Sync model to prop value
watch(
  model,
  (val) => {
    emit('update:value', val);
  },
  { deep: true },
);

// Metadata definition based on type
const metadata = computed<ConfigMetadata[]>(() => {
  if (!props.protocolType) return [];

  const isJar = props.protocolType === 'jar';

  const commonLocationProp: ConfigMetadata = {
    name: '',
    properties: [
      {
        property: 'location',
        name: $t('protocol.location'),
        type: {
          type: 'STRING',
          expands: {
            required: true,
            rules: isJar
              ? [
                  {
                    required: true,
                    message: `${$t('ylConfigMetadataForm.pleaseEnter')}${$t('protocol.location')}`,
                    trigger: ['change', 'blur'],
                  },
                ]
              : undefined,
            componentProps: {
              placeholder: isJar
                ? $t('common.placeholder.input')
                : $t('protocol.absolutePath'),
              // Put button in addonAfter only for JAR
              addonAfter: isJar
                ? h(
                    Upload,
                    {
                      beforeUpload: handleUpload,
                      showUploadList: false,
                    },
                    {
                      default: () =>
                        h(
                          Button,
                          {
                            loading: uploading.value,
                            type: 'text',
                            size: 'small',
                            style: { height: '24px', padding: '0 8px' },
                          },
                          {
                            default: () => $t('common.action.upload'),
                            icon: () => h(UploadIcon, { class: 'size-4' }),
                          },
                        ),
                    },
                  )
                : undefined,
            },
          },
        },
      },
    ],
  };

  switch (props.protocolType) {
    case 'jar':
    case 'local': {
      return [commonLocationProp];
    }
    // script case removed as it uses custom component
    default: {
      return [];
    }
  }
});

// JAR Upload Handler
async function handleUpload(file: File) {
  uploading.value = true;
  try {
    const res = await uploadProtocol(file);

    // Auto-fill location with accessUrl
    if (res.accessUrl) {
      model.value = {
        ...model.value,
        location: res.accessUrl,
      };
    }

    // Use protocolInfo instead of protocols array
    if (res.protocolInfo) {
      emit('success', res.protocolInfo);
      message.success($t('common.uploadSuccess'));
    } else {
      message.warning($t('protocol.uploadNoInfo'));
    }
    return false;
  } catch (error) {
    console.error(error);
  } finally {
    uploading.value = false;
  }
}

// function beforeUpload(file: File) {
//   handleUpload(file);
//   return false;
// }
</script>

<template>
  <div class="w-full">
    <!-- Script Editor -->
    <div v-if="protocolType === 'script'">
      <ScriptProtocolEditor v-model:value="model" />
    </div>

    <!-- Metadata Form for other types -->
    <div v-else-if="protocolType">
      <YlConfigMetadataForm
        v-model:model="model"
        @register="register"
        :metadata="metadata"
        hide-root-header
        layout="vertical"
      />
    </div>

    <div v-else class="text-sm text-gray-400">
      {{ $t('protocol.selectTypeFirst') }}
    </div>
  </div>
</template>
