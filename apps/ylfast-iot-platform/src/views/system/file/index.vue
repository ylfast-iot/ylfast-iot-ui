<script setup lang="ts">
import type { Term } from '#/adapter';
import type { FileBucketEntity, FileEntity } from '#/api/system/file';

import { onMounted, ref, watch } from 'vue';

import { Page, useVbenForm, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Modal, Tag, Tooltip } from 'ant-design-vue';

import {
  createFileBucket,
  deleteFile,
  downloadFile,
  queryFileList,
  updateFileBucket,
} from '#/api/system/file';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';
import { getFileTypeInfo } from '#/enums/file';

import FileCard from './components/FileCard.vue';
import FileEditModal from './components/FileEditModal.vue';
import FilePreviewModal from './components/FilePreviewModal.vue';
import FileSidebar from './components/FileSidebar.vue';
import FileUploadModal from './components/FileUploadModal.vue';
import {
  formatFileSize,
  isSupportPreview,
  useFileSearchSchemas,
  useFileTableColumns,
} from './data';
import { useFileResources } from './hooks/useFileResources';

const EyeIcon = createIconifyIcon('lucide:eye');
const DownloadIcon = createIconifyIcon('lucide:download');
const EditIcon = createIconifyIcon('lucide:edit');
const TrashIcon = createIconifyIcon('lucide:trash-2');

const selectedRowKeys = ref<string[]>([]);
const isUploading = ref(false);
const isBucketEditing = ref(false);
const editBucketId = ref<string>();

const {
  loadingBuckets,
  loadingNodes,
  bucketList,
  clusterNodes,
  selectedNodeId,
  selectedBucket,
  currentNode,
  initResources,
  handleNodeSelect,
  handleBucketSelect,
  handleDeleteBucket,
  getBucketLabel,
  getNodeLabel,
} = useFileResources();

const fileEditModalRef = ref<InstanceType<typeof FileEditModal> | null>(null);
const filePreviewModalRef = ref<InstanceType<typeof FilePreviewModal> | null>(
  null,
);

// --- Vben Modals ---
const [UploadModal, uploadModalApi] = useVbenModal({
  draggable: true,
  footer: false,
  closeOnClickModal: false,
});

const [BucketForm, bucketFormApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('file.bucketManage.id'),
      componentProps: {
        placeholder: $t('file.bucketManage.idPlaceholder'),
        disabled: isBucketEditing,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('file.bucketManage.name'),
      rules: 'required',
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: $t('file.bucketManage.desc'),
      componentProps: {
        placeholder: $t('file.bucketManage.descPlaceholder'),
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
});

const [BucketModal, bucketModalApi] = useVbenModal({
  onCancel: () => bucketModalApi.close(),
  onConfirm: async () => {
    try {
      const { valid } = await bucketFormApi.validate();
      if (!valid) return;
      const values = await bucketFormApi.getValues();
      bucketModalApi.setState({ confirmLoading: true });
      await (isBucketEditing.value && editBucketId.value
        ? updateFileBucket(editBucketId.value, values as FileBucketEntity)
        : createFileBucket(values as FileBucketEntity));
      message.success(
        isBucketEditing.value
          ? $t('file.bucketManage.updateSuccess')
          : $t('file.bucketManage.createSuccess'),
      );
      bucketModalApi.close();
      initResources();
    } catch {
      message.error($t('file.bucketManage.saveFail'));
    } finally {
      bucketModalApi.setState({ confirmLoading: false });
    }
  },
});

const handleOpenUploadModal = () => {
  uploadModalApi.setState({ title: $t('file.upload.title') });
  uploadModalApi.open();
};

const handleOpenBucketModal = (item?: FileBucketEntity) => {
  isBucketEditing.value = !!item;
  editBucketId.value = item?.id;
  bucketModalApi.setState({
    title: item ? $t('file.bucketManage.edit') : $t('file.bucketManage.create'),
  });
  bucketFormApi.resetForm();
  if (item) {
    bucketFormApi.setValues({
      id: item.id,
      name: item.name,
      description: item.description,
    });
  }
  bucketModalApi.open();
};

// --- Table Handlers ---
const handleSelectionChange = () => {
  selectedRowKeys.value = gridApi.grid.getCheckboxRecords().map((r) => r.id);
};

const handlePreview = (row: FileEntity) => {
  if (!row) return;
  if (!isSupportPreview(row.extension))
    return message.warning($t('file.tips.noPreview'));
  filePreviewModalRef.value?.open(row);
};

const handleDownload = (row: FileEntity) => {
  if (!row) return;
  downloadFile(
    row.id,
    row.extension,
    row.name,
    row.others?.accessKey as string,
  );
};

const handleDelete = (row: FileEntity) => {
  Modal.confirm({
    title: $t('file.tips.deleteConfirm'),
    content: $t('file.tips.deleteFileConfirm', { name: row.name }),
    onOk: async () => {
      try {
        await deleteFile([row.id]);
        message.success($t('file.tips.deleteSuccess'));
        gridApi.reload();
      } catch {
        message.error($t('file.tips.deleteFail'));
      }
    },
  });
};

const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) return;
  Modal.confirm({
    title: $t('file.action.batchDelete', { count: '' }).trim(), // Hack to reuse key without count if cleaner key not avail
    content: $t('file.tips.deleteBatchConfirm', {
      count: selectedRowKeys.value.length,
    }),
    onOk: async () => {
      try {
        await deleteFile(selectedRowKeys.value);
        message.success($t('file.tips.batchDeleteSuccess'));
        gridApi.reload();
        selectedRowKeys.value = [];
      } catch {
        message.error($t('file.tips.batchDeleteFail'));
      }
    },
  });
};

