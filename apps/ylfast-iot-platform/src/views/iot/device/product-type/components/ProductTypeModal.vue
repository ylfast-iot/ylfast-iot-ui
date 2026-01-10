<script setup lang="ts">
import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { IotProductTypeApi } from '#/api/iot/device/product-type';

import { getModalFormSchemas } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const isUpdate = ref(false);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: getModalFormSchemas(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) {
        return;
      }
      const values = await formApi.getValues();
      modalApi.setState({ confirmLoading: true });

      if (isUpdate.value) {
        await IotProductTypeApi.basicCrudApis.putUpdate(values.id, values);
      } else {
        // 新增时移除空 id
        if (!values.id) delete values.id;
        await IotProductTypeApi.basicCrudApis.postAdd(values);
      }

      message.success(
        isUpdate.value
          ? $t('common.updateSuccess')
          : $t('common.createSuccess'),
      );
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const { type, values } = modalApi.getData<any>();
      isUpdate.value = type === 'edit';
      modalApi.setState({
        title: isUpdate.value
          ? $t('common.action.edit')
          : $t('common.action.add'),
      });

      formApi.resetForm();
      if (values) {
        formApi.setValues(values);
      }
    }
  },
});
</script>

<template>
  <Modal>
    <div class="p-4">
      <Form />
    </div>
  </Modal>
</template>
