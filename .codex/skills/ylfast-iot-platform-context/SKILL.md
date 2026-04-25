---
name: ylfast-iot-platform-context
description: Restore the working context for `ylfast-iot-ui`, especially `apps/ylfast-iot-platform`. Use when implementing or reviewing Vue pages, routes, menu and permission integration, hsweb API adapters, shared business components, or project-specific frontend conventions in this repository.
---

# Ylfast IoT Platform Context

## Quick Start

Do not read the whole repository first. Read only the minimum set needed for the task:

1. Read `AGENTS.md`
2. Read `references/context-map.md`
3. If the task is page work, read `discuss/规范/ylfast-iot-platform前端架构与界面开发流程.md`
4. If the task is API work, also read `discuss/规范/前端接口对接规范.md`
5. If the task is component extraction or review, also read `discuss/规范/Vue组件开发规范.md`

## Workflow

### Understand the app shape

Treat `apps/ylfast-iot-platform` as the default working app unless the user says otherwise.

Focus on these areas first:

- App startup: `src/main.ts`, `src/bootstrap.ts`, `src/app.vue`
- Routing and access: `src/router`, `src/api/core/menu.ts`, `src/adapter/hsweb/menu.ts`
- Request adapter: `src/api/request.ts`
- UI layer: `src/views`, `src/components`

### Implement UI work

Follow the existing page pattern:

- Create page directories under `src/views/...`
- Prefer `index.vue + data.ts(x) + components/`
- Put page orchestration in `index.vue`
- Put table columns, search schemas, and form schemas in `data.ts(x)`
- Reuse `useYlVxeTableCard` for list and card pages
- Reuse `YlDcForm` for advanced search

### Integrate backend-driven menus

Remember that business menus are generated from backend data, not only local route files.

Before assuming a route bug, check:

1. `src/router/access.ts`
2. `src/api/core/menu.ts`
3. `src/adapter/hsweb/menu.ts`
4. Whether the target page exists under `src/views/**/*.vue`

## Guardrails

- Keep documentation and communication in Chinese inside this repository
- Do not develop on `master`; follow the repository's gitflow conventions
- Avoid adding more responsibility into oversized files such as `src/api/iot/device/instance.ts`
- Call out directory bloat, file bloat, circular dependency risk, and duplicated logic when you see them

## Reference

Read `references/context-map.md` for the concise file map and reading order.
