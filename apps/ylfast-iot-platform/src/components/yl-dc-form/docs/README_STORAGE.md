# YlDcForm 条件存储功能 UI 使用指南

## 功能概述

`YlDcForm` 组件现在内置了条件存储管理UI，用户可以直接通过界面保存、加载和管理查询条件。

## 主要功能

### 1. **保存条件**

- 点击"保存"按钮（或"编辑条件"按钮，如果已加载条件）
- 在弹出的对话框中输入条件名称
- 点击确定完成保存
- 保存成功后会显示提示消息

### 2. **加载条件**

- 点击"搜索"按钮右侧的下拉箭头
- 在下拉菜单中选择已保存的条件
- 点击条件名称即可加载该条件
- 加载成功后，"保存"按钮会变为"编辑条件"

### 3. **删除条件**

- 在搜索按钮的下拉菜单中
- 鼠标悬停在条件项上
- 点击右侧出现的删除按钮
- 删除成功后会显示提示消息

### 4. **编辑条件**

- 加载一个已保存的条件后
- 修改查询条件
- 点击"编辑条件"按钮
- 在对话框中可以修改条件名称或保持原名
- 点击确定更新条件

## UI 特性

### 美观设计

- **下拉菜单**：采用卡片式设计，带阴影效果
- **条件列表**：每个条件项都有悬停效果
- **删除按钮**：鼠标悬停时才显示，避免误操作
- **图标提示**：保存/编辑按钮带有对应图标
- **空状态**：没有保存条件时显示友好提示

### 交互细节

- 条件名称过长时自动省略显示
- 删除按钮点击时阻止事件冒泡，不会触发加载
- 下拉菜单最大高度限制，超出时可滚动
- 对话框支持回车键快速保存

## 使用示例

```vue
<script setup lang="ts">
import { useYlDcForm } from '#/components/yl-dc-form';
import type { YlDcFormSchema } from '#/components/yl-dc-form';

const schemas: YlDcFormSchema[] = [
  {
    label: '设备名称',
    field: 'name',
    component: 'Input',
  },
  {
    label: '状态',
    field: 'state',
    component: 'Select',
    componentProps: {
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'notActive' },
      ],
    },
  },
];

// 使用默认本地存储
const [DynamicConditionForm] = useYlDcForm({
  formSchemas: schemas,
  // 可选：自定义存储key
  storeOption: {
    mode: 'localstorage',
    conf: {
      storageKey: 'my-device-conditions',
    },
  },
});

const handleSearch = (terms) => {
  console.log('搜索条件:', terms);
  // 执行搜索逻辑
};
</script>

<template>
  <div>
    <DynamicConditionForm @search="handleSearch" />
  </div>
</template>
```

## 存储配置

### 本地存储（默认）

```typescript
const [DynamicConditionForm] = useYlDcForm({
  formSchemas: schemas,
  // 不传 storeOption 或使用以下配置
  storeOption: {
    mode: 'localstorage',
    conf: {
      storageKey: 'custom-key', // 可选，默认为 'yl-dc-form-conditions'
    },
  },
});
```

### API 存储

```typescript
const [DynamicConditionForm] = useYlDcForm({
  formSchemas: schemas,
  storeOption: {
    mode: 'api',
    conf: {
      getAllApi: () => fetch('/api/conditions').then((r) => r.json()),
      getApi: (key) => fetch(`/api/conditions/${key}`).then((r) => r.json()),
      saveApi: (condition) =>
        fetch('/api/conditions', {
          method: 'POST',
          body: JSON.stringify(condition),
        }).then((r) => r.json()),
      updateApi: (condition) =>
        fetch(`/api/conditions/${condition.key}`, {
          method: 'PUT',
          body: JSON.stringify(condition),
        }).then((r) => r.json()),
      delApi: (key) =>
        fetch(`/api/conditions/${key}`, {
          method: 'DELETE',
        }).then((r) => r.json()),
      resultField: 'data', // API 返回数据的字段路径
    },
  },
});
```

## 样式定制

组件使用 scoped 样式，如需定制可通过以下 CSS 变量或类名覆盖：

```css
/* 下拉菜单 */
.condition-dropdown-menu {
  /* 自定义样式 */
}

/* 条件项 */
.condition-menu-item {
  /* 自定义样式 */
}

/* 删除按钮 */
.delete-btn {
  /* 自定义样式 */
}
```

## 注意事项

1. **存储限制**：本地存储模式下，浏览器有大小限制（通常 5-10MB）
2. **条件唯一性**：每个条件通过时间戳生成唯一 key
3. **编辑模式**：加载条件后，保存按钮会变为"编辑条件"，更新时使用相同的 key
4. **数据格式**：保存的条件包含完整的 groups 数据结构
5. **国际化**：所有文本支持中英文切换

## 快捷键

- **回车键**：在保存对话框中按回车可快速保存
- **ESC键**：关闭保存对话框

## 最佳实践

1. **命名规范**：使用有意义的条件名称，如"本月新增设备"、"故障设备查询"等
2. **定期清理**：删除不再使用的条件，保持列表整洁
3. **分类管理**：对于不同页面，使用不同的 `storageKey` 区分
4. **备份重要条件**：对于复杂的查询条件，建议导出备份
