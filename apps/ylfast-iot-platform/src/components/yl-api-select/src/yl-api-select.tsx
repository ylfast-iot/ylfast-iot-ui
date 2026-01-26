import type { PropType } from 'vue';

import type { Term } from '#/adapter';

import { computed, defineComponent, ref } from 'vue';

import { ApiComponent } from '@vben/common-ui';

import { Select, TreeSelect } from 'ant-design-vue';

// eslint-disable-next-line vue/one-component-per-file
export default defineComponent({
  name: 'YlApiSelect',
  props: {
    // eslint-disable-next-line vue/require-default-prop
    value: {
      type: [String, Number, Array] as PropType<any>,
    },
    multiple: {
      type: Boolean,
      default: true,
    },
    allowInput: {
      type: Boolean,
      default: false,
    },
    // eslint-disable-next-line vue/require-default-prop
    api: {
      type: Function as PropType<(arg?: any) => Promise<any>>,
    },
    params: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    terms: {
      type: Array as PropType<Term[]>,
      default: () => [],
    },
    resultField: {
      type: String,
      default: '',
    },
    labelField: {
      type: String,
      default: 'label',
    },
    valueField: {
      type: String,
      default: 'value',
    },
    placeholder: {
      type: String,
      default: '请选择',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isTree: {
      type: Boolean,
      default: false,
    },
    childrenField: {
      type: String,
      default: 'children',
    },
    allowSearch: {
      type: Boolean,
      default: true,
    },
    // eslint-disable-next-line vue/require-default-prop
    arrayValueFormat: {
      type: String,
    },
  },
  emits: ['update:value', 'change'],
  setup(props, { emit, attrs }) {
    const searchValue = ref('');

    /**
     * 值转换代理 (对组件内部始终使用数组 + 字符串化，对外部根据 arrayValueFormat 转换)
     */
    const proxyValue = computed({
      get: () => {
        const val = props.value;
        // 1. 如果是多选且配置了格式化
        if (props.multiple && props.arrayValueFormat) {
          if (typeof val === 'string') {
            // 彻底清洗字符串：按分隔符拆分 -> 每个元素去除首尾空格 -> 过滤掉空字符串 -> 去重 -> 强制转 String
            const array = val
              .split(props.arrayValueFormat)
              .map((s) => s.trim())
              .filter(Boolean);
            return [...new Set(array)];
          }
          if (Array.isArray(val)) {
            // 确保内部全是字符串以匹配 numberToString={true} 厚的 option
            const array = val.map((v) => String(v).trim()).filter(Boolean);
            return [...new Set(array)];
          }
        }
        // 2. 如果是多选数组但没配置格式化，也确保字符串化
        if (props.multiple && Array.isArray(val)) {
          return [...new Set(val.map((v) => String(v).trim()).filter(Boolean))];
        }
        // 3. 单选情况
        return val !== undefined && val !== null ? String(val).trim() : val;
      },
      set: (val) => {
        let emitVal = val;
        // 如果是多选且开启了格式化
        if (props.multiple && props.arrayValueFormat && Array.isArray(val)) {
          // 清洗、去重并合并
          const uniqueVal = [
            ...new Set(val.map((v) => String(v).trim()).filter(Boolean)),
          ];
          emitVal = uniqueVal.join(props.arrayValueFormat);
        }
        emit('update:value', emitVal);
        emit('change', emitVal);
        searchValue.value = ''; // 选中后清空搜索框
      },
    });

    const handleSearch = (val: string) => {
      searchValue.value = val;
    };

    // eslint-disable-next-line vue/one-component-per-file
    const MergedSelect = defineComponent({
      name: 'MergedSelect',
      inheritAttrs: false,
      setup(_, { attrs: selectAttrs, slots }) {
        return () => {
          const {
            options = [],
            value,
            searchValue: sValue,
            // 从 ApiComponent 接收到的事件处理函数
            'onUpdate:value': onUpdateValue,
            onChange,
            ...rest
          } = selectAttrs as any;

          const list: any[] = [...options];

          // 确保内容回显 (当前选中的值必须在选项列表中)
          // 增加二次防御：如果内部状态意外收到了未拆分的字符串，在此处强制拆分
          let valToProcess = value;
          if (
            typeof value === 'string' &&
            props.multiple &&
            props.arrayValueFormat &&
            value.includes(props.arrayValueFormat)
          ) {
            valToProcess = value
              .split(props.arrayValueFormat)
              .map((s) => s.trim())
              .filter(Boolean);
          }

          const currentValues = (
            Array.isArray(valToProcess) ? valToProcess : [valToProcess]
          ).filter((v) => v !== undefined && v !== null && v !== '');

          const exists = (items: any[], v: any): boolean => {
            const vStr = String(v).trim();
            return items.some((item) => {
              if (String(item.value).trim() === vStr) return true;
              if (props.isTree && item.children && item.children.length > 0) {
                return exists(item.children, v);
              }
              return false;
            });
          };

          currentValues.forEach((v) => {
            if (!exists(list, v)) {
              list.push({ label: v, value: v });
            }
          });

          if (props.allowInput && sValue && !exists(list, sValue)) {
            list.push({ label: `${sValue} (新增)`, value: sValue });
          }

          const uniqueByValue = (items: any[]): any[] => {
            const seen = new Set();
            const result: any[] = [];
            for (const item of items) {
              const val = String(item.value).trim();
              if (val && !seen.has(val)) {
                seen.add(val);
                const newItem = { ...item };
                if (newItem.children && Array.isArray(newItem.children)) {
                  newItem.children = uniqueByValue(newItem.children);
                }
                result.push(newItem);
              }
            }
            return result;
          };

          const finalOptions = uniqueByValue(list);

          const filterOption = (inputValue: string, option: any) => {
            const input = inputValue.toLowerCase().trim();
            const l = String(option.label || '').toLowerCase();
            const v = String(option.value || '').toLowerCase();
            return l.includes(input) || v.includes(input);
          };

          // 转发事件到 ApiComponent 的 stateValue
          const handleChange = (val: any) => {
            if (onUpdateValue) onUpdateValue(val);
            if (onChange) onChange(val);
          };

          if (props.isTree) {
            return (
              <TreeSelect
                {...rest}
                fieldNames={{
                  label: 'label',
                  value: 'value',
                  children: 'children',
                }}
                filterTreeNode={filterOption}
                multiple={props.multiple}
                onChange={handleChange}
                onSearch={handleSearch}
                onUpdate:searchValue={handleSearch}
                searchValue={sValue}
                treeBlockNode={true}
                treeData={finalOptions}
                treeDefaultExpandAll={false}
                v-slots={slots}
                value={valToProcess}
              />
            );
          }

          return (
            <Select
              {...rest}
              fieldNames={{
                label: 'label',
                value: 'value',
              }}
              filterOption={filterOption}
              onChange={handleChange}
              onSearch={handleSearch}
              onUpdate:searchValue={handleSearch}
              options={finalOptions}
              searchValue={sValue}
              v-slots={slots}
              value={valToProcess}
            />
          );
        };
      },
    });

    const mergedParams = computed(() => {
      const p = { ...props.params };
      if (props.terms && props.terms.length > 0) {
        p.terms = [...(p.terms || []), ...props.terms];
      }
      return p;
    });

    const getMode = computed(() => {
      if (props.isTree) return undefined;
      if (props.multiple) {
        return props.allowInput ? 'tags' : 'multiple';
      }
      return undefined;
    });

    return () => {
      const mode = getMode.value;
      // 关键：解构 props 以排除原始 value，避免透传给 ApiComponent 导致其初始化 stateValue 时产生冲突
      const { value: _v, ...componentProps } = props;

      return (
        <ApiComponent
          {...attrs}
          {...componentProps}
          alwaysLoad={true}
          component={MergedSelect}
          modelPropName="value"
          modelValue={proxyValue.value}
          numberToString={true}
          onUpdate:modelValue={(val: any) => {
            proxyValue.value = val;
          }}
          onUpdate:searchValue={handleSearch}
          params={mergedParams.value}
          searchValue={searchValue.value}
          {...({
            mode,
            allowClear: true,
            showSearch: props.allowSearch || props.allowInput,
          } as any)}
        />
      );
    };
  },
});
