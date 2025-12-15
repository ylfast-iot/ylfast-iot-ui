# YlDesc 描述组件

基于 Ant Design Vue `Descriptions` 组件封装的通用描述列表组件，支持 Schema 配置和 Hooks 操作。

## 特性

- **配置驱动**: 通过 `schema` 数组定义描述项。
- **Hooks 支持**: 提供 `useYlDesc` hook，方便外部控制组件（设置属性、更新 Schema 等）。
- **灵活渲染**: 支持 slot 和 render 函数自定义内容。

## 使用

```vue
<script setup lang="ts">
import { useYlDesc } from '@/components/yl-desc';

const [Desc, { setProps }] = useYlDesc({
  title: '基本信息',
  data: { name: 'Vben', age: 18 },
  schemas: [
    { field: 'name', label: '姓名' },
    { field: 'age', label: '年龄' },
  ],
});
</script>

<template>
  <Desc />
</template>
```

## API

### Props

| 属性     | 类型                  | 说明         |
| -------- | --------------------- | ------------ |
| title    | `string`              | 描述列表标题 |
| data     | `Record<string, any>` | 数据对象     |
| schemas  | `YlDescSchema[]`      | 描述项配置   |
| column   | `number`              | 列数         |
| bordered | `boolean`             | 是否展示边框 |

### YlDescSchema

| 属性   | 类型                             | 说明             |
| ------ | -------------------------------- | ---------------- |
| field  | `string`                         | 字段名           |
| label  | `string`                         | 标签名           |
| span   | `number`                         | 包含列的数量     |
| show   | `boolean \| (data) => boolean`   | 是否显示         |
| render | `(val, data) => VNode \| string` | 自定义渲染       |
| slot   | `string`                         | 自定义 slot 名称 |

### Actions (useYlDesc)

- `setProps(props)`: 设置组件属性
- `updateSchema(data)`: 更新 Schema
- `resetSchema(data)`: 重置 Schema (目前行为同 updateSchema)
- `getFieldsValue()`: 获取当前数据