watch([selectedNodeId, selectedBucket], () => {
  gridApi.reload();
});

const toggleSelection = (row: FileEntity) => {
  const isSelected = selectedRowKeys.value.includes(row.id);
  gridApi.grid.setCheckboxRow(row, !isSelected);
  handleSelectionChange();
};

const [TableCard, gridApi] = useYlVxeTableCard<FileEntity>({
  mode: 'all',
  defaultMode: 'card',
  tableTitle: $t('file.title'),
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  cardOptions: {
    minWidth: 280,
    cols: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 6 },
  },
  ylDcFromOptions: { formSchemas: useFileSearchSchemas() },
  gridOptions: {
    height: 'auto',
    columns: useFileTableColumns(),
    checkboxConfig: { highlight: true, range: true },
    rowConfig: { keyField: 'id', isHover: true },
    proxyConfig: {
      enabled: true,
      ajax: {
        query: async (_params: any, ...args: any[]) => {
          const queryParams = args[0] || {};
          const terms: Term[] = [];
          if (queryParams.terms?.length) terms.push(...queryParams.terms);
          if (selectedNodeId.value)
            terms.push({
              column: 'serverNodeId',
              termType: 'eq',
              value: selectedNodeId.value,
            });
          if (selectedBucket.value === 'default')
            terms.push({ column: 'bucket', termType: 'isnull', value: '1' });
          else if (selectedBucket.value !== 'all')
            terms.push({
              column: 'bucket',
              termType: 'eq',
              value: selectedBucket.value,
            });

          const res = await queryFileList({
            pageIndex: _params.page.currentPage - 1,
            pageSize: _params.page.pageSize,
            sorts: [{ name: 'createTime', order: 'desc' }],
            terms,
          });
          return { items: res.data || [], total: res.total || 0 };
        },
      },
      response: {
        result: 'items',
        total: 'total',
      },
    },
  },
  gridEvents: {
    checkboxChange: handleSelectionChange,
    checkboxAll: handleSelectionChange,
  },
});

