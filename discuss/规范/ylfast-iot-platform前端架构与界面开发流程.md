# ylfast-iot-platform 前端架构与界面开发流程

## 1. 文档目的

本文档用于快速说明 `apps/ylfast-iot-platform` 的前端架构、关键入口、路由菜单机制，以及界面开发的标准落地流程，方便新同学与 AI 工具快速建立上下文。

## 2. 仓库架构总览

### 2.1 Monorepo 结构

仓库采用 `pnpm workspace + turbo` 组织，核心分层如下：

- `apps/`：具体应用
- `packages/`：共享运行时能力包，如 `stores`、`utils`、`icons`、`styles`
- `internal/`：构建工具、Vite 配置、Tailwind 配置、tsconfig 等内部包
- `discuss/`：讨论类、规范类文档
- `docs/`：正式文档站点

### 2.2 当前开发焦点

当前开发重点是：

- `apps/ylfast-iot-platform`

该应用的 `package.json` 暴露了独立命令：

- 开发：`pnpm dev:iot-platform`
- 构建：`pnpm build:iot-platform`
- 类型检查：`pnpm -F @vben/ylfast-iot-platform run typecheck`

## 3. 应用架构

### 3.1 技术栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Ant Design Vue`
- `Pinia`
- `vue-router`
- `@vben/*` 系列共享包
- `vxe-table`，并通过 `yl-vxe-table-card` 做二次封装

### 3.2 启动链路

应用启动链路如下：

1. `src/main.ts`
2. `src/bootstrap.ts`
3. `src/app.vue`

职责分工：

- `src/main.ts`
  - 基于环境变量拼装应用命名空间
  - 初始化偏好设置 `initPreferences`
  - 动态加载 `bootstrap`
- `src/bootstrap.ts`
  - 初始化组件适配器与表单适配器
  - 注册业务选择器与业务下拉组件
  - 装配 i18n、Pinia、权限指令、路由、动效插件
  - 最终挂载 Vue 应用
- `src/app.vue`
  - 注入 `ConfigProvider`
  - 初始化公共系统配置 `systemStore.initPublicConfig()`
  - 驱动主题 token 与标题更新

### 3.3 环境与代理

开发环境关键变量在 `apps/ylfast-iot-platform/.env.development`：

- `VITE_PORT=5666`
- `VITE_GLOB_API_URL=/api`
- `VITE_GLOB_WS_URL=/api`

本地代理定义在 `apps/ylfast-iot-platform/vite.config.mts`：

- `/api` 代理到 `http://localhost:9000/api`
- 会移除前缀 `/api`

## 4. 路由、菜单与权限模型

### 4.1 路由分两部分

项目不是纯前端静态路由模式，而是：

- 本地静态核心路由
- 后端动态菜单路由

关键文件：

- `src/router/routes/index.ts`
- `src/router/access.ts`
- `src/api/core/menu.ts`
- `src/adapter/hsweb/menu.ts`

### 4.2 本地静态路由

本地静态路由主要包含：

- 核心路由
- dashboard 示例路由
- demo/vben 示例路由
- 404 兜底路由

这些路由由 `src/router/routes/modules/*.ts` 收集。

### 4.3 后端动态菜单

业务菜单主要来自后端接口：

- `/menu/user-own/tree`

流程如下：

1. `src/router/access.ts` 中的 `generateAccess` 调用 `getAllMenusApi`
2. `src/api/core/menu.ts` 请求后端菜单树
3. `src/adapter/hsweb/menu.ts` 将 hsweb 菜单结构转成 Vben 可识别的路由结构
4. `generateAccessible` 基于权限模式与页面映射生成最终菜单和可访问路由

### 4.4 页面映射方式

页面组件通过下面的 glob 自动建立映射：

- `import.meta.glob('../views/**/*.vue')`

这意味着：

- 新增页面必须放在 `src/views` 下
- 后端菜单中的组件路径或路由信息，必须能正确映射到 `src/views/**/*.vue`
- 页面路径设计时，要同时校验菜单配置、实际文件路径、路由跳转地址三者一致

## 5. 请求层与后端适配

### 5.1 核心入口

请求统一从：

- `src/api/request.ts`

### 5.2 适配策略

项目后端存在 hsweb 风格响应，`request.ts` 已做统一处理：

- 注入 `Authorization`
- 注入 `Accept-Language`
- 将 hsweb 的 `{ status, result, message }` 结构转换成统一 `{ code, data, message }`
- 统一处理登录过期、刷新 token、通用错误提示

因此业务接口层应优先复用：

- `requestClient`
- `buildBasicCrudApis`

不要在页面层重复写响应格式适配逻辑。

### 5.3 API 文件组织

业务接口按领域拆分在：

- `src/api/core`
- `src/api/system`
- `src/api/iot`
- `src/api/dashboard`

典型模式：

- 一个领域一个文件
- 类型与接口方法放在同一文件
- 常见增删改查优先走 `buildBasicCrudApis`
- 特殊接口再单独扩展

