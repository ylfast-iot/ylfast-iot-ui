# YlVxeTableCard 表格卡片容器

`YlVxeTableCard` 是对 `VbenVxeGrid` 的增强封装。它保留了强大的表格功能（基于 vxe-table），同时增加了**卡片视图 (Card View)** 模式，支持一键切换，非常适合“设备列表”、“商品管理”等图文并茂的业务场景。

## ✨ 核心特性

- **双视图切换**: 顶部工具栏自动注入切换按钮，支持 `Table` 和 `Card` 模式无缝切换。
- **虚拟滚动**: 卡片视图内置虚拟滚动，轻松渲染万级数据，不卡顿。
- **响应式栅格**: 卡片布局自动根据容器宽度调整列数（1列 ~ 5列）。
- **深度集成 DcForm**: 可选集成 `YlDcForm` 替换默认的简单搜索表单，实现高级筛选。

## 📦 基本使用

使用 `useYlVxeTableCard` 替代 `useVbenVxeGrid`。

```vue
<script setup lang="ts">
import { useYlVxeTableCard } from '@/components/yl-vxe-table-card';
import { Card, Avatar } from 'ant-design-vue';

// 定义 Hook
const [TableCardWrapper, { query }] = useYlVxeTableCard({
  // 1. 基础表格配置 (继承自 VbenVxeGrid)
  gridOptions: {
    columns: [
      { field: 'name', title: '名称' },
      { field: 'desc', title: '描述' },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          // 获取数据逻辑...
          return { items: [], total: 0 };
        },
      },
    },
  },

  // 2. 视图模式配置
  mode: 'all', // 支持 'table' | 'card' | 'all'
  defaultMode: 'card', // 默认展示卡片

  // 3. (可选) 集成 YlDcForm 搜索
  searchFormMode: 'yl-dc-form',
  ylDcFromOptions: {
    formSchemas: [{ field: 'name', component: 'Input', label: '搜索名称' }],
  },
});
</script>

<template>
  <div class="h-full p-4">
    <TableCardWrapper>
      <!-- 4. 定义卡片插槽: #card="{ row }" -->
      <template #card="{ row }">
        <Card hoverable>
          <Card.Meta :title="row.name" :description="row.desc">
            <template #avatar>
              <Avatar :src="row.avatar" />
            </template>
          </Card.Meta>
        </Card>
      </template>

      <!-- 可选：自定义表格操作栏 -->
      <template #toolbar-tools>
        <!-- 你的按钮 -->
      </template>
    </TableCardWrapper>
  </div>
</template>
```

## ⚙️ 配置项 (Props)

除支持所有 `VbenVxeGrid` 配置外，新增：

| 属性 | 类型 | 说明 |
| :-- | :-- | :-- |
| `mode` | `'all' \| 'table' \| 'card'` | 视图模式支持范围。`all` 会显示切换按钮。 |
| `defaultMode` | `'table' \| 'card'` | 初始化默认显示的视图。 |
| `searchFormMode` | `'default' \| 'yl-dc-form'` | 搜索栏模式。设为 `yl-dc-form` 启用高级搜索。 |
| `ylDcFromOptions` | `YlDcFormProps` | 传递给 YlDcForm 的配置（Schema 等）。 |
| `cardOptions` | `{ minWidth?: number }` | 卡片布局微调配置。 |

## 🔧 常用方法 (Action)

通过 Hook 返回的第二个参数调用：

- `setMode('card' | 'table')`: 手动切换视图。
- `toggleMode()`: 切换视图。
- `getDcFormApi()`: 获取内部 `YlDcForm` 的句柄（当启用 `yl-dc-form` 模式时），可用于手动设置搜索值。
- `reload()`: 刷新数据。
- `resize()`: 重新计算布局。

## 🧩 插槽 (Slots)

- `#card`: **[核心]** 卡片视图的渲染模板。参数 `{ row, index }`。
- `#toolbar-tools`: 表格工具栏右侧区域。
- `#form`: 自定义搜索表单区域（如果不使用内置配置）。

## 💡 最佳实践

1.  **优先使用 `searchFormMode: 'yl-dc-form'`**: 这能让你的列表页直接拥有高级筛选和条件保存能力。
2.  **卡片设计**: 在 `#card` 插槽中，推荐使用 `Ant Design Vue` 的 `<Card>` 组件，并配合 `hoverable` 属性获得更好的交互体验。
3.  **响应式**: `YlVxeTableCard` 会自动处理卡片列数，但请确保你的卡片内容（如文本长度）也能适应不同宽度。
