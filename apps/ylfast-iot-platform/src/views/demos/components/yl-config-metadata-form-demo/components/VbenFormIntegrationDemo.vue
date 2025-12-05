<script lang="ts" setup>
import { ref } from 'vue';

import { Button, Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useYlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const [registerForVben, { validate: validateInnerForm }] =
  useYlConfigMetadataForm({
    layout: 'vertical',
    metadata: {
      name: 'Simple Config',
      properties: [
        {
          property: 'host',
          name: 'Host',
          type: { type: 'STRING', expands: { required: true } },
        },
      ],
    },
    showAction: false,
  });

const formDataVben = ref({});

const [VbenForm, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: '权限字符',
      rules: 'required',
    },
    {
      fieldName: 'configuration',
      component: 'YlConfigMetadataForm',
      componentProps: {
        onRegister: registerForVben,
      },
    },
  ],
});

async function handleVbenFormSubmit() {
  const { valid } = await formApi.validate();

  let innerValid = true;
  try {
    await validateInnerForm();
  } catch {
    innerValid = false;
  }

  if (valid && innerValid) {
    formDataVben.value = await formApi.getValues();
    message.success('Vben Form 提交成功');
  } else {
    message.error('表单验证失败');
  }
}
</script>

<template>
  <Card title="Vben Form 集成示例" class="mb-4">
    <template #extra>
      <Button type="primary" @click="handleVbenFormSubmit">
        获取 Vben Form 数据
      </Button>
    </template>
    <VbenForm />
  </Card>
  <Card title="表单数据" class="mt-4" v-if="formDataVben">
    <pre>{{ JSON.stringify(formDataVben, null, 2) }}</pre>
  </Card>
</template>
