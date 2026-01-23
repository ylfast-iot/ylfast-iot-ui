<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { QueryParamEntity } from '#/adapter';
import type { ComponentType } from '#/adapter/component/components';
import type { IotPluginApi } from '#/api/iot/plugin';

import { markRaw, onMounted, ref } from 'vue';

import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';
import { Button, message, Popconfirm, Tag, Tooltip } from 'ant-design-vue';

import {
  getPluginTypes,
  IotPluginApi as PluginApi,
  validatePluginId,
} from '#/api/iot/plugin';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import PluginCard from './components/PluginCard.vue';
import PluginUpload from './components/PluginUpload.vue';
import { getColumns, getSearchFormSchemas } from './data';

const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PlusIcon = createIconifyIcon('lucide:plus');

const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');

// Plugin type mapping
const pluginTypeMap = ref<Map<string, string>>(new Map());

// Load plugin types on mount
onMounted(async () => {
  try {
    const types = await getPluginTypes();
    types.forEach((t) => {
      pluginTypeMap.value.set(t.id || t.value, t.name || t.text);
    });
  } catch (error) {
    console.error('Failed to load plugin types:', error);
  }
});

// Get type label by ID
const getTypeLabel = (typeId: string) => {
  return pluginTypeMap.value.get(typeId) || typeId || '-';
};

// Debounced ID validation
const debouncedValidateId = useDebounceFn(async (id: string) => {
  if (!id) return;
  // Skip validation if editing and ID hasn't changed
  if (formType.value === 'edit' && id === currentId.value) return;

  try {
    const result = await validatePluginId(id);
    if (!result.passed) {
      message.warning(result.reason || $t('plugin.validate.idExists'));
    }
  } catch (error) {
    console.error('Validate ID failed:', error);
  }
}, 500);

// --- Edit/Add Modal Form ---
const [Form, formApi] = useVbenForm<ComponentType>({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: [
    {
      fieldName: 'id',
      label: $t('plugin.id'),
      component: 'Input',
      help: $t('plugin.idHint'),
      rules: z.string().optional(),
      dependencies: {
        componentProps: () => ({
          disabled: formType.value === 'edit',
        }),
        triggerFields: [],
      },
      componentProps: {
        placeholder: $t('common.placeholder.input'),
        onChange: (e: any) => {
          const val = e?.target?.value || e;
          if (val) {
            debouncedValidateId(val);
          }
        },
      },
    },
    {
      fieldName: 'name',
      label: $t('plugin.name'),
      component: 'Input',
      rules: z.string().min(1, $t('common.validate.required')),
      componentProps: {
        placeholder: $t('common.placeholder.input'),
      },
    },
    {
      fieldName: '_uploadInfo',
      label: $t('plugin.pluginPackage'),
      component: markRaw(PluginUpload),
      modelPropName: 'value',
      componentProps: (formModel: Recordable<any>) => ({
        onSuccess: (info: IotPluginApi.PluginDriverUploadInfo) => {
          // Auto-fill form fields from upload result
          if (info.id && !formModel.id) {
            formModel.id = info.id;
          }
          if (info.name) {
            formModel.name = info.name;
          }
          if (info.extension) {
            formModel.fileType = info.extension;
          }
          if (info.filename) {
            formModel.fileName = info.filename;
          }
          if (info.type) {
            formModel.type = info.type.id;
          }
          if (info.version) {
            formModel.version = info.version;
          }
          if (info.provider && !formModel.provider) {
            formModel.provider = info.provider;
          }
          if (info.description) {
            formModel.description = info.description;
          }
          // Set configuration.location
          formModel.configuration = {
            ...formModel.configuration,
            location: info.accessUrl,
          };
        },
      }),
    },
    {
      fieldName: 'configuration',
      label: '',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['configuration'],
      },
    },
    {
      fieldName: 'provider',
      label: '',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['provider'],
      },
    },
    {
      fieldName: 'version',
      label: '',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['version'],
      },
    },
    {
      fieldName: 'type',
      label: '',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['type'],
      },
    },
    {
      fieldName: 'fileType',
      label: '',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['fileType'],
      },
    },
    {
      fieldName: 'fileName',
      label: '',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['fileName'],
      },
    },
    {
      fieldName: 'description',
      label: $t('common.description'),
      component: 'Textarea',
      componentProps: {
        placeholder: $t('common.placeholder.input'),
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  closeOnClickModal: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;

      const values = await formApi.getValues();
      normalizeFormValues(values);

      // Remove the upload info field (it's only for UI)
      delete values._uploadInfo;

      modalApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        await PluginApi.basicCrudApis.postAdd(
          values as IotPluginApi.PluginDriver,
        );
        message.success($t('common.createSuccess'));
      } else {
        await PluginApi.basicCrudApis.putUpdate(currentId.value, values);
        message.success($t('common.updateSuccess'));
      }
      await modalApi.close();
      await gridApi.reload();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  title:
    formType.value === 'add'
      ? $t('common.action.add')
      : $t('common.action.edit'),
});

