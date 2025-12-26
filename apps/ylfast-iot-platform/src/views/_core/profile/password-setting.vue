<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Input, message, Modal, Steps } from 'ant-design-vue';

import {
  changeSelfPassword,
  mePasswordValidate,
  passwordValidate,
} from '#/api/system/user';
import { $t } from '#/locales';
import { useAuthStore } from '#/store/auth';

const LockIcon = createIconifyIcon('lucide:lock');
const KeyIcon = createIconifyIcon('lucide:key-round');
const ShieldIcon = createIconifyIcon('lucide:shield-check');

const authStore = useAuthStore();
const current = ref(0);
const loading = ref(false);

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const steps = computed(() => [
  {
    title: $t('profile.passwordSetting.step1'),
    description: $t('profile.passwordSetting.step1Desc'),
  },
  {
    title: $t('profile.passwordSetting.step2'),
    description: $t('profile.passwordSetting.step2Desc'),
  },
  {
    title: $t('profile.passwordSetting.step3'),
    description: $t('profile.passwordSetting.step3Desc'),
  },
]);

async function handleNext() {
  if (loading.value) return;
  loading.value = true;

  try {
    switch (current.value) {
      case 0: {
        if (!formState.oldPassword) {
          message.warning($t('profile.passwordSetting.placeholderOld'));
          return;
        }
        const res = await mePasswordValidate(formState.oldPassword);
        if (res.passed) {
          current.value++;
        } else {
          message.error(
            res.reason || $t('profile.passwordSetting.validateFail'),
          );
        }

        break;
      }
      case 1: {
        if (!formState.newPassword) {
          message.warning($t('profile.passwordSetting.placeholderNew'));
          return;
        }
        if (formState.newPassword === formState.oldPassword) {
          message.warning($t('profile.passwordSetting.sameFail'));
          return;
        }
        const res = await passwordValidate(formState.newPassword);
        if (res.passed) {
          current.value++;
        } else {
          message.error(
            res.reason || $t('profile.passwordSetting.strengthFail'),
          );
        }

        break;
      }
      case 2: {
        if (!formState.confirmPassword) {
          message.warning($t('profile.passwordSetting.placeholderConfirm'));
          return;
        }
        if (formState.newPassword !== formState.confirmPassword) {
          message.error($t('profile.passwordSetting.matchFail'));
          return;
        }

        Modal.confirm({
          title: $t('profile.passwordSetting.confirmTitle'),
          content: $t('profile.passwordSetting.confirmContent'),
          okText: $t('profile.passwordSetting.confirm'),
          cancelText: $t('common.cancel'),
          centered: true,
          onOk: async () => {
            try {
              loading.value = true;
              await changeSelfPassword({
                newPassword: formState.newPassword,
                oldPassword: formState.oldPassword,
              });

              Modal.confirm({
                title: $t('profile.passwordSetting.successTitle'),
                content: $t('profile.passwordSetting.successContent'),
                okText: $t('profile.passwordSetting.relogin'),
                cancelText: $t('common.cancel'),
                centered: true,
                onOk: async () => {
                  await authStore.logout();
                },
                onCancel: () => {
                  handleReset();
                },
              });
            } catch (error) {
              console.error(error);
            } finally {
              loading.value = false;
            }
          },
        });
        break;
      }
      // No default
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handlePrev() {
  if (current.value > 0) {
    current.value--;
  }
}

function handleReset() {
  current.value = 0;
  formState.oldPassword = '';
  formState.newPassword = '';
  formState.confirmPassword = '';
}
</script>

<template>
  <div class="mx-auto max-w-3xl py-8">
    <Steps :current="current" :items="steps" class="mb-12" />

    <div class="mx-auto max-w-md">
      <!-- Step 0: Old Password -->
      <div v-if="current === 0" class="fade-in">
        <div class="mb-6 text-center">
          <h3 class="mb-2 text-xl font-medium">
            {{ $t('profile.passwordSetting.step1') }}
          </h3>
          <p class="text-gray-500">
            {{ $t('profile.passwordSetting.step1Desc') }}
          </p>
        </div>
        <Input.Password
          v-model:value="formState.oldPassword"
          size="large"
          :placeholder="$t('profile.passwordSetting.placeholderOld')"
          class="mb-8"
          @press-enter="handleNext"
        >
          <template #prefix>
            <LockIcon class="text-gray-400" />
          </template>
        </Input.Password>
      </div>

      <!-- Step 1: New Password -->
      <div v-if="current === 1" class="fade-in">
        <div class="mb-6 text-center">
          <h3 class="mb-2 text-xl font-medium">
            {{ $t('profile.passwordSetting.step2') }}
          </h3>
          <p class="text-gray-500">
            {{ $t('profile.passwordSetting.step2Desc') }}
          </p>
        </div>
        <Input.Password
          v-model:value="formState.newPassword"
          size="large"
          :placeholder="$t('profile.passwordSetting.placeholderNew')"
          class="mb-8"
          @press-enter="handleNext"
        >
          <template #prefix>
            <KeyIcon class="text-gray-400" />
          </template>
        </Input.Password>
      </div>

      <!-- Step 2: Confirm Password -->
      <div v-if="current === 2" class="fade-in">
        <div class="mb-6 text-center">
          <h3 class="mb-2 text-xl font-medium">
            {{ $t('profile.passwordSetting.step3') }}
          </h3>
          <p class="text-gray-500">
            {{ $t('profile.passwordSetting.step3Desc') }}
          </p>
        </div>
        <Input.Password
          v-model:value="formState.confirmPassword"
          size="large"
          :placeholder="$t('profile.passwordSetting.placeholderConfirm')"
          class="mb-8"
          @press-enter="handleNext"
        >
          <template #prefix>
            <ShieldIcon class="text-gray-400" />
          </template>
        </Input.Password>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between gap-4">
        <Button
          v-if="current > 0"
          size="large"
          class="w-full"
          @click="handlePrev"
        >
          {{ $t('profile.passwordSetting.prev') }}
        </Button>
        <Button
          type="primary"
          size="large"
          class="w-full"
          :loading="loading"
          @click="handleNext"
        >
          {{
            current === 2
              ? $t('profile.passwordSetting.confirm')
              : $t('profile.passwordSetting.next')
          }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
