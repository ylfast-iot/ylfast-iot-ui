<script setup lang="ts">
import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  InputPassword,
  message,
  Textarea,
  Upload,
} from 'ant-design-vue';

import { uploadCertificateFile } from '#/api/iot/certificate';

const props = defineProps<{
  authenticationMethod?: 'binomial' | 'single';
  format?: 'JKS' | 'PEM' | 'PFX';
  mode?: 'client' | 'server';
  part: 'cert' | 'key' | 'keystore' | 'trust' | 'trustKeystore';
  value?: any;
}>();

const emit = defineEmits(['update:value']);

const UploadOutlined = createIconifyIcon('ant-design:upload-outlined');
const TrashIcon = createIconifyIcon('lucide:trash-2');

const config = ref<any>(props.value || {});

// Watch for external value changes (loading from API)
watch(
  () => props.value,
  (val) => {
    if (val && JSON.stringify(val) !== JSON.stringify(config.value)) {
      config.value = { ...val };
    }
  },
  { deep: true },
);

// Specific handle function to emit ONLY the fields this part cares about
function notifyChange() {
  emit('update:value', { ...config.value });
}

async function handleUpload(file: File, field: string, isText = false) {
  try {
    if (isText) {
      const reader = new FileReader();
      reader.addEventListener('load', (e) => {
        config.value[field] = e.target?.result as string;
        notifyChange();
      });
      // eslint-disable-next-line unicorn/prefer-blob-reading-methods
      reader.readAsText(file);
    } else {
      const res = await uploadCertificateFile(file);
      config.value[field] = res;
      notifyChange();
    }
    return false;
  } catch (error: any) {
    message.error(error?.message || 'Upload failed');
    return false;
  }
}

function handleClear(field: string) {
  config.value[field] = '';
  if (field === 'keystoreBase64') config.value.keystorePwd = '';
  if (field === 'trustKeyStoreBase64') config.value.trustKeyStorePwd = '';
  notifyChange();
}

function handleInputChange() {
  notifyChange();
}
</script>

