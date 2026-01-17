<script setup lang="ts">
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { IotCertificateApi } from '#/api/iot/certificate';

import { getFormSchemas } from './data';

const emit = defineEmits(['success']);

const InfoIcon = createIconifyIcon('lucide:info');
const LayersIcon = createIconifyIcon('lucide:layers');
const FileIcon = createIconifyIcon('lucide:file-terminal');
const CheckSquareIcon = createIconifyIcon('lucide:check-square');

const formType = ref<'add' | 'edit'>('add');
const currentId = ref<string>('');

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: getFormSchemas(false),
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
      const { valid } = await formApi.validate();
      if (!valid) return;

      const values = (await formApi.getValues()) as any;

      // 合并配置部分
      const configuration = {
        ...values.config_cert,
        ...values.config_key,
        ...values.config_trust,
      };

      const submitData = { ...values, configuration };
      delete submitData.config_cert;
      delete submitData.config_key;
      delete submitData.config_trust;

      drawerApi.setState({ confirmLoading: true });

      if (formType.value === 'add') {
        if (!submitData.id) delete submitData.id;
        await IotCertificateApi.basicCrudApis.postAdd(submitData as any);
        message.success($t('common.createSuccess'));
      } else {
        await IotCertificateApi.basicCrudApis.putUpdate(
          currentId.value,
          submitData as any,
        );
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

function setData(data: any) {
  const clonedData = cloneDeep(data);
  const { id, configuration } = clonedData;

  if (id) {
    formType.value = 'edit';
    currentId.value = id;
  } else {
    formType.value = 'add';
    currentId.value = '';
  }

  // 拆分配置部分
  if (configuration) {
    clonedData.config_cert = configuration;
    clonedData.config_key = configuration;
    clonedData.config_trust = configuration;
  }

  formApi.setState({
    schema: getFormSchemas(formType.value === 'edit'),
  });

  formApi.resetForm();
  formApi.setValues(clonedData);

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
  <Drawer class="w-full">
    <div class="flex h-full gap-0 overflow-hidden">
      <!-- 左侧表单域 (1/2) -->
      <div
        class="flex h-full flex-1 flex-col overflow-y-auto border-r bg-white p-8 dark:border-slate-800 dark:bg-slate-950"
      >
        <div
          class="mb-8 flex items-end justify-between border-b pb-4 dark:border-slate-800"
        >
          <div>
            <h2
              class="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {{ $t('certificate.edit.title') }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ $t('certificate.edit.subtitle') }}
            </p>
          </div>
          <div class="flex gap-2">
            <span
              class="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
            >
              {{ $t('certificate.fields.standard') }}
            </span>
          </div>
        </div>
        <Form />
      </div>

      <!-- 右侧说明文档 (3/5) -->
      <div
        class="flex h-full flex-1 flex-col gap-10 overflow-y-auto bg-slate-50/40 p-10 text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-400"
      >
        <section class="relative">
          <h3
            class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            <InfoIcon class="size-5 text-primary" />
            {{ $t('certificate.edit.doc.overview') }}
          </h3>
          <p class="text-[15px] leading-relaxed opacity-90">
            {{ $t('certificate.edit.doc.overviewContent') }}
          </p>
        </section>

        <section>
          <h3
            class="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            <LayersIcon class="size-5 text-primary" />
            {{ $t('certificate.edit.doc.model') }}
          </h3>
          <div class="grid grid-cols-1 gap-6">
            <div
              class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              <h4
                class="mb-2 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200"
              >
                <span class="size-2 rounded-full bg-blue-500"></span>
                {{ $t('certificate.edit.doc.serverTitle') }}
              </h4>
              <p class="leading-relaxed opacity-85">
                {{ $t('certificate.edit.doc.serverContent') }}
              </p>
            </div>
            <div
              class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              <h4
                class="mb-2 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200"
              >
                <span class="size-2 rounded-full bg-orange-500"></span>
                {{ $t('certificate.edit.doc.clientTitle') }}
              </h4>
              <p class="leading-relaxed opacity-85">
                {{ $t('certificate.edit.doc.clientContent') }}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3
            class="mb-5 flex items-center gap-2 text-base text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            <FileIcon class="size-5 text-primary" />
            {{ $t('certificate.edit.doc.format') }}
          </h3>
          <div class="space-y-4">
            <div
              class="flex gap-4 rounded-lg border border-transparent bg-slate-100/30 p-4 transition-all hover:border-slate-200 dark:bg-slate-800/30 dark:hover:border-slate-700"
            >
              <div class="select-none font-bold text-slate-400">01</div>
              <div>
                <h4 class="mb-1 font-bold text-slate-800 dark:text-slate-200">
                  {{ $t('certificate.edit.doc.pemTitle') }}
                </h4>
                <p class="text-[13px] leading-relaxed opacity-80">
                  {{ $t('certificate.edit.doc.pemContent') }}
                </p>
              </div>
            </div>

            <div
              class="flex gap-4 rounded-lg border border-transparent bg-slate-100/30 p-4 transition-all hover:border-slate-200 dark:bg-slate-800/30 dark:hover:border-slate-700"
            >
              <div class="select-none font-bold text-slate-400">02</div>
              <div>
                <h4 class="mb-1 font-bold text-slate-800 dark:text-slate-200">
                  {{ $t('certificate.edit.doc.binaryTitle') }}
                </h4>
                <p class="text-[13px] leading-relaxed opacity-80">
                  {{ $t('certificate.edit.doc.binaryContent') }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div
            class="rounded-2xl border border-primary/20 bg-primary/5 p-6 dark:bg-primary/10"
          >
            <h3
              class="mb-4 flex items-center gap-2 text-sm font-bold text-primary"
            >
              <CheckSquareIcon class="size-4" />
              {{ $t('certificate.edit.doc.checklist.title') }}
            </h3>
            <ul
              class="space-y-2.5 text-[13px] text-slate-500 dark:text-slate-400"
            >
              <li class="flex items-center gap-2">
                <span class="size-1 rounded-full bg-primary/40"></span>
                {{ $t('certificate.edit.doc.checklist.item1') }}
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1 rounded-full bg-primary/40"></span>
                {{ $t('certificate.edit.doc.checklist.item2') }}
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1 rounded-full bg-primary/40"></span>
                {{ $t('certificate.edit.doc.checklist.item3') }}
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1 rounded-full bg-primary/40"></span>
                {{ $t('certificate.edit.doc.checklist.item4') }}
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </Drawer>
</template>
