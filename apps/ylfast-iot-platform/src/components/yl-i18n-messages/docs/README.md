# YlI18nMessages 组件使用文档

## 组件简介

`YlI18nMessages` 是一个用于配置后端国际化消息的组件，支持动态语言管理、导入导出等功能。

## 快速开始

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { YlI18nMessages } from '#/components/yl-i18n-messages';
import type { I18nMessagesData } from '#/components/yl-i18n-messages';

const i18nData = ref<I18nMessagesData>({
  home: {
    zh_CN: '首页',
    en_US: 'Home',
    en: 'Home',
  },
});
</script>

<template>
  <YlI18nMessages v-model="i18nData" />
</template>
```

### 使用 Hook 进行外部控制

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useYlI18nMessages, YlI18nMessages } from '#/components/yl-i18n-messages';
import type { I18nMessagesData } from '#/components/yl-i18n-messages';

const [register, { getValue, addKey, exportData }] = useYlI18nMessages();

const i18nData = ref<I18nMessagesData>({});

async function handleExport() {
  const data = exportData();
  console.log('导出的数据:', data);
}

async function handleAddCustomKey() {
  await addKey('customKey', {
    zh_CN: '自定义键',
    en_US: 'Custom Key',
  });
}
</script>

<template>
  <div>
    <a-space class="mb-4">
      <a-button @click="handleExport">导出数据</a-button>
      <a-button @click="handleAddCustomKey">添加自定义键</a-button>
    </a-space>
    
    <YlI18nMessages v-model="i18nData" @register="register" />
  </div>
</template>
```

## API 文档

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue / value` | `I18nMessagesData` | `{}` | 双向绑定的国际化数据 |
| `languages` | `string[]` | `['zh_CN', 'en_US', 'en']` | 支持的语言列表 |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` | 组件大小 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `showToolbar` | `boolean` | `true` | 是否显示工具栏 |
| `height` | `number \| string` | - | 表格高度 |
| `bordered` | `boolean` | `true` | 是否显示边框 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `register` | `(action: YlI18nMessagesActionType) => void` | 注册组件实例 |
| `change` | `(value: I18nMessagesData) => void` | 数据变化时触发 |
| `update:modelValue` | `(value: I18nMessagesData) => void` | v-model 更新事件 |

### Methods (通过 Hook 或 ref 调用)

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `getValue` | - | `I18nMessagesData` | 获取当前值 |
| `setValue` | `value: I18nMessagesData` | `Promise<void>` | 设置值 |
| `addKey` | `key: string, translations?: I18nMessage` | `Promise<void>` | 添加新键 |
| `removeKey` | `key: string` | `Promise<void>` | 删除键 |
| `updateKey` | `oldKey: string, newKey: string` | `Promise<void>` | 更新键名 |
| `updateTranslation` | `key: string, language: string, value: string` | `Promise<void>` | 更新翻译值 |
| `addLanguage` | `language: string` | `Promise<void>` | 添加语言 |
| `removeLanguage` | `language: string` | `Promise<void>` | 删除语言 |
| `importData` | `data: I18nMessagesData` | `Promise<void>` | 导入数据 |
| `exportData` | - | `I18nMessagesData` | 导出数据 |
| `clear` | - | `Promise<void>` | 清空所有数据 |

## 数据格式

### I18nMessagesData

```typescript
type I18nMessagesData = Record<string, I18nMessage>;

// 示例
{
  "home": {
    "zh_CN": "首页",
    "en_US": "Home",
    "en": "Home"
  },
  "user": {
    "zh_CN": "用户",
    "en_US": "User"
  }
}
```

### I18nMessage

```typescript
type I18nMessage = Record<string, string>;

// 示例
{
  "zh_CN": "首页",
  "en_US": "Home",
  "en": "Home",
  "ja_JP": "ホーム"
}
```

## 使用场景

### 1. 只读模式

用于展示已配置的国际化数据，不允许编辑。

```vue
<YlI18nMessages v-model="i18nData" :readonly="true" />
```

### 2. 自定义语言列表

初始化时指定特定的语言列表。

```vue
<YlI18nMessages 
  v-model="i18nData" 
  :languages="['zh_CN', 'en_US', 'ja_JP', 'ko_KR']" 
/>
```

### 3. 隐藏工具栏

适用于嵌入式场景，只展示表格部分。

```vue
<YlI18nMessages v-model="i18nData" :show-toolbar="false" />
```

### 4. 导入导出

```vue
<script setup lang="ts">
import { useYlI18nMessages } from '#/components/yl-i18n-messages';

const [register, { importData, exportData }] = useYlI18nMessages();

async function handleImport() {
  const sampleData = {
    welcome: {
      zh_CN: '欢迎',
      en_US: 'Welcome',
    },
  };
  await importData(sampleData);
}

function handleExport() {
  const data = exportData();
  // 下载为 JSON 文件
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'i18n-messages.json';
  a.click();
  URL.revokeObjectURL(url);
}
</script>
```

## 注意事项

1. **键名限制**：不支持嵌套键（如 `user.name`），键名中不能包含点号（`.`）
2. **语言代码**：可以使用任意语言代码，推荐使用标准格式（如 `zh_CN`, `en_US`, `ja_JP`）
3. **数据验证**：导入数据时会自动验证格式，格式不正确会抛出错误
4. **语言合并**：导入数据时会自动提取所有语言并合并到当前语言列表中

## 完整示例

查看完整示例请访问：`/demos/yl-i18n-messages`

## 作者

- 作者：yaolonga
- 邮箱：1638538651@qq.com
