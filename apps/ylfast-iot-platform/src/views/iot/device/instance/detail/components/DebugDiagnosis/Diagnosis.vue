<script setup lang="tsx">
import type { VNode } from 'vue';

import type { Term } from '#/adapter';
import type { IotDeviceInstanceApi } from '#/api/iot/device/instance';
import type {
  ConfigMetadata,
  ConfigPropertyMetadata,
} from '#/types/config-metadata';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Empty, message, Tooltip } from 'ant-design-vue';

import {
  bindDevice,
  getDeviceConfigMetadata,
  getDeviceDetail,
  getProductConfigMetadata,
  IotDeviceInstanceApi as InstanceApi,
  register,
  updateDeviceSimpleInfo,
} from '#/api/iot/device/instance';
import {
  getProductDetail,
  IotDeviceProductApi,
  registerProduct,
} from '#/api/iot/device/product';
import { getGatewayDetail, startupGateway } from '#/api/iot/gateway';
import { startNetwork } from '#/api/iot/network-config';
import { DeviceSelector } from '#/components/business/device/device-selector';
import { YlConfigMetadataForm } from '#/components/yl-config-metadata-form';
import { DEVICE_STATE, DEVICE_TYPE } from '#/enums/device';
import { hasSpan } from '#/utils/config-metadata';
import { useGatewayChannel } from '#/views/iot/gateway/hooks/useGatewayChannel';

const props = defineProps<{
  device: IotDeviceInstanceApi.DeviceDetail;
  viewMode?: 'compact' | 'full';
}>();

const emit = defineEmits<{
  (
    e: 'update:state',
    state: {
      current: number;
      diagnosing: boolean;
      errorCount: number;
      finished: boolean;
      total?: number;
      warningCount: number;
    },
  ): void;
  (e: 'reload'): void;
}>();

// 图标中心
const CheckIcon = createIconifyIcon('lucide:check-circle-2');
const XIcon = createIconifyIcon('lucide:x-circle');
const AlertIcon = createIconifyIcon('lucide:alert-triangle');
const InfoIcon = createIconifyIcon('lucide:info');
const SettingsIcon = createIconifyIcon('lucide:settings');
const LoaderIcon = createIconifyIcon('lucide:loader-2');

// 诊断状态
const diagnosing = ref(false);
const currentStepIndex = ref(-1);
const diagnosisFinished = ref(false);
const totalSteps = ref(4);

export type DiagnosisStatus =
  | 'error'
  | 'process'
  | 'success'
  | 'wait'
  | 'warning';

export interface DiagnosisResult {
  key: string;
  title: string;
  status: DiagnosisStatus;
  message: string | VNode;
  suggestion?: string | VNode;
  icon?: string;
  fixLabel?: string;
  fix?: () => Promise<void>;
  autoFix?: (
    res: DiagnosisResult,
    step: DiagnosisStep,
    isBatch?: boolean,
  ) => Promise<void>;
  ignore?: () => void;
  renderActions?: (
    res: DiagnosisResult,
    step: DiagnosisStep,
  ) => string | undefined | VNode;
  step?: DiagnosisStep;
  metadata?: ConfigMetadata;
  missingProps?: ConfigPropertyMetadata[];
  type?: 'base' | 'config';
  renderContent?: (res: DiagnosisResult) => string | undefined | VNode;
}

export interface DiagnosisStep {
  key: string;
  title: (() => string) | string;
  icon?: (() => string) | string;
  loadingMessage?: (() => string) | string;
  exec: (
    onProgress: (progress: Partial<DiagnosisResult>) => void,
  ) => Promise<Partial<DiagnosisResult>>;
  type?: 'base' | 'config';
  renderContent?: (res: DiagnosisResult) => string | undefined | VNode;
  renderActions?: (
    res: DiagnosisResult,
    step: DiagnosisStep,
  ) => string | undefined | VNode;
}

const diagnosisResults = ref<DiagnosisResult[]>([]);

// 使用计数属性替代手动计数，确保响应性
const errorCount = computed(() =>
  diagnosisResults.value.reduce(
    (acc, r) => acc + (r.status === 'error' ? 1 : 0),
    0,
  ),
);
const warningCount = computed(() =>
  diagnosisResults.value.reduce(
    (acc, r) => acc + (r.status === 'warning' ? 1 : 0),
    0,
  ),
);

// 弹窗逻辑
const fixFormModel = ref<any>({});
const activeFixResult = ref<DiagnosisResult | null>(null);
const deviceSelectorRef = ref<any>(null);
const router = useRouter();

