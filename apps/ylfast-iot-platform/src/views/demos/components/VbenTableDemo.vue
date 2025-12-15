<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

// 模拟行数据
const getExampleTableApi = (size = 200) => {
  try {
    const dataList: RowType[] = [];
    for (let i = 0; i < size; i++) {
      dataList.push({
        id: `${10_000 + i}`,
        releaseDate: `Test${i}`,
        color: 'Developer',
        category: '男',
        price: '22.1',
        productName: '測試產品',
      });
    }
    gridApi.setGridOptions({ data: dataList });
  } catch (error) {
    console.error('Failed to load data:', error);
    // Implement user-friendly error handling
  }
};

onMounted(() => {
  getExampleTableApi(1000);
});
interface RowType {
  category: string;
  color: string;
  id: string;
  price: string;
  productName: string;
  releaseDate: string;
}

const gridOptions: VxeGridProps<RowType> = {
  border: true,
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    { editRender: { name: 'input' }, field: 'category', title: 'Category' },
    { editRender: { name: 'input' }, field: 'color', title: 'Color' },
    {
      editRender: { name: 'input' },
      field: 'productName',
      title: 'Product Name',
    },
    { field: 'price', title: 'Price', editRender: { name: 'AInputNumber' } },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Date' },
    { slots: { default: 'action' }, title: '操作' },
  ],
  keepSource: true,
  editConfig: {
    mode: 'row',
    trigger: 'click',
    showAsterisk: true,
    showStatus: true,
  },
  editRules: {
    category: [
      { required: true, content: '请输入类别', trigger: 'change' },
      { min: 2, max: 4, content: '长度在 2 到 4 个字符', trigger: 'change' },
    ],
    color: [
      { required: true, content: '请输入颜色', trigger: 'change' },
      { min: 2, max: 4, content: '长度在 2 到 4 个字符', trigger: 'change' },
    ],
  },
  height: 'auto',
  virtualYConfig: {
    enabled: true,
    gt: 0,
  },
  showOverflow: true,
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function hasEditStatus(row: RowType) {
  return gridApi.grid?.isEditByRow(row);
}

function editRowEvent(row: RowType) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: RowType) {
  try {
    const errorMap = await gridApi.grid?.validate(row);
    if (errorMap) {
      message.error('验证未通过');
    } else {
      message.success('保存成功');
      await gridApi.grid?.clearEdit(row);
      await gridApi.grid?.reloadRow(row, {});
    }
  } catch {
    message.error('验证未通过');
  }
}

const cancelRowEvent = (_row: RowType) => {
  gridApi.grid?.clearEdit();
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #action="{ row }">
        <template v-if="hasEditStatus(row)">
          <Button type="link" @click="saveRowEvent(row)">保存</Button>
          <Button type="link" @click="cancelRowEvent(row)">取消</Button>
        </template>
        <template v-else>
          <Button type="link" @click="editRowEvent(row)">编辑</Button>
        </template>
      </template>
    </Grid>
  </Page>
</template>
