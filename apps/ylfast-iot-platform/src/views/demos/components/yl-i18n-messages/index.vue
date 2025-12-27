<script lang="ts" setup>
import type { I18nMessagesData } from '#/components/yl-i18n-messages';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  message,
  Space,
  Tag,
  TypographyTitle,
} from 'ant-design-vue';

import {
  useYlI18nMessages,
  YlI18nMessages,
} from '#/components/yl-i18n-messages';

// 基础用法
const basicValue = ref<I18nMessagesData>({
  home: {
    zh_CN: '首页',
    en_US: 'Home',
    en: 'Home',
  },
  user: {
    zh_CN: '用户',
    en_US: 'User',
    en: 'User',
  },
  settings: {
    zh_CN: '设置',
    en_US: 'Settings',
    en: 'Settings',
  },
});

// Hook 用法
const [register, { getValue, addKey, addLanguage, importData }] =
  useYlI18nMessages();

const hookValue = ref<I18nMessagesData>({
  dashboard: {
    zh_CN: '仪表板',
    en_US: 'Dashboard',
    en: 'Dashboard',
  },
  profile: {
    zh_CN: '个人资料',
    en_US: 'Profile',
    en: 'Profile',
  },
});

// 只读模式
const readonlyValue = ref<I18nMessagesData>({
  login: {
    zh_CN: '登录',
    en_US: 'Login',
    en: 'Login',
  },
  logout: {
    zh_CN: '登出',
    en_US: 'Logout',
    en: 'Logout',
  },
  register: {
    zh_CN: '注册',
    en_US: 'Register',
    en: 'Register',
  },
});

// 自定义语言列表
const customLanguagesValue = ref<I18nMessagesData>({
  welcome: {
    zh_CN: '欢迎',
    en_US: 'Welcome',
    ja_JP: 'ようこそ',
    ko_KR: '환영합니다',
  },
  goodbye: {
    zh_CN: '再见',
    en_US: 'Goodbye',
    ja_JP: 'さようなら',
    ko_KR: '안녕히 가세요',
  },
});

// Hook 操作示例
async function handleGetValue() {
  const value = getValue();
  message.success(`获取成功，共 ${Object.keys(value).length} 个键`);
}

async function handleAddKey() {
  try {
    await addKey('newKey', {
      zh_CN: '新键',
      en_US: 'New Key',
      en: 'New Key',
    });
    message.success('通过 Hook 添加键成功');
  } catch (error) {
    message.error((error as Error).message);
  }
}

async function handleAddLanguage() {
  try {
    await addLanguage('fr_FR');
    message.success('通过 Hook 添加语言成功');
  } catch (error) {
    message.error((error as Error).message);
  }
}

function handleExport() {
  message.success('数据已导出到控制台');
}

async function handleImport() {
  try {
    const sampleData: I18nMessagesData = {
      imported: {
        zh_CN: '导入的数据',
        en_US: 'Imported Data',
        en: 'Imported Data',
      },
    };
    await importData(sampleData);
    message.success('通过 Hook 导入数据成功');
  } catch (error) {
    message.error((error as Error).message);
  }
}

// 模拟数据（作者：yaolonga，邮箱：1638538651@qq.com）
const mockData: I18nMessagesData = {
  menu: {
    zh_CN: '菜单',
    en_US: 'Menu',
    en: 'Menu',
  },
  notification: {
    zh_CN: '通知',
    en_US: 'Notification',
    en: 'Notification',
  },
  message: {
    zh_CN: '消息',
    en_US: 'Message',
    en: 'Message',
  },
  search: {
    zh_CN: '搜索',
    en_US: 'Search',
    en: 'Search',
  },
  help: {
    zh_CN: '帮助',
    en_US: 'Help',
    en: 'Help',
  },
};
</script>

