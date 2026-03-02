<script setup lang="ts">
import type { SubscriptionGroup } from './data';

import type { IotNotifyChannelApi } from '#/api/iot/notify/channel';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon, IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Checkbox,
  Collapse,
  CollapsePanel,
  Divider,
  Dropdown,
  Empty,
  Menu,
  MenuItem,
  message,
  Modal,
  Popconfirm,
  Spin,
  Switch,
  Tooltip,
} from 'ant-design-vue';

import {
  deleteChannel,
  disableProvider,
  enableProvider,
  getChannelsForSave,
  saveChannels,
  updateProvider,
} from '#/api/iot/notify/channel';
import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';

import ChannelDetailModal from './components/ChannelDetailModal.vue';
import ChannelWizardModal from './components/ChannelWizardModal.vue';
import PermissionModal from './components/PermissionModal.vue';
import { groupByType } from './data';

// 状态
const activeKey = ref<string[]>([]);

// 图标
const LockIcon = createIconifyIcon('lucide:lock');
const EyeIcon = createIconifyIcon('lucide:eye');
const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const ShieldCheckIcon = createIconifyIcon('lucide:shield-check');

// 加载状态
const loading = ref(false);
const groups = ref<SubscriptionGroup[]>([]);

// 当前操作的 provider
const wizardOpen = ref(false);
const detailOpen = ref(false);
const wizardMode = ref<'add' | 'edit'>('add');
const editingChannel = ref<IotNotifyChannelApi.NotifySubscriberChannel | null>(
  null,
);
const permissionOpen = ref(false);
const currentProviderId = ref('');
const activeProvider = ref<IotNotifyChannelApi.SubscriberProviderInfo | null>(
  null,
);

// 记住不再提示状态
const skipToggleConfirm = ref(
  localStorage.getItem('ylfast-iot-subscription-toggle-confirm-skip') ===
    'true',
);

/**
 * 加载全部通道数据
 */
async function loadData() {
  loading.value = true;
  try {
    const data = await getChannelsForSave();
    const grouped = groupByType(data);
    groups.value = grouped;
    // 默认展开所有
    activeKey.value = grouped.map((g) => g.typeId);
  } finally {
    loading.value = false;
  }
}

/**
 * 真正执行切换逻辑
 */
async function executeToggle(
  provider: IotNotifyChannelApi.SubscriberProviderInfo,
  checked: boolean,
) {
  try {
    if (checked) {
      const hasChannels = provider.channels && provider.channels.length > 0;
      if (hasChannels) {
        await enableProvider(provider.id);
        message.success($t('subscription.enableSuccess'));
      } else {
        // 无通道时，保存一个默认站内信通道，状态会自动设为启用
        await saveChannels([
          {
            ...provider,
            channels: [
              {
                name: '站内信',
                channelProvider: 'inside-mail',
                providerId: provider.id,
                channelConfiguration: {
                  notifierId: '',
                  templateId: '',
                },
                grant: {
                  role: {
                    idList: [],
                  },
                },
                i18nMessages: {
                  name: {
                    zh_CN: '站内信',
                    en_US: 'In-site Message',
                    zh: '站内信',
                    en: 'In-site Message',
                  },
                },
              },
            ],
            state: { value: 'enabled' } as any,
          },
        ]);
        message.success($t('subscription.enableSuccess'));
      }
    } else {
      await disableProvider(provider.id);
      message.success($t('subscription.disableSuccess'));
    }
    await loadData();
  } catch (error) {
    console.error('Toggle provider failed:', error);
    message.error(
      checked
        ? $t('subscription.enableFailed')
        : $t('subscription.disableFailed'),
    );
    await loadData(); // 刷新以重置状态
  }
}

/**
 * 启用 / 禁用订阅 (带弹窗确认)
 */
