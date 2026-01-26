<script setup lang="ts">
import type { HeaderKeyValue, TransparentParserProps } from './types';

import type {
  IotTransparentCodecModel,
  TransparentMessageDecodeRequest,
  TransparentMessageDecodeResponse,
} from '#/api/iot/device/transparent-codec';
import type { ScriptExecutorProvider } from '#/api/iot/script';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  decodeDebug,
  getDeviceTransparentCodec,
  getDeviceTypescriptDeclares,
  getProductTransparentCodec,
  getProductTypescriptDeclares,
  removeDeviceCodec,
  removeProductCodec,
  saveDeviceTransparentCodec,
  saveProductTransparentCodec,
} from '#/api/iot/device/transparent-codec';
import { getSupportScriptExecutorProviders } from '#/api/iot/script';
import YlMonacoEditor from '#/components/yl-monaco-editor';
import { YlVirtualScroll } from '#/components/yl-virtual-scroll';

import HeaderConfigModal from './components/HeaderConfigModal.vue';
import { useDebugLog } from './hooks/useDebugLog';

defineOptions({ name: 'TransparentParser' });
const props = defineProps<TransparentParserProps>();
// 图标组件
const MaximizeIcon = createIconifyIcon('lucide:maximize');
const MinimizeIcon = createIconifyIcon('lucide:minimize');
const PlayIcon = createIconifyIcon('lucide:play');

// 脚本引擎提供者列表
const scriptProviders = ref<ScriptExecutorProvider[]>([]);

// 透传编解码配置
const transparentCodec = ref<IotTransparentCodecModel>();

// 是否为设备页面引用
const isDevicePage = computed(() => !!props.deviceId || !!props.device?.id);

const effectiveProductId = computed(
  () => props.productId || props.product?.id || props.device?.productId,
);
const effectiveDeviceId = computed(() => props.deviceId || props.device?.id);
const effectiveName = computed(
  () =>
    props.name || props.product?.productName || props.device?.deviceName || '',
);

// Header配置弹窗
const [HeaderModal, headerModalApi] = useVbenModal({
  connectedComponent: HeaderConfigModal,
});

/**
 * 打开 Header 配置弹窗
 */
function handleEditHeaders() {
  headerModalApi.setData({
    headers: headerList.value,
    defaultHeaderKeys: props.defaultHeaderKeys,
  });
  headerModalApi.open();
}

/**
 * 处理 Header 弹窗确认
 */
function handleHeaderConfirm(newList: HeaderKeyValue[]) {
  headerList.value = newList;
}

// 是否继承产品的透传解析器
const hasExtendProductCodec = ref(true);

// 是否能够更新解析器（产品模式或设备独立模式）
const canUpdateCodec = computed(
  () => !isDevicePage.value || !hasExtendProductCodec.value,
);

// 提示信息
const tips = computed(() => {
  if (!isDevicePage.value) return '';
  return hasExtendProductCodec.value
    ? $t('device.instance.transparentParser.inheritTip')
    : $t('device.instance.transparentParser.independentTip');
});

// 调试相关
const decodeDebugResponse = ref<TransparentMessageDecodeResponse>({
  success: false,
  reason: '',
  outputs: [],
});

const decodeDebugRequest = ref<TransparentMessageDecodeRequest>({
  provider: 'script',
  configuration: {},
  headers: {},
  payload: '',
});

// Header键值对列表
const headerList = ref<HeaderKeyValue[]>([{ key: 'topic', value: '' }]);

// Payload输入
const payloadInput = ref('');

// 解码结果（JSON格式）
const decodeResult = computed(() => {
  if (!decodeDebugResponse.value.success) {
    return decodeDebugResponse.value.reason || '';
  }
  return JSON.stringify(decodeDebugResponse.value.outputs, null, 2);
});

