<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { Term } from '#/adapter';

import { onMounted, ref } from 'vue';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm } from 'ant-design-vue';

import {
  getRelationTypes,
  SystemRelationApi,
  validateRelation,
} from '#/api/system/relation';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import { columns, modalFormSchemas, searchFormSchemas } from './data';

const formType = ref<'add' | 'edit'>('add');
const relationTypes = ref<SystemRelationApi.ObjectTypeInfo[]>([]);

onMounted(async () => {
  try {
    relationTypes.value = await getRelationTypes();
  } catch (error) {
    console.error('Failed to load relation types', error);
  }
});

// Form
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: modalFormSchemas,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

// Modal (Relation Form)
const [RelationModal, relationModalApi] = useVbenModal({
  onCancel() {
    relationModalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const values = await formApi.getValues();
      relationModalApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        const validation = await validateRelation(
          values.objectType,
          values.relation,
          values.targetType,
        );
        // Note: checking validation payload format, assume success is boolean
        // ValidationResult { success: boolean, message: string }
        if (validation && validation.success === false) {
          message.error(
            validation.message || $t('error.relation_ID_already_exists'),
          );
          return;
        }

        // map names
        const objType = relationTypes.value.find(
          (t) => t.id === values.objectType,
        );
        const tgtType = relationTypes.value.find(
          (t) => t.id === values.targetType,
        );
        if (objType) values.objectTypeName = objType.name;
        if (tgtType) values.targetTypeName = tgtType.name;

        await SystemRelationApi.basicCrudApis.postAdd(values as any);
      } else {
        await SystemRelationApi.basicCrudApis.patchSave(values as any);
      }

      message.success(
        formType.value === 'add'
          ? $t('common.createSuccess')
          : $t('common.updateSuccess'),
      );
      relationModalApi.close();
      gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      relationModalApi.setState({ confirmLoading: false });
    }
  },
});

const gridQuery = async (_params: any, ...args: any[]) => {
  const queryParams = args[0] || {};
  const { page } = _params;

  const termsToCombine: Term[] = [];

  if (queryParams.terms && queryParams.terms.length > 0) {
    termsToCombine.push(...queryParams.terms);
  }

  return await SystemRelationApi.basicCrudApis.postQuery({
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    sorts: [
      {
        name: 'createTime',
        order: 'desc',
      },
      {
        name: 'id',
        order: 'desc',
      },
    ],
    terms: termsToCombine,
  });
};

const [TableCard, gridApi] =
  useYlVxeTableCard<SystemRelationApi.RelationEntity>({
    cardOptions: {
      minWidth: 300,
    },
    mode: 'table',
    gridOptions: {
      columns: columns!,
      height: 'auto',
      pagerConfig: {
        enabled: true,
      },
      rowConfig: {
        keyField: 'id',
      },
      proxyConfig: {
        response: {
          result: 'data',
        },
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
    tableTitle: $t('relation.list', 'Relation List'),
    ylDcFromOptions: {
      formSchemas: searchFormSchemas,
    },
  });

function handleAdd() {
  formType.value = 'add';
  relationModalApi.setState({ title: $t('relation.add', 'Add Relation') });
  formApi.resetForm();

  // Enable key fields when adding new
  formApi.updateSchema([
    { fieldName: 'objectType', componentProps: { disabled: false } },
    { fieldName: 'relation', componentProps: { disabled: false } },
    { fieldName: 'targetType', componentProps: { disabled: false } },
  ]);

  relationModalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  relationModalApi.setState({ title: $t('relation.edit', 'Edit Relation') });
  formApi.resetForm();

  // Disable key fields when editing existing records (updatable: false in backend)
  formApi.updateSchema([
    { fieldName: 'objectType', componentProps: { disabled: true } },
    { fieldName: 'relation', componentProps: { disabled: true } },
    { fieldName: 'targetType', componentProps: { disabled: true } },
  ]);

  formApi.setValues(row);
  relationModalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await SystemRelationApi.basicCrudApis.deleteById(row.id);
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
      <div class="flex-1 overflow-hidden">
        <TableCard>
          <template #toolbar-tools>
            <Button type="primary" @click="handleAdd">
              {{ $t('relation.add', 'Add Relation') }}
            </Button>
          </template>

          <template #action="{ row }">
            <Button size="small" type="link" @click="handleEdit(row)">
              {{ $t('common.action.edit') }}
            </Button>
            <Popconfirm
              :title="$t('common.confirmDelete')"
              @confirm="handleDelete(row)"
            >
              <Button danger size="small" type="link">
                {{ $t('common.action.delete') }}
              </Button>
            </Popconfirm>
          </template>
        </TableCard>
      </div>
    </div>

    <RelationModal>
      <div class="p-4">
        <Form />
      </div>
    </RelationModal>
  </Page>
</template>