async function handleToggle(
  provider: IotNotifyChannelApi.SubscriberProviderInfo,
  checked: boolean,
) {
  if (skipToggleConfirm.value) {
    executeToggle(provider, checked);
    return;
  }

  let isSkipChecked = false;

  Modal.confirm({
    title: checked
      ? $t('subscription.toggleConfirm.enableTitle')
      : $t('subscription.toggleConfirm.disableTitle'),
    content: () =>
      h('div', { class: 'mt-2' }, [
        h(
          'p',
          checked
            ? $t('subscription.toggleConfirm.enableMessage')
            : $t('subscription.toggleConfirm.disableMessage'),
        ),
        h('div', { class: 'mt-4 flex justify-end items-center gap-2' }, [
          h(
            Checkbox,
            {
              onChange: (e: any) => {
                isSkipChecked = e.target.checked;
              },
            },
            { default: () => $t('subscription.toggleConfirm.dontShowAgain') },
          ),
        ]),
      ]),
    okText: checked
      ? $t('subscription.toggleConfirm.enableTitle')
      : $t('subscription.toggleConfirm.disableTitle'),
    cancelText: $t('common.cancel'),
    onOk: async () => {
      if (isSkipChecked) {
        skipToggleConfirm.value = true;
        localStorage.setItem(
          'ylfast-iot-subscription-toggle-confirm-skip',
          'true',
        );
      }
      await executeToggle(provider, checked);
    },
    onCancel: () => {
      // 重新加载数据以还原 Switch 状态
      loadData();
    },
  });
}

/**
 * 打开新增向导
 */
function handleAdd(providerId: string) {
  currentProviderId.value = providerId;
  wizardMode.value = 'add';
  editingChannel.value = null;
  wizardOpen.value = true;
}

/**
 * 查看通道
 */
function handleView(
  providerId: string,
  channel: IotNotifyChannelApi.NotifySubscriberChannel,
) {
  currentProviderId.value = providerId;
  editingChannel.value = channel;
  detailOpen.value = true;
}

/**
 * 编辑通道
 */
function handleEdit(
  providerId: string,
  channel: IotNotifyChannelApi.NotifySubscriberChannel,
) {
  currentProviderId.value = providerId;
  wizardMode.value = 'edit';
  editingChannel.value = channel;
  wizardOpen.value = true;
}

/**
 * 删除通道
 */
async function handleDeleteChannel(channelId: string) {
  await deleteChannel(channelId);
  message.success($t('subscription.deleteSuccess'));
  await loadData();
}

/**
 * 向导完成回调
 */
function handleWizardSuccess() {
  wizardOpen.value = false;
  loadData();
}

/**
 * 打开权限控制弹窗
 */
function handleOpenPermission(
  provider: IotNotifyChannelApi.SubscriberProviderInfo,
) {
  activeProvider.value = provider;
  permissionOpen.value = true;
}

/**
 * 保存权限设置
 */
async function handleSavePermission(roleIds: string[]) {
  if (!activeProvider.value) return;

  loading.value = true;
  try {
    const updatedProvider = {
      ...activeProvider.value,
      grant: {
        ...activeProvider.value.grant,
        role: {
          idList: roleIds,
        },
      },
    };
    await updateProvider(activeProvider.value.id, updatedProvider);
    message.success($t('subscription.updateSuccess'));
    permissionOpen.value = false;
    await loadData();
  } catch (error) {
    console.error('Update provider permission failed:', error);
    message.error($t('common.updateFailed'));
  } finally {
    loading.value = false;
  }
}

/**
 * 获取通道对应的图标
 */
function getChannelIcon(channelProvider: string): string {
  if (channelProvider === 'inside-mail') return 'mingcute:mail-open-line';
  // 从服务商枚举中查找匹配 subscriberProviderId 的项
  const providerEnum = Object.values(NOTIFY_PROVIDER_ENUMS).find(
    (p) => p.subscriberProviderId === channelProvider,
  );
  return providerEnum?.icon || 'lucide:bell';
}

/**
 * 获取通道对应的颜色
 */
function getChannelColor(channelProvider: string): string {
  // 从服务商枚举中查找匹配 subscriberProviderId 的项
  const providerEnum = Object.values(NOTIFY_PROVIDER_ENUMS).find(
    (p) => p.subscriberProviderId === channelProvider,
  );
  return providerEnum?.color || 'blue';
}

/**
 * 获取通道对应的名称
 */