// 默认脚本内容
const defaultScript = `//注册设备下行数据监听器,当平台下发指令给设备时,回调将被调用,用于构造下发给设备的报文
codec.onDownstream(function (ctx) {

});

//注册设备上行数据监听器,当设备上行数据时,回调将被调用,用于解析设备上报的数据.
codec.onUpstream(function (ctx) {

});`;

// 调试用的CodecId（独立ID，避免与生产冲突）
const debugCodecId = computed(() =>
  isDevicePage.value
    ? `device-debug-${effectiveDeviceId.value}`
    : `product-debug-${effectiveProductId.value}`,
);

const fetchDeclares = computed(() =>
  isDevicePage.value && effectiveDeviceId.value
    ? () =>
        getDeviceTypescriptDeclares(
          effectiveProductId.value!,
          effectiveDeviceId.value!,
        )
    : () => getProductTypescriptDeclares(effectiveProductId.value!),
);

// TypeScript类型定义库
const extraLibs = ref<{ content: string; filePath: string }[]>([]);

// SSE调试日志Hook
const { logs, clearLog, subscribe, close } = useDebugLog();

// 全屏状态
const isFullscreen = ref(false);

/**
 * 切换全屏
 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

/**
 * 初始化组件
 */
async function init() {
  if (!effectiveProductId.value) return;

  try {
    // 获取脚本引擎提供者
    scriptProviders.value = await getSupportScriptExecutorProviders();

    // 获取透传编解码配置
    const fetchFunc =
      isDevicePage.value && effectiveDeviceId.value && effectiveProductId.value
        ? () =>
            getDeviceTransparentCodec(
              effectiveProductId.value!,
              effectiveDeviceId.value!,
            )
        : () => getProductTransparentCodec(effectiveProductId.value!);

    const codec: IotTransparentCodecModel | null = await fetchFunc();

    // 设备模式下，判断是否继承产品配置
    if (isDevicePage.value) {
      // 如果codec不存在，或者codec没有deviceId，则认为是继承产品的解析器
      hasExtendProductCodec.value = !codec || !codec.deviceId;
    }

    // eslint-disable-next-line unicorn/prefer-ternary
    if (codec) {
      transparentCodec.value = codec;
    } else {
      // 创建默认配置
      transparentCodec.value = {
        provider: 'script',
        name: `${effectiveName.value} 透传解析器`,
        productId: effectiveProductId.value,
        deviceId: effectiveDeviceId.value,
        configuration: {
          script: defaultScript,
          scriptType: 'javascript',
          scriptEngineType: 'nashorn',
        },
      };
    }

    // 加载TypeScript类型定义
    await loadTypescriptDeclares();

    // 订阅调试日志（不等待，让其在后台运行）
    subscribeLog();
  } catch (error: any) {
    message.error(error.message || '初始化失败');
  }
}

/**
 * 加载TypeScript类型定义
 */
async function loadTypescriptDeclares() {
  try {
    const declares = await fetchDeclares.value();

    extraLibs.value = [
      {
        content: declares,
        filePath: 'transparent-codec.d.ts',
      },
    ];
  } catch (error: any) {
    console.error('加载类型定义失败:', error);
  }
}

/**
 * 订阅调试日志
 */
function subscribeLog() {
  if (transparentCodec.value?.configuration.scriptEngineType) {
    subscribe(
      transparentCodec.value.configuration.scriptEngineType,
      debugCodecId.value,
    );
  }
}

/**
 * 保存配置
 */
async function handleSave() {
  if (!transparentCodec.value) return;

  if (!transparentCodec.value?.configuration.scriptType) {
    message.warning(
      $t('device.instance.transparentParser.tips.selectScriptType'),
    );
    return;
  }

  try {
    await (isDevicePage.value &&
    effectiveDeviceId.value &&
    effectiveProductId.value
      ? saveDeviceTransparentCodec(
          effectiveProductId.value,
          effectiveDeviceId.value,
          transparentCodec.value,
        )
      : saveProductTransparentCodec(
          effectiveProductId.value!,
          transparentCodec.value,
        ));
    message.success($t('device.instance.transparentParser.tips.saveSuccess'));
  } catch (error: any) {
    message.error(error.message || '保存失败');
  }
}

