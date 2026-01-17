<script setup lang="ts">
import type { IotNetCompApi } from '#/api/iot/network-config';

import { ref } from 'vue';

import { useVbenDrawer, useVbenForm } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { message } from 'ant-design-vue';

import { IotNetCompApi as CompApi } from '#/api/iot/network-config';
import { useYlConfigMetadataForm } from '#/components/yl-config-metadata-form';

import { getModalFormSchemas } from './data';

const emit = defineEmits(['success']);

const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');
const typeOptions = ref<any[]>([]);

// Internal Config Form Hooks
const [registerShared, { validate: validateShared }] =
  useYlConfigMetadataForm();
const [registerCluster, { validate: validateCluster }] =
  useYlConfigMetadataForm();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    try {
      const values = await formApi.getValues();

      // Parallel validation
      const validateMain = formApi.validate();

      // Dynamic validation based on shareCluster
      let validateDynamic = Promise.resolve(true);
      validateDynamic = values.shareCluster
        ? validateShared()
            .then(() => true)
            .catch(() => false)
        : validateCluster()
            .then(() => true)
            .catch(() => false);

      const [{ valid: mainValid }, dynamicValid] = await Promise.all([
        validateMain,
        validateDynamic,
      ]);

      if (!mainValid || !dynamicValid) return;

      // 新增时移除空 id
      if (formType.value === 'add' && !values.id) delete values.id;

      drawerApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        await CompApi.basicCrudApis.postAdd(values as any);
        message.success($t('common.createSuccess'));
      } else {
        await CompApi.basicCrudApis.putUpdate(currentId.value, values as any);
        message.success($t('common.updateSuccess'));
      }
      emit('success');
      drawerApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      drawerApi.setState({ confirmLoading: false });
    }
  },
});

function updateSchema() {
  formApi.setState({
    schema: getModalFormSchemas(
      typeOptions.value,
      registerShared,
      registerCluster,
      formType.value === 'edit',
    ),
  });
}

function setData(data: Partial<IotNetCompApi.IotNetComp> & { options: any[] }) {
  // Deep clone data to prevent reference pollution
  const clonedData = cloneDeep(data);
  const { id, options } = clonedData;

  if (id) {
    formType.value = 'edit';
    currentId.value = id;
  } else {
    formType.value = 'add';
    currentId.value = '';
  }
  typeOptions.value = options || [];
  updateSchema();
  formApi.resetForm();
  if (id) {
    formApi.setValues(clonedData);
  } else {
    // Default values
    formApi.setValues({
      shareCluster: true,
      state: { value: 'enabled' },
    });
  }
  drawerApi.setState({
    title:
      formType.value === 'add'
        ? $t('common.action.add')
        : $t('common.action.edit'),
  });
  drawerApi.open();
}

defineExpose({
  setData,
});
</script>

<template>
  <Drawer class="w-4/5">
    <Form />
  </Drawer>
</template>
