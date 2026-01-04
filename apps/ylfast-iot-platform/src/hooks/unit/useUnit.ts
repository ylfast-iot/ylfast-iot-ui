import type { Unit } from '#/types/data-type';

import { computed, onMounted, ref } from 'vue';

import { getAllUnits } from '#/api/iot/device/instance';

import unitData from './unit.json';

export function useUnit() {
  const units = ref<Unit[]>(unitData);

  onMounted(async () => {
    try {
      const res = await getAllUnits();
      if (res && res.length > 0) {
        units.value = res;
      }
    } catch (error) {
      console.warn('Failed to fetch units, using fallback.', error);
    }
  });

  const unitOptions = computed(() => {
    return units.value.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.symbol})`,
      original: item,
    }));
  });

  function getSymbol(id: string) {
    return units.value.find((item) => item.id === id)?.symbol || id;
  }

  return {
    unitOptions,
    units,
    getSymbol,
  };
}