/**
 * 重置配置
 */
async function handleReset() {
  if (!effectiveProductId.value) return;

  Modal.confirm({
    title: isDevicePage.value
      ? $t('device.instance.transparentParser.confirmTitle.reset')
      : $t('device.instance.transparentParser.confirmTitle.reset'),
    content: isDevicePage.value
      ? $t('device.instance.transparentParser.confirmContent.resetDevice')
      : $t('device.instance.transparentParser.confirmContent.resetProduct'),
    onOk: async () => {
      try {
        await (isDevicePage.value &&
        effectiveDeviceId.value &&
        effectiveProductId.value
          ? removeDeviceCodec(effectiveProductId.value, effectiveDeviceId.value)
          : removeProductCodec(effectiveProductId.value!));
        message.success(
          $t('device.instance.transparentParser.tips.resetSuccess'),
        );
        await init();
      } catch (error: any) {
        message.error(error.message || '重置失败');
        throw error; // 重新抛出错误以阻止模态框关闭
      }
    },
  });
}

/**
 * 切换继承/独立模式
 */
function handleToggleInherit() {
  if (!effectiveDeviceId.value || !effectiveProductId.value) return;

  const isInherited = hasExtendProductCodec.value;

  Modal.confirm({
    title: isInherited
      ? $t('device.instance.transparentParser.confirmTitle.cancelInherit')
      : $t('device.instance.transparentParser.confirmTitle.inherit'),
    content: isInherited
      ? $t('device.instance.transparentParser.confirmContent.cancelInherit')
      : $t('device.instance.transparentParser.confirmContent.inherit'),
    onOk: async () => {
      try {
        if (isInherited) {
          // 取消继承：将产品的脚本保存到设备
          const productCodec = await getProductTransparentCodec(
            effectiveProductId.value!,
          );
          await saveDeviceTransparentCodec(
            effectiveProductId.value!,
            effectiveDeviceId.value!,
            {
              provider: productCodec.provider,
              configuration: productCodec.configuration,
            },
          );
        } else {
          // 启用继承：删除设备的独立脚本
          await removeDeviceCodec(
            effectiveProductId.value!,
            effectiveDeviceId.value!,
          );
        }
        message.success(
          isInherited
            ? $t('device.instance.transparentParser.tips.cancelInheritSuccess')
            : $t('device.instance.transparentParser.tips.inheritSuccess'),
        );
        await init();
      } catch (error: any) {
        message.error(error.message || '操作失败');
        throw error;
      }
    },
  });
}

/**
 * 调试解码
 */
async function handleDecodeTest() {
  if (!payloadInput.value) {
    message.error($t('device.instance.transparentParser.tips.inputPayload'));
    return;
  }

  try {
    // 构建headers
    const headers: Record<string, any> = {};
    for (const item of headerList.value) {
      if (item.key && item.value) {
        headers[item.key] = item.value;
      }
    }

    // 构建调试配置
    const debugConfig = {
      ...transparentCodec.value?.configuration,
      id: debugCodecId.value,
    };

    decodeDebugRequest.value = {
      provider: 'script',
      configuration: debugConfig,
      headers,
      payload: payloadInput.value.replaceAll(/\s+/g, ''),
    };

    const response = await decodeDebug(decodeDebugRequest.value);
    decodeDebugResponse.value = response;

    if (response.success) {
      message.success(
        $t('device.instance.transparentParser.tips.decodeSuccess'),
      );
    } else {
      message.error($t('device.instance.transparentParser.tips.decodeFailed'));
    }
  } catch (error: any) {
    message.error(error.message || '调试失败');
    decodeDebugResponse.value = {
      success: false,
      reason: error.message,
    };
  }
}

/**
 * 脚本类型变化
 */
function handleScriptTypeChange() {
  // 重新订阅日志
  close();
  subscribeLog();
}