async function handleBindParent(val: string) {
  if (!val) return;
  try {
    await bindDevice({
      parentDeviceId: val,
      bindDeviceList: [props.device as any],
    });
    message.success($t('common.updateSuccess'));

    // 乐观更新：确保本地状态及时反映，以便 executeStep 能通过校验
    const device = props.device as any;
    device.parentDeviceId = val;

    // 重新执行诊断步骤，而非直接改状态
    const result = diagnosisResults.value.find((r) => r.key === 'access-layer');
    const step = allDiagnosticSteps.value.find((s) => s.key === 'access-layer');
    if (result && step) {
      await executeStep(step, result);
    }

    emit('reload');
  } catch (error: any) {
    message.error(error.message || 'Error');
  }
}

const [FixModal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (!activeFixResult.value) return;
    modalApi.setState({ confirmLoading: true });
    try {
      const updateData = { ...fixFormModel.value };
      await (activeFixResult.value.key.startsWith('device-config')
        ? InstanceApi.basicCrudApis.putUpdate(props.device.id, {
            configuration: updateData,
          } as any)
        : IotDeviceProductApi.basicCrudApis.putUpdate(props.device.productId, {
            configuration: updateData,
          } as any));
      modalApi.setState({ confirmLoading: true });
      // 执行保存
      await updateDeviceSimpleInfo({
        ...props.device,
        configuration: fixFormModel.value,
      } as InstanceApi.DeviceInstance);

      // 触发详情刷新
      emit('reload');

      // 重新执行该步骤进行核验
      if (activeFixResult.value) {
        const step = allDiagnosticSteps.value.find(
          (s) => s.key === activeFixResult.value?.key,
        );
        if (step) {
          await executeStep(step, activeFixResult.value);
        }
      }

      modalApi.close();
    } catch (error: any) {
      console.error($t('device.debug.fix_failed'), error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
});

/**
 * 一键修复所有异常
 */
const fixAllLoading = ref(false);
async function handleFixAll() {
  if (fixAllLoading.value) return;
  fixAllLoading.value = true;
  try {
    const errorItems = diagnosisResults.value.filter(
      (r) => r.status === 'error' && r.autoFix && r.step,
    );
    if (errorItems.length === 0) {
      message.info($t('common.noData'));
      return;
    }

    message.loading({
      content: $t('device.debug.fixing_all'),
      key: 'fix_all',
      duration: 0,
    });

    // 串行执行修复，确保状态同步
    const fixedItems: DiagnosisResult[] = [];
    for (const item of errorItems) {
      if (item.status === 'error' && item.autoFix && item.step) {
        // 使用 batch 模式，不触发 reload
        await item.autoFix(item, item.step, true);
        fixedItems.push(item);
      }
    }

    // 批量修复完成后，统一 reload 并等待
    if (fixedItems.length > 0) {
      emit('reload');
      await sleep(1000);

      // 统一重新核验
      for (const item of fixedItems) {
        if (item.step) {
          await executeStep(item.step, item);
        }
      }
    }

    message.success({
      content: $t('common.operation_success'),
      key: 'fix_all',
    });
  } catch {
    message.error({ content: $t('device.debug.fix_failed'), key: 'fix_all' });
  } finally {
    fixAllLoading.value = false;
  }
}

/**
 * 递归核验配置项
 */
function checkConfigRecursively(
  metadata: ConfigMetadata,
  config: any,
  results: {
    errors: ConfigPropertyMetadata[];
    warnings: ConfigPropertyMetadata[];
  },
) {
  if (!metadata.properties) return;

  metadata.properties.forEach((prop) => {
    const value = config?.[prop.property];
    const isRequired =
      prop.expands?.required === true || prop.type?.expands?.required === true;

    // 判断值是否为空 (null, undefined, '')
    const isEmpty = value === null || value === undefined || value === '';

    // 如果有span则直接把span删掉
    const _hasSpan = hasSpan(prop);
    if (_hasSpan && prop.type.expands) {
      delete prop.type.expands.span;
    }
    if (isEmpty) {
      if (isRequired) {
        results.errors.push(prop);
      } else {
        // 非必填但元数据中存在的也标记为警告（根据用户需求：选填项未填标记位可能存在异常）
        results.warnings.push(prop);
      }
    }

    // 处理嵌套
    if (prop.type?.expands?.configMetadata) {
      const nestedMetadata = prop.type.expands.configMetadata;
      if (Array.isArray(nestedMetadata)) {
        nestedMetadata
          .map((element) => formatConfigMetadata(element))
          .filter((m) => m !== null)
          .forEach((m) =>
            checkConfigRecursively(m as ConfigMetadata, value, results),
          );
      } else {
        const _metadata = formatConfigMetadata(nestedMetadata);
        if (!_metadata) return;
        checkConfigRecursively(_metadata, value, results);
      }
    }
  });
}

function formatConfigMetadata(
  metadata: ConfigMetadata | ConfigPropertyMetadata,
) {
  if (
    (metadata as ConfigMetadata).properties &&
    (metadata as ConfigMetadata).properties.length > 0
  ) {
    return metadata as ConfigMetadata;
  }
  if ((metadata as ConfigPropertyMetadata).property !== undefined) {
    return {
      properties: [metadata],
      name: $t('device.debug.config_info'),
    } as ConfigMetadata;
  }
  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function updateParent() {
  emit('update:state', {
    diagnosing: diagnosing.value,
    current: currentStepIndex.value,
    errorCount: errorCount.value,
    warningCount: warningCount.value,
    finished: diagnosisFinished.value,
    total: totalSteps.value,
  });
}

/**
 * 执行单个诊断步骤
 * @param step 诊断步骤定义
 * @param res 响应式结果对象
 */
async function executeStep(step: DiagnosisStep, res: DiagnosisResult) {
  res.status = 'process';
  res.message =
    typeof step.loadingMessage === 'function'
      ? step.loadingMessage()
      : step.loadingMessage || $t('common.processing');

  // 清除旧的状态和操作，防止残留
  res.renderActions = undefined;
  res.suggestion = undefined;
  res.fix = undefined;
  res.fixLabel = undefined;
  res.ignore = undefined;

  // 执行诊断，并支持进度订阅
  const result = await step.exec((progress) => {
    Object.assign(res, progress);
    updateParent();
  });

  Object.assign(res, { status: 'success' as const, ...result });

  // 统一处理忽略逻辑（仅针对 warning）
  if ((res.status as string) === 'warning' && !res.ignore) {
    res.ignore = () => {
      res.status = 'success';
      res.message = res.message + $t('device.debug.ignored_tip');
      res.suggestion = '';
      updateParent();
    };
  }

  updateParent();
}

const allDiagnosticSteps = ref<DiagnosisStep[]>([]);

function AddressStatus(props: { addresses: any[] }) {
  if (!props.addresses || props.addresses.length === 0) return null;

  return (
    <div class="flex w-full flex-col gap-2">
      <div class="space-y-1">
        {props.addresses.map((a: any) => {
          let statusColor = 'bg-gray-400';
          let statusLabel = $t('device.debug.address_status.stopped');
          let textClass = 'text-gray-500';

          if (a.health === 1) {
            statusColor = 'bg-emerald-500';
            statusLabel = $t('device.debug.address_status.running');
            textClass = 'text-emerald-600';
          } else if (a.health === -1) {
            statusColor = 'bg-red-500';
            statusLabel = $t('device.debug.address_status.faulty');
            textClass = 'text-red-600';
          }

          return (
            <div class="mb-1.5 flex items-center gap-2 last:mb-0">
              <span
                class={['size-1.5 rounded-full', statusColor, 'shadow-current']}
              ></span>
              <span class="flex-1 truncate font-mono text-[11px] opacity-90">
                {a.address}
              </span>
              <span
                class={[
                  'border-current/10 max-w-[60px] shrink-0 truncate rounded-md border px-1.5 py-0.5 text-center text-[10px] font-bold',
                  `${statusColor}/10`,
                  textClass,
                ]}
              >
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
const { isNetwork, isSub, isPlugin } = useGatewayChannel(
  ref(props.device.channel),
);

// 诊断引擎与核心驱动逻辑
async function handleDiagnose() {
  diagnosing.value = true;
  diagnosisFinished.value = false;
  diagnosisResults.value = [];
  currentStepIndex.value = 0;
  updateParent();

  try {
    // 1. 立即获取元数据以便计算精确的总步数
    const [pMetas, dMetas] = await Promise.all([
      getProductConfigMetadata(props.device.productId),
      getDeviceConfigMetadata(props.device.id),
    ]);

    // 2. 共享上下文数据
    const context = {
      gateway: null as any,
      prodMetas: pMetas,
      devMetas: dMetas,
    };

    const getGateway = async () => {
      if (!context.gateway && props.device.gatewayId) {
        context.gateway = await getGatewayDetail(props.device.gatewayId);
      }
      return context.gateway;
    };

    /**
     * 构建所有诊断步骤列表 (静态 + 动态)
     * 诊断引擎核心逻辑:
     * 1. 接入层 (Access Laery):
     *    - 子设备: 核验父级网关绑定状态及父设备连接健康度。
     *    - 直连设备: 核验网关网络组件配置 (协议端口、服务监听) 及通道健康度。
     * 2. 网关状态 (Gateway Status): (仅针对网络/插件通道) 核验设备接入网关实例是否启用。
     * 3. 产品状态 (Product Status): 核验所属产品定义的启用状态 (产品禁用将导致无法注册)。
     * 4. 设备状态 (Device Status): 核验设备自身的激活状态 (Token) 及在线状态。
     * 5. 配置与物模型 (Config & Metadata):
     *    - 递归核验产品级配置 (公共配置)。
     *    - 递归核验设备级配置 (独立配置)。
     *    - 检查必填项缺失 (Error) 及选填项为空 (Warning)。
     */
    const allSteps: DiagnosisStep[] = [
      // ==================================================================================
      // 1. 接入层核验 (Access Layer Verification)
      // 目标: 确保设备物理/逻辑连接通道畅通
      // 逻辑:
      //   - 子设备: 检查是否绑定父设备 -> 检查父设备是否在线。
      //   - 网络/插件: 检查网关服务地址列表 -> 检查端口监听状态 -> 检查网络组件运行状态。
      // ==================================================================================
      {
        key: 'access-layer',
        loadingMessage: $t('device.debug.steps_loading.network'),
        get title() {
          return isSub()
            ? $t('device.debug.steps.gateway_device')
            : $t('device.debug.steps.network');
        },
        get icon() {
          return isSub() ? 'lucide:router' : 'lucide:network';
        },
        exec: async () => {
          if (isSub()) {
            if (!props.device.parentDeviceId) {
              return {
                status: 'error',
                message: $t('device.debug.no_parent_device'),
                suggestion: $t('device.debug.no_parent_device_suggestion'),
                fixLabel: $t('device.debug.bind_parent'),
                fix: async () => {
                  deviceSelectorRef.value?.open({
                    paramsTerms: [
                      {
                        column: 'deviceType',
                        termType: 'eq',
                        value: DEVICE_TYPE.GATEWAY,
                      },
                      {
                        column: 'deviceState',
                        termType: 'neq',
                        value: DEVICE_STATE.unActive,
                      },
                    ] as Term[],
                  });
                },
              };
            }
            const parentDetail = await getDeviceDetail(
              props.device.parentDeviceId,
            );
            if (parentDetail.deviceState?.value === DEVICE_STATE.online) {
              return {
                status: 'success' as const,
                message: $t('device.debug.gateway_device_normal'),
              };
            }

            return {
              status: 'error',
              message: $t('device.debug.parent_device_offline'),
              suggestion: $t('device.debug.parent_device_offline_suggestion'),
              async fix() {
                await router.push({
                  path: '/iot/device/instance/detail',
                  query: {
                    id: props.device.parentDeviceId,
                    tab: 'debugDiagnosis',
                  },
                });
              },
              fixLabel: $t('device.instance.detail'),
            };
          } else if (isNetwork() || isPlugin()) {
            const gateway = await getGateway();
            if (gateway?.channelInfo) {
              const addresses = gateway.channelInfo.addresses || [];
              if (addresses.some((a: { health: number }) => a.health === -1)) {
                return {
                  status: 'error',
                  message: $t('device.debug.invalid_network_address'),
                  suggestion: $t('device.debug.channel_config_check_manual'),
                };
              }
              if (
                addresses.length > 0 &&
                addresses.every((a: any) => a.health === 0)
              ) {
                return {
                  status: 'error' as const,
                  message: $t('device.debug.network_stopped'),
                  fixLabel: $t('device.debug.fix_labels.start_network'),
                  suggestion: $t('device.debug.network_service_check_manual'),
                  autoFix: async (
                    res: DiagnosisResult,
                    step: DiagnosisStep,
                    isBatch = false,
                  ) => {
                    await startNetwork(gateway.channelId || '');
                    context.gateway = null;

                    if (!isBatch) {
                      emit('reload');
                      await sleep(1000);
                      await executeStep(step, res);
                    }
                  },
                };
              }
              if (addresses.length === 0) {
                return {
                  status: 'warning' as const,
                  message: $t('device.debug.no_valid_network_address'),
                };
              }
              return {
                status: 'success' as const,
                message: $t('device.debug.channel_link_normal'),
              };
            }
            return {
              status: 'success' as const,
              message: $t('device.debug.network_service_ready'),
            };
          }
          return { status: 'success' as const, message: $t('common.verified') };
        },
        renderContent: (_res) => {
          if (
            (isNetwork() || isPlugin()) &&
            context.gateway?.channelInfo?.addresses?.length > 0
          ) {
            return (
              <div class="mt-2 border-t border-primary/10 pt-2">
                <AddressStatus
                  addresses={context.gateway.channelInfo.addresses}
                />
              </div>
            );
          }
          return undefined;
        },
      },
      // ==================================================================================
      // 2. 网关运行状态 (Gateway Status)
      // 目标: 确保设备消息接入网关 (Device Gateway) 处于运行中
      // 逻辑: 检查设备关联的网关实例状态 (如 MQTT Broker, HTTP Server 网关等)。
      //       注意: 直连设备需要网关，子设备此步骤通常跳过(因为依赖父设备)。
      // ==================================================================================
      {
        key: 'gateway',
        title: $t('device.debug.steps.gateway'),
        icon: 'lucide:router',
        loadingMessage: $t('device.debug.steps_loading.gateway'),
        exec: async () => {
          if (!props.device.gatewayId)
            return {
              status: 'success' as const,
              message: $t('device.debug.no_gateway_needed'),
            };
          const detail = await getGateway();
          if (detail.state?.value === 'enabled') {
            return {
              status: 'success' as const,
              message: $t('device.debug.gateway_running', {
                name: detail.name,
              }),
            };
          }
          return {
            status: 'error' as const,
            fixLabel: $t('device.debug.fix_labels.start_gateway'),
            message: $t('device.debug.gateway_disabled_status', {
              name: detail.name,
            }),
            suggestion: $t('device.debug.gateway_disabled_manual'),
            autoFix: async (
              res: DiagnosisResult,
              step: DiagnosisStep,
              isBatch = false,
            ) => {
              await startupGateway(props.device.gatewayId!);
              context.gateway = null;

              if (!isBatch) {
                emit('reload');
                await sleep(1000);
                await executeStep(step, res);
              }
            },
          };
        },
      },
      // ==================================================================================
      // 3. 产品定义状态 (Product Status)
      // 目标: 确保所属产品定义有效且启用
      // 逻辑: 查询产品详情 -> 检查状态是否为启用 (State=1)。产品禁用时设备无法进行注册和通信。
      // ==================================================================================
      {
        key: 'product',
        title: $t('device.debug.steps.product'),
        icon: 'lucide:box',
        loadingMessage: $t('device.debug.steps_loading.product'),
        exec: async () => {
          const prodDetail = await getProductDetail(props.device.productId);
          if (prodDetail.state === 1)
            return {
              status: 'success' as const,
              message: $t('device.debug.product_enabled_status'),
            };
          return {
            status: 'error' as const,
            fixLabel: $t('device.debug.fix_labels.enable_product'),
            message: $t('device.debug.product_disabled_status'),
            suggestion: $t('device.debug.product_disabled_manual'),
            autoFix: async (
              res: DiagnosisResult,
              step: DiagnosisStep,
              isBatch = false,
            ) => {
              await registerProduct(prodDetail.id!);

              if (!isBatch) {
                emit('reload');
                await sleep(1000);
                await executeStep(step, res);
              }
            },
          };
        },
      },
      // ==================================================================================
      // 4. 设备激活状态 (Device Status)
      // 目标: 确保设备实例已注册激活
      // 逻辑:
      //   - 检查 State 是否为 unActive (未激活) -> 报错，需激活。
      //   - 检查 State 是否为 offline (离线) -> 警告，提示检查网络。
      // ==================================================================================
      {
        key: 'device',
        title: $t('device.debug.steps.device'),
        icon: 'lucide:cpu',
        loadingMessage: $t('device.debug.steps_loading.device'),
        exec: async () => {
          const state = props.device.deviceState?.value;
          if (state === 'unActive') {
            return {
              status: 'error' as const,
              fixLabel: $t('device.debug.fix_labels.enable_device'),
              message: $t('device.debug.device_not_enabled'),
              suggestion: $t('device.debug.device_not_enabled_manual'),
              autoFix: async (
                res: DiagnosisResult,
                step: DiagnosisStep,
                isBatch = false,
              ) => {
                await register(props.device.id);

                if (!isBatch) {
                  emit('reload');
                  await sleep(1000);
                  await executeStep(step, res);
                }
              },
            };
          }
          if (state === 'offline') {
            return {
              status: 'warning' as const,
              message: $t('device.debug.device_offline_warning'),
              suggestion: $t('device.debug.device_offline_manual'),
            };
          }
          return {
            status: 'success' as const,
            message: $t('device.debug.device_enabled_status'),
          };
        },
      },
      // ==================================================================================
      // 5. 产品配置完整性 (Product Config Integrity)
      // 目标: 确保继承自产品的配置项已填写
      // 逻辑: 遍历产品元数据 -> 递归检查设备配置值 -> 必填项缺失报错 / 选填项缺失警告。
      // ==================================================================================
      ...(pMetas || []).map((meta: ConfigMetadata, idx: number) => ({
        key: `prod-config-${idx}`,
        title: `${$t('device.debug.product_prefix')}-${meta.name}`,
        loadingMessage: $t('device.debug.steps_loading.config'),
        type: 'config' as const,
        exec: async () => {
          const checkRes = {
            errors: [] as ConfigPropertyMetadata[],
            warnings: [] as ConfigPropertyMetadata[],
          };
          checkConfigRecursively(meta, props.device.configuration, checkRes);
          if (checkRes.errors.length > 0) {
            return {
              status: 'error' as const,
              message: $t('device.debug.config_error_count', {
                count: checkRes.errors.length,
              }),
              suggestion: `${$t('device.debug.required_fields')}: ${checkRes.errors.map((p) => p.name).join(', ')}`,
              missingProps: checkRes.errors,
              metadata: meta,
              fix: async () =>
                openFixModal(
                  diagnosisResults.value.find(
                    (r) => r.key === `prod-config-${idx}`,
                  )!,
                ),
            };
          }
          if (checkRes.warnings.length > 0) {
            return {
              status: 'warning' as const,
              message: $t('device.debug.config_warning_count', {
                count: checkRes.warnings.length,
              }),
              suggestion: `${$t('device.debug.optional_fields')}: ${checkRes.warnings.map((p) => p.name).join(', ')}`,
              missingProps: checkRes.warnings,
              metadata: meta,
              fix: async () =>
                openFixModal(
                  diagnosisResults.value.find(
                    (r) => r.key === `prod-config-${idx}`,
                  )!,
                ),
            };
          }
          return {
            status: 'success' as const,
            message: $t('device.debug.config_integrity_passed'),
          };
        },
      })),
      // ==================================================================================
      // 6. 设备配置完整性 (Device Config Integrity)
      // 目标: 确保设备独立配置项已填写
      // 逻辑: 遍历设备独立元数据 -> 递归检查 -> 必填项缺失报错 / 选填项缺失警告。
      // ==================================================================================
      ...(dMetas || []).map((meta: ConfigMetadata, idx: number) => ({
        key: `dev-config-${idx}`,
        title: `${$t('device.debug.device_prefix')}-${meta.name}`,
        loadingMessage: $t('device.debug.steps_loading.config'),
        type: 'config' as const,
        exec: async () => {
          const checkRes = {
            errors: [] as ConfigPropertyMetadata[],
            warnings: [] as ConfigPropertyMetadata[],
          };
          checkConfigRecursively(meta, props.device.configuration, checkRes);
          if (checkRes.errors.length > 0) {
            return {
              status: 'error' as const,
              message: $t('device.debug.device_config_error_count', {
                count: checkRes.errors.length,
              }),
              suggestion: `${$t('device.debug.missing_properties')}: ${checkRes.errors.map((p) => p.name).join(', ')}`,
              missingProps: checkRes.errors,
              metadata: meta,
              fix: async () =>
                openFixModal(
                  diagnosisResults.value.find(
                    (r) => r.key === `dev-config-${idx}`,
                  )!,
                ),
            };
          }
          if (checkRes.warnings.length > 0) {
            return {
              status: 'warning' as const,
              message: $t('device.debug.device_config_warning_count', {
                count: checkRes.warnings.length,
              }),
              suggestion: `${$t('device.debug.optional_fields')}: ${checkRes.warnings.map((p) => p.name).join(', ')}`,
              missingProps: checkRes.warnings,
              metadata: meta,
              fix: async () =>
                openFixModal(
                  diagnosisResults.value.find(
                    (r) => r.key === `dev-config-${idx}`,
                  )!,
                ),
            };
          }
          return {
            status: 'success' as const,
            message: $t('device.debug.device_independent_config_passed'),
          };
        },
      })),
    ];

    allDiagnosticSteps.value = allSteps;
    totalSteps.value = allSteps.length;
    updateParent();

    // 顺序执行所有步骤
    for (const step of allDiagnosticSteps.value) {
      const res = reactive<DiagnosisResult>({
        key: step.key,
        title: typeof step.title === 'function' ? step.title() : step.title,
        icon: typeof step.icon === 'function' ? step.icon() : step.icon,
        status: 'process',
        message:
          typeof step.loadingMessage === 'function'
            ? step.loadingMessage()
            : step.loadingMessage || $t('common.processing'),
        type: step.type || 'base',
        renderContent: step.renderContent,
        renderActions: step.renderActions,
        step,
      });
      diagnosisResults.value.push(res);
      updateParent();
      await sleep(500);

      await executeStep(step, res);

      currentStepIndex.value++;
      updateParent();
    }

    diagnosisFinished.value = true;
    updateParent();
  } catch (error: any) {
    console.error('Diagnosis failed:', error);
    diagnosisResults.value.push(
      reactive({
        key: 'system-error',
        title: $t('device.debug.system_anomaly'),
        message: $t('device.debug.diagnosis_error', { error: error.message }),
        status: 'error',
        icon: 'lucide:alert-octagon',
      }) as DiagnosisResult,
    );
  } finally {
    diagnosing.value = false;
    updateParent();
  }
}

function openFixModal(result: DiagnosisResult) {
  activeFixResult.value = result;
  fixFormModel.value = { ...props.device.configuration };
  const baseTitle =
    result.status === 'error'
      ? $t('device.debug.fix_required_config')
      : $t('device.debug.modify_config');
  modalApi.setState({ title: `${baseTitle} - ${result.title}` });
  modalApi.open();
}

onMounted(handleDiagnose);

defineExpose({ handleDiagnose, handleFixAll });
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="res in diagnosisResults"
        :key="res.key"
        class="group relative overflow-hidden rounded-md border bg-white transition-all duration-300 dark:bg-gray-900"
        :class="[
          res.status === 'error'
            ? 'border-red-200 shadow-red-500/5 dark:border-red-900/40'
            : res.status === 'warning'
              ? 'border-orange-200 shadow-orange-500/5 dark:border-orange-900/40'
              : res.status === 'success'
                ? 'border-emerald-200 shadow-emerald-500/5 dark:border-emerald-900/40'
                : 'border-gray-100 shadow-sm dark:border-gray-800',
        ]"
      >
        <div class="flex items-start gap-4 p-5">
          <!-- Card Icon -->
          <div class="shrink-0 pt-1">
            <div
              class="flex size-10 items-center justify-center rounded-md shadow-sm transition-colors duration-300"
              :class="[
                res.status === 'error'
                  ? 'border border-red-100 bg-red-50 text-red-500 shadow-sm'
                  : res.status === 'warning'
                    ? 'border border-orange-100 bg-orange-50 text-orange-500 shadow-sm'
                    : res.status === 'success'
                      ? 'border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-sm'
                      : 'border border-primary/10 bg-primary/5 text-primary shadow-sm',
              ]"
            >
              <LoaderIcon
                v-if="res.status === 'process'"
                class="size-5 animate-spin"
              />
              <XIcon v-else-if="res.status === 'error'" class="size-6" />
              <AlertIcon v-else-if="res.status === 'warning'" class="size-6" />
              <CheckIcon v-else-if="res.status === 'success'" class="size-6" />
            </div>
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex items-center justify-between">
              <span
                class="text-base font-bold tracking-tight dark:text-gray-100"
              >
                {{ res.title }}
              </span>
              <div class="flex items-center gap-2">
                <span
                  v-if="res.status === 'error'"
                  class="text-[11px] font-bold uppercase tracking-wider text-red-500"
                >
                  {{ $t('device.debug.status_error') }}
                </span>
                <span
                  v-if="res.status === 'warning'"
                  class="text-[11px] font-bold uppercase tracking-wider text-orange-500"
                >
                  {{ $t('device.debug.status_warning') }}
                </span>
                <span
                  v-if="res.status === 'success'"
                  class="text-[11px] font-bold uppercase tracking-wider text-emerald-500"
                >
                  {{ $t('device.debug.check_passed') }}
                </span>
              </div>
            </div>

            <div
              class="mb-0 line-clamp-1 text-sm text-gray-500 dark:text-gray-400"
            >
              <template v-if="typeof res.message === 'string'">
                {{ res.message }}
              </template>
              <component v-else :is="res.message" />
            </div>

            <div v-if="res.renderContent" class="mt-2">
              <component :is="res.renderContent(res)" />
            </div>

            <div
              v-if="
                res.suggestion &&
                (res.status !== 'success' || res.key === 'network')
              "
              class="mt-3 flex items-start gap-2 rounded-lg border-l-2 border-primary/30 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1"
            >
              <InfoIcon
                class="mt-0.5 size-4 shrink-0 text-primary opacity-70"
              />
              <div
                class="flex-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400"
              >
                <!-- eslint-disable vue/no-v-html -->
                <div
                  v-if="typeof res.suggestion === 'string'"
                  v-html="res.suggestion"
                ></div>
                <component v-else :is="res.suggestion" />
                <div v-if="res.renderActions && res.step" class="mt-2">
                  <component :is="res.renderActions(res, res.step)" />
                </div>
                <div v-else class="mt-2 flex items-center gap-4">
                  <Button
                    v-if="res.fix || res.autoFix"
                    size="small"
                    type="link"
                    class="group/btn h-auto p-0"
                    @click="
                      async () => {
                        if (res.autoFix) await res.autoFix(res, res.step);
                        else if (res.fix) await res.fix();
                      }
                    "
                  >
                    {{
                      res.fixLabel ||
                      (res.status === 'warning'
                        ? $t('device.debug.manual_check')
                        : $t('device.debug.one_click_process'))
                    }}
                  </Button>
                  <Button
                    v-if="res.ignore"
                    size="small"
                    type="link"
                    class="h-auto p-0 text-gray-400"
                    @click="res.ignore"
                  >
                    {{ $t('device.debug.ignore') }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修复弹窗 -->
    <FixModal class="w-[1000px]">
      <div
        v-if="activeFixResult"
        class="flex h-[650px] flex-col gap-0 overflow-hidden rounded-lg bg-gray-50 md:flex-row dark:bg-black/20"
      >
        <!-- 左侧: 表单区 -->
        <div
          class="flex min-w-0 flex-1 flex-col border-r bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="mb-6 shrink-0">
            <h3
              class="m-0 flex h-6 items-center gap-2 text-lg font-bold leading-none tracking-tight"
            >
              <SettingsIcon class="size-5 text-primary" />
              {{ $t('device.debug.update_param_config') }}
            </h3>
            <p class="mb-0 mt-1 text-xs text-gray-400 opacity-70">
              {{ $t('device.debug.check_param_definition') }}
            </p>
          </div>

          <div class="custom-scroll flex-1 overflow-y-auto pr-2">
            <YlConfigMetadataForm
              v-if="activeFixResult.metadata"
              v-model:model-value="fixFormModel"
              :metadata="[activeFixResult.metadata]"
              layout="vertical"
              :hide-root-header="true"
            />
          </div>
        </div>

        <!-- 右侧: 异常描述区 -->
        <div
          class="flex w-full shrink-0 flex-col bg-gray-50/50 p-6 md:w-[350px] lg:p-8 dark:bg-gray-800/20"
        >
          <div class="mb-5 shrink-0">
            <span
              class="mb-3 inline-flex items-center gap-1.5 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-600 dark:bg-red-900/30 dark:text-red-400"
            >
              Security Check
            </span>
            <h4 class="m-0 text-sm font-bold text-gray-800 dark:text-gray-200">
              {{
                activeFixResult.status === 'warning'
                  ? $t('device.debug.possible_issue')
                  : $t('device.debug.anomaly_details')
              }}
            </h4>
          </div>

          <div class="custom-scroll flex-1 space-y-4 overflow-y-auto pr-2">
            <div
              v-for="prop in activeFixResult.missingProps"
              :key="prop.property"
              class="rounded-md border bg-white p-3.5 shadow-sm transition-all hover:border-red-200 dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold text-primary">{{
                  prop.name
                }}</span>
                <Tooltip
                  :title="`${$t('device.debug.field_id')}: ${prop.property}`"
                >
                  <span
                    class="cursor-help font-mono text-[10px] text-gray-400 opacity-40"
                  >
                    #field
                  </span>
                </Tooltip>
              </div>
              <p
                class="m-0 text-[11px] leading-relaxed text-gray-500 opacity-80"
              >
                {{ prop.description || $t('device.debug.no_description_tip') }}
              </p>
            </div>

            <div
              v-if="!activeFixResult.missingProps?.length"
              class="flex flex-col items-center justify-center py-12 text-center opacity-40"
            >
              <Empty :description="false" />
              <span class="mt-2 text-xs">{{
                $t('device.debug.no_detailed_suggestion')
              }}</span>
            </div>
          </div>

          <div
            class="mt-8 rounded-md border border-orange-500/10 bg-orange-500/5 p-4"
          >
            <div class="mb-2 flex items-center gap-2">
              <InfoIcon class="size-4 text-orange-500" />
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-orange-600"
              >
                Expert Advice
              </span>
            </div>
            <p
              class="m-0 text-[11px] font-medium leading-relaxed text-orange-600/70"
            >
              {{ $t('device.debug.config_warning_tip') }}
            </p>
          </div>
        </div>
      </div>
    </FixModal>

    <!-- 设备选择器，用于绑定父设备 -->
    <DeviceSelector
      ref="deviceSelectorRef"
      hide-trigger
      display-mode="card"
      :multiple="false"
      @change="handleBindParent"
    />
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: rgb(0 0 0 / 10%);
  border-radius: 10px;
}
</style>
