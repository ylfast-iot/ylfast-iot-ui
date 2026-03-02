<script setup lang="ts">
import type { SsoApi } from '#/api/system/sso';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Form, FormItem, Input, InputPassword } from 'ant-design-vue';

const props = defineProps<{
  isRegisterMode?: boolean;
  providerName?: string;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [form?: SsoApi.ApplicationSsoRegisterRequest];
}>();

const isSubmitting = ref(false);
const formRef = ref();
const formData = reactive<SsoApi.ApplicationSsoRegisterRequest>({
  username: '',
  password: '',
  name: '',
});

const rules = {
  username: [{ required: true, message: $t('login.usernamePlaceholder') }],
  password: [{ required: true, message: $t('login.passwordPlaceholder') }],
  name: [
    { required: true, message: $t('login.namePlaceholder', '请输入姓名') },
  ],
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    emit('cancel');
    modalApi.close();
  },
  onConfirm: async () => {
    isSubmitting.value = true;
    try {
      if (props.isRegisterMode && formRef.value) {
        await formRef.value.validate();
        emit('confirm', { ...formData });
      } else {
        emit('confirm');
      }
    } catch {
      // Validate Error
      isSubmitting.value = false;
      return;
    }
    isSubmitting.value = false;
    modalApi.close();
  },
});
</script>

<template>
  <Modal :title="$t('sso.bindAccountTitle')" :confirm-loading="isSubmitting">
    <div class="flex flex-col items-center justify-center p-6 text-center">
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500"
      >
        <span class="icon-[lucide--link] text-3xl"></span>
      </div>

      <h3 class="mb-2 text-lg font-medium text-gray-900">
        {{
          isRegisterMode
            ? $t('sso.bindRegisterPrompt')
            : $t('sso.bindAccountPrompt')
        }}
      </h3>

      <p class="mb-6 text-sm text-gray-500">
        <template v-if="providerName">
          {{
            isRegisterMode
              ? $t('sso.bindRegisterProviderDesc', {
                  provider: providerName || '',
                })
              : $t('sso.bindProviderDesc', { provider: providerName || '' })
          }}
        </template>
        <template v-else>
          {{
            isRegisterMode
              ? $t('sso.bindRegisterUntypedDesc')
              : $t('sso.bindUntypedDesc')
          }}
        </template>
      </p>

      <div v-if="isRegisterMode" class="mb-4 w-full text-left">
        <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
          <FormItem :label="$t('login.username')" name="username">
            <Input
              v-model:value="formData.username"
              :placeholder="$t('login.usernamePlaceholder')"
            />
          </FormItem>
          <FormItem :label="$t('login.password')" name="password">
            <InputPassword
              v-model:value="formData.password"
              :placeholder="$t('login.passwordPlaceholder')"
            />
          </FormItem>
          <FormItem :label="$t('common.name')" name="name">
            <Input
              v-model:value="formData.name"
              :placeholder="$t('common.namePlaceholder')"
            />
          </FormItem>
        </Form>
      </div>

      <div
        v-else
        class="w-full rounded-md border border-orange-100 bg-orange-50 p-4 text-left text-sm text-orange-800"
      >
        <p class="mb-1 font-medium">{{ $t('common.notice') }}</p>
        <ul class="list-disc space-y-1 pl-5">
          <li>{{ $t('sso.bindNotice1') }}</li>
          <li>{{ $t('sso.bindNotice2') }}</li>
        </ul>
      </div>
    </div>
  </Modal>
</template>
