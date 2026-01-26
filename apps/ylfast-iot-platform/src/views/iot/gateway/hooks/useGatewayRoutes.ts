import type { Ref } from 'vue';

import type { IotGatewayApi } from '#/api/iot/gateway';

import { computed, unref } from 'vue';

import { $t } from '@vben/locales';

export function useGatewayRoutes(
  routesRef: Ref<IotGatewayApi.TransportDetail['routes'] | undefined>,
  transportRef: Ref<string | undefined>,
) {
  // 获取排序后的路由数据 (按分组排序以支持单元格合并)
  const sortedRoutes = computed(() => {
    const routes = unref(routesRef) || [];
    return [...routes].sort((a, b) =>
      (a.group || '').localeCompare(b.group || ''),
    );
  });

  // 动态计算路由表列
  const routeColumns = computed(() => {
    const routes = sortedRoutes.value;

    const baseColumns = [
      {
        align: 'center' as const,
        customCell: (_: any, index?: number) => {
          if (index === undefined) {
            return {};
          }
          const val = routes[index]?.group;
          if (index > 0 && val === routes[index - 1]?.group) {
            return { rowSpan: 0 };
          }
          let count = 1;
          for (let i = index + 1; i < routes.length; i++) {
            if (val === routes[i]?.group) {
              count++;
            } else {
              break;
            }
          }
          return { rowSpan: count };
        },
        dataIndex: 'group',
        key: 'group',
        title: $t('common.group') || '分组',
        width: 110,
      },
    ];

    if (!unref(routesRef)?.length) {
      return baseColumns;
    }

    const transportId = unref(transportRef)?.toLowerCase();

    // 基础地址列定义
    const addressColumn = {
      dataIndex: 'address',
      ellipsis: true,
      key: 'address',
      minWidth: 150,
      title: $t('common.address') || '地址',
    };

    // 基础描述列定义
    const descColumn = {
      dataIndex: 'description',
      ellipsis: true,
      key: 'description',
      title: $t('common.description') || '描述',
    };

    if (transportId?.includes('mqtt')) {
      return [
        ...baseColumns,
        {
          dataIndex: 'topic',
          ellipsis: true,
          key: 'topic',
          minWidth: 150,
          title: 'Topic',
        },
        {
          align: 'center' as const,
          dataIndex: 'qos',
          key: 'qos',
          title: 'QoS',
          width: 60,
        },
        {
          align: 'center' as const,
          key: 'direction',
          title: $t('gateway.detail.direction') || '方向',
          width: 100,
        },
        descColumn,
      ];
    }

    if (transportId?.includes('http')) {
      return [
        ...baseColumns,
        addressColumn,
        { dataIndex: 'method', key: 'method', title: 'Method', width: 100 },
        {
          dataIndex: 'contentType',
          ellipsis: true,
          key: 'contentType',
          title: 'Content-Type',
        },
        descColumn,
      ];
    }

    if (transportId?.includes('websocket')) {
      return [
        ...baseColumns,
        { dataIndex: 'path', ellipsis: true, key: 'path', title: 'Path' },
        descColumn,
      ];
    }

    return [...baseColumns, descColumn];
  });

  return {
    routeColumns,
    sortedRoutes,
  };
}
