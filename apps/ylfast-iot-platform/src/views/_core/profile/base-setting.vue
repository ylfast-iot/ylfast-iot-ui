<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { UserDetail } from '#/adapter/hsweb/user';

import { computed, onMounted, ref } from 'vue';

import { z } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { Button, DatePicker, Input, message, Textarea } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getUserInfoApi } from '#/api';
import { saveUserDetails } from '#/api/system/user';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const CheckIcon = createIconifyIcon('lucide:check');
const XIcon = createIconifyIcon('lucide:x');

const userInfo = ref<Partial<UserDetail>>({});
const activeKey = ref<null | string>(null);
const tempValue = ref<any>(null);
const saving = ref(false);

interface FieldConfig {
  icon: any;
  key: keyof UserDetail;
  label: string;
  type: 'date' | 'input' | 'textarea';
  validator?: z.ZodTypeAny;
}

const fields = computed<FieldConfig[]>(() => [
  {
    icon: createIconifyIcon('lucide:user'),
    key: 'realName',
    label: $t('profile.info.name'),
    type: 'input',
    validator: z
      .string()
      .min(1, $t('profile.validation.required', [$t('profile.info.name')])),
  },
  {
    icon: createIconifyIcon('lucide:mail'),
    key: 'email',
    label: $t('profile.info.email'),
    type: 'input',
    validator: z.string().email($t('profile.validation.email')).optional(),
  },
  {
    icon: createIconifyIcon('lucide:phone'),
    key: 'telephone',
    label: $t('profile.info.phone'),
    type: 'input',
    validator: z
      .string()
      .regex(/^1[3-9]\d{9}$/, $t('profile.validation.phone'))
      .optional(),
  },
  {
    icon: createIconifyIcon('lucide:id-card'),
    key: 'idNumber',
    label: $t('profile.info.idCard'),
    type: 'input',
    validator: z
      .string()
      .regex(
        /(^\d{15}$)|(^\d{18}$)|(^\d{17}[\dX]$)/i,
        $t('profile.validation.idCard'),
      )
      .optional(),
  },
  {
    icon: createIconifyIcon('lucide:building'),
    key: 'company',
    label: $t('profile.info.company'),
    type: 'input',
  },
  {
    icon: createIconifyIcon('lucide:calendar'),
    key: 'birthday',
    label: $t('profile.info.birthday'),
    type: 'date',
  },
  {
    icon: createIconifyIcon('lucide:info'),
    key: 'description',
    label: $t('profile.info.bio'),
    type: 'textarea',
  },
]);

onMounted(async () => {
  await fetchUserData();
});

async function fetchUserData() {
  const data = await getUserInfoApi();
  userInfo.value = data;
}

function startEdit(key: string, value: any) {
  activeKey.value = key;
  tempValue.value = key === 'birthday' && value ? dayjs(value) : value;
}

function cancelEdit() {
  activeKey.value = null;
  tempValue.value = null;
}

async function handleSave(key: string) {
  const config = fields.value.find((f) => f.key === key);
  if (!config) return;

  if (config.validator) {
    const result = config.validator.safeParse(tempValue.value);
    if (!result.success) {
      message.error(result.error.errors[0]?.message);
      return;
    }
  }

  const currentData = { ...userInfo.value };
  let finalValue = tempValue.value;
  if (config.type === 'date' && finalValue) {
    finalValue = (finalValue as Dayjs).valueOf();
  }

  if (key === 'realName') {
    (currentData as any).name = finalValue;
  }

  const payload = {
    ...currentData,
    [key]: finalValue,
  };

  const safePayload = {
    avatar: payload.avatar,
    birthday: payload.birthday,
    company: payload.company,
    description: payload.description,
    email: payload.email,
    idNumber: payload.idNumber,
    name: payload.name || payload.realName,
    realName: payload.realName,
    telephone: payload.telephone,
  };

  try {
    saving.value = true;
    await saveUserDetails(safePayload);
    message.success($t('profile.info.updateSuccess'));
    userInfo.value = { ...userInfo.value, [key]: finalValue };
    if (key === 'realName') {
      userInfo.value.name = finalValue;
    }
    emit('success');
    cancelEdit();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

function formatDate(val: number | string | undefined) {
  return val ? dayjs(val).format('YYYY-MM-DD') : $t('profile.info.notSet');
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="item in fields"
      :key="item.key"
      class="flex flex-col gap-4 rounded-lg border p-4 transition-all hover:border-blue-200 hover:bg-blue-50/10 md:flex-row md:items-center md:justify-between"
    >
      <!-- Left Side: Icon, Label and Value -->
      <div class="flex flex-1 items-start gap-3">
        <div class="mt-1 shrink-0 text-gray-400">
          <component :is="item.icon" class="size-5" />
        </div>

        <div class="flex-1 space-y-1">
          <div class="text-base font-medium text-gray-800 dark:text-gray-200">
            {{ item.label }}
          </div>

          <div v-if="activeKey !== item.key" class="text-sm text-gray-500">
            <template v-if="item.type === 'date'">
              {{ formatDate(userInfo[item.key] as number) }}
            </template>
            <template v-else-if="item.type === 'textarea'">
              <div class="whitespace-pre-wrap">
                {{ userInfo[item.key] || $t('profile.info.notSet') }}
              </div>
            </template>
            <template v-else>
              {{ userInfo[item.key] || $t('profile.info.notSet') }}
            </template>
          </div>

          <!-- Edit Form in the middle -->
          <div v-else class="mt-2 w-full md:mt-0">
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <Input
                  v-if="item.type === 'input'"
                  v-model:value="tempValue"
                  :placeholder="`请输入${item.label}`"
                  size="large"
                  @press-enter="handleSave(item.key)"
                />
                <Textarea
                  v-else-if="item.type === 'textarea'"
                  v-model:value="tempValue"
                  :auto-size="{ minRows: 3, maxRows: 6 }"
                  :placeholder="`请输入${item.label}`"
                  size="large"
                />
                <DatePicker
                  v-else-if="item.type === 'date'"
                  v-model:value="tempValue"
                  class="w-full"
                  format="YYYY-MM-DD"
                  size="large"
                  :allow-clear="false"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Actions -->
      <div class="flex shrink-0 items-center justify-end gap-2 md:ml-4">
        <template v-if="activeKey === item.key">
          <Button
            :loading="saving"
            shape="circle"
            type="primary"
            @click="handleSave(item.key)"
          >
            <template #icon><CheckIcon /></template>
          </Button>
          <Button shape="circle" class="text-gray-400" @click="cancelEdit">
            <template #icon><XIcon /></template>
          </Button>
        </template>
        <template v-else>
          <Button type="link" @click="startEdit(item.key, userInfo[item.key])">
            {{ $t('profile.info.edit') }}
          </Button>
        </template>
      </div>
    </div>
  </div>
</template>
