# ylfast-iot-ui 项目开发指南

## 1. 项目概述 (Project Overview)

`ylfast-iot-ui` 是一个基于 **Vben Admin 5.0** 的现代化前端 Monorepo 项目。本项目采用了 **Vue 3**, **Vite**, **TypeScript** 和 **TurboRepo** 等前沿技术栈。

**🚨 重要提示：** 本项目的核心业务开发主要集中在 `apps/ylfast-iot-platform` 目录下。这是 IoT 平台的主应用程序。其他应用（如 `web-antd`, `web-naive` 等）主要作为参考或组件库示例。

## 2. 核心模块：ylfast-iot-platform

这是你日常开发的主要工作区。

### 2.1 目录结构 (`apps/ylfast-iot-platform`)

```text
apps/ylfast-iot-platform/
├── .env.*                # 环境变量配置 (development, production 等)
├── vite.config.mts       # Vite 配置文件 (包含代理设置)
├── index.html            # 入口 HTML
└── src/                  # 源码目录
    ├── api/              # 后端接口定义
    ├── views/            # 页面试图 (业务逻辑核心)
    ├── router/           # 路由配置
    │   └── routes/       # 路由模块定义
    ├── store/            # Pinia 状态管理 (应用级)
    ├── components/       # 业务通用组件
    ├── layouts/          # 布局组件
    ├── locales/          # 国际化语言包
    ├── adapter/          # 适配层 (用于对接 Vben 核心库)
    ├── utils/            # 工具函数
    └── main.ts           # 应用入口文件
```

### 2.2 关键配置

- **Vite 配置 (`vite.config.mts`):**
  - 使用了 `@vben/vite-config` 预设。
  - **API 代理**: 默认将 `/api` 代理到 `http://localhost:8090` (真实后端地址)。
  - 如果你需要修改后端地址，请编辑此文件中的 `server.proxy.target`。

- **环境配置 (`.env`):**
  - 检查 `.env.development` 可了解开发环境的特定变量。

## 3. 技术栈 (Tech Stack)

- **核心框架:** Vue 3.5+
- **构建工具:** Vite 7+
- **语言:** TypeScript 5.9+
- **包管理:** pnpm (Monorepo 工作区管理)
- **构建编排:** TurboRepo
- **UI 组件库:** Ant Design Vue (主要用于 `ylfast-iot-platform`)
- **样式:** Tailwind CSS (推荐使用 Utility classes)
- **状态管理:** Pinia
- **图标:** Iconify

## 4. 常用开发命令 (Commands)

请在项目**根目录**下运行以下命令：

### 🚀 启动开发环境 (核心)

启动主应用 `ylfast-iot-platform`：

```bash
pnpm dev:iot-platform
```

_这将启动开发服务器，通常访问地址为 http://localhost:5555 (端口视具体配置而定)_

### 📦 构建与发布

构建主应用：

```bash
pnpm build:iot-platform
```

构建所有应用（通常不需要）：

```bash
pnpm build
```

### 🛠 代码质量与提交

- **Lint 检查:** `pnpm lint`
- **类型检查:** `pnpm check:type`
- **提交代码:** `pnpm commit` (使用 czg 交互式提交，遵循 Conventional Commits 规范)

## 5. Monorepo 结构说明

虽然你主要在 `ylfast-iot-platform` 工作，但了解其他目录有助于理解依赖关系：

- **`packages/`**: 共享库，所有的 apps 都依赖这里的内容。
  - `@core/*`: Vben 的核心逻辑（UI Kit, Preferences, Base）。如果你发现某些通用组件无法修改，可能定义在这里。
  - `utils/`: 通用工具函数。
  - `stores/`: 全局共享的 Pinia store（如用户、权限状态）。
  - `api/`: 这里的 API 通常是通用后端的接口，业务接口应放在 app 内部的 `api` 目录。
- **`internal/`**: 构建配置和 Lint 配置。

## 6. 开发规范 (Development Conventions)

1.  **新增功能**: 请优先在 `apps/ylfast-iot-platform/src/views` 下创建新的业务模块。
2.  **路由**: 在 `apps/ylfast-iot-platform/src/router/routes` 下定义新的路由。
3.  **样式**: 优先使用 Tailwind CSS 类名，减少手写 CSS/SCSS。
4.  **组件存放规范**:
    - **页面私有组件**: 仅在当前页面使用的组件，存放在 `src/views/[module]/[page]/components/`。
    - **模块共享组件**: 在同一业务模块下多个页面复用的组件，存放在 `src/views/[module]/components/`。
    - **全局业务组件**: 跨模块复用的业务组件（如 `yl-desc`, `dc-form`），存放在 `src/components/`。
    - **通用基础组件**: 纯 UI 组件或底层封装，若需跨 app 复用，放入 `packages/`。
