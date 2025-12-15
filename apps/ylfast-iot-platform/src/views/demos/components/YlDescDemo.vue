<script setup lang="ts">
import type { YlDescSchema } from '#/components/yl-desc';

import { ref } from 'vue';

import { Button, Card, Space } from 'ant-design-vue';

import { useYlDesc } from '#/components/yl-desc';

const data = ref({
  username: 'vben',
  nickName: 'Vben Admin',
  age: 18,
  phone: '13888888888',
  email: 'vben@163.com',
  addr: 'Xiamen City 9999',
  sex: 'Male',
  c1: '9999',
  c2: '2020-01-01',
  c3: '10:10:10',
});

const schemas: YlDescSchema[] = [
  {
    field: 'username',
    label: '用户名',
  },
  {
    field: 'nickName',
    label: '昵称',
    render: (val) => {
      return `昵称：${val}`;
    },
  },
  {
    field: 'phone',
    label: '联系电话',
  },
  {
    field: 'email',
    label: '邮箱',
  },
  {
    field: 'addr',
    label: '地址',
    span: 2,
  },
];

const [Desc, { setProps, updateSchema }] = useYlDesc({
  title: '用户信息',
  data: data.value,
  schemas,
});

function handleUpdateSchema() {
  updateSchema({
    field: 'username',
    label: 'Updated Username',
    labelStyle: { color: 'red' },
  });
}

function handleUpdateData() {
  setProps({
    data: {
      ...data.value,
      username: 'Changed User',
      nickName: 'Changed Nick',
    },
  });
}

function handleToggleBorder() {
  setProps({
    bordered: false,
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="YlDesc Description Component Demo">
      <Space class="mb-4">
        <Button type="primary" @click="handleUpdateSchema">
          Update Schema
        </Button>
        <Button type="primary" @click="handleUpdateData">Update Data</Button>
        <Button type="primary" @click="handleToggleBorder">
          Remove Border
        </Button>
      </Space>

      <Desc />
    </Card>
  </div>
</template>
