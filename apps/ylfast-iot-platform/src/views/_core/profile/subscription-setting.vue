<script setup lang="ts">
import type { UserDetail } from '#/adapter';
import type { IotNotifyChannelApi } from '#/api/iot/notify/channel';
import type { IotNotificationApi } from '#/api/iot/notify/notification';
import type { BuiltinApplicationProvider } from '#/enums/application';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Collapse,
  CollapsePanel,
  Empty,
  Input,
  message,
  Modal,
  Popover,
  Spin,
} from 'ant-design-vue';

import { getUserInfoApi } from '#/api';
import { getAccessibleChannels } from '#/api/iot/notify/channel';
import { doSubscribe, querySubscription } from '#/api/iot/notify/notification';
import { queryAppBindingsMe, SsoApi } from '#/api/system/sso';
import { saveUserDetails } from '#/api/system/user';
import { APPLICATION_PROVIDER_ENUMS } from '#/enums/application';
import { NOTIFY_PROVIDER_ENUMS, NOTIFY_TYPE_ENUMS } from '#/enums/notify';
import { componentKeys } from '#/views/_core/profile/enums';

type BoundApplicationInfo = SsoApi.BoundApplicationInfo;

// 定义接口，复用 channel 结构以便于分类和渲染
interface SubscriptionGroup {
  typeId: string;
  typeName: string;
  providers: IotNotifyChannelApi.SubscriberProviderInfo[];
}

// 事件
const emit = defineEmits(['route']);
// 状态
const activeKey = ref<string[]>([]);
const loading = ref(false);
const groups = ref<SubscriptionGroup[]>([]);
const userSubscriptions = ref<IotNotificationApi.IotNotifySubscriberEntity[]>(
  [],
);
const popoverState = ref<Record<string, boolean>>({});
const userInfo = ref<Partial<UserDetail>>({});
const dingTalkInfo = ref<BoundApplicationInfo>();
const wxTalkInfo = ref<BoundApplicationInfo>();

// 弹窗状态
const boundAccountModalVisible = ref(false);
const boundAccountSaving = ref(false);
const currentProviderId = ref<string>('');
const newBoundAccountValue = ref<string>('');
const boundAccountLabel = ref<string>('');

/**
 * 获取用户的订阅配置
 */
async function loadUserSubscriptions() {
  try {
    const res = await querySubscription({
      pageIndex: 0,
      pageSize: 9999,
      paging: false,
    });
    userSubscriptions.value = res.data || [];
  } catch (error) {
    console.error('Failed to load user subscriptions:', error);
  }
}

/**
 * 分组处理数据
 */
function groupByType(
  providers: IotNotifyChannelApi.SubscriberProviderInfo[],
): SubscriptionGroup[] {
  const groupMap = new Map<string, SubscriptionGroup>();
  providers.forEach((provider) => {
    // 还需要过滤掉不存在任何通道提供商的通道，因为没有配置通道也无法订阅
    if (!provider.channels || provider.channels.length === 0) return;

    const typeId = provider.type?.id || 'unknown';
    const typeName = provider.type?.name || typeId;
    if (!groupMap.has(typeId)) {
      groupMap.set(typeId, {
        typeId,
        typeName,
        providers: [],
      });
    }

    if (provider.channels.length > 0) {
      groupMap.get(typeId)!.providers.push(provider);
    }
  });

  return [...groupMap.values()].sort((a, b) =>
    a.typeName.localeCompare(b.typeName),
  );
}

/**
 * 加载可用通道和订阅数据
 */
async function loadData() {
  loading.value = true;
  try {
    // 1. 获取所有可用通道
    const channelsData = await getAccessibleChannels();
    const grouped = groupByType(channelsData);
    groups.value = grouped;
    // 默认展开所有
    activeKey.value = grouped.map((g) => g.typeId);

    // 2. 获取用户订阅
    await loadUserSubscriptions();

    // 3. 获取用户自身的基本信息
    userInfo.value = await getUserInfoApi();

    // 4. 加载当前用户绑定信息
    const info = await getCurBindInfo();
    dingTalkInfo.value = info?.dingTalk;
    wxTalkInfo.value = info?.wx;
  } finally {
    loading.value = false;
  }
}

/**
 * 检查当前通道是否已被用户订阅
 */
