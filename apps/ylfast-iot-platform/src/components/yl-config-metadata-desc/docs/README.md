# YlConfigMetadataDesc 组件

基于 Ant Design Vue Descriptions 的配置元数据描述列表组件，支持预览和编辑两种模式。

## 功能特性

- ✅ **双模式切换**：支持预览模式和编辑模式无缝切换
- ✅ **智能渲染**：根据数据类型自动选择合适的展示/编辑组件
- ✅ **嵌套支持**：支持嵌套对象配置的递归渲染
- ✅ **联动配置**：支持基于枚举值的动态联动配置
- ✅ **必填标识**：必填字段在 label 前显示红色星号
- ✅ **响应式布局**：自适应不同屏幕尺寸
- ✅ **主题兼容**：完美支持亮色/暗色主题
- ✅ **类型安全**：完整的 TypeScript 类型定义

## 基本用法

### 预览模式

```vue
<template>
  <YlConfigMetadataDesc
    :metadata="metadata"
    :model="model"
    :show-edit-button="false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

const metadata = ref({
  name: '设备配置',
  properties: [
    {
      property: 'deviceName',
      name: '设备名称',
      type: { type: 'STRING', expands: { required: true } },
    },
    // ...更多属性
  ],
});

const model = ref({
  deviceName: 'Device-001',
});
</script>
```

### 编辑模式

```vue
<template>
  <YlConfigMetadataDesc
    :metadata="metadata"
    :model="model"
    @save="handleSave"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
function handleSave(data) {
  console.log('保存数据:', data);
}

function handleCancel() {
  console.log('取消编辑');
}
</script>
```

### 使用 Hook

```vue
<template>
  <YlConfigMetadataDesc @register="register" />
  <Button @click="methods.toggleEditMode">切换编辑模式</Button>
</template>

<script setup lang="ts">
import { useYlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

const [register, methods] = useYlConfigMetadataDesc({
  metadata,
  model,
});

// 调用方法
methods.setEditMode(true);
methods.validate();
methods.getFieldsValue();
</script>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| metadata | `ConfigMetadata \| ConfigMetadata[]` | - | 配置元数据 |
| model | `Recordable` | - | 数据模型 |
| modelValue | `Recordable` | - | v-model 支持 |
| editMode | `boolean` | `false` | 是否为编辑模式 |
| showEditButton | `boolean` | `true` | 是否显示编辑按钮 |
| editButtonText | `string` | `'编辑'` | 编辑按钮文本 |
| cancelButtonText | `string` | `'取消'` | 取消按钮文本 |
| saveButtonText | `string` | `'保存'` | 保存按钮文本 |
| isNested | `boolean` | `false` | 是否为嵌套模式 |
| hideRootHeader | `boolean` | `false` | 是否隐藏根标题 |
| hideNestedHeader | `boolean` | `false` | 是否隐藏嵌套标题 |

继承 Ant Design Vue `DescriptionsProps` 的所有属性。

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| register | `(instance: YlConfigMetadataDescActionType) => void` | 组件注册事件 |
| change | `(values: Recordable) => void` | 数据变化事件 |
| update:model | `(values: Recordable) => void` | model 更新事件 |
| update:modelValue | `(values: Recordable) => void` | modelValue 更新事件 |
| update:editMode | `(mode: boolean) => void` | 编辑模式更新事件 |
| save | `(values: Recordable) => void` | 保存事件 |
| cancel | `() => void` | 取消事件 |

## Methods (通过 Hook 或 ref 调用)

| 方法名 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| setProps | `(props: Partial<YlConfigMetadataDescProps>) => void` | - | 设置组件属性 |
| toggleEditMode | `() => void` | - | 切换编辑模式 |
| setEditMode | `(mode: boolean) => void` | - | 设置编辑模式 |
| validate | `() => Promise<any>` | `Promise<any>` | 验证表单 |
| resetFields | `() => Promise<void>` | `Promise<void>` | 重置字段 |
| setFieldsValue | `(values: Recordable) => void` | - | 设置字段值 |
| getFieldsValue | `() => Recordable` | `Recordable` | 获取字段值 |

## 数据类型支持

组件根据 `ConfigPropertyMetadata.type.type` 自动选择合适的展示/编辑组件：

- `STRING`: Input / 文本
- `INTEGER`, `LONG`, `FLOAT`, `DOUBLE`: InputNumber / 数字
- `BOOLEAN`: Switch / 是/否
- `ENUM`: Select / 枚举文本
- `ARRAY`: Select (tags mode) / 逗号分隔
- `OBJECT`: 嵌套描述列表 / JSON
- `PASSWORD`: Input (password) / **\*\***

## 高级特性

### 嵌套对象

```typescript
{
  property: 'security',
  name: '安全配置',
  type: {
    type: 'OBJECT',
    expands: {
      configMetadata: {
        name: '安全设置',
        properties: [
          // 嵌套属性
        ],
      },
    },
  },
}
```

### 联动配置

```typescript
{
  property: 'protocol',
  name: '通信协议',
  type: {
    type: 'ENUM',
    elements: [
      { value: 'mqtt', text: 'MQTT' },
      { value: 'http', text: 'HTTP' },
    ],
    expands: {
      linkageProperty: 'protocolConfig',
      linkagePropertyEnumMapConfig: {
        mqtt: {
          // MQTT 配置元数据
        },
        http: {
          // HTTP 配置元数据
        },
      },
    },
  },
}
```

### 必填字段

```typescript
{
  property: 'deviceName',
  name: '设备名称',
  type: {
    type: 'STRING',
    expands: {
      required: true, // 标记为必填
    },
  },
}
```

## 样式定制

组件使用 CSS 变量，自动适配主题：

- `hsl(var(--foreground))` - 前景色
- `hsl(var(--muted-foreground))` - 次要前景色
- `hsl(var(--border))` - 边框色
- `hsl(var(--card))` - 卡片背景色
- `hsl(var(--primary))` - 主色

## 示例

查看 `apps/ylfast-iot-platform/src/views/demos/components/yl-config-metadata-desc` 目录下的完整示例：

- `BasicDemo.vue` - 基础预览模式
- `EditModeDemo.vue` - 编辑模式
- `ComplexDemo.vue` - 嵌套与联动

## 注意事项

1. **必填验证**：编辑模式下，必填字段会在保存时进行验证
2. **数据同步**：组件内部使用响应式数据，修改会实时同步到 model
3. **嵌套渲染**：嵌套对象会递归渲染，支持无限层级
4. **联动逻辑**：联动配置会根据选择的值动态显示/隐藏相关配置项

## 更新日志

### v1.0.0 (2025-12-05)

- ✨ 初始版本发布
- ✨ 支持预览和编辑模式
- ✨ 支持嵌套对象和联动配置
- ✨ 完整的 TypeScript 类型支持
