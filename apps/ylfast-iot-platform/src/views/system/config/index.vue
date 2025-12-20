<script setup lang="ts">
import type { RuleObject } from 'ant-design-vue/es/form';

import type { SystemConfigApi } from '#/api/system/config';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Input,
  message,
  Row,
  Spin,
} from 'ant-design-vue';

import { batchSaveConfig, getScopeConfigDetail } from '#/api/system/config';
import { $t } from '#/locales';

import ImageUpload from './components/ImageUpload.vue';

const loading = ref(false);
const formRef = ref();

// 数据模型
const configData = reactive<{
  amap: {
    [key: string]: any;
    apiKey?: string;
    secretKey?: string;
    webKey?: string;
  };
  front: Record<string, any>;
  paths: Record<string, any>;
}>({
  amap: {},
  front: {},
  paths: {},
});

// 校验规则
interface ConfigRules {
  front: {
    title: RuleObject[];
  };
  paths: {
    'base-path': RuleObject[];
  };
}

const rules: ConfigRules = {
  front: {
    title: [
      {
        required: true,
        message: $t('config.placeholder.title'),
        trigger: 'blur',
      },
    ],
  },
  paths: {
    'base-path': [
      {
        required: true,
        message: $t('config.placeholder.basePath'),
        trigger: 'blur',
      },
    ],
  },
};

// 原始数据，用于保存时构建请求
const originalConfigs = ref<SystemConfigApi.ScopeConfig[]>([]);

const fetchConfig = async () => {
  loading.value = true;
  try {
    const scopes = ['front', 'amap', 'paths'];
    const res = (await getScopeConfigDetail(
      scopes,
    )) as any as SystemConfigApi.ScopeConfig[];
    originalConfigs.value = res;

    // 映射到响应式数据
    res.forEach((item) => {
      switch (item.scope) {
        case 'amap': {
          configData.amap = { ...item.properties };

          break;
        }
        case 'front': {
          configData.front = { ...item.properties };

          break;
        }
        case 'paths': {
          configData.paths = { ...item.properties };

          break;
        }
        // No default
      }
    });
  } catch (error) {
    console.error('Failed to fetch config:', error);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    // 构建保存数据
    const dataToSave: SystemConfigApi.ScopeConfig[] = originalConfigs.value.map(
      (item) => {
        let props = {};
        switch (item.scope) {
          case 'amap': {
            props = configData.amap;
            // No default
            break;
          }
          case 'front': {
            props = configData.front;
            break;
          }
          case 'paths': {
            props = configData.paths;
            break;
          }
        }

        return {
          ...item,
          properties: props,
        };
      },
    );

    await batchSaveConfig(dataToSave);
    message.success($t('config.message.saveSuccess'));
  } catch (error) {
    console.error('Failed to save config:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchConfig();
});
</script>

<template>
  <Page :title="$t('config.title')">
    <template #extra>
      <Button type="primary" :loading="loading" @click="handleSave">
        {{ $t('config.action.save') }}
      </Button>
    </template>
    <div class="p-4">
      <Spin :spinning="loading">
        <Form
          ref="formRef"
          :model="configData"
          layout="vertical"
          class="space-y-4"
        >
          <!-- 基础设置卡片 -->
          <Card :title="$t('config.card.basic')" :bordered="false">
            <Row :gutter="24">
              <Col :span="12">
                <FormItem
                  :label="$t('config.front.title')"
                  :name="['front', 'title']"
                  :rules="rules.front.title"
                >
                  <Input
                    v-model:value="configData.front.title"
                    :placeholder="$t('config.placeholder.title')"
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem
                  :label="$t('config.paths.basePath')"
                  :name="['paths', 'base-path']"
                  :rules="rules.paths['base-path']"
                >
                  <Input
                    v-model:value="configData.paths['base-path']"
                    :placeholder="$t('config.placeholder.basePath')"
                  />
                </FormItem>
              </Col>
            </Row>

            <Row :gutter="24">
              <Col :span="6">
                <FormItem
                  :label="$t('config.front.logo')"
                  :name="['front', 'logo']"
                  :extra="$t('config.front.supportImage')"
                >
                  <ImageUpload
                    v-model:value="configData.front.logo"
                    default-value="/logo-v1.webp"
                    object-fit="contain"
                  />
                </FormItem>
              </Col>
              <Col :span="6">
                <FormItem
                  :label="$t('config.front.ico')"
                  :name="['front', 'ico']"
                  :extra="$t('config.front.supportIco')"
                >
                  <ImageUpload
                    v-model:value="configData.front.ico"
                    default-value="/favicon.ico"
                    object-fit="contain"
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem
                  :label="$t('config.front.background')"
                  :name="['front', 'background']"
                  :extra="$t('config.front.supportBg')"
                >
                  <ImageUpload
                    v-model:value="configData.front.background"
                    default-value="/bg.svg"
                    object-fit="cover"
                  />
                </FormItem>
              </Col>
            </Row>
          </Card>

          <!-- 高德地图卡片 -->
          <Card :title="$t('config.card.amap')" :bordered="false">
            <Row :gutter="24">
              <Col :span="8">
                <FormItem
                  :label="$t('config.amap.apiKey')"
                  :name="['amap', 'apiKey']"
                >
                  <Input
                    v-model:value="configData.amap.apiKey"
                    :placeholder="`${$t('config.placeholder.input')} apiKey`"
                  />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem
                  :label="$t('config.amap.secretKey')"
                  :name="['amap', 'secretKey']"
                >
                  <Input
                    v-model:value="configData.amap.secretKey"
                    :placeholder="`${$t('config.placeholder.input')} secretKey`"
                  />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem
                  :label="$t('config.amap.webKey')"
                  :name="['amap', 'webKey']"
                >
                  <Input
                    v-model:value="configData.amap.webKey"
                    :placeholder="`${$t('config.placeholder.input')} webKey`"
                  />
                </FormItem>
              </Col>
            </Row>

            <!-- 渲染其他可能存在的配置项 -->
            <div
              v-if="
                Object.keys(configData.amap).some(
                  (k) => !['apiKey', 'secretKey', 'webKey'].includes(k),
                )
              "
              class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <template v-for="(_val, key) in configData.amap" :key="key">
                <FormItem
                  v-if="
                    !['apiKey', 'secretKey', 'webKey'].includes(key as string)
                  "
                  :label="key as string"
                  :name="['amap', key]"
                >
                  <Input v-model:value="configData.amap[key]" />
                </FormItem>
              </template>
            </div>
          </Card>
        </Form>
      </Spin>
    </div>
  </Page>
</template>
