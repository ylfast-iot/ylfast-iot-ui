import type { SelectorEchoApi } from '../types';

import { ref, watch } from 'vue';

export function useSelectorEcho(options: {
  echoApi?: SelectorEchoApi;
  idField?: string;
  multiple?: boolean;
  value: any;
}) {
  const { echoApi, idField = 'id', value } = options;
  const selectedRows = ref<any[]>([]);

  async function fetchDetails(ids: any[]) {
    if (!ids || ids.length === 0) {
      selectedRows.value = [];
      return;
    }
    if (!echoApi) return;

    try {
      const currentIds = new Set(selectedRows.value.map((r) => r[idField]));
      const missingIds = ids.filter((id) => !currentIds.has(id));

      if (missingIds.length > 0) {
        const res = await echoApi(missingIds);
        const newRows = [...selectedRows.value, ...res];
        const valSet = new Set(ids);
        selectedRows.value = newRows.filter((r) => valSet.has(r[idField]));
      } else {
        const valSet = new Set(ids);
        selectedRows.value = selectedRows.value.filter((r) =>
          valSet.has(r[idField]),
        );
      }
    } catch (error) {
      console.error('Failed to fetch selector echo details', error);
    }
  }

  watch(
    () => value,
    (val) => {
      const ids = Array.isArray(val) ? val : [val].filter(Boolean);
      fetchDetails(ids);
    },
    { immediate: true, deep: true },
  );

  return {
    selectedRows,
    fetchDetails,
  };
}
