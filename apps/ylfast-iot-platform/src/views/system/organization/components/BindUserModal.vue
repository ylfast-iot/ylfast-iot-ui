<script setup lang="ts">
import type { UserDetail } from '#/adapter/hsweb/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { bindUsersToOrg } from '#/api/system/organization';
import { queryUsers } from '#/api/system/user';
import { useYlVxeTableCard } from '#/components/yl-vxe-table-card';

import { bindUserColumns, searchFormSchemas } from '../data';

const emit = defineEmits(['success']);

const currentOrgId = ref<string>('');

const [TableCard, gridApi] = useYlVxeTableCard<UserDetail>({
  mode: 'table',
  gridOptions: {
    columns: bindUserColumns,
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    rowConfig: {
      keyField: 'id',
    },
    checkboxConfig: {
      reserve: true,
    },
    proxyConfig: {
      response: {},
      ajax: {
        query: async (_params: any, ...args: any) => {
          if (!currentOrgId.value) {
            return { items: [], total: 0 };
          }

          const queryParams = args[0] || {};
          const { page } = _params;

          const terms = queryParams.terms || [];

          // Core requirement: id$in-dimension$org$not = orgId
          const notInOrgTerm = {
            column: 'id$in-dimension$org$not',
            value: currentOrgId.value,
          };

          const finalTerms = [
            {
              terms: [notInOrgTerm],
            },
            ...terms, // Add search form terms
          ];

          const { data, total } = await queryUsers({
            pageIndex: page.currentPage - 1,
            pageSize: page.pageSize,
            terms: finalTerms,
          });
          return { items: data, total };
        },
      },
      enabled: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  },
  searchFormMode: 'yl-dc-form',
  showSearchForm: true,
  tableTitle: $t('organization.bindUserTitle'),
  ylDcFromOptions: {
    formSchemas: searchFormSchemas,
    showMoreButton: false, // Requirement
  },
});

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      const selectedRecords = gridApi.getGrid().getCheckboxRecords();
      if (selectedRecords.length === 0) {
        message.warning($t('common.pleaseSelect'));
        return;
      }

      modalApi.setState({ confirmLoading: true });
      const userIds = selectedRecords.map((item) => item.id);

      await bindUsersToOrg(currentOrgId.value, userIds);

      message.success($t('common.success'));
      emit('success');
      modalApi.close();
      gridApi.reload(); // clear selection? VxeTable might keep selection if reserve is true.
      gridApi.getGrid().clearCheckboxRow();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      // reload to refresh the exclusion list based on currentOrgId
      // But wait, the component might be mounted once.
      // We can rely on open(data) to set orgId, then reload.
    }
  },
});

function open(orgId: string) {
  currentOrgId.value = orgId;
  modalApi.setState({ title: $t('organization.bindUser') });
  modalApi.open();
  // We need to reload the table when opening with a new OrgId
  // Use setTimeout to ensure the modal is rendered and grid is ready?
  // Or just call reload() if gridApi is ready.
  // Since useYlVxeTableCard might init async, we can try:
  setTimeout(() => {
    gridApi.reload();
  }, 100);
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-3/5">
    <div class="h-[500px]">
      <TableCard />
    </div>
  </Modal>
</template>
