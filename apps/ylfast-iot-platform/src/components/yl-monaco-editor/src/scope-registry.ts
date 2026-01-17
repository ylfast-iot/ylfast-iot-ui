import type { MonacoCompletionProvider } from './types';

import { initDefaultScopes } from './default-scopes';

// 单例 Map 存储作用域配置
const scopeRegistry = new Map<string, MonacoCompletionProvider[]>();

// 初始化状态标识
let isInitialized = false;

/**
 * 确保默认作用域已初始化
 * 此函数应在 Pinia 就绪后调用，或在组件生命周期内调用
 */
export async function ensureDefaultScopes() {
  if (isInitialized) return;
  isInitialized = true;
  await initDefaultScopes();
}
/* 注册一个编辑器提示作用域
 * @param scopeName 作用域名称(e.g., 'protocol-script', 'sql-query')
 * @param providers 该作用域下的 Provide 列表
 */
export function registerEditorScope(
  scopeName: string,
  providers: MonacoCompletionProvider[],
) {
  if (scopeRegistry.has(scopeName)) {
    console.warn(`[YlMonacoEditor] Scope "${scopeName}" is being overwritten.`);
  }
  scopeRegistry.set(scopeName, providers);
}

/**
 * 获取指定作用域的 Providers
 * @param scopeName 作用域名称
 */
export function getEditorScope(scopeName: string): MonacoCompletionProvider[] {
  return scopeRegistry.get(scopeName) || [];
}

/**
 * 移除作用域 (用于清理)
 */
export function unregisterEditorScope(scopeName: string) {
  scopeRegistry.delete(scopeName);
}

/**
 * 获取所有已注册的作用域名称
 */
export function getRegisteredScopes(): string[] {
  return [...scopeRegistry.keys()];
}
