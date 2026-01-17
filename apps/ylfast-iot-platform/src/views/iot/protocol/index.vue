<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { QueryParamEntity } from '#/adapter';
import type { IotProtocolApi } from '#/api/iot/protocol';

import { onMounted, ref, watch } from 'vue';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Popconfirm, Tooltip } from 'ant-design-vue';

import {
  deployProtocol,
  getProtocolSupportLoaderProviders,
  IotProtocolApi as ProtocolApi,
  unDeployProtocol,
} from '#/api/iot/protocol';
import { useYlConfigMetadataForm } from '#/components/yl-config-metadata-form';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import ProtocolCard from './components/ProtocolCard.vue';
import { getColumns, getModalFormSchemas, getSearchFormSchemas } from './data';

const EditIcon = createIconifyIcon('lucide:edit-3');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const PlusIcon = createIconifyIcon('lucide:plus');

const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');
const editingProtocolId = ref<string>('');
const providerOptions = ref<any[]>([]);

// Internal Config Form Hook
const [registerConfigForm, { validate: validateConfigForm }] =
  useYlConfigMetadataForm();

// --- Load Providers ---
onMounted(async () => {
  try {
    const res = await getProtocolSupportLoaderProviders();
    providerOptions.value = res.map((item) => {
      let icon = 'lucide:box';
      let color = 'default';
      switch (item.provider) {
        case 'jar': {
          icon = 'mdi:language-java';
          color = 'blue';
          break;
        }
        case 'local': {
          icon = 'lucide:folder-open';
          color = 'blue';
          break;
        }
        case 'script': {
          icon = 'lucide:file-code-2';
          color = 'blue';
          break;
        }
      }
      return {
        label: $t(`protocol.${item.provider}`) || item.name,
        value: item.provider,
        description: item.provider,
        helpDoc: item.document,
        icon,
        color,
      };
    });
    // Update schema options if form is already initialized (though usually runs before modal open)
  } catch (error) {
    console.error('Failed to load protocol providers:', error);
  }
});

function updateSchema() {
  formApi.setState({
    schema: getModalFormSchemas(
      providerOptions.value,
      registerConfigForm,
      editingProtocolId.value,
    ),
  });
}

// --- Edit/Add Modal Form ---
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  // Pass providerOptions.value. Note: this is initial value.
  // If options load AFTER form init, we might need to use setState or reactive schema.
  // But getModalFormSchemas is called once.
  // We can pass a getter or reactive object?
  // VbenForm schema is reactive if we use computed or similar? No, usually static.
  // Better to update schema when options load.
  schema: [], // Initialize empty, set later
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});
watch(providerOptions, (newOptions) => {
  if (newOptions.length > 0) {
    updateSchema();
  }
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[1000px]',
  closeOnClickModal: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const values = await formApi.getValues();

      // Execute validations in parallel
      const validateMain = formApi.validate();

      // Only validate config form if type is NOT script
      // because YlConfigMetadataForm is not rendered for script type
      let validateConfig = Promise.resolve(true);

      if (values.protocolType !== 'script') {
        validateConfig = validateConfigForm()
          .then(() => true)
          .catch(() => false);
      }

      const [{ valid: mainValid }, configValid] = await Promise.all([
        validateMain,
        validateConfig,
      ]);

      if (!mainValid || !configValid) return;

      // Clean up fields based on type?
      // For now, trust the form values.

      // 新增时移除空 id
      if (!values.id) delete values.id;

      modalApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        await ProtocolApi.basicCrudApis.postAdd(values as any);
        message.success($t('common.createSuccess'));
      } else {
        await ProtocolApi.basicCrudApis.putUpdate(currentId.value, {
          ...values,
        });
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
  return await ProtocolApi.basicCrudApis.postQuery(queryParams);
};

const [TableCard, gridApi] = useYlVxeTableCard<IotProtocolApi.Protocol>({
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
        storageKey: 'iot-protocol-dc-storage',
      },
      mode: 'localstorage',
    },
  },
});

// --- Handlers ---
function handleAdd() {
  formType.value = 'add';
  currentId.value = '';
  editingProtocolId.value = '';
  modalApi.open();
  updateSchema();
  formApi.resetForm();
}

function handleEdit(row: Recordable<any>) {
  formType.value = 'edit';
  currentId.value = row.id;
  editingProtocolId.value = row.protocolId;
  modalApi.open();
  updateSchema();
  formApi.resetForm();
  formApi.setValues(row);
}

async function handleDelete(row: Recordable<any>) {
  try {
    await ProtocolApi.basicCrudApis.deleteById(row.id);
    message.success($t('common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleDeploy(row: Recordable<any>) {
  try {
    await deployProtocol(row.id);
    message.success($t('common.success'));
    gridApi.reload();
  } catch (error) {
    console.error(error);
  }
}

async function handleUndeploy(row: Recordable<any>) {
  try {
    await unDeployProtocol(row.id);
    message.success($t('common.success'));
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
        <ProtocolCard
          :row="row"
          @delete="handleDelete"
          @deploy="handleDeploy"
          @edit="handleEdit"
          @undeploy="handleUndeploy"
        />
      </template>
    </TableCard>

    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
