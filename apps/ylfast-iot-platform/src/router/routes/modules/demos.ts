import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      requiresAuth: false,
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
      {
        meta: {
          title: 'YlConfigMetadataDesc 演示',
        },
        name: 'YlConfigMetadataDescDemo',
        path: 'yl-config-metadata-desc',
        component: () =>
          import('#/views/demos/components/yl-config-metadata-desc/index.vue'),
      },
      {
        meta: {
          title: 'YlDesc 演示',
        },
        name: 'YlDescDemo',
        path: '/demos/yl-desc',
        component: () => import('#/views/demos/components/YlDescDemo.vue'),
      },
      {
        meta: {
          title: '数据类型策略演示',
        },
        name: 'YlDataTypeStrategiesDemo',
        path: '/demos/yl-data-type-strategies',
        component: () =>
          import('#/views/demos/components/yl-data-type-strategies/index.vue'),
      },
      {
        meta: {
          title: 'Thing Model Editor Demo',
        },
        name: 'ThingModelEditorDemo',
        path: '/demos/thing-model-editor',
        component: () =>
          import('#/views/demos/components/ThingModelEditorDemo.vue'),
      },
      {
        meta: {
          title: 'vben编辑表格演示',
        },
        name: 'VbenEditableTableDemo',
        path: '/demos/vben-editable-table',
        component: () => import('#/views/demos/components/VbenTableDemo.vue'),
      },
      {
        meta: {
          title: '看板组件演示',
        },
        name: 'DashboardComponentsDemo',
        path: '/demos/dashboard-components',
        component: () => import('#/views/demos/components/dashboard/index.vue'),
      },
      {
        meta: {
          title: 'YlI18nMessages 演示',
        },
        name: 'YlI18nMessagesDemo',
        path: '/demos/yl-i18n-messages',
        component: () =>
          import('#/views/demos/components/yl-i18n-messages/index.vue'),
      },
      {
        meta: {
          title: '业务组件演示',
        },
        name: 'BusinessComponentsDemo',
        path: '/demos/business-components',
        component: () => import('#/views/demos/business-components/index.vue'),
      },
    ],
  },
];

export default routes;
