import type { ConditionStorageOption, DynamicCondition } from './types';

/**
 * 条件存储管理器
 */
export class ConditionStorageManager {
  private option: ConditionStorageOption;

  constructor(option?: ConditionStorageOption) {
    // 默认使用本地存储
    this.option = option || {
      mode: 'localstorage',
      conf: {
        storageKey: 'dc-form-conditions',
      },
    };
  }

  /**
   * 删除条件
   */
  async deleteCondition(key: string): Promise<void> {
    if (this.option.mode === 'localstorage') {
      const conf = this.option.conf as { storageKey: string };
      const conditions = await this.getAllConditions();
      const filtered = conditions.filter((c) => c.key !== key);
      localStorage.setItem(conf.storageKey, JSON.stringify(filtered));
    } else {
      // API 模式
      const conf = this.option.conf as any;
      await conf.delApi(key);
    }
  }

  /**
   * 获取所有条件
   */
  async getAllConditions(): Promise<DynamicCondition[]> {
    if (this.option.mode === 'localstorage') {
      const conf = this.option.conf as { storageKey: string };
      const data = localStorage.getItem(conf.storageKey);
      return data ? JSON.parse(data) : [];
    } else {
      // API 模式
      const conf = this.option.conf as any;
      try {
        const result = await conf.getAllApi();
        // 支持通过 resultField 获取嵌套数据
        if (conf.resultField) {
          return this.getNestedValue(result, conf.resultField) || [];
        }
        return result || [];
      } catch (error) {
        console.error('Failed to get all conditions:', error);
        return [];
      }
    }
  }

  /**
   * 加载条件
   */
  async loadCondition(key: string): Promise<DynamicCondition | null> {
    if (this.option.mode === 'localstorage') {
      const conditions = await this.getAllConditions();
      return conditions.find((c) => c.key === key) || null;
    } else {
      // API 模式
      const conf = this.option.conf as any;
      try {
        const result = await conf.getApi(key);
        // 支持通过 resultField 获取嵌套数据
        if (conf.resultField) {
          return this.getNestedValue(result, conf.resultField);
        }
        return result;
      } catch (error) {
        console.error('Failed to load condition:', error);
        return null;
      }
    }
  }

  /**
   * 保存条件
   */
  async saveCondition(condition: DynamicCondition): Promise<void> {
    if (this.option.mode === 'localstorage') {
      const conf = this.option.conf as { storageKey: string };
      const conditions = await this.getAllConditions();
      const index = conditions.findIndex((c) => c.key === condition.key);

      if (index === -1) {
        // 添加新条件
        conditions.push(condition);
      } else {
        // 更新现有条件
        conditions[index] = condition;
      }

      localStorage.setItem(conf.storageKey, JSON.stringify(conditions));
    } else {
      // API 模式
      const conf = this.option.conf as any;
      const conditions = await this.getAllConditions();
      const exists = conditions.find((c) => c.key === condition.key);

      await (exists ? conf.updateApi(condition) : conf.saveApi(condition));
    }
  }

  /**
   * 获取嵌套对象的值
   * 支持 'data.result.list' 这样的路径
   */
  private getNestedValue(obj: any, path: string): any {
    // eslint-disable-next-line unicorn/no-array-reduce
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
