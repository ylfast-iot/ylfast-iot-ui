<script setup lang="ts">
import { ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Alert, Modal } from 'ant-design-vue';

import RoleSelector from '#/components/business/system/role-selector.vue';

interface Props {
  open: boolean;
  providerName?: string;
  initialRoleIds?: string[];
}

const props = defineProps<Props>();
const emit = defineEmits(['update:open', 'confirm']);

// 已选中的 ID 列表
const selectedIds = ref<string[]>([]);

// 提交
function handleOk() {
  emit('confirm', [...selectedIds.value]);
  handleClose();
}

function handleClose() {
  emit('update:open', false);
}

// 监听打开状态，初始化数据
watch(
  () => props.open,
  (val) => {
    if (val) {
      selectedIds.value = [...(props.initialRoleIds || [])];
    }
  },
);
</script>

<template>
  <Modal
    :open="open"
    :title="$t('subscription.permissionControl')"
    :width="600"
    :ok-text="$t('common.action.confirm')"
    :cancel-text="$t('common.action.cancel')"
    @cancel="handleClose"
    @ok="handleOk"
  >
    <div class="flex flex-col gap-4 py-2">
      <!-- 提示 -->
      <Alert type="info">
        <template #message>
          <div
            class="flex items-start gap-2 text-[13px] text-muted-foreground/80"
          >
            <span>{{
              $t('subscription.permissionTip', { name: providerName })
            }}</span>
          </div>
        </template>
      </Alert>

      <!-- 角色选择器 -->
      <RoleSelector v-model:value="selectedIds" />
    </div>
  </Modal>
</template>

<style scoped></style>