onMounted(() => {
  initResources();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full w-full">
      <div class="h-full w-1/6 min-w-[220px] pr-2">
        <FileSidebar
          :loading-nodes="loadingNodes"
          :loading-buckets="loadingBuckets"
          :cluster-nodes="clusterNodes"
          :bucket-list="bucketList"
          :selected-node-id="selectedNodeId"
          :selected-bucket="selectedBucket"
          @select-node="handleNodeSelect"
          @select-bucket="handleBucketSelect"
          @open-upload="handleOpenUploadModal"
          @open-bucket-modal="handleOpenBucketModal"
          @edit-bucket="handleOpenBucketModal"
          @delete-bucket="handleDeleteBucket"
        />
      </div>

      <div class="flex-1 overflow-hidden">
        <TableCard>
          <template #toolbar-tools>
            <Button
              v-if="selectedRowKeys.length > 0"
              danger
              size="small"
              @click="handleBatchDelete"
            >
              {{
                $t('file.action.batchDelete', { count: selectedRowKeys.length })
              }}
            </Button>
          </template>
          <!-- 卡片视图槽 -->
          <template #card="{ row }">
            <FileCard
              v-if="row && row.id"
              :item="row"
              :is-selected="selectedRowKeys.includes(row.id)"
              :bucket-label="getBucketLabel(row.bucket)"
              :node-label="getNodeLabel(row.serverNodeId)"
              @click="toggleSelection(row)"
              @preview="handlePreview(row)"
              @download="handleDownload(row)"
              @edit="fileEditModalRef?.open(row)"
              @delete="handleDelete(row)"
            />
          </template>
          <!-- 列表视图槽 -->
          <template #nameSlot="{ row }">
            <span
              v-if="row"
              class="cursor-pointer font-medium hover:text-primary"
              @click="handlePreview(row)"
            >
              {{ row.name }}
            </span>
          </template>
          <template #typeSlot="{ row }">
            <Tag v-if="row" :color="getFileTypeInfo(row.extension).color">
              {{ getFileTypeInfo(row.extension).label }}
            </Tag>
          </template>
          <template #sizeSlot="{ row }">
            <template v-if="row">
              {{ formatFileSize(row.length || 0) }}
            </template>
          </template>
          <template #bucketSlot="{ row }">
            <template v-if="row">{{ getBucketLabel(row.bucket) }}</template>
          </template>
          <template #nodeSlot="{ row }">
            <template v-if="row">{{ getNodeLabel(row.serverNodeId) }}</template>
          </template>
          <template #actionSlot="{ row }">
            <div class="flex items-center gap-1">
              <Tooltip :title="$t('file.action.preview')">
                <Button
                  type="text"
                  size="small"
                  @click="handlePreview(row)"
                  class="flex items-center justify-center p-1"
                >
                  <template #icon>
                    <EyeIcon class="size-4 text-primary" />
                  </template>
                </Button>
              </Tooltip>
              <Tooltip :title="$t('file.action.download')">
                <Button
                  type="text"
                  size="small"
                  @click="handleDownload(row)"
                  class="flex items-center justify-center p-1"
                >
                  <template #icon>
                    <DownloadIcon class="size-4 text-primary" />
                  </template>
                </Button>
              </Tooltip>
              <Tooltip :title="$t('file.action.edit')">
                <Button
                  type="text"
                  size="small"
                  @click="fileEditModalRef?.open(row)"
                  class="flex items-center justify-center p-1"
                >
                  <template #icon>
                    <EditIcon class="size-4 text-primary" />
                  </template>
                </Button>
              </Tooltip>
              <Tooltip :title="$t('file.action.delete')">
                <Button
                  type="text"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                  class="flex items-center justify-center p-1"
                >
                  <template #icon><TrashIcon class="size-4" /></template>
                </Button>
              </Tooltip>
            </div>
          </template>
        </TableCard>
      </div>
    </div>

    <UploadModal title="上传文件" :width="650">
      <FileUploadModal
        :node="currentNode"
        :nodes="clusterNodes"
        :buckets="bucketList"
        @success="gridApi.reload"
        @upload-status-change="(s) => (isUploading = s)"
      />
    </UploadModal>

    <BucketModal>
      <BucketForm />
    </BucketModal>

    <FileEditModal
      ref="fileEditModalRef"
      :bucket-list="bucketList"
      @success="gridApi.reload()"
    />
    <FilePreviewModal ref="filePreviewModalRef" />
  </Page>
</template>
