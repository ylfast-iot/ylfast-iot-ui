<script setup lang="ts">
import type { Term } from '#/adapter';
import type { ConfigPropertyMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Card, Space } from 'ant-design-vue';

import YlApiSelect from '#/components/yl-api-select';
import ArrayInput from '#/components/yl-data-type-strategies/value-input/ArrayInput.vue';

const value1 = ref(['item1', 'item2']);
const value2 = ref([]);
const value3 = ref('opt1');
const value4 = ref('NewValue');
const value5 = ref(['opt1']);
const value6 = ref('opt1,opt2');

const mockApi = async (params: any) => {
  console.error(
    'Mock API called with params:',
    JSON.stringify(params, null, 2),
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  let options = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
    { label: 'Filtered Option', value: 'filtered' },
  ];

  // Simple mock terms filtering
  options =
    params.terms &&
    params.terms.some((t: any) => t.column === 'test' && t.value === 'filter')
      ? options.filter((o) => o.value === 'filtered')
      : options.filter((o) => o.value !== 'filtered');

  return options;
};

const prop1: ConfigPropertyMetadata = {
  property: 'selectTest',
  name: '多选测试 (只读)',
  type: {
    type: 'ARRAY',
    expands: {
      componentProps: {
        type: 'select',
        api: mockApi,
        placeholder: '请多选...',
      },
    },
  },
};

const prop2: ConfigPropertyMetadata = {
  property: 'selectAllowInputTest',
  name: '多选测试 (允许输入)',
  type: {
    type: 'ARRAY',
    expands: {
      componentProps: {
        type: 'select',
        api: mockApi,
        allowInput: true,
        placeholder: '请选择或输入...',
      },
    },
  },
};

const terms: Term[] = [{ column: 'test', termType: 'eq', value: 'filter' }];
</script>

<template>
  <div class="p-4">
    <Space direction="vertical" class="w-full" size="large">
      <Card title="YlApiSelect 验证 (通用业务组件)">
        <div class="mb-4 text-sm text-gray-500">
          YlApiSelect 是一个通用的 API
          选择组件，支持单选、多选、远程搜索以及手动输入。
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- 多选场景 -->
          <div class="rounded-lg border border-dashed p-4">
            <h4
              class="mb-4 flex items-center gap-2 border-b pb-2 font-bold text-primary"
            >
              <span class="size-2 rounded-full bg-primary"></span>
              多选场景 (ArrayInput 集成)
            </h4>

            <div class="mb-6">
              <h5 class="mb-2 text-sm font-medium">1.1 基础多选 (API数据)</h5>
              <ArrayInput v-model:value="value1" :prop="prop1" />
              <div
                class="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground"
              >
                Value: {{ value1 }}
              </div>
            </div>

            <div class="mb-2">
              <h5 class="mb-2 text-sm font-medium">
                1.2 允许手动输入 (回车新增)
              </h5>
              <ArrayInput v-model:value="value2" :prop="prop2" />
              <div
                class="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground"
              >
                Value: {{ value2 }}
              </div>
            </div>
          </div>

          <!-- 单选场景 -->
          <div class="rounded-lg border border-dashed p-4">
            <h4
              class="mb-4 flex items-center gap-2 border-b pb-2 font-bold text-orange-500"
            >
              <span class="size-2 rounded-full bg-orange-500"></span>
              单选场景 (直接调用)
            </h4>

            <div class="mb-6">
              <h5 class="mb-2 text-sm font-medium">2.1 单选 + Terms 过滤</h5>
              <YlApiSelect
                v-model:value="value3"
                :multiple="false"
                :api="mockApi"
                :terms="terms"
                placeholder="只能选到 Filtered Option"
                class="w-full"
              />
              <div
                class="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground"
              >
                Value: {{ value3 }}
              </div>
            </div>

            <div class="mb-2">
              <h5 class="mb-2 text-sm font-medium">
                2.2 单选 + 允许手动输入 (Combobox)
              </h5>
              <YlApiSelect
                v-model:value="value4"
                :multiple="false"
                :allow-input="true"
                :api="mockApi"
                placeholder="可输入新值或选择"
                class="w-full"
              />
              <div
                class="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground"
              >
                Value: {{ value4 }}
              </div>
            </div>
          </div>

          <!-- 格式化场景 -->
          <div class="rounded-lg border border-dashed p-4">
            <h4
              class="mb-4 flex items-center gap-2 border-b pb-2 font-bold text-green-500"
            >
              <span class="size-2 rounded-full bg-green-500"></span>
              多选格式化 (字符串序列化)
            </h4>

            <div class="mb-2">
              <h5 class="mb-2 text-sm font-medium">
                3.1 自动转分隔符字符串 (arrayValueFormat: ',')
              </h5>
              <YlApiSelect
                v-model:value="value6"
                multiple
                array-value-format=","
                :api="mockApi"
                placeholder="选择后观察 Value 变化"
                class="w-full"
              />
              <div class="mt-2 space-y-2">
                <div class="rounded bg-muted p-2 text-xs text-muted-foreground">
                  <strong>绑定值 (String):</strong> {{ value6 }}
                </div>
                <div
                  class="rounded border-l-4 border-green-500 bg-muted p-2 text-xs text-muted-foreground"
                >
                  <strong>解析数组:</strong>
                  {{
                    typeof value6 === 'string'
                      ? value6.split(',').filter(Boolean)
                      : value6
                  }}
                </div>
              </div>
              <p class="mt-2 text-[11px] italic text-gray-400">
                * 适用于后端仅接受 "id1,id2" 格式的场景
              </p>
            </div>
          </div>
        </div>

        <!-- 其他状态 -->
        <div class="mt-6 border-t pt-4">
          <h4 class="mb-4 font-bold">4. 状态演示</h4>
          <div class="flex flex-wrap gap-8">
            <div class="w-64">
              <h5 class="mb-2 text-xs text-muted-foreground">
                禁用状态 (Disabled)
              </h5>
              <YlApiSelect
                v-model:value="value5"
                disabled
                :api="mockApi"
                class="w-full"
              />
            </div>
            <div class="w-64">
              <h5 class="mb-2 text-xs text-muted-foreground">
                加载失败/无匹配 (空状态)
              </h5>
              <YlApiSelect
                :api="async () => []"
                placeholder="无数据示例"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="配置详情 (调试信息)" size="small">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="mb-1 text-xs font-bold">Prop 1 (Readonly Multi)</div>
            <pre
              class="max-h-40 overflow-auto bg-muted p-2 text-[10px] leading-tight"
            >
              {{ JSON.stringify(prop1, null, 2) }}
            </pre>
          </div>
          <div>
            <div class="mb-1 text-xs font-bold">Prop 2 (Input Multi)</div>
            <pre
              class="max-h-40 overflow-auto bg-muted p-2 text-[10px] leading-tight"
            >
              {{ JSON.stringify(prop2, null, 2) }}
            </pre>
          </div>
        </div>
      </Card>
    </Space>
  </div>
</template>