<template>
  <Page
    description="YlI18nMessages 组件用于配置后端的国际化消息，支持动态语言管理、导入导出等功能。作者：yaolonga (1638538651@qq.com)"
    title="YlI18nMessages 组件演示"
  >
    <div class="demo-container">
      <!-- 基础用法 -->
      <Card class="demo-card" title="1. 基础用法">
        <template #extra>
          <Tag color="blue">可编辑</Tag>
        </template>
        <p class="demo-description">
          基本的国际化消息配置，支持添加键、编辑翻译、删除键等操作。
        </p>
        <YlI18nMessages v-model="basicValue" :height="300" />
        <div class="demo-output">
          <TypographyTitle :level="5">当前值：</TypographyTitle>
          <pre>{{ JSON.stringify(basicValue, null, 2) }}</pre>
        </div>
      </Card>

      <!-- Hook 用法 -->
      <Card class="demo-card" title="2. Hook 用法（外部控制）">
        <template #extra>
          <Tag color="green">Hook 控制</Tag>
        </template>
        <p class="demo-description">
          使用 <code>useYlI18nMessages</code> Hook
          在外部控制组件，实现编程式操作。
        </p>

        <div class="demo-actions">
          <Space wrap>
            <Button type="primary" @click="handleGetValue"> 获取当前值 </Button>
            <Button @click="handleAddKey">添加键（newKey）</Button>
            <Button @click="handleAddLanguage">添加语言（fr_FR）</Button>
            <Button @click="handleExport">导出数据</Button>
            <Button @click="handleImport">导入示例数据</Button>
          </Space>
        </div>

        <YlI18nMessages
          v-model="hookValue"
          :height="300"
          @register="register"
        />
      </Card>

      <!-- 只读模式 -->
      <Card class="demo-card" title="3. 只读模式">
        <template #extra>
          <Tag color="orange">只读</Tag>
        </template>
        <p class="demo-description">
          设置 <code>readonly</code> 属性后，组件将禁用所有编辑功能。
        </p>
        <YlI18nMessages
          v-model="readonlyValue"
          :height="250"
          :readonly="true"
        />
      </Card>

      <!-- 自定义语言列表 -->
      <Card class="demo-card" title="4. 自定义语言列表">
        <template #extra>
          <Tag color="purple">自定义语言</Tag>
        </template>
        <p class="demo-description">
          通过
          <code>languages</code> 属性自定义初始语言列表，支持任意语言代码（如
          ja_JP, ko_KR）。
        </p>
        <YlI18nMessages
          v-model="customLanguagesValue"
          :height="250"
          :languages="['zh_CN', 'en_US', 'ja_JP', 'ko_KR']"
        />
      </Card>

      <!-- 无工具栏 -->
      <Card class="demo-card" title="5. 隐藏工具栏">
        <template #extra>
          <Tag>无工具栏</Tag>
        </template>
        <p class="demo-description">
          设置 <code>showToolbar</code> 为 <code>false</code>
          可以隐藏顶部工具栏，适用于嵌入式场景。
        </p>
        <YlI18nMessages
          v-model="basicValue"
          :height="250"
          :show-toolbar="false"
        />
      </Card>

      <!-- 模拟数据展示 -->
      <Card class="demo-card" title="6. 模拟数据示例">
        <template #extra>
          <Tag color="cyan">示例数据</Tag>
        </template>
        <p class="demo-description">
          模拟后端返回的国际化数据（作者：yaolonga，邮箱：1638538651@qq.com）
        </p>
        <YlI18nMessages :height="300" :model-value="mockData" readonly />
      </Card>

      <!-- API 说明 -->
      <Card class="demo-card" title="API 说明">
        <Descriptions :column="1" bordered size="small">
          <DescriptionsItem label="Props">
            <ul class="api-list">
              <li>
                <code>modelValue / value</code>: 双向绑定的数据，类型为
                <code>I18nMessagesData</code>
              </li>
              <li>
                <code>languages</code>: 支持的语言列表，默认
                <code>['zh_CN', 'en_US', 'en']</code>
              </li>
              <li>
                <code>size</code>: 组件大小，可选 <code>'large'</code>,
                <code>'middle'</code>, <code>'small'</code>
              </li>
              <li><code>readonly</code>: 只读模式，默认 <code>false</code></li>
              <li>
                <code>showToolbar</code>: 是否显示工具栏，默认
                <code>true</code>
              </li>
              <li>
                <code>height</code>: 表格高度，支持数字或字符串（如
                <code>'400px'</code>）
              </li>
              <li>
                <code>bordered</code>: 是否显示边框，默认 <code>true</code>
              </li>
            </ul>
          </DescriptionsItem>
          <DescriptionsItem label="Events">
            <ul class="api-list">
              <li><code>register</code>: 注册组件实例，用于 Hook 控制</li>
              <li><code>change</code>: 数据变化事件</li>
              <li><code>update:modelValue</code>: v-model 更新事件</li>
            </ul>
          </DescriptionsItem>
          <DescriptionsItem label="Methods (通过 Hook)">
            <ul class="api-list">
              <li><code>getValue()</code>: 获取当前值</li>
              <li><code>setValue(value)</code>: 设置值</li>
              <li><code>addKey(key, translations?)</code>: 添加新键</li>
              <li><code>removeKey(key)</code>: 删除键</li>
              <li><code>updateKey(oldKey, newKey)</code>: 更新键名</li>
              <li>
                <code>updateTranslation(key, language, value)</code>: 更新翻译值
              </li>
              <li><code>addLanguage(language)</code>: 添加语言</li>
              <li><code>removeLanguage(language)</code>: 删除语言</li>
              <li><code>importData(data)</code>: 导入数据</li>
              <li><code>exportData()</code>: 导出数据</li>
              <li><code>clear()</code>: 清空所有数据</li>
            </ul>
          </DescriptionsItem>
        </Descriptions>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.demo-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-card {
  width: 100%;
}

.demo-description {
  margin-bottom: 16px;
  color: hsl(var(--muted-foreground));
}

.demo-description code {
  padding: 2px 6px;
  background: hsl(var(--muted));
  border-radius: 4px;
  font-size: 0.9em;
}

.demo-actions {
  margin-bottom: 16px;
}

.demo-output {
  margin-top: 16px;
  padding: 16px;
  background: hsl(var(--muted));
  border-radius: 6px;
}

.demo-output pre {
  margin: 0;
  font-size: 12px;
  overflow-x: auto;
}

.api-list {
  margin: 0;
  padding-left: 20px;
}

.api-list li {
  margin: 8px 0;
  line-height: 1.6;
}

.api-list code {
  padding: 2px 6px;
  background: hsl(var(--muted));
  border-radius: 4px;
  font-size: 0.9em;
}
</style>