function isSubscribed(
  provider: string,
  channelId: string | undefined,
): boolean {
  if (!channelId) return false;
  // 查找对应 providerId (也就是topicProvider) 的订阅记录
  const subscription = userSubscriptions.value.find(
    (s) => s.topicProvider === provider,
  );
  if (!subscription || !subscription.notifyChannels) return false;

  return subscription.notifyChannels.includes(channelId);
}

/**
 * 切换订阅状态
 */
async function toggleSubscription(
  provider: IotNotifyChannelApi.SubscriberProviderInfo,
  channel: IotNotifyChannelApi.NotifySubscriberChannel,
) {
  if (!channel.id) return;

  const providerId = provider.provider;
  const channelId = channel.id;

  let subscription = userSubscriptions.value.find(
    (s) => s.topicProvider === providerId,
  );
  let isSub = false;
  let newChannels: string[] = [];

  if (subscription) {
    if (subscription.notifyChannels) {
      isSub = subscription.notifyChannels.includes(channelId);
      // eslint-disable-next-line unicorn/prefer-ternary
      if (isSub) {
        // 取消订阅
        newChannels = subscription.notifyChannels.filter(
          (id) => id !== channelId,
        );
      } else {
        // 添加订阅
        newChannels = [...subscription.notifyChannels, channelId];
      }
    } else {
      isSub = false;
      newChannels = [channelId];
    }
  } else {
    // 全新订阅记录
    isSub = false;
    newChannels = [channelId];
    subscription = {
      topicProvider: providerId,
      subscribeName: getProviderLabel(provider),
      topicName: getProviderLabel(provider),
      notifyChannels: [],
    };
  }

  try {
    const payload = {
      ...subscription,
      notifyChannels: newChannels,
    };

    await doSubscribe([payload]);
    if (isSub) {
      message.success($t('profile.subscriptions.unsubscribeSuccess'));
    } else {
      message.success($t('profile.subscriptions.subscribeSuccess'));
    }

    // 刷新订阅信息
    await loadUserSubscriptions();
  } catch (error) {
    console.error('Toggle subscription failed', error);
  }
}

/**
 * 处理通道点击操作
 */
function handleChannelClick(
  provider: IotNotifyChannelApi.SubscriberProviderInfo,
  channel: IotNotifyChannelApi.NotifySubscriberChannel,
) {
  if (!channel.id) return;
  toggleSubscription(provider, channel);
  popoverState.value[channel.id] = false;
}

/**
 * 处理点击更换绑定账号操作
 */
function handleChangeBoundAccountClick(
  channel: IotNotifyChannelApi.NotifySubscriberChannel,
) {
  if (channel.id) {
    popoverState.value[channel.id] = false;
  }
  openChangeBoundAccountModal(channel.channelProvider);
}

/**
 * 获取当前绑定信息
 */
async function getCurBindInfo() {
  // 获取绑定
  const res = await queryAppBindingsMe();

  if (res && res.length > 0) {
    // 找到应用提供

    const getProvider = (provider: BuiltinApplicationProvider) => {
      const bindings = res.filter(
        (b) => b.provider === APPLICATION_PROVIDER_ENUMS[provider].value,
      );
      if (bindings && bindings.length > 0) {
        // 默认取第一个
        return bindings[0];
      }
    };

    return {
      wx: getProvider('wechat-webapp'),
      dingTalk: getProvider('dingtalk-ent-app'),
    };
  }
}

/**
 * 打开绑定账号修改弹框
 */
async function openChangeBoundAccountModal(channelProvider: string) {
  currentProviderId.value = channelProvider;

  if (channelProvider === 'notifier-email') {
    boundAccountLabel.value = $t('profile.info.email');
    newBoundAccountValue.value = userInfo.value.email || '';
  } else if (
    channelProvider === 'notifier-sms' ||
    channelProvider === 'notifier-voice' ||
    channelProvider === 'notifier-dingTalk' ||
    channelProvider === 'notifier-wechat'
  ) {
    // 短信、语音、钉钉、微信 通常绑定手机号，或者根据实际业务来区分
    if (
      channelProvider === 'notifier-dingTalk' ||
      channelProvider === 'notifier-wechat'
    ) {
      emit('route', componentKeys.binding);
      return;
    }
    boundAccountLabel.value = $t('profile.info.phone');
    newBoundAccountValue.value = userInfo.value.telephone || '';
  } else {
    // 默认回退
    boundAccountLabel.value = '账号';
    newBoundAccountValue.value = '';
  }

  boundAccountModalVisible.value = true;
}