5.  **API**: 使用 `src/api` 定义接口，保持与后端路径一致。

---

# 现代化业务组件开发规范 (Based on DcForm)

本规范以 `dc-form` 为最佳实践范本，旨在统一项目内复杂业务组件的开发风格，确保组件的可维护性、可扩展性和一致的用户体验。

## 1. 目录结构规范 (Directory Structure)

复杂组件不应只是一个 `.vue` 文件，而是一个**功能模块包**。

```text
src/components/your-component/
├── src/                        # 核心源码目录
│   ├── components/             # 内部子组件 (私有，不导出)
│   │   ├── SubComponentA.vue
│   │   └── SubComponentB.vue
│   ├── hooks/                  # 逻辑 Hook (包括外部控制 Hook)
│   │   └── useYourComponent.ts
│   ├── your-component.vue      # 组件主体 (View)
│   ├── props.ts                # (可选) 复杂的 Props 定义
│   ├── types.ts                # 类型定义 (对外暴露的类型)
│   └── helper.ts               # 工具函数
├── docs/                       # 文档目录
│   ├── README.md               # 使用说明
│   └── CHANGELOG.md            # 变更日志
└── index.ts                    # 入口文件 (导出组件和 Hook)
```

## 2. 核心架构模式：Hook + Action

对于包含表单、弹窗、表格等需要父组件频繁交互的组件，**必须**采用 `useComponent` + `Action` 模式，而非传统的 `ref` 调用。

### 2.1 定义 Action 接口 (`types.ts`)

在 `types.ts` 中定义组件对外暴露的所有方法。

```typescript
// types.ts
export interface YourComponentActionType {
  setProps: (props: Partial<YourComponentProps>) => void;
  reloadData: () => Promise<void>;
  getValue: () => any;
  // ...其他方法
}
```

### 2.2 实现 useHook (`useYourComponent.ts`)

提供一个 Hook 给父组件使用，解耦 `ref` 绑定逻辑。

```typescript
// useYourComponent.ts
export function useYourComponent(props?: YourComponentProps) {
  const yourComponentRef = ref<Nullable<YourComponentActionType>>(null);

  function register(instance: YourComponentActionType) {
    yourComponentRef.value = instance;
    // 初始化逻辑...
  }

  const methods: YourComponentActionType = {
    reloadData: async () => {
      await yourComponentRef.value?.reloadData();
    },
    // ... 代理其他方法
  };

  return [register, methods];
}
```

### 2.3 组件内部暴露 (`index.vue`)

```typescript
// index.vue
const action: YourComponentActionType = {
  reloadData: handleReload,
  // ...
};

onMounted(() => {
  emit('register', action);
});

defineExpose(action);
```

## 3. 数据驱动与 Schema (Schema Driven)

避免在 Template 中硬编码大量表单项或列。应优先采用 **配置化 (Schema)** 的方式生成 UI。

- **规范**: 定义清晰的 `Schema` 接口（如 `DcFormSchema`）。
- **优势**: 易于通过后端动态下发配置，或在不同业务中复用逻辑。

```typescript
// 好的实践
const schemas: DcFormSchema[] = [
  { field: 'name', component: 'Input', label: '名称' },
  { field: 'type', component: 'Select', label: '类型', componentProps: { options: [...] } }
];
```

## 4. 样式与视觉规范 (Styling & Visual)

### 4.1 语义化折叠 (Semantic Collapse)

对于占用空间较大的组件（如筛选器、配置表单），**必须**提供“折叠/摘要”模式。

- **折叠态**: 仅展示关键信息的**语义化摘要**（高亮标签、关键数值）。
- **展开态**: 展示完整的交互表单。
- **视觉层次**: 折叠态应通过边框、背景色与周围元素区分（参考 `dc-form` 的 Header 与 Summary 分离设计）。

### 4.2 CSS 变量与主题

