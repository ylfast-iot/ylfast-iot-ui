# AI 上下文索引

本文档用于帮助 AI 工具在最短路径内恢复 `ylfast-iot-ui`，尤其是 `apps/ylfast-iot-platform` 的开发上下文。

## 适用范围

- 当前迭代默认聚焦 `apps/ylfast-iot-platform`
- 适用于页面开发、接口对接、路由菜单接入、业务组件复用、结构审查

## 推荐阅读顺序

1. [ylfast-iot-platform 前端架构与界面开发流程](./ylfast-iot-platform前端架构与界面开发流程.md)
2. [前端页面开发规范](./前端页面开发规范.md)
3. [前端接口对接规范](./前端接口对接规范.md)
4. [Vue组件开发规范](./Vue组件开发规范.md)

## 最小上下文

如果只需要快速开始开发，请先掌握下面这些结论：

- 仓库是 `pnpm workspace + turbo` monorepo，业务应用位于 `apps/*`
- 当前主应用是 `apps/ylfast-iot-platform`
- 启动入口链路是 `src/main.ts -> src/bootstrap.ts -> src/app.vue`
- 页面主要放在 `src/views`
- API 主要放在 `src/api`
- 路由采用“本地静态核心路由 + 后端菜单动态生成”
- 列表页优先复用 `useYlVxeTableCard`
- 高级搜索优先复用 `YlDcForm`
- 组件、类型、hooks 如已存在，默认先复用，不重复新建
- 枚举如已存在，默认从 `apps/ylfast-iot-platform/src/enums` 复用
- 后端字典项默认通过 `apps/ylfast-iot-platform/src/hooks/dictionary/useDictionary.ts` 的 `useDict` 获取
- 业务组件统一放在 `apps/ylfast-iot-platform/src/components/business`
- 业务选择器默认参考 `src/components/business/plugin/plugin-selector` 与其 demo
- 适配 hsweb 返回格式的核心文件是 `src/api/request.ts` 与 `src/adapter/hsweb/*`
- AI Agent 默认不执行后端编译、打包、启动，后端联调验证由用户手动执行
- 前端页面默认遵循“无渐变、小圆角、细边框、中等字重、无 hover 位移、优先原子 CSS”的保守风格约束

## 目录导航

### 仓库级

- `apps/`：应用入口
- `packages/`：共享能力包，如 `utils`、`stores`、`styles`、`icons`
- `internal/`：内部构建与配置包
- `discuss/规范/`：讨论与规范文档
- `docs/`：正式站点文档

### 应用级

- `apps/ylfast-iot-platform/src/main.ts`：偏好设置初始化与应用启动
- `apps/ylfast-iot-platform/src/bootstrap.ts`：应用装配中心
- `apps/ylfast-iot-platform/src/app.vue`：主题、语言、系统公共配置入口
- `apps/ylfast-iot-platform/src/router`：路由、守卫、动态权限接入
- `apps/ylfast-iot-platform/src/api`：接口层
- `apps/ylfast-iot-platform/src/views`：页面层
- `apps/ylfast-iot-platform/src/components`：通用与业务组件
- `apps/ylfast-iot-platform/src/store`：业务状态
- `apps/ylfast-iot-platform/src/adapter`：组件、表单、表格、hsweb 适配层

## 常用命令

- `pnpm dev:iot-platform`
- `pnpm build:iot-platform`
- `pnpm -F @vben/ylfast-iot-platform run typecheck`

## 进入具体任务前的判断

### 做页面

先看：

- [ylfast-iot-platform 前端架构与界面开发流程](./ylfast-iot-platform前端架构与界面开发流程.md)
- [前端页面开发规范](./前端页面开发规范.md)

额外默认约束：

- 非用户明确要求时，不做装饰化、营销化视觉设计
- 页面实现优先使用原子 CSS，不优先堆 scoped 样式
- `hover` 反馈保持颜色或边框变化，不做位移、缩放、抬升
- 页面里需要后端字典时，优先使用 `useDict('dict-id')`，不要页面内自行重复请求字典接口

### 接接口

先看：

- [前端接口对接规范](./前端接口对接规范.md)
- `apps/ylfast-iot-platform/src/api/request.ts`
- `apps/ylfast-iot-platform/src/adapter/hsweb/README.md`

额外默认约束：

- 如果本次任务包含后端修改，AI Agent 不主动执行 Maven、Gradle 编译或启动命令
- 后端验证只提供建议步骤，由用户自行执行

### 抽组件

先看：

- [Vue组件开发规范](./Vue组件开发规范.md)
- `apps/ylfast-iot-platform/src/components/yl-vxe-table-card/docs/README.md`

额外默认约束：

- 如果仓库里已有同类组件、类型、hooks、配置项，默认先复用
- 如果仓库里已有同类枚举，默认从 `apps/ylfast-iot-platform/src/enums` 复用
- 业务组件统一归档到 `apps/ylfast-iot-platform/src/components/business`
- 业务选择器优先参考 `apps/ylfast-iot-platform/src/components/business/plugin/plugin-selector`
- 卡片背景样式优先与插件卡片实现对齐

### 查菜单或权限问题

先看：

- `apps/ylfast-iot-platform/src/router/access.ts`
- `apps/ylfast-iot-platform/src/api/core/menu.ts`
- `apps/ylfast-iot-platform/src/adapter/hsweb/menu.ts`

## 当前结构风险提醒

- `src/api/system`、`src/views/system`、`src/components` 等目录层级已偏大，后续新增功能时应优先继续下钻子目录
- `apps/ylfast-iot-platform/src/api/iot/device/instance.ts` 已超过 600 行，应避免继续向该文件堆积职责