/**
 * 重新加载日志
 */
function handleReloadLog() {
  clearLog();
  close(); // 先关闭旧连接
  subscribeLog();
}

onMounted(() => {
  init();
});

defineExpose({
  init,
});
</script>

<template>
  <div class="transparent-parser" :class="{ 'is-fullscreen': isFullscreen }">
    <Card v-if="transparentCodec">
      <!-- 操作栏 -->
      <div class="header-row">
        <div class="header-col header-col-left">
          <Button
            :disabled="!canUpdateCodec"
            type="primary"
            @click="handleSave"
          >
            {{ $t('common.action.save') }}
          </Button>
          <Button
            v-if="isDevicePage"
            :type="hasExtendProductCodec ? 'default' : 'primary'"
            class="ml-2"
            @click="handleToggleInherit"
          >
            {{
              hasExtendProductCodec
                ? $t('device.instance.transparentParser.cancelInherit')
                : $t('device.instance.transparentParser.inheritProduct')
            }}
          </Button>
          <Button class="ml-2" danger @click="handleReset">
            {{ $t('device.instance.transparentParser.reset') }}
          </Button>
        </div>
        <div class="header-col header-col-right">
          <span class="mr-2 font-semibold">
            {{ $t('device.instance.transparentParser.scriptLanguage') }}:
          </span>
          <Select
            v-model:value="transparentCodec.configuration.scriptType"
            :disabled="!canUpdateCodec"
            :options="
              scriptProviders.map((item) => ({
                label: item.name,
                value: item.scriptType,
                scriptEngineType: item.scriptEngineType,
              }))
            "
            class="w-40"
            placeholder="请选择脚本类型"
            @change="handleScriptTypeChange"
          />
          <Button class="ml-2" type="text" @click="toggleFullscreen">
            <template #icon>
              <component :is="isFullscreen ? MinimizeIcon : MaximizeIcon" />
            </template>
          </Button>
        </div>
      </div>

      <!-- 提示信息 -->
      <Alert
        v-if="isDevicePage && tips"
        :message="tips"
        class="mb-3"
        show-icon
        type="info"
      />

      <!-- 主内容区域：编辑器 + 调试区 -->
      <div class="main-content-wrapper">
        <div class="main-content-row">
          <!-- 左侧：编辑器 -->
          <div class="main-content-col main-content-col-editor">
            <div class="editor-wrapper">
              <YlMonacoEditor
                v-model="transparentCodec.configuration.script"
                :extra-libs="extraLibs"
                :language="transparentCodec.configuration.scriptType"
                :read-only="!canUpdateCodec"
              />
            </div>
          </div>

          <!-- 右侧：统一调试面板列 -->
          <div class="main-content-col main-content-col-debug">
            <div class="debug-panel-unified">
              <div class="unified-panel-header">
                <div class="panel-title">
                  <span class="i-lucide:terminal mr-1.5"></span>
                  透传解析调试
                </div>
                <div class="ml-auto flex gap-2">
                  <Button
                    size="small"
                    type="primary"
                    @click="handleDecodeTest"
                    class="run-btn-compact"
                  >
                    <template #icon>
                      <PlayIcon class="size-3.5" />
                    </template>
                    发送请求
                  </Button>
                </div>
              </div>

              <div class="unified-panel-body">
                <!-- Headers 区域 -->
                <div class="header-summary-box">
                  <div class="item-label text-primary/80">
                    <span class="i-lucide:settings mr-1.5"></span>
                    HEADERS
                    <Button
                      type="link"
                      size="small"
                      class="ml-auto px-0 text-xs"
                      @click="handleEditHeaders"
                    >
                      配置
                    </Button>
                  </div>
                  <div class="header-tags-container" @click="handleEditHeaders">
                    <template
                      v-if="
                        headerList &&
                        headerList.length > 0 &&
                        headerList[0]?.key
                      "
                    >
                      <Tag
                        v-for="(item, index) in headerList.slice(0, 3)"
                        :key="index"
                        class="header-tag"
                      >
                        {{ item?.key }}
                      </Tag>
                      <Tag v-if="headerList.length > 3" class="header-tag">
                        +{{ headerList.length - 3 }}
                      </Tag>
                    </template>
                    <span v-else class="text-xs italic text-gray-400">
                      未配置 Header
                    </span>
                  </div>
                </div>

                <!-- 输入区 -->
                <div class="input-item payload-item-flex">
                  <div class="item-label">
                    <span class="i-lucide:binary mr-1.5"></span>
                    原始消息
                  </div>
                  <div class="editor-style-border bg-background">
                    <Input.TextArea
                      v-model:value="payloadInput"
                      placeholder="请输入十六进制（以 0x 开头，如 0x0102）或字符串消息..."
                      class="transparent-textarea"
                      :rows="4"
                    />
                  </div>
                </div>

                <!-- 流程引导 -->
                <div class="flow-divider">
                  <div class="divider-line"></div>
                  <span class="i-lucide:chevron-down text-gray-300"></span>
                  <div class="divider-line"></div>
                </div>

                <!-- 输出区 -->
                <div class="input-item output-section-flex">
                  <div class="item-label text-success">
                    <span class="i-lucide:code mr-1.5"></span>
                    解析结果
                  </div>
                  <div
                    class="editor-style-border result-display-container bg-muted/5"
                  >
                    <div class="result-display-panel">
                      <pre v-if="decodeResult" class="result-pre-content">{{
                        decodeResult
                      }}</pre>
                      <div v-else class="result-empty-placeholder">
                        等待运行结果...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 调试日志区域（独立一行） -->
      <div class="debug-log-wrapper">
        <div class="debug-section">
          <div class="section-title">
            <span class="i-lucide:scroll-text mr-1.5"></span>
            {{ $t('device.instance.transparentParser.debugLog') }}
            <div class="ml-auto flex gap-1.5">
              <Button size="small" @click="clearLog"> 清空 </Button>
              <Button size="small" type="primary" @click="handleReloadLog">
                重载
              </Button>
            </div>
          </div>
          <div class="log-container-new">
            <YlVirtualScroll
              v-if="logs.length > 0"
              :items="logs"
              :item-height="24"
              container-height="100%"
              :auto-scroll-to-bottom="true"
            >
              <template #default="{ item }">
                <!-- eslint-disable vue/no-v-html -->
                <div class="log-line" v-html="item"></div>
              </template>
            </YlVirtualScroll>
            <div v-else class="log-empty">等待调试日志...</div>
          </div>
        </div>
      </div>
    </Card>
    <HeaderModal @confirm="handleHeaderConfirm" />
  </div>
