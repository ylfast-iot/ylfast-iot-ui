# 高级测试案例说明

## 📋 功能概述

高级测试页面提供了完整的配置测试功能，包括：

1. **布局配置测试** - 实时调整布局参数
2. **Metadata 导入导出** - 支持自定义配置测试
3. **LocalStorage 持久化** - 配置自动保存，刷新不丢失
4. **多种布局选项** - 测试不同的显示效果

## 🎛️ 控制面板功能

### 1. 布局大小 (Size)

- **小 (small)** - 紧凑布局，适合信息密集场景
- **中 (middle)** - 默认大小
- **大 (default)** - 宽松布局，适合重要信息展示

### 2. 布局类型 (Layout)

- **水平 (horizontal)** - Label 和 Value 水平排列
- **垂直 (vertical)** - Label 在上，Value 在下（推荐）

### 3. 边框 (Bordered)

- **显示** - 显示表格边框
- **隐藏** - 无边框，更简洁

### 4. 列数配置 (Column)

- **1 列** - 单列布局，适合移动端
- **2 列** - 双列布局
- **3 列** - 三列布局（默认）
- **4 列** - 四列布局，适合宽屏

响应式配置：

```typescript
{
  xs: 1,          // 超小屏：1列
  sm: min(col, 1), // 小屏：最多1列
  md: min(col, 2), // 中屏：最多2列
  lg: min(col, 2), // 大屏：最多2列
  xl: col,         // 超大屏：配置的列数
  xxl: col,        // 超超大屏：配置的列数
}
```

## 📥 Metadata 导入导出

### 导入 Metadata

1. 点击"📤 导入 Metadata"按钮
2. 选择 `.json` 文件
3. 自动解析并应用配置

**支持的文件格式：**

```json
{
  "name": "配置名称",
  "description": "配置描述",
  "properties": [
    {
      "property": "字段名",
      "name": "显示名称",
      "description": "字段描述",
      "type": {
        "type": "STRING",
        "expands": {
          "required": true
        }
      }
    }
  ]
}
```

### 导出 Metadata

1. 点击"导出 Metadata"按钮
2. 自动下载 `metadata.json` 文件
3. 可用于备份或分享配置

## 💾 LocalStorage 持久化

所有配置自动保存到浏览器 LocalStorage：

**保存的数据：**

- `metadata` - 配置元数据
- `model` - 数据模型
- `layoutSize` - 布局大小
- `layoutType` - 布局类型
- `bordered` - 边框显示
- `columnConfig` - 列数配置

**存储键名：**

```
yl-config-metadata-desc-advanced-demo
```

### 清除缓存

点击"清除缓存"按钮可以清除所有保存的配置，刷新页面后恢复默认配置。

## 🔄 重置功能

点击"重置为默认"按钮可以将所有配置恢复到初始状态：

**默认配置：**

- 6 个字段（deviceName, deviceType, enabled, port, host, timeout）
- 布局大小：小
- 布局类型：垂直
- 边框：显示
- 列数：3

## 🧪 测试场景

### 场景 1：测试不同列数布局

1. 选择不同的列数（1/2/3/4）
2. 观察字段的排列方式
3. 验证最后一项是否自动填充剩余空间

### 场景 2：测试响应式布局

1. 调整浏览器窗口大小
2. 观察列数的自动调整
3. 验证移动端显示效果

### 场景 3：测试自定义 Metadata

1. 创建自己的 `metadata.json` 文件
2. 导入测试
3. 验证各种数据类型的渲染

### 场景 4：测试持久化

1. 修改各种配置
2. 刷新页面
3. 验证配置是否保持

### 场景 5：测试编辑模式

1. 点击"编辑"按钮
2. 修改字段值
3. 点击"保存"
4. 验证数据模型是否更新

## 📊 示例 Metadata

### 简单示例

```json
{
  "name": "用户信息",
  "properties": [
    {
      "property": "username",
      "name": "用户名",
      "type": { "type": "STRING", "expands": { "required": true } }
    },
    {
      "property": "age",
      "name": "年龄",
      "type": { "type": "INTEGER", "expands": {} }
    },
    {
      "property": "active",
      "name": "激活状态",
      "type": { "type": "BOOLEAN", "expands": {} }
    }
  ]
}
```

### 复杂示例（包含枚举和嵌套）

```json
{
  "name": "设备配置",
  "properties": [
    {
      "property": "type",
      "name": "设备类型",
      "type": {
        "type": "ENUM",
        "elements": [
          { "value": "sensor", "text": "传感器" },
          { "value": "actuator", "text": "执行器" }
        ],
        "expands": { "required": true }
      }
    },
    {
      "property": "config",
      "name": "配置信息",
      "type": {
        "type": "OBJECT",
        "expands": {
          "configMetadata": {
            "name": "详细配置",
            "properties": [
              {
                "property": "host",
                "name": "主机",
                "type": { "type": "STRING", "expands": {} }
              }
            ]
          }
        }
      }
    }
  ]
}
```

## 💡 使用技巧

1. **快速测试** - 使用默认配置快速验证功能
2. **导出备份** - 测试前导出当前配置作为备份
3. **批量测试** - 准备多个 metadata.json 文件进行批量测试
4. **性能测试** - 导入大量字段的 metadata 测试性能
5. **边界测试** - 测试极端情况（1列、10+字段等）

## 🎯 测试检查清单

- [ ] 1列布局显示正常
- [ ] 2列布局显示正常
- [ ] 3列布局显示正常
- [ ] 4列布局显示正常
- [ ] 最后一项自动填充
- [ ] 水平布局显示正常
- [ ] 垂直布局显示正常
- [ ] 边框显示/隐藏正常
- [ ] 小/中/大尺寸显示正常
- [ ] 导入 metadata 成功
- [ ] 导出 metadata 成功
- [ ] 刷新后配置保持
- [ ] 清除缓存成功
- [ ] 重置为默认成功
- [ ] 编辑模式切换正常
- [ ] 数据保存成功

## 🔗 相关文档

- [组件 API 文档](./README.md)
- [快速开始](./QUICKSTART.md)
- [开发总结](./SUMMARY.md)
