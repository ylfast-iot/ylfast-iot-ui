# YlDcForm 动态条件表单组件

`YlDcForm` 是一个用于构建复杂查询逻辑的高级表单组件。它通过 Schema 驱动，支持嵌套的 `AND`/`OR` 分组、语义化折叠展示以及查询条件的持久化存储。

## ✨ 核心特性

- **逻辑嵌套**: 支持无限层级的条件分组（例如：`(A 和 B) 或 (C 和 D)`）。
- **语义化折叠**: 默认以“胶囊”形式展示查询摘要，节省空间；点击即可展开完整编辑表单。
- **条件存储**: 内置条件管理器，支持将常用查询保存到本地 (`localStorage`) 或后端 API。
- **智能合并**: 展开更多筛选时，自动合并新字段并保留用户已输入的条件。
- **响应式布局**: 支持配置不同屏幕尺寸下的列数，完美适配移动端和桌面端。
- **灵活扩展**: 支持针对不同条件类型（如 `IN`, `LIKE`）渲染不同组件，支持自定义值格式化。

## 📦 基本使用

组件遵循 **Hook + Action** 模式，同时也支持直接使用 Props。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { YlDcForm, useYlDcForm } from '#/components/yl-dc-form';
import type { YlDcFormSchema, Term } from '#/components/yl-dc-form';

// 1. 定义 Schema
const schemas: YlDcFormSchema[] = [
  {
    field: 'deviceName',
    label: '设备名称',
    component: 'Input',
    defaultValue: '',
    termTypes: ['eq', 'like'], // 该字段支持的操作符
  },
  {
    field: 'type',
    label: '设备类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '网关', value: 'gateway' },
        { label: '直连', value: 'direct' },
      ],
    },
    // 针对 'in' (包含) 操作符使用多选框
    termTypeComponents: {
      in: {
        component: 'Select',
        componentProps: { mode: 'tags' },
      },
    },
    termTypes: ['eq', 'in'],
  },
  {
    field: 'createTime',
    label: '创建时间',
    component: 'DatePicker',
    termTypes: ['gt', 'lt'],
    // 格式化输出值
    valueFormatter: (val) => (val ? val.format('YYYY-MM-DD') : val),
  },
];

// 2. 注册 Hook
const [register, { getFieldsValue, setProps }] = useYlDcForm({
  formSchemas: schemas,
  size: 'middle',
  layoutOption: {
    cols: 2, // 默认 2 列
    breakpoints: { xs: 1, md: 2, xl: 3 }, // 响应式配置
  },
  // 开启条件存储（本地模式）
  storeOption: {
    mode: 'localstorage',
    conf: { storageKey: 'device-search-conditions' },
  },
});

const searchTerms = ref<Term[]>([]);

// 3. 处理搜索
const handleSearch = (terms: Term[]) => {
  console.log('查询条件:', terms);
  // 发送给后端...
};

const handleReset = (terms: Term[]) => {
  console.log('重置后条件:', terms);
};
</script>

<template>
  <div class="p-4">
    <YlDcForm
      @register="register"
      @search="handleSearch"
      @reset="handleReset"
      v-model:terms="searchTerms"
    />
  </div>
</template>
```

## ⚙️ 配置项 (Props)

| 属性 | 类型 | 默认 | 说明 |
| :-- | :-- | :-- | :-- |
| `formSchemas` | `YlDcFormSchema[]` | `[]` | 字段定义（见下文） |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` | 组件尺寸 |
| `showMoreButton` | `boolean` | `true` | 是否显示"更多筛选"按钮 |
| `layoutOption` | `object` | - | 响应式列数配置 `{ cols: 1, breakpoints: { md: 2, ... } }` |
| `storeOption` | `object` | - | 条件存储配置 `{ mode: 'api' \| 'localstorage', conf: ... }` |
| `terms` | `Term[]` | - | (v-model) 当前的条件列表 |

### Schema 定义 (`YlDcFormSchema`)

```ts
export interface YlDcFormSchema {
  // 字段名 (对应后端查询字段)
  field: string;
  // 显示名
  label: string;
  // 默认值
  defaultValue?: any;
  // 该字段支持的操作符 (eq, like, gt, lt, in, empty 等)
  termTypes?: TermType[];

  // 默认使用的组件类型 (Input, Select, ApiSelect, DatePicker 等)
  component?: ComponentType;
  // 传递给默认组件的 props
  componentProps?: Record<string, any>;

  // 【高级】针对特定操作符指定不同的组件
  // 例如：eq 使用 Input，in 使用 Select[mode=tags]
  termTypeComponents?: {
    [key in TermType]?: {
      component: ComponentType;
      componentProps?: Record<string, any>;
    };
  };

  // 值格式化函数，用于在构建最终 Terms 时转换值的格式
  valueFormatter?: (value: any) => any;
}
```

## 💾 条件存储 (StoreOption)

支持用户保存常用的查询组合。UI 集成了保存、加载、删除条件的完整交互。详情请参考 [README_STORAGE.md](./README_STORAGE.md)。

## 🎮 Events 事件

| 事件名 | 参数 | 说明 |
| :-- | :-- | :-- |
| `search` | `(terms: Term[]) => void` | 点击搜索按钮或按下回车时触发 |
| `reset` | `(terms: Term[]) => void` | 点击重置按钮时触发 |
| `save` | `(terms: Term[]) => void` | 点击保存按钮时触发 (如果有外部保存需求) |
| `update:terms` | `(terms: Term[]) => void` | 条件变化时触发 (v-model) |
| `resize` | `(entry: ResizeObserverEntry) => void` | 组件容器大小变化时触发 |
| `register` | `(action: YlDcFormActionType) => void` | 组件注册回调 |

## 🔧 Methods 方法 (ActionType)

通过 `useYlDcForm` 返回的 action 对象调用：

**表单操作：**

- `search()`: 触发搜索。
- `resetFields()`: 重置所有条件为初始状态。
- `getFieldsValue()`: 获取当前构建的查询条件结构 (`Term[]`)。
- `setProps(props)`: 动态更新组件 Props。

**Schema 操作：**

- `updateSchema(data)`: 更新指定字段的 Schema (支持数组)。
- `resetSchema(data)`: 重置 Schema。
- `appendSchemaByField(schema, prefixField, first)`: 在指定字段后（或开头/末尾）插入新字段。
- `removeSchemaByField(field)`: 移除指定字段。

**条件存储 (UI 内部主要使用，外部也可调用)：**

> 注意：部分方法在 Hook 中可能未完全代理，建议通过 UI 交互管理条件。

- `saveCondition(name)`: 保存当前条件。
- `loadCondition(key)`: 加载指定条件。
- `deleteCondition(key)`: 删除条件。
- `getAllConditions()`: 获取所有已保存条件。

---
