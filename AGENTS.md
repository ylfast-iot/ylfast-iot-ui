# ylfast-iot-ui AI 协作入口

本仓库当前前端开发默认聚焦 `apps/ylfast-iot-platform`。

## 先读这些文档

1. [AI 上下文索引](./discuss/规范/AI上下文索引.md)
2. [ylfast-iot-platform 前端架构与界面开发流程](./discuss/规范/ylfast-iot-platform前端架构与界面开发流程.md)
3. [前端页面开发规范](./discuss/规范/前端页面开发规范.md)
4. [前端接口对接规范](./discuss/规范/前端接口对接规范.md)
5. [Vue 组件开发规范](./discuss/规范/Vue组件开发规范.md)

## 当前项目的关键结论

- 仓库是 `pnpm workspace + turbo` monorepo，业务开发主要发生在 `apps/ylfast-iot-platform`
- 技术栈以 `Vue 3 + Vite + TypeScript + Ant Design Vue + Pinia + vue-router` 为主
- 页面通常按 `index.vue + data.ts(x) + components/` 组织
- 列表/卡片页优先复用 `src/components/yl-vxe-table-card`
- 高级搜索优先复用 `src/components/yl-dc-form`
- 路由与菜单是“本地核心路由 + 后端动态菜单”混合模式，新增业务页面时要同时考虑菜单配置与页面路径映射
- 组件、类型、hooks、配置项如果仓库里已经存在，默认先复用
- 枚举如果仓库里已经存在，默认从 `apps/ylfast-iot-platform/src/enums` 复用，不重复定义
- 后端字典项获取默认复用 `apps/ylfast-iot-platform/src/hooks/dictionary/useDictionary.ts` 中的 `useDict`
- 业务组件统一放在 `apps/ylfast-iot-platform/src/components/business`
- 业务选择器默认参考 `apps/ylfast-iot-platform/src/components/business/plugin/plugin-selector` 与 demo 示例
- 业务卡片背景样式默认与插件卡片风格对齐

## 启动与验证

- 本地开发：`pnpm dev:iot-platform`
- 构建：`pnpm build:iot-platform`
- 类型检查：`pnpm -F @vben/ylfast-iot-platform run typecheck`

## 项目专属 Skill

- 项目 skill：[`./.codex/skills/ylfast-iot-platform-context/SKILL.md`](./.codex/skills/ylfast-iot-platform-context/SKILL.md)
- 该 skill 用于快速恢复 `ylfast-iot-platform` 的架构、页面开发流程、规范入口与关键目录映射

## 协作约束

- 所有讨论、文档、注释优先使用简体中文
- 不要在 `master` 直接开发；当前仓库应遵循 `dev` 分支开发与 gitflow 流程
- 如发现目录层级、文件规模、循环依赖、重复逻辑等坏味道，要先指出，再继续开发
- AI Agent 默认不执行后端编译、打包、启动、联调验证；后端验证步骤只给建议，由用户手动执行
- 前端页面默认遵循简洁保守风格：无渐变、小圆角、细边框、中等字重、无 hover 位移、优先原子 CSS
