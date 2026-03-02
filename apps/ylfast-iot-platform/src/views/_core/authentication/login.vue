<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, onMounted } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Spin } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { useSsoLogin } from './hooks/useSsoLogin';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const { status, availableApps, loadApps, loginWithApp } = useSsoLogin();

onMounted(() => {
  loadApps();
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  >
    <template #third-party-login>
      <div class="mt-4 w-full sm:mx-auto md:max-w-md">
        <div v-if="status === 'loadingApps'" class="flex justify-center py-4">
          <Spin size="small" />
        </div>
        <template v-else-if="availableApps.length > 0">
          <div class="mt-4 flex items-center justify-between">
            <span
              class="w-[35%] border-b border-input dark:border-gray-600"
            ></span>
            <span
              class="whitespace-nowrap px-2 text-center text-xs uppercase text-muted-foreground"
            >
              {{ $t('authentication.otherLogin', '其他登录方式') }}
            </span>
            <span
              class="w-[35%] border-b border-input dark:border-gray-600"
            ></span>
          </div>
          <div class="mt-6 flex flex-wrap justify-center gap-8">
            <div
              v-for="app in availableApps"
              :key="app.id"
              class="flex cursor-pointer flex-col items-center justify-center opacity-80 transition-opacity hover:opacity-100"
              @click="loginWithApp(app)"
              :title="app.name"
            >
              <!-- Render Image Logo given by Backend -->
              <img
                v-if="app.logoUrl"
                :src="app.logoUrl"
                class="h-8 w-8 object-contain"
                :alt="app.name"
              />
              <!-- Fallback Icon if missing logoUrl -->
              <span
                v-else
                class="icon-[lucide--layout-grid] text-3xl text-gray-500"
              ></span>

              <span class="mt-2 text-xs text-gray-500">{{ app.name }}</span>
            </div>
          </div>
        </template>
      </div>
    </template>

    <template #to-register>
      <span></span>
    </template>
  </AuthenticationLogin>
</template>
