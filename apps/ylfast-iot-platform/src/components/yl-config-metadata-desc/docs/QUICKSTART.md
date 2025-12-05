# YlConfigMetadataDesc 快速开始

## 🚀 5分钟上手

### 1️⃣ 导入组件

```typescript
import { YlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';
```

### 2️⃣ 准备数据

```typescript
import { ref } from 'vue';

// 配置元数据
const metadata = ref({
  name: '设备配置',
  properties: [
    {
      property: 'name',
      name: '设备名称',
      type: {
        type: 'STRING',
        expands: { required: true },
      },
    },
    {
      property: 'enabled',
      name: '启用状态',
      type: { type: 'BOOLEAN' },
    },
  ],
});

// 数据模型
const model = ref({
  name: 'Device-001',
  enabled: true,
});
```

### 3️⃣ 使用组件

```vue
<template>
  <YlConfigMetadataDesc
    :metadata="metadata"
    :model="model"
    @save="handleSave"
  />
</template>

<script setup lang="ts">
function handleSave(data) {
  console.log('保存数据:', data);
}
</script>
```

## 🎯 常见场景

### 场景1：只读展示（无编辑按钮）

```vue
<YlConfigMetadataDesc
  :metadata="metadata"
  :model="model"
  :show-edit-button="false"
/>
```

### 场景2：默认进入编辑模式

```vue
<YlConfigMetadataDesc
  :metadata="metadata"
  :model="model"
  :edit-mode="true"
  @save="handleSave"
/>
```

### 场景3：使用 Hook 控制

```vue
<template>
  <div>
    <YlConfigMetadataDesc @register="register" />
    <Button @click="methods.toggleEditMode">切换编辑</Button>
    <Button @click="handleSave">保存</Button>
  </div>
</template>

<script setup lang="ts">
import { useYlConfigMetadataDesc } from '#/components/yl-config-metadata-desc';

const [register, methods] = useYlConfigMetadataDesc({
  metadata,
  model,
});

async function handleSave() {
  const values = methods.getFieldsValue();
  console.log('当前值:', values);
}
</script>
```

### 场景4：嵌套对象

```typescript
const metadata = ref({
  name: '高级配置',
  properties: [
    {
      property: 'security',
      name: '安全配置',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: {
            name: '安全设置',
            properties: [
              {
                property: 'username',
                name: '用户名',
                type: { type: 'STRING' },
              },
              {
                property: 'password',
                name: '密码',
                type: { type: 'PASSWORD' },
              },
            ],
          },
        },
      },
    },
  ],
});

const model = ref({
  security: {
    username: 'admin',
    password: '******',
  },
});
```

### 场景5：联动配置

```typescript
const metadata = ref({
  name: '通信配置',
  properties: [
    {
      property: 'protocol',
      name: '协议类型',
      type: {
        type: 'ENUM',
        elements: [
          { value: 'mqtt', text: 'MQTT' },
          { value: 'http', text: 'HTTP' },
        ],
        expands: {
          required: true,
          linkageProperty: 'protocolConfig',
          linkagePropertyEnumMapConfig: {
            mqtt: {
              name: 'MQTT 配置',
              properties: [
                {
                  property: 'broker',
                  name: 'Broker 地址',
                  type: { type: 'STRING', expands: { required: true } },
                },
              ],
            },
            http: {
              name: 'HTTP 配置',
              properties: [
                {
                  property: 'url',
                  name: 'URL',
                  type: { type: 'STRING', expands: { required: true } },
                },
              ],
            },
          },
        },
      },
    },
  ],
});

const model = ref({
  protocol: 'mqtt',
  protocolConfig: {
    broker: 'mqtt://localhost:1883',
  },
});
```

## 📋 数据类型速查

| 类型       | 预览显示 | 编辑组件         | 示例                  |
| ---------- | -------- | ---------------- | --------------------- |
| `STRING`   | 文本     | Input            | `"Hello"`             |
| `INTEGER`  | 数字     | InputNumber      | `123`                 |
| `LONG`     | 数字     | InputNumber      | `9999999`             |
| `FLOAT`    | 数字     | InputNumber      | `3.14`                |
| `DOUBLE`   | 数字     | InputNumber      | `3.14159`             |
| `BOOLEAN`  | 是/否    | Switch           | `true` → "是"         |
| `ENUM`     | 枚举文本 | Select           | `"sensor"` → "传感器" |
| `ARRAY`    | 逗号分隔 | Select (tags)    | `["a","b"]` → "a, b"  |
| `OBJECT`   | 嵌套列表 | 嵌套组件         | `{...}`               |
| `PASSWORD` | **\*\*** | Input (password) | `"pwd"` → "**\*\***"  |

## 🎨 自定义样式

```vue
<YlConfigMetadataDesc
  :metadata="metadata"
  :model="model"
  bordered
  size="small"
  :column="{ xs: 1, sm: 2, md: 3 }"
  layout="vertical"
/>
```

## 🔔 事件监听

```vue
<YlConfigMetadataDesc
  :metadata="metadata"
  :model="model"
  @change="handleChange"
  @save="handleSave"
  @cancel="handleCancel"
  @update:editMode="handleEditModeChange"
/>
```

```typescript
function handleChange(values) {
  console.log('数据变化:', values);
}

function handleSave(values) {
  console.log('保存数据:', values);
  // 调用 API 保存
}

function handleCancel() {
  console.log('取消编辑');
}

function handleEditModeChange(mode) {
  console.log('编辑模式:', mode);
}
```

## 💡 小贴士

1. **必填字段**：设置 `expands.required: true` 会在 label 前显示红色 `*`
2. **默认值**：使用 `expands.defaultValue` 设置字段默认值
3. **禁用字段**：设置 `expands.disabled: true` 禁用编辑
4. **隐藏字段**：设置 `expands.ifShow: false` 隐藏字段
5. **响应式列数**：使用 `column` 属性适配不同屏幕尺寸

## 🐛 常见问题

### Q: 如何验证必填字段？

A: 在保存时会自动验证，也可以手动调用：

```typescript
const [register, methods] = useYlConfigMetadataDesc();
await methods.validate(); // 验证所有字段
```

### Q: 如何重置表单？

A: 使用 `resetFields` 方法：

```typescript
methods.resetFields(); // 重置为默认值
```

### Q: 如何获取当前值？

A: 使用 `getFieldsValue` 方法：

```typescript
const values = methods.getFieldsValue();
```

### Q: 如何动态修改配置？

A: 使用 `setProps` 方法：

```typescript
methods.setProps({
  metadata: newMetadata,
  model: newModel,
});
```

## 📖 更多示例

访问演示页面查看完整示例：

- 路由：`/demos/yl-config-metadata-desc`
- 源码：`apps/ylfast-iot-platform/src/views/demos/components/yl-config-metadata-desc`

## 📚 相关文档

- [完整 API 文档](./README.md)
- [开发总结](./SUMMARY.md)
- [项目规范](../../../GEMINI.md)