- **禁止**: 使用硬编码颜色 (如 `#1890ff`, `#fff`)。
- **必须**: 使用系统 CSS 变量以支持暗黑模式。
  - 背景: `hsl(var(--background))`, `hsl(var(--card))`
  - 边框: `hsl(var(--border))`
  - 主色: `hsl(var(--primary))`
  - 文本: `hsl(var(--foreground))`, `hsl(var(--muted-foreground))`

### 4.3 动画 (Animation)

- 状态切换（展开/折叠）必须添加 CSS Transition 过渡（`max-height`, `opacity`），禁止生硬的跳变。
- 使用 `v-show` 代替 `v-if` 来保持 DOM 结构以支持高度动画，或使用 `<Transition>` 组件。

## 5. 交互体验规范 (UX)

1.  **智能合并 (Smart Merge)**: 当用户在组件内进行了部分操作（如输入了值），随后组件配置发生变化（如展开更多项）时，**必须保留用户已输入的数据**，不能暴力重置。
2.  **空状态 (Empty State)**: 数据为空时，需提供友好的占位提示或默认初始化一组数据（如 `dc-form` 默认创建一个空条件组）。
3.  **滚动与固定**: 内容过长时，内容区域应支持滚动（`overflow-y: auto`），但操作栏（按钮组）必须**固定在底部**，确保操作触手可及。

## 6. 类型安全 (TypeScript)

- **Props 定义**: 必须使用 TypeScript 接口定义 Props，并在 `defineProps<Props>()` 中使用。
- **严禁 Any**: 核心逻辑中严禁使用 `any`，必须定义明确的 Interface。

## 7. 国际化 (i18n)

- 组件内部显示的文字必须通过 `# /locales` (`$t`) 获取。
- Key 命名规范: `componentName.feature.label` (如 `dcForm.action.save`)。

## 8. 严格编码规范 (Strict Coding Standards)

本项目启用了极其严格的 Lint 和 Type Check 规则，开发时必须遵守：

### 8.1 TypeScript 严格模式

- **禁止隐式 Any (`noImplicitAny`)**: 必须为所有变量和参数显式定义类型。严禁使用 `any`，除非万不得已（需加注释说明）。
- **禁止未使用 (`noUnusedLocals/Parameters`)**: 声明了但未使用的变量、函数参数会导致编译错误。请清理无用代码。
- **空安全 (`strictNullChecks`)**: 必须显式处理 `null` 和 `undefined`。
- **索引访问安全 (`noUncheckedIndexedAccess`)**: 数组或对象索引访问的结果默认为 `T | undefined`，必须进行空值检查。

### 8.2 代码风格与 Lint

- **Import 排序**: 项目集成了 `perfectionist` 插件，Imports 必须按特定顺序排列（通常是内置模块 -> 外部库 -> 内部别名 -> 相对路径）。
- **Prettier**: 所有代码必须符合 Prettier 格式化标准。
- **Vue 3**: 强制使用 `<script setup lang="ts">` 和 Composition API。
- **自动检查**: 除非用户明确要求，否则不要主动运行 `npx prettier` 或 `pnpm lint`。

### 8.3 组件接口一致性

- **Size Prop**: 与 Ant Design Vue 保持一致，使用 `SizeType` (`'small' | 'middle' | 'large'`)，避免使用 `'default'`。
- **类型兼容**: 定义组件 Props 时，尽量复用 UI 库导出的类型（如 `import type { SelectProps } from 'ant-design-vue'`），减少手动定义的类型不匹配风险。

## 9. 示例代码 (Example)

参考 `apps/ylfast-iot-platform/src/components/dc-form`：

- `types.ts`: 定义了 `DcFormSchema`, `DynamicCondition`。
- `index.vue`: 实现了视图、滚动区域、折叠动画。
- `conditionStorage.ts`: 抽离了存储逻辑。
- `components/ConditionGroup.vue`: 子组件，实现了语义化摘要渲染。

## 10. 实例展示

当用户需要给组件添加测试页面时你需要遵循：在apps\ylfast-iot-platform\src\router\routes\modules\demos.ts文件中新增具体的组件测试页面路由，路由所绑定的测试页面路径均在apps\ylfast-iot-platform\src\views\demos\components

- 案例生成时的模拟数据如果合理请带上作者：yaolonga 邮箱：1638538651@qq.com

# 语言约束

输出的文档和代码都必须是中文的，代码注释尽量中文

---

**总结**: 一个优秀的业务组件应该是 **结构清晰的、类型安全的、配置驱动的、并且具有极致用户体验的**。