/**
 * 保存绑定的账号信息
 */
async function saveBoundAccount() {
  if (!newBoundAccountValue.value) {
    message.warning(`请输入${boundAccountLabel.value}`);
    return;
  }

  // 简单的校验逻辑，可根据需要加严
  if (
    currentProviderId.value === 'notifier-email' &&
    !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(newBoundAccountValue.value)
  ) {
    message.warning($t('profile.validation.email'));
    return;
  }
  if (
    (currentProviderId.value === 'notifier-sms' ||
      currentProviderId.value === 'notifier-voice') &&
    !/^1[3-9]\d{9}$/.test(newBoundAccountValue.value)
  ) {
    message.warning($t('profile.validation.phone'));
    return;
  }

  try {
    boundAccountSaving.value = true;

    // 构造 payload，只更新特定的字段
    const payload: any = { ...userInfo.value };

    if (currentProviderId.value === 'notifier-email') {
      payload.email = newBoundAccountValue.value;
    } else {
      // 其他全归到手机号
      payload.telephone = newBoundAccountValue.value;
    }

    // 还需要确保必填项 name 或 realName 存在
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

    await saveUserDetails(safePayload);
    message.success($t('profile.info.updateSuccess'));

    // 更新本地状态
    if (currentProviderId.value === 'notifier-email') {
      userInfo.value.email = newBoundAccountValue.value;
    } else {
      userInfo.value.telephone = newBoundAccountValue.value;
    }

    // 关闭所有 popover，因为弹框覆盖在 popover 之上，改完关掉弹框更好看
    Object.keys(popoverState.value).forEach(
      (k) => (popoverState.value[k] = false),
    );

    boundAccountModalVisible.value = false;
  } catch (error) {
    console.error('Failed to save bound account', error);
  } finally {
    boundAccountSaving.value = false;
  }
}

/**
 * 获取通道绑定的账号信息
 */
function getBoundAccount(channelProvider: string) {
  if (channelProvider === 'notifier-email') return userInfo.value.email;
  if (
    channelProvider === 'notifier-sms' ||
    channelProvider === 'notifier-voice'
  )
    return userInfo.value.telephone;
  // 其他扩展通道的账号获取逻辑...

  if (channelProvider === 'notifier-dingTalk' && dingTalkInfo.value) {
    return `已绑定钉钉账号（${dingTalkInfo.value.others.username}）`;
  }
  return undefined;
}

/**
 * 获取通道对应的图标
 */
function getChannelIcon(channelProvider: string): string {
  if (channelProvider === 'inside-mail') return 'mingcute:mail-open-line';
  const providerEnum = Object.values(NOTIFY_PROVIDER_ENUMS).find(
    (p) => p.subscriberProviderId === channelProvider,
  );
  return providerEnum?.icon || 'lucide:bell';
}

/**
 * 获取通道对应的颜色
 */
function getChannelColor(channelProvider: string): string {
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

  if (providerEnums[channelProvider]) {
    return providerEnums[channelProvider].label;
  }

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
  if (typeEnums[group.typeId]) {
    return typeEnums[group.typeId].label;
  }
  return group.typeName;
}

/**
 * 获取提供商名称（带翻译）
 */
