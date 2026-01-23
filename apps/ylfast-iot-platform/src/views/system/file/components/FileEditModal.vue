<script setup lang="ts">
import type { ComponentType } from '#/adapter/component/components';
import type { FileBucketEntity, FileEntity } from '#/api/system/file';

import { markRaw, ref } from 'vue';

import { useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { queryFileBuckets, updateFileInfo } from '#/api/system/file';

import { formatFileSize } from '../data';
import FileOptionsSelector from './FileOptionsSelector.vue';

defineProps<{
  bucketList: FileBucketEntity[];
}>();

const emit = defineEmits(['success']);

const editFileId = ref<string>();
const currentRow = ref<FileEntity | null>(null);

const [FileEditForm, fileEditFormApi] = useVbenForm<ComponentType>({
  layout: 'vertical',
  schema: [
    // --- 核心业务信息 ---
    {
      fieldName: 'name',
      component: 'Input',
      label: $t('file.edit.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('file.edit.namePlaceholder'),
      },
      formItemClass: 'col-span-12',
    },
    {
      fieldName: 'bucket',
      component: 'ApiSelect',
      label: $t('file.bucket'),
      componentProps: {
        class: 'w-full',
        api: () => queryFileBuckets({ paging: false }),
        resultField: 'data',
        valueField: 'id',
        labelField: 'name',
        placeholder: $t('file.upload.selectBucket'),
        allowClear: true,
      },
      formItemClass: 'col-span-12',
    },
    {
      fieldName: 'options',
      label: $t('file.upload.fileOptions'),
      component: markRaw(FileOptionsSelector),
      modelPropName: 'value',
      formItemClass: 'col-span-12',
    },
    {
      fieldName: 'expires',
      component: 'DatePicker',
      label: $t('file.upload.expires'),
      componentProps: {
        placeholder: $t('file.upload.expiresPlaceholder'),
        class: 'w-full',
        showTime: true,
        valueFormat: 'x',
        disabledDate: (current: any) => {
          return current && current < dayjs().startOf('day');
        },
      },
      rules: z
        .union([z.string(), z.number()])
        .optional()
        .refine(
          (val) => {
            if (!val) return true;
            return dayjs(val).isAfter(dayjs());
          },
          {
            message: $t('file.edit.expiresError'),
          },
        ),
      formItemClass: 'col-span-12',
      dependencies: {
        show: (values) => {
          return values.options?.includes('tempFile');
        },
        triggerFields: ['options'],
      },
    },
    // --- 系统只读信息 ---
    {
      component: 'Divider',
      fieldName: 'divider_1',
      label: $t('file.edit.sysParams'),
      formItemClass: 'col-span-12 mt-4',
    },
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('file.id'),
      componentProps: {
        disabled: true,
        class: 'bg-muted/30 cursor-not-allowed',
      },
      formItemClass: 'col-span-6',
    },
    {
      component: 'Input',
      fieldName: 'extension',
      label: $t('file.extension'),
      componentProps: {
        disabled: true,
        class: 'bg-muted/30 cursor-not-allowed uppercase font-bold',
      },
      formItemClass: 'col-span-6',
    },
    {
      component: 'Input',
      fieldName: 'length',
      label: $t('file.fileSize'),
      componentProps: {
        disabled: true,
        class: 'bg-muted/30 cursor-not-allowed text-primary font-semibold',
      },
      formItemClass: 'col-span-6',
    },
    {
      component: 'Input',
      fieldName: 'createTime',
      label: $t('file.createTime'),
      componentProps: {
        disabled: true,
        class: 'bg-muted/30 cursor-not-allowed',
      },
      formItemClass: 'col-span-6',
    },
    {
      component: 'Input',
      fieldName: 'md5',
      label: $t('file.md5'),
      componentProps: {
        disabled: true,
        class: 'bg-muted/20 text-[11px] font-mono',
      },
      formItemClass: 'col-span-12',
    },
    {
      component: 'Input',
      fieldName: 'sha256',
      label: $t('file.sha256'),
      componentProps: {
        disabled: true,
        class: 'bg-muted/20 text-[11px] font-mono',
      },
      formItemClass: 'col-span-12',
    },
    {
      component: 'Input',
      fieldName: 'storagePath',
      label: $t('file.storagePath'),
      componentProps: { disabled: true, class: 'bg-muted/30 text-[11px]' },
      formItemClass: 'col-span-12',
    },
  ],
  wrapperClass: 'grid grid-cols-12 gap-x-4',
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  class: 'w-[580px]',
  onCancel: () => modalApi.close(),
  onConfirm: async () => {
    try {
      const { valid } = await fileEditFormApi.validate();
      if (!valid) return;
      const values = await fileEditFormApi.getValues();

      if (!editFileId.value) return;

      modalApi.setState({ confirmLoading: true });

      const formOptions = values.options;
      const apiOptions = Array.isArray(formOptions)
        ? formOptions.map((o) => ({ value: o }))
        : [];

      await updateFileInfo(editFileId.value, {
        name: values.name,
        bucket: values.bucket,
        options: apiOptions as any,
        expires:
          values.options?.includes('tempFile') && values.expires
            ? dayjs(Number(values.expires)).valueOf()
            : undefined,
        others: currentRow.value?.others || {},
      });

      message.success($t('file.edit.updateSuccess'));
      modalApi.close();
      emit('success');
    } catch (error) {
      console.error(error);
      message.error($t('file.edit.updateFail'));
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
});

function open(row: FileEntity) {
  editFileId.value = row.id;
  currentRow.value = row;
  modalApi.setState({ title: $t('file.edit.title') });

  const currentOptions = row.options?.map((o) => o.value) || [];

  fileEditFormApi.setValues({
    id: row.id,
    name: row.name,
    bucket: row.bucket,
    md5: row.md5,
    sha256: row.sha256,
    storagePath: row.storagePath || (row as any).path,
    extension: row.extension,
    length: formatFileSize(row.length),
    createTime: new Date(row.createTime).toLocaleString(),
    options: currentOptions,
    expires: row.expires,
  });
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal>
    <div class="p-2">
      <FileEditForm />
    </div>
  </Modal>
</template>