// --- Grid & Logic ---
const gridQuery = async (params: any, ...args: any[]) => {
  const { page } = params;
  const formValues = args[0] || {};
  const { terms } = formValues;

  const queryParams: QueryParamEntity = {
    pageIndex: page.currentPage - 1,
    pageSize: page.pageSize,
    terms,
    sorts: [{ name: 'createTime', order: 'desc' }],
  };
  return await PluginApi.basicCrudApis.postQuery(queryParams);
};

const [TableCard, gridApi] = useYlVxeTableCard<IotPluginApi.PluginDriver>({
  defaultMode: 'card',
  gridOptions: {
    rowConfig: {
      keyField: 'id',
    },
    columns: getColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
      pageSize: 12,
      pageSizes: [12, 24, 48],
    },
    proxyConfig: {
      ajax: {
        query: gridQuery,
      },
      response: {
        result: 'data',
      },
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
  ylDcFromOptions: {
    formSchemas: getSearchFormSchemas(),
    storeOption: {
      conf: {
        storageKey: 'iot-plugin-dc-storage',
      },
      mode: 'localstorage',
    },
  },
});

// --- Handlers ---
function normalizeFormValues(values: Recordable<any>) {
  // id 如果是空的则直接设置为undefined，防止为 空字符串时后端校验不通过
  if (!values.id) {
    values.id = undefined;
  }
}

function handleAdd() {
  formType.value = 'add';
  currentId.value = '';
  modalApi.setState({
    title: $t('common.action.add'),
  });
  formApi.resetForm();
  formApi.updateSchema([
    {
      componentProps: {
        disabled: false,
      },
      fieldName: 'id',
    },
  ]);
  modalApi.open();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  currentId.value = row.id;
  modalApi.setState({
    title: $t('common.action.edit'),
  });
  formApi.resetForm();

  // Construct echo info manually from row data instead of calling API
  const echoInfo: Partial<IotPluginApi.PluginDriverUploadInfo> = {
    filename: row.fileName,
    extension: row.fileType,
    id: row.id,
    name: row.name,
    version: row.version,
    accessUrl: row.configuration?.location,
    type: {
      id: row.type,
      name: getTypeLabel(row.type),
      text: getTypeLabel(row.type),
      value: row.type,
    },
  };
  row._uploadInfo = echoInfo;
  formApi.setValues(row);

  formApi.updateSchema([
    {
      componentProps: {
        disabled: true,
      },
      fieldName: 'id',
    },
  ]);
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  try {
    await PluginApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <TableCard>
      <!-- Toolbar -->
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button type="primary" @click="handleAdd">
            <template #icon>
              <PlusIcon class="mr-1 size-4" />
            </template>
            {{ $t('common.action.add') }}
          </Button>
        </div>
      </template>

      <!-- Type Column -->
      <template #type="{ row }">
        <Tag
          class="rounded-md border-0 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {{ getTypeLabel(row.type) }}
        </Tag>
      </template>

      <!-- Table Action Column -->
      <template #action="{ row }">
        <div class="flex-center flex gap-2">
          <Button
            :title="$t('common.edit')"
            size="small"
            type="link"
            @click.stop="handleEdit(row)"
          >
            <template #icon>
              <EditIcon class="size-4" />
            </template>
          </Button>
          <Tooltip :title="$t('common.delete')">
            <Popconfirm
              :title="$t('common.action.confirmDelete')"
              @confirm="handleDelete(row)"
            >
              <Button
                :title="$t('common.delete')"
                danger
                size="small"
                type="link"
              >
                <template #icon>
                  <TrashIcon class="size-4" />
                </template>
              </Button>
            </Popconfirm>
          </Tooltip>
        </div>
      </template>

      <!-- Card Template -->
      <template #card="{ row }">
        <PluginCard
          :row="row"
          :type-map="pluginTypeMap"
          @delete="handleDelete"
          @edit="handleEdit"
        />
      </template>
    </TableCard>

    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