function getProviderLabel(provider: any): string {
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
  <Spin :spinning="loading" wrapper-class-name="h-full">
    <div class="h-full">
      <!-- 顶部提示 -->
      <Alert
        type="info"
        show-icon
        :message="$t('profile.subscriptions.description')"
        class="mb-6"
      />

      <!-- 分组列表 (Collapse) -->
      <div v-if="groups.length > 0">
        <Collapse v-model:active-key="activeKey" expand-icon-position="end">
          <CollapsePanel v-for="group in groups" :key="group.typeId">
            <template #header>
              <div class="flex items-center gap-3 py-1">
                <span class="text-base font-bold text-foreground">
                  {{ getGroupLabel(group) }}
                </span>
              </div>
            </template>

            <!-- Provider 内容 -->
            <div class="overflow-hide flex flex-col gap-3">
              <div
                v-for="provider in group.providers"
                :key="provider.id"
                class="group flex items-center rounded-md border border-border/50 bg-background/30 px-4 py-3 transition-all hover:bg-muted/30"
              >
                <!-- 名称 -->
                <div class="flex min-w-[150px] items-center gap-3">
                  <span class="text-sm font-medium text-foreground">
                    {{ getProviderLabel(provider) }}
                  </span>
                </div>

                <!-- 弹性间隔 -->
                <div class="flex-1"></div>

                <!-- 已配置的通道图标列表 -->
                <div class="flex items-center gap-4">
                  <template
                    v-for="channel in provider.channels"
                    :key="channel.id"
                  >
                    <Popover
                      v-model:open="popoverState[channel.id!]"
                      trigger="click"
                      placement="top"
                      :overlay-inner-style="{
                        padding: '8px 4px',
                        borderRadius: '8px',
                      }"
                    >
                      <template #content>
                        <div
                          v-if="channel.channelProvider !== 'inside-mail'"
                          class="min-w-[320px] px-6 py-4"
                        >
                          <div
                            class="mb-8 flex items-center text-[14px] font-medium text-foreground"
                          >
                            <span class="text-muted-foreground">
                              {{ $t('profile.subscriptions.boundAccount') }}:
                            </span>
                            <span>{{
                              getBoundAccount(channel.channelProvider) ||
                              $t('profile.subscriptions.notBound')
                            }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <Button
                              class="flex-1 !rounded-md"
                              :class="
                                isSubscribed(provider.provider, channel.id)
                                  ? ''
                                  : '!border-primary/50 text-foreground'
                              "
                              size="small"
                              @click="handleChannelClick(provider, channel)"
                            >
                              {{
                                isSubscribed(provider.provider, channel.id)
                                  ? $t('profile.subscriptions.unsubscribe')
                                  : $t('profile.subscriptions.subscribe')
                              }}
                            </Button>
                            <Button
                              type="primary"
                              class="flex-1 !rounded-md border-none !bg-indigo-500 hover:!bg-indigo-600"
                              size="small"
                              @click="handleChangeBoundAccountClick(channel)"
                            >
                              {{
                                $t('profile.subscriptions.changeBoundAccount')
                              }}
                            </Button>
                          </div>
                        </div>
                        <div
                          v-else
                          class="cursor-pointer rounded-md px-5 py-2.5 text-center text-[14px] font-medium text-primary transition-colors hover:bg-primary/5"
                          @click="handleChannelClick(provider, channel)"
                        >
                          {{
                            isSubscribed(provider.provider, channel.id)
                              ? $t('profile.subscriptions.unsubscribe')
                              : $t('profile.subscriptions.subscribe')
                          }}
                        </div>
                      </template>
                      <div
                        class="group/channel flex cursor-pointer flex-col items-center gap-1.5"
                      >
                        <div
                          class="flex size-10 items-center justify-center rounded-xl transition-all group-hover/channel:scale-105 group-hover/channel:shadow-sm"
                          :class="[
                            isSubscribed(provider.provider, channel.id)
                              ? `bg-${getChannelColor(channel.channelProvider)}-500/10 text-${getChannelColor(channel.channelProvider)}-500 dark:bg-${getChannelColor(channel.channelProvider)}-500/20`
                              : 'bg-muted/50 text-muted-foreground/50 opacity-80 grayscale',
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
                            isSubscribed(provider.provider, channel.id)
                              ? 'text-foreground'
                              : 'w-[max-content] text-muted-foreground/60'
                          "
                        >
                          {{
                            channel.name ||
                            getChannelLabel(channel.channelProvider)
                          }}
                        </span>
                      </div>
                    </Popover>
                  </template>
                </div>
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
        <Empty :description="$t('profile.subscriptions.noChannels')" />
      </div>
    </div>

    <!-- 修改绑定账号弹窗 -->
    <Modal
      v-model:open="boundAccountModalVisible"
      :title="$t('profile.subscriptions.changeBoundAccount')"
      :confirm-loading="boundAccountSaving"
      @ok="saveBoundAccount"
    >
      <div class="pb-2 pt-4">
        <div class="mb-2 text-sm text-foreground/80">
          请输入新的 {{ boundAccountLabel }}
        </div>
        <Input
          v-model:value="newBoundAccountValue"
          :placeholder="`请输入${boundAccountLabel}`"
          allow-clear
          @keyup.enter="saveBoundAccount"
        />
      </div>
    </Modal>
  </Spin>
</template>

<style scoped></style>