function getChannelLabel(channelProvider: string): string {
  const providerEnums = NOTIFY_PROVIDER_ENUMS as any;
  const typeEnums = NOTIFY_TYPE_ENUMS as any;

  // 1. 尝试从服务商配置找
  if (providerEnums[channelProvider]) {
    return providerEnums[channelProvider].label;
  }

  // 2. 尝试从通知类型映射找
  const typeConfig = Object.values(typeEnums).find(
    (t: any) => t.subscriberProviderId === channelProvider,
  ) as any;

  return typeConfig?.label || channelProvider;
}

/**
 * 获取分组名称（带翻译）
 */
function getGroupLabel(group: SubscriptionGroup): string {
  const typeEnums = NOTIFY_TYPE_ENUMS as any;
  return typeEnums[group.typeId]?.label || group.typeName;
}

/**
 * 获取提供商名称（带翻译）
 */
function getProviderLabel(
  provider: IotNotifyChannelApi.SubscriberProviderInfo,
): string {
  const typeEnums = NOTIFY_TYPE_ENUMS as any;
  const typeConfig = Object.values(typeEnums).find(
    (t: any) => t.subscriberProviderId === provider.id,
  ) as any;

  return typeConfig?.label || provider.name;
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading" wrapper-class-name="h-full bg-white">
      <div class="min-h-full p-6">
        <!-- 顶部提示 -->
        <Alert
          type="info"
          show-icon
          :message="$t('subscription.description')"
          class="mb-6"
        />

        <!-- 分组列表 (Collapse) -->
        <div v-if="groups.length > 0">
          <Collapse v-model:active-key="activeKey" expand-icon-position="end">
            <CollapsePanel v-for="group in groups" :key="group.typeId">
              <template #header>
                <div class="flex items-center gap-3 py-1">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-base font-bold text-foreground">
                      {{ getGroupLabel(group) }}
                    </span>
                    <span
                      class="text-[11px] font-normal leading-tight text-muted-foreground"
                    >
                      {{ $t('subscription.tip') }}
                    </span>
                  </div>
                </div>
              </template>

              <!-- Provider 内容 -->
              <div class="overflow-hide flex flex-col gap-3 bg-white">
                <div
                  v-for="provider in group.providers.filter(
                    (p) => p.id !== 'inside-mail',
                  )"
                  :key="provider.id"
                  class="group flex items-center rounded-md border border-border/50 bg-background/30 px-4 py-3 transition-all hover:bg-muted/30"
                >
                  <!-- 名称 + Switch -->
                  <div class="flex min-w-[180px] items-center gap-3">
                    <span class="text-sm font-medium text-foreground">
                      {{ getProviderLabel(provider) }}
                    </span>
                    <Switch
                      :checked="provider.state?.value === 'enabled'"
                      size="small"
                      @change="
                        (checked: any) => handleToggle(provider, !!checked)
                      "
                    />
                    <!-- 权限控制按钮 -->
                    <div
                      class="group/perm ml-3 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1 transition-all"
                      :class="[
                        provider.state?.value === 'enabled'
                          ? 'hover:bg-primary/5'
                          : 'pointer-events-none cursor-not-allowed opacity-50 grayscale',
                      ]"
                      @click="handleOpenPermission(provider)"
                    >
                      <div
                        class="flex size-7 items-center justify-center rounded-lg transition-all"
                        :class="[
                          provider.state?.value === 'enabled'
                            ? provider.grant?.role?.idList?.length
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground/60',
                        ]"
                      >
                        <ShieldCheckIcon
                          v-if="provider.grant?.role?.idList?.length"
                          class="size-4.5"
                        />
                        <LockIcon v-else class="size-4.5" />
                      </div>
                      <span
                        class="text-[12px] font-medium leading-tight"
                        :class="[
                          provider.state?.value === 'enabled'
                            ? 'text-muted-foreground group-hover/perm:text-primary'
                            : 'text-muted-foreground/60',
                        ]"
                      >
                        {{ $t('subscription.permissionControl') }}
                      </span>
                    </div>
                  </div>

                  <!-- 弹性间隔 -->
                  <div class="flex-1"></div>

                  <!-- 已配置的通道图标列表 -->
                  <div class="flex items-center gap-4">
                    <template
                      v-for="channel in provider.channels"
                      :key="channel.id"
                    >
                      <Dropdown
                        :trigger="['click']"
                        :disabled="channel.channelProvider === 'inside-mail'"
                      >
                        <Tooltip
                          :title="
                            channel.name ||
                            getChannelLabel(channel.channelProvider)
                          "
                        >
                          <div
                            class="group/channel flex cursor-pointer flex-col items-center gap-1.5"
                          >
                            <div
                              class="flex size-10 items-center justify-center rounded-xl transition-all group-hover/channel:scale-105 group-hover/channel:shadow-sm"
                              :class="[
                                provider.state?.value === 'enabled'
                                  ? `bg-${getChannelColor(channel.channelProvider)}-500/10 text-${getChannelColor(channel.channelProvider)}-500`
                                  : 'bg-muted/50 font-medium text-muted-foreground/80 opacity-90 grayscale',
                                provider.state?.value === 'enabled' &&
                                  `dark:bg-${getChannelColor(channel.channelProvider)}-500/20`,
                              ]"
                            >
                              <IconifyIcon
                                :icon="getChannelIcon(channel.channelProvider)"
                                class="size-6"
                              />
                            </div>
                            <span
                              class="text-[11px] font-medium leading-tight transition-colors"
                              :class="
                                provider.state?.value === 'enabled'
                                  ? 'text-muted-foreground group-hover/channel:text-foreground'
                                  : 'text-muted-foreground/70'
                              "
                            >
                              {{
                                channel.name ||
                                getChannelLabel(channel.channelProvider)
                              }}
                            </span>
                          </div>
                        </Tooltip>
                        <template #overlay>
                          <Menu>
                            <MenuItem
                              key="view"
                              @click="handleView(provider.id, channel)"
                            >
                              <div class="flex items-center gap-2">
                                <EyeIcon class="size-3.5" />
                                <span>{{
                                  $t('subscription.action.view')
                                }}</span>
                              </div>
                            </MenuItem>
                            <MenuItem
                              key="edit"
                              @click="handleEdit(provider.id, channel)"
                            >
                              <div class="flex items-center gap-2">
                                <EditIcon class="size-3.5" />
                                <span>{{
                                  $t('subscription.action.edit')
                                }}</span>
                              </div>
                            </MenuItem>
                            <Divider class="!my-1" />
                            <Popconfirm
                              :title="$t('common.action.confirmDelete')"
                              @confirm="handleDeleteChannel(channel.id!)"
                            >
                              <MenuItem key="delete" class="!text-rose-500">
                                <div class="flex items-center gap-2">
                                  <TrashIcon class="size-3.5" />
                                  <span>{{
                                    $t('subscription.action.delete')
                                  }}</span>
                                </div>
                              </MenuItem>
                            </Popconfirm>
                          </Menu>
                        </template>
                      </Dropdown>
                    </template>
                  </div>

                  <!-- 新增按钮 -->
                  <Tooltip :title="$t('subscription.addChannel')">
                    <div
                      class="group/add ml-2 flex h-[61px] w-[61px] flex-col items-center justify-center self-start rounded-xl border border-dashed border-border text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                      @click="handleAdd(provider.id)"
                    >
                      <IconifyIcon icon="lucide:plus" class="size-6" />
                    </div>
                  </Tooltip>
                </div>
              </div>
            </CollapsePanel>
          </Collapse>
        </div>

        <!-- 空状态 -->
        <div
          v-else-if="!loading"
          class="flex flex-col items-center justify-center py-20"
        >
          <Empty :description="$t('subscription.noChannels')" />
        </div>
      </div>
    </Spin>

    <!-- 配置向导弹框 -->
    <ChannelWizardModal
      v-model:open="wizardOpen"
      :provider-id="currentProviderId"
      :mode="wizardMode"
      :data="editingChannel"
      @success="handleWizardSuccess"
    />

    <!-- 详情弹窗 -->
    <ChannelDetailModal v-model:open="detailOpen" :data="editingChannel" />

    <!-- 角色权限弹窗 -->
    <PermissionModal
      v-model:open="permissionOpen"
      :provider-name="activeProvider ? getProviderLabel(activeProvider) : ''"
      :initial-role-ids="activeProvider?.grant?.role?.idList"
      @confirm="handleSavePermission"
    />
  </Page>
</template>

<style scoped></style>
