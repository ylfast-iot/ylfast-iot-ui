# Vue组件开发规范

## 1. 适用范围

本文适用于 `ylfast-iot-ui/apps/xxx` 中的 Vue 组件开发，包括：

- 全局通用组件
- 业务组件
- 页面级组件
- 表单组件
- 卡片组件
- 复杂交互组件

本文重点约束以下内容：

- 组件目录结构
- 通用逻辑抽离方式
- `hooks + useXXX` 组织方式
- `tsx` 与 `template` 的使用边界
- 组件对外使用方式

## 2. 总体原则

组件开发统一遵循以下原则：

- 视图和逻辑分离
- 通用逻辑优先复用
- 组件、类型、hooks、配置项如果仓库中已经存在，默认先复用，不重复新建同义实现
- 枚举如果仓库中已经存在，默认从 `apps/ylfast-iot-platform/src/enums` 复用
- 复杂逻辑优先抽离到 `hooks`
- 简单组件保持直观、易读
- 复杂组件优先保证可维护性，而不是强行保持模板写法
- 组件对外暴露方式必须清晰，不要让业务代码深层依赖内部实现

## 3. 组件分类约定

### 3.1 全局组件

全局通用组件统一放在：

```text
src/components/
```

适用场景：

- 多页面复用的基础组件
- 多业务域复用的通用组件
- 需要统一暴露能力的全局组件

### 3.1.1 业务组件目录约束

业务组件统一放在：

```text
apps/ylfast-iot-platform/src/components/business/
```

适用范围：

- 业务选择器
- 业务卡片
- 业务详情展示块
- 业务域内复用的弹窗、抽屉、表单组件

要求：

- 不要把业务组件散落到 `src/components` 根目录下
- 如果组件明确属于某个业务域，应优先归档到 `src/components/business/{domain}/`
- 页面内暂时只用一次、且没有复用价值的局部组件，才放到页面自己的 `components/`

### 3.2 页面级组件

页面级组件统一放在当前页面目录下的：

```text
src/views/{domain}/{page}/components/
```

适用场景：

- 只服务于当前页面的卡片组件
- 只服务于当前页面的弹窗组件
- 只服务于当前页面的局部展示组件

要求：

- 页面级组件不要提升到 `src/components`，除非已经明确会被多个页面复用
- 页面级组件允许直接使用单文件 `.vue` 或 `.tsx`

## 4. 全局组件目录规范

### 4.1 标准目录结构

对于复杂的全局通用组件，统一使用标准目录结构。

以 `Select` 组件为例：

```text
src/components/Select/
├─ index.ts
└─ src/
   ├─ index.vue
   ├─ types.ts
   ├─ props.ts
   ├─ hooks.ts
   └─ components/
      └─ **
```

各文件职责如下：

#### `src/components/Select/index.ts`

作用：

- 作为组件统一入口
- 默认导出 `src` 下的主组件或相关能力
- 屏蔽外部对内部文件结构的直接依赖

要求：

- 外部使用全局组件时，优先从 `index.ts` 导入
- 不要让业务代码跨过入口直接依赖多个内部文件

#### `src/components/Select/src/index.vue`

作用：

- 组件主实现文件
- 承载主视图结构与组件对外行为

#### `src/components/Select/src/types.ts`

作用：

- 放组件相关类型定义
- 放导出给外部使用的类型

要求：

- 关键类型属性必须写注释

#### `src/components/Select/src/props.ts`

作用：

- 放组件 `props` 相关定义
- 放默认值、类型约束、属性说明

要求：

- 不要把大量 `props` 定义直接堆在 `index.vue`
- 属性必须配套必要注释

#### `src/components/Select/src/hooks.ts`

作用：

- 放当前组件内部可复用的通用逻辑
- 放与组件状态、事件、计算行为相关的抽离逻辑

要求：

- 导出方法统一使用 `useXXX`
- 只放组件相关逻辑，不要把无关工具函数塞进来

#### `src/components/Select/src/components/**`

作用：

- 放该组件的子组件
- 放复杂拆分后的局部渲染组件

### 4.2 简单全局组件例外

对于简单的全局组件，不需要强制使用完整目录结构。

允许直接使用单文件创建：

```text
src/components/Select.vue
```

或：

```text
src/components/Select.tsx
```

适用场景：

- 逻辑非常简单
- 没有复杂状态管理
- 没有复杂子组件拆分
- 不需要单独拆出 `types`、`props`、`hooks`

原则：

- 简单组件优先简单处理，不要为了套规范制造多余目录
- 只有当组件已经明显复杂、需要长期维护和扩展时，再升级为标准目录结构

### 4.3 复用优先原则

新增组件或类型前，必须先检查当前仓库是否已有可复用实现。

强制要求：