## 6. 界面开发的实际流程

### 6.1 新增页面时的标准步骤

1. 确认页面归属领域，如 `system`、`iot/device`
2. 在 `src/api/<domain>` 补齐接口定义与类型
3. 在 `src/views/<domain>/<page>` 新建页面目录
4. 页面优先拆成：
   - `index.vue`
   - `data.ts` 或 `data.tsx`
   - `components/`
5. 如需复用业务选择器或业务下拉，优先接入 `src/components/business`
6. 若页面通过菜单访问，校验后端菜单配置与 `src/views` 文件路径映射
7. 若页面含中英文文案，补齐 `src/locales/langs/zh-CN` 与 `en-US`
8. 完成后运行类型检查与必要的页面验证

### 6.2 推荐页面结构

列表或管理页优先遵循下面的模式：

```text
src/views/<domain>/<module>/
├─ index.vue
├─ data.tsx
└─ components/
```

职责建议：

- `index.vue`
  - 页面主流程
  - 查询、弹窗、按钮动作、路由跳转
  - 视图插槽组织
- `data.ts` / `data.tsx`
  - 表格列定义
  - 搜索 schema
  - 表单 schema
  - 独立 UI 配置项
- `components/`
  - 卡片项
  - 复杂表单块
  - 明细页子面板

典型例子：

- `src/views/system/user/index.vue + data.tsx`
- `src/views/iot/device/instance/index.vue + data.tsx`

### 6.3 列表页推荐模式

项目列表页推荐优先使用：

- `useYlVxeTableCard`

优势：

- 同时支持表格视图与卡片视图
- 自带工具栏、分页、代理查询
- 能接入 `YlDcForm` 做高级搜索

典型用法：

- 在 `index.vue` 中创建 `TableCard` 与 `gridApi`
- 在 `data.tsx` 中维护 columns 与 search schema
- 通过插槽定义 `action`、`status`、`card`

### 6.4 搜索表单推荐模式

高级搜索优先使用：

- `src/components/yl-dc-form`

适用场景：

- 多条件筛选
- 条件持久化
- 需要 `terms` 结构直接对接 hsweb 查询

### 6.5 表单弹窗推荐模式

新增/编辑弹窗优先使用：

- `useVbenForm`
- `useVbenModal`

建议分工：

- `schema` 放到 `data.tsx`
- 提交逻辑留在 `index.vue`
- 页面层只负责组合提交参数，不重复编写底层校验器

## 7. 业务组件复用策略

### 7.1 通用组件层

通用组件主要放在：

- `src/components/yl-*`

包括：

- `yl-vxe-table-card`
- `yl-dc-form`
- `yl-image-upload`
- `yl-markdown`
- `yl-monaco-editor`
- `yl-config-metadata-form`

### 7.2 业务组件层

业务组件主要放在：

- `src/components/business`

包括：

- 选择器
- 业务弹窗
- 通知、设备、协议、网关等领域组件

如果新页面需要选择产品、设备、协议、证书、用户等实体，优先先查这里是否已有现成选择器，而不是直接新写一套。

### 7.3 注册型组件

项目启动时会注册两类业务组件：

- `registerSelectors()`
- `registerSelects()`

因此新增可复用业务选择器时，需要同步考虑：

- 组件目录落点
- registry 注册
- 页面消费方式

## 8. 状态与配置

### 8.1 状态管理

业务 store 位于：

- `src/store`

其中 `src/store/system.ts` 负责：

- 拉取前端公开配置
- 拉取登录后私有配置
- 更新系统标题、Logo、favicon

### 8.2 偏好设置

项目偏好覆盖在：

- `src/preferences.ts`

当前重点配置：

- `accessMode: 'mixed'`
- `layout: 'mixed-nav'`
- `loginExpiredMode: 'modal'`

这些配置会直接影响布局、权限模式与登录失效体验。

## 9. 开发检查清单

完成页面开发前，至少确认：

- API 是否落在正确领域目录
- 页面是否按 `index.vue + data.ts(x) + components` 组织
- 是否优先复用了 `yl-vxe-table-card` 与 `yl-dc-form`
- 是否避免把 schema、查询、渲染、业务逻辑全部堆进一个文件
- 是否校验了菜单路径、页面路径、路由跳转的一致性
- 是否补齐必要国际化文案
- 是否运行 `pnpm -F @vben/ylfast-iot-platform run typecheck`

## 10. 当前结构风险

当前已经能看到几类需要控制的风险：

- `src/api/system`、`src/views/system`、`src/components` 的单层条目数量偏大，新增功能时要优先继续拆分子目录
- `src/api/iot/device/instance.ts` 已有 626 行，已经超过动态语言单文件 600 行约束
- 若继续在页面文件中叠加 schema、请求、渲染、状态，会进一步增加脆弱性与晦涩性

建议后续逐步把超大领域按“查询接口 / 操作接口 / metadata 接口 / SSE 接口”等职责继续拆分。
