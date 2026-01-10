import type {
  YlDcFormActionType,
  YlDcFormProps,
} from '#/components/yl-dc-form';
import type {
  YlVxeTableCardInstance,
  YlVxeTableCardProps,
} from '#/components/yl-vxe-table-card';

import { defineComponent, h, markRaw, nextTick, ref, unref } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useYlDcForm } from '#/components/yl-dc-form';
import { deepMerge } from '#/utils';

import YlVxeTableCard from './index.vue';

export function useYlVxeTableCard<RowType extends Record<string, any> = any>(
  props: YlVxeTableCardProps<RowType>,
) {
  // 1. 状态管理
  const currentMode = ref<'card' | 'table'>(
    props.mode === 'card' ? 'card' : props.defaultMode || 'table',
  );

  // 2. 保存原始的 form 配置
  const defaultFormConfig = props.formOptions;
  let dcFormApi: YlDcFormActionType;
  // 3. 如果模式为yl-dc-form 模式则 注入 yl-dc-form
  if (props.searchFormMode === 'yl-dc-form') {
    const dcFormConfig = deepMerge(
      {
        showMoreButton: true,
        layoutOption: {
          cols: 2,
          breakpoints: {
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 2,
            xxl: 2,
          },
        },
      },
      [props.ylDcFromOptions || {}],
    );
    const [DynamicConditionForm, _dcFormApi] = useYlDcForm(dcFormConfig);
    dcFormApi = _dcFormApi;
    // 配置yl dc form
    props.formOptions = props.ylDcFromOptions
      ? {
          commonConfig: {
            hideLabel: true,
          },
          showCollapseButton: false,
          showDefaultActions: false,
          wrapperClass: 'grid-cols-1',
          schema: [
            {
              label: '',
              fieldName: 'terms',
              modelPropName: 'terms',
              componentProps: {
                onResize() {
                  extendedApi.resize();
                },
                onReset(terms) {
                  gridApi.reload({
                    terms,
                  });
                },
                // onSave(terms) {},
                onSearch(terms) {
                  gridApi.query({
                    terms,
                  });
                },
              } as Partial<YlDcFormProps>,
              component: markRaw(DynamicConditionForm),
            },
          ],
        }
      : undefined;
  } else {
    // 默认模式则恢复
    props.formOptions = defaultFormConfig;
  }

  // 4. 初始化 VxeGrid (作为数据驱动器)
  const [BaseGrid, gridApi] = useVbenVxeGrid<RowType>(props);
  // 1. 将 YlVxeTableCard 的实例引用提升到 useYlVxeTableCard 作用域
  const innerCardTableRef = ref<null | YlVxeTableCardInstance>(null);
  // 5. 包装组件
  const WrappedComponent = defineComponent({
    name: 'YlVxeTableCardWrapper',
    setup(_, { attrs, expose, slots }) {
      // 2. 必须暴露这个 ref 或相关方法给外部父组件
      expose({
        // 外部组件可以直接调用这个方法
        resize: () => {
          innerCardTableRef.value?.resize();
        },
      });
      return () =>
        h(
          YlVxeTableCard,
          {
            ...attrs,
            gridApi,
            ref: innerCardTableRef,
            gridComponent: BaseGrid,
            mode: unref(currentMode),
            'onUpdate:mode': (val: 'card' | 'table') => {
              if (val === 'card') {
                // 关闭列设置、放大的toolbar
                gridApi.setGridOptions({
                  toolbarConfig: {
                    custom: false,
                    zoom: false,
                  },
                });
              } else {
                gridApi.setGridOptions({
                  toolbarConfig: {
                    custom: true,
                    zoom: true,
                  },
                });
              }
              currentMode.value = val;
            },
            propsConfig: props,
          },
          slots,
        );
    },
  });

  // 6. 扩展 API
  const extendedApi = {
    ...gridApi,
    getGrid: () => gridApi.grid,
    get grid() {
      return gridApi.grid;
    },
    getMode: () => unref(currentMode),
    setMode: (mode: 'card' | 'table') => {
      currentMode.value = mode;
    },
    reload(...args: any[]) {
      return gridApi.grid.commitProxy('reload', ...args);
    },
    query(...args: any[]) {
      return gridApi.grid.commitProxy('query', ...args);
    },
    getCheckboxRecords(isFull?: boolean) {
      return gridApi.grid.getCheckboxRecords(isFull);
    },
    resize() {
      // 重新计算宽高
      nextTick(() => {
        // 触发重新计算
        gridApi.grid.recalculate(true);
        innerCardTableRef.value?.resize();
      });
    },
    toggleMode: () => {
      currentMode.value = currentMode.value === 'table' ? 'card' : 'table';
    },
    getDcFormApi() {
      return dcFormApi || {};
    },
  };

  return [WrappedComponent, extendedApi] as const;
}