- 已存在的组件优先扩展或封装，不重复创建同义组件
- 已存在的类型、`props`、hooks、配置对象优先复用，不重复定义一套语义相同的结构
- 已存在的枚举、常量映射优先从 `apps/ylfast-iot-platform/src/enums` 引用，不要在页面、组件、api 中重复定义
- 如果只是名称不同、行为相同，本质上仍视为重复实现，应避免再次创建

推荐排查范围：

- `apps/ylfast-iot-platform/src/components`
- `apps/ylfast-iot-platform/src/components/business`
- `apps/ylfast-iot-platform/src/views/**/components`
- `apps/ylfast-iot-platform/src/api/**/*.ts`
- `apps/ylfast-iot-platform/src/enums/**/*.ts`

## 5. Hooks 规范

### 5.1 通用逻辑必须抽离

当前项目中，通用逻辑统一采用 `hooks + useXXX` 的方式抽离，提高可复用性和可维护性。

适合抽离到 `hooks` 的逻辑包括：

- 列表查询逻辑
- 弹窗打开/关闭逻辑
- 表单提交逻辑
- 批量操作逻辑
- 状态切换逻辑
- 权限判断逻辑
- 表格配置复用逻辑
- 国际化选项映射逻辑
- 组件状态管理逻辑
- 与多个页面、多个组件重复出现的计算逻辑

### 5.2 命名规范

统一命名为：

```ts
useXxx;
```

示例：

- `useDeviceTable`
- `useDeviceModal`
- `useArticleForm`
- `useSelectOptions`
- `useBatchDelete`

要求：

- 不要写成 `deviceHook`、`commonLogic`、`utilDevice`
- 名称必须体现用途，而不是只体现资源名

### 5.3 目录建议

页面级逻辑建议：

```text
src/views/{domain}/{page}/
├─ index.vue
├─ data.tsx
├─ hooks/
│  ├─ useXxxTable.ts
│  ├─ useXxxModal.ts
│  └─ useXxxForm.ts
└─ components/
```

全局复用逻辑建议：

```text
src/hooks/
```

组件内部逻辑建议：

```text
src/components/Xxx/src/hooks.ts
```

### 5.4 不需要抽成 hooks 的场景

以下场景不要过度抽离：

- 只有一两行且只在当前组件使用的简单逻辑
- 与模板强绑定、没有复用价值的局部变量
- 过度拆分后反而降低可读性的简单组件逻辑

原则是：

- 能提升复用性和可维护性时再抽
- 不要为了“有 hooks”而制造不必要复杂性

## 6. TSX 与 Template 使用边界

### 6.1 简单组件使用 template

简单组件统一优先使用 `.vue + template` 方式开发。

适用场景：

- 普通展示组件
- 简单表单组件
- 卡片组件
- 布局组件
- 条件分支不多的页面片段
- 结构清晰、插槽不复杂的基础组件

### 6.2 复杂组件使用 TSX

复杂组件优先使用 `tsx` 开发。

适用场景：

- 动态渲染分支很多
- 插槽组合复杂
- 高度配置化的渲染组件
- 表格单元格渲染器
- 动态表单项渲染器
- 递归结构、树结构、拖拽结构等复杂 UI
- 使用模板会导致大量重复片段和可读性下降的组件

### 6.3 选择判断标准

可按以下标准判断：

- 结构稳定、展示直观：用 `template`
- 分支复杂、渲染动态、组合度高：用 `tsx`
- 如果一个组件使用 `template` 后出现大量 `v-if/v-else`、重复模板块、复杂插槽嵌套，应考虑改为 `tsx`

## 7. 组件对外使用规范

组件使用统一支持两种方式。

### 7.1 通过 `useXX` 方式使用组件

当组件需要配套状态管理、弹窗控制、命令式调用、实例方法暴露时，推荐提供 `useXX` 的使用方式。

适用场景：

- 弹窗组件
- 抽屉组件
- 命令式表单组件
- 带状态控制的复杂选择器
- 需要与页面逻辑深度联动的组件

示例命名：

- `useSelect`
- `useDevicePicker`
- `useUserDialog`

要求：

- `useXX` 方法负责屏蔽复杂初始化逻辑
- 返回值应清晰表达组件状态、方法和实例能力
- 涉及对外暴露的状态和方法必须写注释

### 7.2 直接引入组件使用

当组件是典型声明式组件时，也允许直接引入组件使用。

全局组件推荐写法：

```ts
import Select from '#/components/Select';
```

页面级组件推荐写法：

```ts
import DeviceCard from './components/DeviceCard.vue';
```

要求：

- 全局组件优先通过统一入口导入
- 页面级组件可以直接引入 `.vue` 或 `.tsx`
- 不要在外部直接深层依赖全局组件内部文件

## 8. 组件拆分规范

组件拆分时，建议优先按职责拆，而不是按文件大小机械拆分。

推荐拆分对象：