</template>

<style scoped>
.transparent-parser {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 全屏样式 */
.transparent-parser.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding: 16px;
  overflow: auto;
  background: hsl(var(--background));
}

.transparent-parser :deep(.ant-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.transparent-parser :deep(.ant-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}

/* 操作栏区域 */
.transparent-parser :deep(.ant-card-body) .header-row {
  flex-shrink: 0;
}

.transparent-parser :deep(.ant-card-body) .main-content-wrapper {
  display: flex;
  flex: 7;
  flex-direction: column;
  min-height: 0;
}

.transparent-parser :deep(.ant-card-body) > .ant-alert {
  flex-shrink: 0;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-col {
  display: flex;
  align-items: center;
}

.header-col-left {
  flex: 0 0 auto;
}

.header-col-right {
  flex: 0 0 auto;
  justify-content: flex-end;
}

/* 主内容包装器 */
.main-content-wrapper {
  flex: 6;
  min-height: 0;
  overflow: hidden;
}

.main-content-row {
  display: flex;
  gap: 16px;
  height: 100%;
}

.main-content-col {
  height: 100%;
  min-height: 0;
}

.main-content-col-editor {
  flex: 50;
}

.main-content-col-debug {
  flex: 50;
}

.editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.editor-wrapper :deep(.yl-monaco-editor) {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.editor-wrapper :deep(.yl-monaco-editor > div) {
  height: 100%;
}

.editor-wrapper :deep(.monaco-editor) {
  height: 100% !important;
}

/* 一体化调试面板 */
.debug-panel-unified {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.unified-panel-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding: 8px 12px;
  background: hsl(var(--muted) / 30%);
  border-bottom: 1px solid hsl(var(--border));
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
}

.run-btn-compact {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.unified-panel-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
}

/* 输入项样式 */
.input-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.payload-item-flex {
  flex: 0 0 140px; /* 改为固定基础高度，防止在小空间下互相挤压 */
}

.header-summary-box {
  flex-shrink: 0;
  padding: 8px 12px;
  background: hsl(var(--muted) / 15%);
  border: 1px solid hsl(var(--border) / 60%);
  border-radius: 8px;
}

.unified-section-input {
  display: flex;
  flex: 1; /* 输入区整体也参与弹性分配 */
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.payload-textarea-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  border-radius: 6px;
}

.editor-style-border {
  display: flex; /* 确保 TextArea 填充 */
  flex-direction: column;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 2%);
  transition: all 0.2s;
}

.editor-style-border:focus-within {
  border-color: hsl(var(--primary));
  box-shadow:
    0 0 0 2px hsl(var(--primary) / 10%),
    inset 0 2px 4px 0 rgb(0 0 0 / 2%);
}

.transparent-textarea {
  flex: 1;
  padding: 10px 12px !important;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.result-display-panel {
  position: relative;
  flex: 1;
  padding: 10px 12px;
  overflow: auto;
}

.result-pre-content {
  margin: 0;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: hsl(var(--foreground));
  word-break: break-all;
  white-space: pre-wrap;
}

.result-empty-placeholder {
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 12px;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}

.output-section-flex {
  display: flex;
  flex: 1.5; /* 增加解析结果的权重，使其占据更多底部空间 */
  flex-direction: column;
  gap: 4px;
  min-height: 240px;
}

.item-label {
  display: flex;
  align-items: center;
  margin-bottom: 6px; /* 增加底部间距 */
  font-size: 11px;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Header 摘要样式 */
.header-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: auto;
  padding: 4px 0 0;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: all 0.2s;
}

.header-tags-container:hover {
  background: hsl(var(--muted) / 40%);
  border-color: hsl(var(--primary) / 50%);
}

.header-tag {
  margin: 0 !important;
}

/* 流程引导 */
.flow-divider {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    hsl(var(--border)),
    transparent
  );
}

/* 输出显示容器 */
.result-display-container {
  display: flex;
  flex: 1;
  min-height: 120px;
}

.result-textarea {
  flex: 1;
  font-family: Consolas, monospace;
  font-size: 12px;
  resize: none;
  background: hsl(var(--muted) / 20%) !important;
}

/* 调试日志包装器 */
.debug-log-wrapper {
  flex: 3;
  min-height: 0;
  overflow: hidden;
}

.debug-log-wrapper .debug-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.debug-log-wrapper .log-container-new {
  flex: 1;
  padding: 10px 14px;
  overflow-y: auto;
  font-family: Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  background: hsl(var(--background));
}

.section-title {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 30%);
  border-bottom: 1px solid hsl(var(--border));
}

.log-line {
  padding: 3px 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}

/* 日志级别颜色 */
.log-line :deep(.log-error) {
  color: hsl(var(--destructive));
}

.log-line :deep(.log-warn) {
  color: #f59e0b;
}

.log-line :deep(.log-info) {
  color: #3b82f6;
}

.log-line :deep(.log-success) {
  color: #10b981;
}

.log-line :deep(.log-debug) {
  color: hsl(var(--muted-foreground));
}

.log-line :deep(.log-timestamp) {
  margin-right: 8px;
  font-size: 0.9em;
  color: hsl(var(--muted-foreground));
}
</style>
