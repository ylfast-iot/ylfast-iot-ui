# YlDashboard 看板组件库

该目录用于存放看板相关的通用业务组件。

## 目录结构

```text
src/components/yl-dashboard/
├── src/                        # 组件源码目录
│   ├── [component-name]/       # 具体组件 (如 chart-card)
│   │   ├── index.vue           # 组件入口
│   │   ├── types.ts            # 组件类型
│   │   └── ...
│   └── index.ts                # 组件统一导出
├── types.ts                    # 全局共享类型
└── index.ts                    # 模块入口
```

## 开发规范

1. 每个子组件应在 `src/` 下建立独立文件夹。
2. 子组件必须在 `src/index.ts` 中导出。
3. 对外暴露的类型应在 `types.ts` 或组件内的 `types.ts` 定义。