- 头部工具栏
- 搜索区
- 卡片展示区
- 表单区
- 明细区
- 批量操作区
- 复杂子渲染块

如果一个组件同时承担以下多种职责，应考虑拆分：

- 数据获取
- 状态管理
- 表单联动
- 列表渲染
- 卡片渲染
- 弹窗交互

## 9. 业务卡片与选择器规范

### 9.1 卡片背景样式统一约束

业务卡片组件如果采用卡片式视觉，背景样式统一参考“插件卡片”的实现，不要各业务域各自发明一套背景语言。

参考实现：

- `apps/ylfast-iot-platform/src/components/business/plugin/plugin-selector/src/components/PluginCardItem.vue`

要求：

- 卡片背景、边框、悬浮态、选中态的视觉语言优先与插件卡片保持一致
- 新增业务卡片时，优先复用插件卡片已有的背景处理方式、阴影策略、边框表达和状态层次
- 除非用户明确要求，否则不要单独引入另一套完全不同的卡片背景风格

### 9.2 业务选择器统一参考基线

新开发业务选择器时，默认参考插件业务选择器的结构与交互，不要从零重新设计一套选择器模式。

主参考目录：

- `apps/ylfast-iot-platform/src/components/business/plugin/plugin-selector`

测试与示例参考：

- `apps/ylfast-iot-platform/src/views/demos/business-components/components/PluginSelectorDemo.vue`
- `apps/ylfast-iot-platform/src/views/demos/business-components/index.vue`

要求：

- 优先复用现有 `selector` 的目录结构、hooks 组织方式和弹窗/列表/卡片切换模式
- 新业务选择器应尽量对齐插件选择器的对外 API 风格
- 如果选择器只是资源域不同，优先基于插件选择器抽象或复制其骨架，而不是另起一套交互体系

## 10. 注释规范

组件开发必须补充必要注释，重点范围如下：

- `hooks` 中的核心导出方法
- 组件 `props` 类型中的关键属性
- `types.ts` 中的关键字段
- 复杂渲染逻辑
- 动态表单联动逻辑
- 权限控制逻辑
- 兼容性处理逻辑

要求：

- 注释重点解释“为什么这样做”
- 不要写“设置变量”“点击按钮”这类无信息量注释

## 11. 推荐示例

### 10.1 简单全局组件

可以直接写成：

```text
src/components/StatusTag.vue
```

或：

```text
src/components/StatusTag.tsx
```

### 10.2 标准全局组件

```text
src/components/Select/
├─ index.ts
└─ src/
   ├─ index.vue
   ├─ types.ts
   ├─ props.ts
   ├─ hooks.ts
   └─ components/
      └─ OptionItem.vue
```

### 10.3 页面级组件

```text
src/views/examples/crud-demo-device-view/components/
├─ DeviceCard.vue
└─ DeviceFilter.tsx
```

## 12. 禁止事项

- 不要把通用逻辑长期堆在多个页面里重复实现
- 不要简单组件为了炫技全部改成 `tsx`
- 不要复杂组件明明已经模板失控，还强行继续堆 `template`
- 不要把 `hooks` 写成杂物堆
- 不要把纯工具函数和组件状态逻辑混在同一个 `hooks` 文件里
- 不要让外部代码绕过 `index.ts` 直接深层依赖全局组件内部文件
- 不要把本来很简单的组件强行拆成一大堆目录和文件
- 不要已存在组件、类型、hooks 可以复用时，仍然重复创建同义实现
- 不要枚举已经存在于 `apps/ylfast-iot-platform/src/enums` 时，仍在页面、组件、api 中再定义一套状态常量
- 不要新业务卡片自己定义一套与插件卡片冲突的背景样式
- 不要业务选择器脱离 `src/components/business` 单独散落实现
- 不要新业务选择器完全脱离插件业务选择器的结构与交互基线

## 13. 结论

Vue 组件开发统一遵循以下口径：

- 全局组件统一放在 `src/components`
- 业务组件统一放在 `apps/ylfast-iot-platform/src/components/business`
- 页面级组件统一放在当前页面的 `components/` 下
- 简单组件允许直接一个 `.vue` 或 `.tsx` 文件创建
- 复杂全局组件使用标准目录结构：`index.ts + src/index.vue + src/types.ts + src/props.ts + src/hooks.ts + src/components/**`
- 通用逻辑使用 `hooks + useXXX` 方式抽离
- 简单组件使用 `template`
- 复杂组件使用 `tsx`
- 组件既可以通过 `useXX` 方式使用，也可以通过统一入口或单文件方式直接引入使用
- 已存在的组件、类型、hooks 优先复用
- 已存在的枚举优先从 `apps/ylfast-iot-platform/src/enums` 复用
- 业务卡片背景样式优先与插件卡片对齐
- 业务选择器默认参考插件业务选择器与其 demo 示例
