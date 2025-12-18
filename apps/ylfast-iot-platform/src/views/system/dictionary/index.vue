<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { Term } from '#/adapter';
import type { SystemDictionaryApi } from '#/api/system/dictionary';

import { ref } from 'vue';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  checkDictionaryItemExists,
  deleteDictionaryItem,
  queryDictionaryItemPost,
  saveDictionaryItem,
} from '#/api/system/dictionary';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import DictionaryList from './components/DictionaryList.vue';
import {
  dictionaryItemColumns,
  dictionaryItemModalSchemas,
  searchFormSchemas,
} from './data';

const currentDict = ref<null | SystemDictionaryApi.Dictionary>(null);
const itemFormType = ref<'add' | 'edit'>('add');

// Item Form
const [ItemForm, itemFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: dictionaryItemModalSchemas,
  showDefaultActions: false,
});

// Item Modal
const [ItemModal, itemModalApi] = useVbenModal({
  onCancel() {
    itemModalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await itemFormApi.validate();
      if (!valid) return;
      const values = await itemFormApi.getValues();

      if (!currentDict.value) {
        message.error('No dictionary selected');
        return;
      }

      itemModalApi.setState({ confirmLoading: true });

      // Check existence only for Add
      if (itemFormType.value === 'add') {
        // Construct terms for check
        const checkParams = {
          terms: [
            {
              terms: [
                {
                  value: values.value,
                  termType: 'eq',
                  column: 'value',
                },
                {
                  value: currentDict.value.id,
                  termType: 'eq',
                  column: 'dictId',
                },
              ],
            },
          ],
        };

        const exists = await checkDictionaryItemExists(checkParams);
        // If API returns true/false directly or wraps it?
        // dictionary.ts return type is boolean.
        if (exists) {
          message.error($t('dictionary.itemExists'));
          itemModalApi.setState({ confirmLoading: false });
          return;
        }
      }

      // Save
      const payload = {
        ...values,
        dictId: currentDict.value.id,
        // Auto-generate searchCode
        searchCode: `${values.name}:${values.value}:${values.text}`,
        // Ensure id is undefined for add if not provided, or handle update
        id: itemFormType.value === 'add' ? undefined : values.id,
      } as unknown as SystemDictionaryApi.DictionaryItem;

      await saveDictionaryItem(payload);
      message.success(
        itemFormType.value === 'add'
          ? $t('common.createSuccess')
          : $t('common.updateSuccess'),
      );
      itemModalApi.close();
      gridApi.reload();
    } catch (error) {
      console.error(error);
      // message.error('Operation failed'); // Let global error handler handle it usually
    } finally {
      itemModalApi.setState({ confirmLoading: false });
    }
  },
});

const gridQuery = async (_params: any, ...args: any[]) => {
  if (!currentDict.value) {
    return { items: [], total: 0 };
  }

  const values = args[0];
  const { page } = _params;

  const terms: Term[] = [
    {
      column: 'dictId',
      termType: 'eq',
      value: currentDict.value.id,
    },
  ];
  if (values.terms) {
    terms.push(...values.terms);
  }
  const { data, total } = await queryDictionaryItemPost({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [{ name: 'ordinal', order: 'asc' }], // Sort by ordinal
    terms,
  });
  return {
    items: data,
    total,
  };
};

const [TableCard, gridApi] =
  useYlVxeTableCard<SystemDictionaryApi.DictionaryItem>({
    cardOptions: {
      minWidth: 300,
    },
    mode: 'table',
    gridOptions: {
      columns: dictionaryItemColumns!,
      height: 'auto',
      pagerConfig: {
        enabled: true,
        pageSize: 50, // Increase page size to help finding max ordinal
        pageSizes: [10, 20, 50, 100],
      },
      rowConfig: {
        keyField: 'id',
      },
      proxyConfig: {
        response: {},
        ajax: {
          query: gridQuery,
        },
        enabled: true,
      },
      toolbarConfig: {
        custom: true,
        export: true,
        refresh: true,
        search: true,
        zoom: true,
      },
    },
    searchFormMode: 'yl-dc-form',
    showSearchForm: true,
    tableTitle: $t('dictionary.item'),
    ylDcFromOptions: {
      formSchemas: searchFormSchemas,
    },
  });

function handleDictSelect(dict: null | SystemDictionaryApi.Dictionary) {
  currentDict.value = dict;
  gridApi.reload();
}

function handleAddItem() {
  if (!currentDict.value) {
    message.warning('Please select a dictionary first');
    return;
  }
  itemFormType.value = 'add';
  itemModalApi.setState({ title: $t('common.action.add') });
  itemFormApi.resetForm();

  // Auto-increment ordinal
  const tableData = gridApi.grid.getData();
  const maxOrdinal =
    tableData.length > 0
      ? Math.max(...tableData.map((item) => item.ordinal || 0))
      : -1;
  itemFormApi.setValues({ ordinal: maxOrdinal + 1 });

  itemModalApi.open();
}

function handleEditItem(row: Recordable<any>) {
  itemFormType.value = 'edit';
  itemModalApi.setState({ title: $t('common.action.edit') });
  itemFormApi.resetForm();
  itemFormApi.setValues(row);
  itemModalApi.open();
}

async function handleDeleteItem(row: Recordable<any>) {
  try {
    await deleteDictionaryItem(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full w-full">
      <DictionaryList @select="handleDictSelect" />

      <div class="flex-1 overflow-hidden">
        <TableCard>
          <template #toolbar-tools>
            <Button
              type="primary"
              @click="handleAddItem"
              :disabled="!currentDict"
            >
              {{ $t('common.action.add') }}
            </Button>
          </template>

          <template #status="{ row }">
            <Tag :color="row.status === 1 ? 'success' : 'error'">
              {{
                row.status === 1 ? $t('common.enable') : $t('common.disable')
              }}
            </Tag>
          </template>

          <template #action="{ row }">
            <Button size="small" type="link" @click="handleEditItem(row)">
              {{ $t('common.action.edit') }}
            </Button>
            <Popconfirm
              :title="$t('common.confirmDelete')"
              @confirm="handleDeleteItem(row)"
            >
              <Button danger size="small" type="link">
                {{ $t('common.action.delete') }}
              </Button>
            </Popconfirm>
          </template>
        </TableCard>
      </div>
    </div>

    <ItemModal>
      <div class="p-4">
        <ItemForm />
      </div>
    </ItemModal>
  </Page>
</template>
