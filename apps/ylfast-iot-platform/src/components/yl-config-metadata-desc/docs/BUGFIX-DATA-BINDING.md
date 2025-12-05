# 数据绑定问题修复

## 🐛 问题描述

保存后数据模型没有更新，编辑的内容没有同步到父组件的 `model`。

## 🔍 根本原因

组件使用了单向数据绑定 `:model="model"`，虽然组件内部发出了 `update:model` 事件，但父组件没有监听这个事件来更新数据。

## ✅ 解决方案

使用 Vue 3 的 `v-model` 语法糖实现双向数据绑定。

### 修改前

```vue
<YlConfigMetadataDesc :metadata="metadata" :model="model" @save="handleSave" />

<script>
function handleSave(data) {
  // 需要手动更新 model
  Object.assign(model.value, data);
}
</script>
```

### 修改后

```vue
<YlConfigMetadataDesc
  v-model:model="model"
  :metadata="metadata"
  @save="handleSave"
/>

<script>
function handleSave(data) {
  // model 已经自动同步，不需要手动更新
  console.log('保存数据:', data);
}
</script>
```

## 📝 工作原理

### 组件内部

组件监听 `formModel` 的变化并发出 `update:model` 事件：

```typescript
// yl-config-metadata-desc.vue
watch(
  formModel,
  (newVal) => {
    emit('change', newVal);
    emit('update:model', newVal); // ← 发出更新事件
    emit('update:modelValue', newVal);
  },
  { deep: true },
);
```

### 父组件使用

**方式 1：v-model（推荐）**

```vue
<YlConfigMetadataDesc v-model:model="model" />
```

等价于：

```vue
<YlConfigMetadataDesc :model="model" @update:model="model = $event" />
```

**方式 2：手动监听事件**

```vue
<YlConfigMetadataDesc :model="model" @update:model="handleModelUpdate" />

<script>
function handleModelUpdate(newModel) {
  model.value = newModel;
}
</script>
```

## 🎯 最佳实践

### 1. 使用 v-model

```vue
<YlConfigMetadataDesc v-model:model="model" :metadata="metadata" />
```

### 2. 监听 change 事件（可选）

如果需要在数据变化时执行额外逻辑：

```vue
<YlConfigMetadataDesc
  v-model:model="model"
  :metadata="metadata"
  @change="handleChange"
/>

<script>
function handleChange(newData) {
  console.log('数据变化:', newData);
  // 执行其他逻辑
}
</script>
```

### 3. 监听 save 事件（可选）

如果需要在保存时调用 API：

```vue
<YlConfigMetadataDesc
  v-model:model="model"
  :metadata="metadata"
  @save="handleSave"
/>

<script>
async function handleSave(data) {
  // 调用 API 保存
  await api.saveConfig(data);
  message.success('保存成功');
}
</script>
```

## 📊 数据流

```
用户编辑
  ↓
DescItem 组件 (v-model:value)
  ↓
formModel 变化
  ↓
watch 监听到变化
  ↓
emit('update:model', newVal)
  ↓
v-model:model 自动更新父组件的 model
  ↓
页面显示的数据模型自动更新 ✅
```

## ✅ 修复验证

1. 进入编辑模式
2. 修改字段值
3. 点击"保存"
4. 查看"数据模型"卡片
5. ✅ 数据已更新

## 🔧 其他修复

同时修复了以下问题：

1. **editMode 传递问题**
   - 添加了对 kebab-case `edit-mode` 的支持
   - 确保编辑模式正确传递到子组件

2. **清理调试代码**
   - 移除了所有 `console.log` 调试输出
   - 移除了模板中的调试变量显示

## 📚 相关文档

- [Vue 3 v-model 文档](https://vuejs.org/guide/components/v-model.html)
- [组件 Props 文档](./README.md#props)
- [组件 Events 文档](./README.md#events)
