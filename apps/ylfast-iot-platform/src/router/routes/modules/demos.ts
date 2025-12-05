import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: $t('demos.title'),
    },
    name: 'Demos',
    path: '/demos',
    children: [
      {
        meta: {
          title: $t('demos.antd'),
        },
        name: 'AntDesignDemos',
        path: '/demos/ant-design',
        component: () => import('#/views/demos/antd/index.vue'),
      },
      {
        meta: {
          title: 'YlVxeTableCard 演示',
        },
        name: 'YlVxeTableCardDemo',
        path: '/demos/yl-vxe-table-card',
        component: () =>
          import('#/views/demos/components/YlVxeTableCardDemo.vue'),
      },
      {
        meta: {
          title: 'YlDcForm 演示',
        },
        name: 'YlDcFormDemo',
        path: '/demos/yl-dc-form',
        component: () => import('#/views/demos/components/YlDcFormDemo.vue'),
      },
      {
        meta: {
          title: $t('routes.demo.ylConfigMetadataForm'),
        },
        name: 'YlConfigMetadataFormDemo',
        path: 'yl-config-metadata-form',
        component: () =>
          import(
            '#/views/demos/components/yl-config-metadata-form-demo/index.vue'
          ),
      },
    ],
  },
];

export default routes;
