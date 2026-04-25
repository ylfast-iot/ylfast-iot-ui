# ylfast-iot-platform 上下文地图

## 1. 目标

当任务发生在 `apps/ylfast-iot-platform` 时，用最少上下文快速恢复：

- 仓库结构
- 应用启动链路
- 路由与菜单机制
- 页面开发模式
- 应优先复用的组件与规范文档

## 2. 首选文档

优先读取：

1. `AGENTS.md`
2. `discuss/规范/AI上下文索引.md`
3. `discuss/规范/ylfast-iot-platform前端架构与界面开发流程.md`

按需再读取：

- `discuss/规范/前端页面开发规范.md`
- `discuss/规范/前端接口对接规范.md`
- `discuss/规范/Vue组件开发规范.md`

## 3. 关键文件

### 应用入口

- `apps/ylfast-iot-platform/src/main.ts`
- `apps/ylfast-iot-platform/src/bootstrap.ts`
- `apps/ylfast-iot-platform/src/app.vue`
- `apps/ylfast-iot-platform/src/preferences.ts`

### 路由与权限

- `apps/ylfast-iot-platform/src/router/index.ts`
- `apps/ylfast-iot-platform/src/router/guard.ts`
- `apps/ylfast-iot-platform/src/router/access.ts`
- `apps/ylfast-iot-platform/src/api/core/menu.ts`
- `apps/ylfast-iot-platform/src/adapter/hsweb/menu.ts`

### 请求与后端适配

- `apps/ylfast-iot-platform/src/api/request.ts`
- `apps/ylfast-iot-platform/src/api/basic.ts`
- `apps/ylfast-iot-platform/src/adapter/hsweb/README.md`

### 页面与组件

- `apps/ylfast-iot-platform/src/views`
- `apps/ylfast-iot-platform/src/components/yl-vxe-table-card`
- `apps/ylfast-iot-platform/src/components/yl-dc-form`
- `apps/ylfast-iot-platform/src/components/business`

## 4. 页面开发约定

- 页面目录优先采用 `index.vue + data.ts(x) + components/`
- 列表页优先使用 `useYlVxeTableCard`
- 高级搜索优先使用 `YlDcForm`
- 页面逻辑放 `index.vue`，schema 放 `data.ts(x)`
- 业务选择器优先复用 `components/business/*`

## 5. 结构风险

- 避免继续向 `apps/ylfast-iot-platform/src/api/iot/device/instance.ts` 追加职责，该文件已超过 600 行
- 避免在 `src/components`、`src/views/system`、`src/api/system` 的顶层继续堆平铺文件