<template>
  <div class="certificate-config-form space-y-2">
    <!-- PEM Cert -->
    <template v-if="format === 'PEM' && part === 'cert'">
      <div class="group relative flex flex-col gap-2">
        <Textarea
          v-model:value="config.cert"
          :auto-size="{ minRows: 5, maxRows: 10 }"
          placeholder="-----BEGIN CERTIFICATE-----"
          class="rounded-lg bg-slate-50/30 font-mono text-xs shadow-sm transition-all focus:bg-white"
          @input="handleInputChange"
        />
        <Button
          v-if="config.cert"
          type="text"
          size="small"
          class="absolute right-2 top-2 p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          @click="handleClear('cert')"
        >
          <TrashIcon class="size-3.5" />
        </Button>
        <Upload
          accept=".crt,.cer,.pem"
          :before-upload="(file: File) => handleUpload(file, 'cert', true)"
          :show-upload-list="false"
        >
          <Button type="dashed" block class="rounded-lg">
            <template #icon><UploadOutlined /></template>
            {{ $t('certificate.tips.uploadCert') }}
          </Button>
        </Upload>
      </div>
    </template>

    <!-- PEM Key -->
    <template v-if="format === 'PEM' && part === 'key' && mode === 'server'">
      <div class="group relative flex flex-col gap-2">
        <Textarea
          v-model:value="config.key"
          :auto-size="{ minRows: 5, maxRows: 10 }"
          placeholder="-----BEGIN PRIVATE KEY-----"
          class="rounded-lg bg-slate-50/30 font-mono text-xs shadow-sm transition-all focus:bg-white"
          @input="handleInputChange"
        />
        <Button
          v-if="config.key"
          type="text"
          size="small"
          class="absolute right-2 top-2 p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          @click="handleClear('key')"
        >
          <TrashIcon class="size-3.5" />
        </Button>
        <Upload
          accept=".key,.pem"
          :before-upload="(file: File) => handleUpload(file, 'key', true)"
          :show-upload-list="false"
        >
          <Button type="dashed" block class="rounded-lg">
            <template #icon><UploadOutlined /></template>
            {{ $t('certificate.tips.uploadKey') }}
          </Button>
        </Upload>
      </div>
    </template>

    <!-- PEM Trust -->
    <template v-if="format === 'PEM' && part === 'trust' && mode === 'client'">
      <div class="group relative flex flex-col gap-2">
        <Textarea
          v-model:value="config.trust"
          :auto-size="{ minRows: 5, maxRows: 10 }"
          placeholder="-----BEGIN CERTIFICATE-----"
          class="rounded-lg bg-slate-50/30 font-mono text-xs shadow-sm transition-all focus:bg-white"
          @input="handleInputChange"
        />
        <Button
          v-if="config.trust"
          type="text"
          size="small"
          class="absolute right-2 top-2 p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          @click="handleClear('trust')"
        >
          <TrashIcon class="size-3.5" />
        </Button>
        <Upload
          accept=".crt,.cer,.pem"
          :before-upload="(file: File) => handleUpload(file, 'trust', true)"
          :show-upload-list="false"
        >
          <Button type="dashed" block class="rounded-lg">
            <template #icon><UploadOutlined /></template>
            {{ $t('certificate.tips.uploadTrust') }}
          </Button>
        </Upload>
      </div>
    </template>

    <!-- PFX / JKS Keystore -->
    <template
      v-if="(format === 'PFX' || format === 'JKS') && part === 'keystore'"
    >
      <div class="flex flex-col gap-4">
        <div class="group relative flex flex-col gap-2">
          <Textarea
            v-model:value="config.keystoreBase64"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :placeholder="$t('certificate.placeholder.keystoreBase64')"
            class="rounded-lg bg-slate-50/30 font-mono text-[11px] shadow-sm transition-all focus:bg-white"
            @input="handleInputChange"
          />
          <Button
            v-if="config.keystoreBase64"
            type="text"
            size="small"
            class="absolute right-2 top-2 p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            @click="handleClear('keystoreBase64')"
          >
            <TrashIcon class="size-3.5" />
          </Button>
          <Upload
            :accept="format === 'PFX' ? '.pfx,.p12' : '.jks,.keystore'"
            :before-upload="
              (file: File) => handleUpload(file, 'keystoreBase64')
            "
            :show-upload-list="false"
          >
            <Button type="dashed" block class="h-10 rounded-lg">
              <template #icon><UploadOutlined /></template>
              {{ $t('certificate.tips.uploadKeystore') }}
            </Button>
          </Upload>
        </div>
        <div class="flex flex-col gap-1.5">
          <span class="ml-1 text-[11px] font-medium text-slate-400">{{
            $t('certificate.fields.keystorePwd')
          }}</span>
          <InputPassword
            v-model:value="config.keystorePwd"
            :placeholder="$t('certificate.placeholder.keystorePwd')"
            class="w-full rounded-lg"
            @change="handleInputChange"
          />
        </div>
      </div>
    </template>

    <!-- PFX / JKS Trust Keystore -->
    <template
      v-if="
        (format === 'PFX' || format === 'JKS') &&
        part === 'trustKeystore' &&
        authenticationMethod === 'binomial'
      "
    >
      <div class="flex flex-col gap-4">
        <div class="group relative flex flex-col gap-2">
          <Textarea
            v-model:value="config.trustKeyStoreBase64"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :placeholder="$t('certificate.placeholder.trustKeystoreBase64')"
            class="rounded-lg bg-slate-50/30 font-mono text-[11px] shadow-sm transition-all focus:bg-white"
            @input="handleInputChange"
          />
          <Button
            v-if="config.trustKeyStoreBase64"
            type="text"
            size="small"
            class="absolute right-2 top-2 p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            @click="handleClear('trustKeyStoreBase64')"
          >
            <TrashIcon class="size-3.5" />
          </Button>
          <Upload
            :accept="format === 'PFX' ? '.pfx,.p12' : '.jks,.keystore'"
            :before-upload="
              (file: File) => handleUpload(file, 'trustKeyStoreBase64')
            "
            :show-upload-list="false"
          >
            <Button type="dashed" block class="h-10 rounded-lg">
              <template #icon><UploadOutlined /></template>
              {{ $t('certificate.tips.uploadTrustKeystore') }}
            </Button>
          </Upload>
        </div>
        <div class="flex flex-col gap-1.5">
          <span class="ml-1 text-[11px] font-medium text-slate-400">{{
            $t('certificate.fields.trustKeystorePwd')
          }}</span>
          <InputPassword
            v-model:value="config.trustKeyStorePwd"
            :placeholder="$t('certificate.placeholder.trustKeystorePwd')"
            class="w-full rounded-lg"
            @change="handleInputChange"
          />
        </div>
      </div>
    </template>
  </div>
</template>
