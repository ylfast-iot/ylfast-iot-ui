<script setup lang="ts">
import { ref } from 'vue';

import { CommonTrigger } from '#/components/business/common-selector';
import { useSelectorEcho } from '#/components/business/common-selector/src/hooks/useSelectorEcho';

import NotifyTemplateSelectorModal from './components/NotifyTemplateSelectorModal.vue';
import { queryNotifyTemplateListNoPaging } from './config';

interface Props {
  allowSearch?: boolean;
  disabled?: boolean;
  hideTrigger?: boolean;
  multiple?: boolean;
  // eslint-disable-next-line vue/require-default-prop
  paramsTerms?: any;
  placeholder?: string;
  // eslint-disable-next-line vue/require-default-prop
  value?: any;
}

const props = withDefaults(defineProps<Props>(), {
  allowSearch: true,
  disabled: false,
  hideTrigger: false,
  multiple: false,
  placeholder: '请选择通知模板',
});

const emit = defineEmits(['update:value', 'change', 'register']);

const modalRef = ref();

const { selectedRows } = useSelectorEcho({
  echoApi: queryNotifyTemplateListNoPaging,
  idField: 'id',
  multiple: props.multiple,
  value: props.value,
});

function handleOpen() {
  modalRef.value?.open({
    selectedRows: selectedRows.value,
  });
}

function handleConfirm(val: any, records: any[]) {
  emit('update:value', val);
  emit('change', val, records);
}

function handleRemove(record: any) {
  if (props.multiple) {
    const newValue = (props.value as string[])?.filter((v) => v !== record.id);
    emit('update:value', newValue);
    // Trigger change with updated records
    const newRecords = selectedRows.value.filter((v) => v.id !== record.id);
    emit('change', newValue, newRecords);
  } else {
    emit('update:value', undefined);
    emit('change', undefined, []);
  }
}

const action = {
  clearSelection: () => {
    emit('update:value', props.multiple ? [] : undefined);
    emit('change', props.multiple ? [] : undefined, []);
  },
  close: () => {
    modalRef.value?.close();
  },
  getSelection: () => {
    return selectedRows.value;
  },
  open: (options?: any) => {
    modalRef.value?.open(options);
  },
  setSelection: (rows: any[]) => {
    const val = rows.map((v) => v.id);
    emit('update:value', props.multiple ? val : val[0]);
    emit('change', props.multiple ? val : val[0], rows);
  },
};

emit('register', action);

defineExpose(action);
</script>

<template>
  <div class="notify-template-selector">
    <CommonTrigger
      v-if="!hideTrigger"
      :disabled="disabled"
      id-field="id"
      name-field="name"
      :placeholder="placeholder"
      :selected-rows="selectedRows"
      :value="value"
      @click="handleOpen"
      @remove="handleRemove"
    />

    <NotifyTemplateSelectorModal
      ref="modalRef"
      :multiple="multiple"
      :params-terms="paramsTerms"
      @confirm="handleConfirm"
    />
  </div>
</template>
