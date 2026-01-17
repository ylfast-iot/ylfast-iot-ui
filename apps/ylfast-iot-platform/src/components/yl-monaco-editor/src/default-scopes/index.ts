import { getAllScriptSuggestions } from '#/api/iot/script';

import { createUniversalProviders } from '../dts-converter';
import { registerEditorScope } from '../scope-registry';

/**
 * 动态扫描本地目录并从后端获取脚本提示并注册为作用域
 */
export async function initDefaultScopes() {
  // 1. 注册本地定义的 Scope (Vite glob)
  const modules = import.meta.glob('./*.ts', {
    eager: true,
    import: 'default',
  });

  Object.entries(modules).forEach(([path, content]) => {
    const fileName = path.split('/').pop() || '';
    const scopeName = fileName.replace('.ts', '');

    if (scopeName === 'index') return;

    if (typeof content === 'string') {
      const providers = createUniversalProviders(content, [
        'javascript',
        'typescript',
        'python',
        'java',
      ]);
      registerEditorScope(scopeName, providers);
    }
  });

  // 2. 注册后端返回的动态 Scope
  try {
    const suggestions = await getAllScriptSuggestions();
    if (suggestions && Array.isArray(suggestions)) {
      suggestions.forEach((item) => {
        if (item.scope?.id && item.suggestion) {
          const providers = createUniversalProviders(item.suggestion, [
            'javascript',
            'typescript',
            'python',
            'java',
          ]);
          registerEditorScope(item.scope.id, providers);
          // console.log(`[YlMonacoEditor] Dynamic remote scope registered: ${item.scope.id} (${item.scope.name})`);
        }
      });
    }
  } catch (error) {
    console.warn(
      '[YlMonacoEditor] Failed to fetch dynamic script suggestions:',
      error,
    );
  }
}
