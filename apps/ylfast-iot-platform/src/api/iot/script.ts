import { requestClient } from '#/api/request';

/**
 * 脚本执行器提供者详情
 */
export interface ScriptExecutorProvider {
  /**
   * 脚本类型
   */
  scriptType: string;
  /**
   * 名称
   */
  name: string;
  /**
   * 脚本引擎类型
   */
  scriptEngineType: string;
  /**
   * 文档
   */
  document?: string;
}

export interface ScriptEngineType {
  id: string;
  name: string;
  description?: string;
}

export interface ScriptSuggestion {
  /*
   * 提示
   */
  suggestion: string;

  /**
   * 范围
   */
  scope: ScriptSuggestionScope;
}

export interface ScriptSuggestionScope {
  /**
   * 范围id
   */
  id: string;
  /**
   * 范围名称
   */
  name: string;
}

/**
 * 获取所有范围的脚本提示
 */
export function getAllScriptSuggestions() {
  return requestClient.get<ScriptSuggestion[]>('/iot/script/suggestion/all');
}
/**
 * 获取当前sopce id 的脚本提示
 */
export function getScriptSuggestionsByScopeId(scopeId: string) {
  return requestClient.get<ScriptSuggestion[]>(
    `/iot/script/suggestion/${scopeId}`,
  );
}

/**
 * @description 获取支持的脚本执行器
 */
export function getSupportScriptExecutorProviders() {
  return requestClient.get<ScriptExecutorProvider[]>('/iot/script/supports');
}

/**
 * @description 获取支持的脚本类型
 */
export function getSupportScriptTypes() {
  return requestClient.get<Map<string, object>[]>('/iot/script/support/types');
}

/**
 * @description 获取支持的脚本执行引擎类型
 */
export function getSupportScriptEngineTypes(scriptType?: string) {
  const url = scriptType
    ? `/iot/script/support/${scriptType}/engine/types`
    : '/iot/script/support/engine/types';
  return requestClient.get<Map<string, object>[]>(url);
}
