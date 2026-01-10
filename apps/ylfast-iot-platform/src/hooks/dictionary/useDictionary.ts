import type { SystemDictionaryApi } from '#/api/system/dictionary';
import type { EnumDict } from '#/types/global';

import { onMounted, ref } from 'vue';

import { getAllDict, getItemDefineById } from '#/api/system/dictionary';

export function useDictionary() {
  const dicts = ref<
    (SystemDictionaryApi.ClassDictDefine | SystemDictionaryApi.DictDefine)[]
  >([]);
  const loading = ref(false);

  async function fetchAllDicts() {
    loading.value = true;
    try {
      const res = await getAllDict();
      dicts.value = res;
    } finally {
      loading.value = false;
    }
  }

  async function getItems(id: string) {
    return await getItemDefineById(id);
  }

  return {
    dicts,
    loading,
    fetchAllDicts,
    getItems,
  };
}

export function useDict<T = any>(id: string) {
  const items = ref<EnumDict<T>[]>([]);
  const loading = ref(false);

  function getDictItem() {
    return getItemDefineById<T>(id).then((res) =>
      res.map((item) => ({
        ...item,
        label: item.text,
      })),
    );
  }

  async function refresh() {
    if (!id) return;
    loading.value = true;
    try {
      items.value = await getDictItem();
    } finally {
      loading.value = false;
    }
  }

  onMounted(refresh);

  return {
    items,
    loading,
    refresh,
    getDictItem,
  };
}
