<script lang="ts" setup>
import type { ConfigMetadata } from '#/types/config-metadata';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  message,
  Space,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  useYlConfigMetadataForm,
  YlConfigMetadataForm,
} from '#/components/yl-config-metadata-form';

const activeKey = ref('basic');

// --- Header Customization Demo ---
const hideRoot = ref(false);
const hideNested = ref(false);

// --- Action Footer Demo ---
const showAction = ref(true);
const showSubmit = ref(true);
const showReset = ref(true);

function handleDemoSubmit(values: any) {
  message.success(`提交成功: ${JSON.stringify(values)}`);
}

function handleDemoReset() {
  message.info('表单已重置');
}

// --- Basic Demo Data & Hooks ---
const formDataBasic = ref({});
const [
  registerBasic,
  {
    setProps: setPropsBasic,
    validate: validateBasic,
    resetFields: resetFieldsBasic,
    getFieldsValue: getFieldsValueBasic,
  },
] = useYlConfigMetadataForm();

const longMarkdown = `
# MQTT Client Configuration Guide

This comprehensive guide details how to configure your MQTT client for optimal performance and security.

## 1. Introduction

MQTT (Message Queuing Telemetry Transport) is a lightweight, publish-subscribe network protocol that transports messages between devices. It is ideal for remote locations with devices that have a small code footprint or are on networks with expensive or low bandwidth.

## 2. Basic Connection Settings

To establish a connection, you must provide the basic broker details.

### 2.1 Host
The **Host** is the IP address or domain name of your MQTT broker.
- Example:
- Example IP:

### 2.2 Port
The **Port** determines the communication channel.
- **1883**: Default non-secure port.
- **8883**: Default secure port (TLS/SSL).

### 2.3 Client Type
Choose the role of this client:
- **Publisher**: Sends messages to topics.
- **Subscriber**: Listens for messages on topics.

## 3. Security Settings

Security is paramount in IoT networks.

### 3.1 Use TLS
Enable **Use TLS** to encrypt the connection. This is highly recommended for production environments to prevent eavesdropping and tampering.

### 3.2 Authentication
(Not yet implemented in this form, but conceptually important)
- **Username/Password**: Basic auth.
- **Client Certificates**: Mutual TLS authentication.

## 4. Advanced Features (Conceptual)

### 4.1 Quality of Service (QoS)
- **QoS 0**: At most once (fire and forget).
- **QoS 1**: At least once (guaranteed delivery).
- **QoS 2**: Exactly once (guaranteed no duplicates).

### 4.2 Retained Messages
Messages that are stored by the broker and sent to new subscribers immediately.

### 4.3 Last Will and Testament (LWT)
A message sent by the broker if the client disconnects ungracefully.

## 5. Troubleshooting

If you cannot connect:
1. Check network connectivity.
2. Verify Host and Port.
3. Ensure firewall rules allow traffic on the specified port.
4. Check broker logs for authentication errors.

## 6. Example Configuration



## 7. Appendix

### 7.1 Glossary
- **Broker**: The server that routes messages.
- **Topic**: The string used to filter messages.

---
*End of Document*


  `;

const basicMetadata: ConfigMetadata = {
  name: 'Simple MQTT Config',
  description: 'A flat configuration example',
  document: longMarkdown,
  properties: [
    {
      property: 'host',
      name: 'Host',
      type: { type: 'STRING', expands: { required: true, span: 12 } },
    },
    {
      property: 'port',
      name: 'Port',
      type: {
        type: 'INTEGER',
        expands: { required: true, span: 12, defaultValue: 1883 },
      },
    },
    {
      property: 'useTls',
      name: 'Use TLS',
      type: { type: 'BOOLEAN', expands: { defaultValue: false } },
    },
    {
      property: 'type',
      name: 'Client Type',
      type: {
        type: 'ENUM',
        expands: {
          options: [
            { label: 'Publisher', value: 'PUB' },
            { label: 'Subscriber', value: 'SUB' },
          ],
          required: true,
        },
      },
    },
  ],
};

function handleSetPropsBasic() {
  setPropsBasic({
    metadata: basicMetadata,
    layout: 'vertical',
    model: { host: 'localhost', type: 'PUB' },
  });
  message.success('基础配置已加载');
}

async function handleValidateBasic() {
  try {
    await validateBasic();
    formDataBasic.value = getFieldsValueBasic();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetBasic() {
  resetFieldsBasic();
  formDataBasic.value = {};
}

// --- Complex Demo Data & Hooks ---
const formDataComplex = ref({});
const [
  registerComplex,
  {
    setProps: setPropsComplex,
    validate: validateComplex,
    resetFields: resetFieldsComplex,
    getFieldsValue: getFieldsValueComplex,
  },
] = useYlConfigMetadataForm();

// 定义嵌套的属性配置
const mqttConfigMetadata: ConfigMetadata = {
  name: 'MQTT Settings', // Name for the nested form card
  description: '这是一个描述',
  properties: [
    {
      property: 'host',
      name: 'Broker Host',
      type: { type: 'STRING', expands: { required: true, span: 12 } },
    },
    {
      property: 'port',
      name: 'Port',
      type: {
        type: 'INTEGER',
        expands: { required: true, span: 12, defaultValue: 1883 },
      },
    },
  ],
};

const httpConfigMetadata: ConfigMetadata = {
  name: 'HTTP Settings', // Name for the nested form card
  properties: [
    {
      property: 'url',
      name: 'Endpoint URL',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'headers',
      name: 'Headers (JSON)',
      description: 'Enter headers as JSON string',
      type: { type: 'STRING' },
    },
  ],
};

const complexMetadata: ConfigMetadata = {
  name: 'Device Connection Configuration',
  description: 'Demonstrates Nested Objects and Linkage Logic',
  properties: [
    {
      property: 'deviceName',
      name: 'Device Name',
      type: { type: 'STRING', expands: { required: true, span: 12 } },
    },
    {
      property: 'isEnabled',
      name: 'Enabled',
      type: { type: 'BOOLEAN', expands: { span: 12, defaultValue: true } },
    },
    {
      property: 'protocol',
      name: 'Protocol',
      description: 'Select protocol to see linkage fields',
      type: {
        type: 'ENUM',
        expands: {
          required: true,
          options: [
            { label: 'MQTT', value: 'MQTT' },
            { label: 'HTTP', value: 'HTTP' },
          ],
          linkagePropertyEnumMapConfig: {
            MQTT: mqttConfigMetadata,
            HTTP: httpConfigMetadata,
          },
        },
      },
    },
  ],
};

function handleSetPropsComplex() {
  setPropsComplex({
    metadata: complexMetadata,
    model: {
      deviceName: 'Test Device 01',
      protocol: 'MQTT',
      mqttSettings: { host: 'broker.hivemq.com' },
    },
  });
  message.success('复杂配置已加载');
}

async function handleValidateComplex() {
  try {
    await validateComplex();
    formDataComplex.value = getFieldsValueComplex();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetComplex() {
  resetFieldsComplex();
  formDataComplex.value = {};
}

// --- Pure Nested Demo Data & Hooks ---
const formDataPureNested = ref({});
const [
  registerPureNested,
  {
    setProps: setPropsPureNested,
    validate: validatePureNested,
    resetFields: resetFieldsPureNested,
    getFieldsValue: getFieldsValuePureNested,
  },
] = useYlConfigMetadataForm();

const addressConfigMetadata: ConfigMetadata = {
  name: 'Address',
  properties: [
    {
      property: 'street',
      name: 'Street',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'city',
      name: 'City',
      type: { type: 'STRING', expands: { required: true } },
    },
    { property: 'zipCode', name: 'Zip Code', type: { type: 'STRING' } },
  ],
};

const contactConfigMetadata: ConfigMetadata = {
  name: 'Contact',
  properties: [
    {
      property: 'email',
      name: 'Email',
      type: { type: 'STRING', expands: { componentProps: { type: 'email' } } },
    },
    { property: 'phone', name: 'Phone', type: { type: 'STRING' } },
  ],
};

const pureNestedMetadata: ConfigMetadata = {
  name: 'User Profile Configuration',
  description: 'A configuration demonstrating pure object nesting.',
  properties: [
    {
      property: 'userName',
      name: 'User Name',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'address',
      name: 'Address Information',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: addressConfigMetadata,
        },
      },
    },
    {
      property: 'contact',
      name: 'Contact Information',
      type: {
        type: 'OBJECT',
        expands: {
          configMetadata: contactConfigMetadata,
        },
      },
    },
  ],
};

function handleSetPropsPureNested() {
  setPropsPureNested({
    metadata: pureNestedMetadata,
    model: {
      userName: 'John Doe',
      address: {
        street: '123 Main St',
        city: 'Anytown',
      },
    },
  });
  message.success('纯粹嵌套配置已加载');
}

async function handleValidatePureNested() {
  try {
    await validatePureNested();
    formDataPureNested.value = getFieldsValuePureNested();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetPureNested() {
  resetFieldsPureNested();
  formDataPureNested.value = {};
}

// --- Boolean Linkage Demo Data & Hooks ---
const formDataBoolean = ref({});
const [
  registerBoolean,
  {
    setProps: setPropsBoolean,
    validate: validateBoolean,
    resetFields: resetFieldsBoolean,
    getFieldsValue: getFieldsValueBoolean,
  },
] = useYlConfigMetadataForm();

const notificationConfig: ConfigMetadata = {
  name: 'Notification Settings',
  properties: [
    {
      property: 'email',
      name: 'Email Address',
      type: { type: 'STRING', expands: { required: true } },
    },
    { property: 'sms', name: 'Phone Number', type: { type: 'STRING' } },
  ],
};

const booleanLinkageMetadata: ConfigMetadata = {
  name: 'User Preferences',
  description: 'Toggle switch to see linked fields',
  properties: [
    {
      property: 'username',
      name: 'Username',
      type: { type: 'STRING', expands: { required: true } },
    },
    {
      property: 'enableNotifications',
      name: 'Enable Notifications',
      type: {
        type: 'BOOLEAN',
        expands: {
          defaultValue: false,
          linkagePropertyEnumMapConfig: {
            true: notificationConfig,
          },
        },
      },
    },
  ],
};

function handleSetPropsBoolean() {
  setPropsBoolean({
    metadata: booleanLinkageMetadata,
    model: {
      username: 'user01',
      enableNotifications: false,
    },
  });
  message.success('布尔联动配置已加载');
}

async function handleValidateBoolean() {
  try {
    await validateBoolean();
    formDataBoolean.value = getFieldsValueBoolean();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetBoolean() {
  resetFieldsBoolean();
  formDataBoolean.value = {};
}

// --- Multi Form Demo Data & Hooks ---
const formDataMulti = ref({});
const [
  registerMulti,
  {
    setProps: setPropsMulti,
    validate: validateMulti,
    resetFields: resetFieldsMulti,
    getFieldsValue: getFieldsValueMulti,
  },
] = useYlConfigMetadataForm();

const multiMetadata: ConfigMetadata[] = [
  {
    name: 'Basic Information',
    description: 'General application settings',
    document: longMarkdown,
    properties: [
      {
        property: 'appName',
        name: 'App Name',
        type: { type: 'STRING', expands: { required: true } },
      },
      { property: 'version', name: 'Version', type: { type: 'STRING' } },
    ],
  },
  {
    name: 'Network Settings',
    description: 'Connectivity options',
    properties: [
      {
        property: 'ip',
        name: 'IP Address',
        type: { type: 'STRING', expands: { span: 12 } },
      },
      {
        property: 'port',
        name: 'Port',
        type: { type: 'INTEGER', expands: { span: 12 } },
      },
    ],
  },
];

function handleSetPropsMulti() {
  setPropsMulti({
    metadata: multiMetadata,
    model: {
      appName: 'My IoT App',
      version: '1.0.0',
    },
  });
  message.success('多表单配置已加载');
}

async function handleValidateMulti() {
  try {
    await validateMulti();
    formDataMulti.value = getFieldsValueMulti();
    message.success('验证通过');
  } catch {
    message.error('验证失败');
  }
}

function handleResetMulti() {
  resetFieldsMulti();
  formDataMulti.value = {};
}

// --- Vben Form Integration ---
const [registerForVben, { validate: validateInnerForm }] =
  useYlConfigMetadataForm({
    metadata: basicMetadata,
    showAction: false,
    layout: 'vertical',
  });

const formDataVben = ref({});

const [VbenForm, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: '权限字符',
      rules: 'required',
    },
    {
      fieldName: 'configuration',
      component: 'YlConfigMetadataForm',
      label: '',
      componentProps: {
        onRegister: registerForVben,
      },
    },
  ],
});

async function handleVbenFormSubmit() {
  const { valid } = await formApi.validate();

  let innerValid = true;
  try {
    await validateInnerForm();
  } catch {
    innerValid = false;
  }

  if (valid && innerValid) {
    formDataVben.value = await formApi.getValues();
    message.success('Vben Form 提交成功');
  } else {
    message.error('表单验证失败');
  }
}
</script>

<template>
  <Page title="Config Metadata Form Demo">
    <div class="p-4">
      <Tabs v-model:active-key="activeKey">
        <!-- Tab 1: 基础示例 -->
        <TabPane key="basic" tab="基础示例">
          <Card title="基础表单 (扁平结构)" class="mb-4">
            <template #extra>
              <Space>
                <Button @click="handleSetPropsBasic">加载配置</Button>
                <Button type="primary" @click="handleValidateBasic">
                  验证并获取值
                </Button>
                <Button @click="handleResetBasic">重置</Button>
              </Space>
            </template>
            <YlConfigMetadataForm @register="registerBasic" />
          </Card>

          <Card title="表单数据" class="mt-4" v-if="formDataBasic">
            <pre>{{ JSON.stringify(formDataBasic, null, 2) }}</pre>
          </Card>
        </TabPane>

        <!-- Tab 2: 复杂示例 -->
        <TabPane key="complex" tab="复杂示例 (嵌套 & 联动)">
          <Card title="复杂表单 (对象嵌套 & 字段联动)" class="mb-4">
            <template #extra>
              <Space>
                <Button @click="handleSetPropsComplex">加载配置</Button>
                <Button type="primary" @click="handleValidateComplex">
                  验证并获取值
                </Button>
                <Button @click="handleResetComplex">重置</Button>
              </Space>
            </template>
            <YlConfigMetadataForm @register="registerComplex" />
          </Card>

          <Card title="表单数据" class="mt-4" v-if="formDataComplex">
            <pre>{{ JSON.stringify(formDataComplex, null, 2) }}</pre>
          </Card>
        </TabPane>

        <!-- Tab 3: 纯粹嵌套示例 -->
        <TabPane key="pureNested" tab="纯粹嵌套示例">
          <Card title="纯粹对象嵌套" class="mb-4">
            <template #extra>
              <Space>
                <Button @click="handleSetPropsPureNested">加载配置</Button>
                <Button type="primary" @click="handleValidatePureNested">
                  验证并获取值
                </Button>
                <Button @click="handleResetPureNested">重置</Button>
              </Space>
            </template>
            <YlConfigMetadataForm @register="registerPureNested" />
          </Card>

          <Card title="表单数据" class="mt-4" v-if="formDataPureNested">
            <pre>{{ JSON.stringify(formDataPureNested, null, 2) }}</pre>
          </Card>
        </TabPane>

        <!-- Tab 4: 布尔联动示例 -->
        <TabPane key="booleanLinkage" tab="布尔联动示例">
          <Card title="布尔值联动表单" class="mb-4">
            <template #extra>
              <Space>
                <Button @click="handleSetPropsBoolean">加载配置</Button>
                <Button type="primary" @click="handleValidateBoolean">
                  验证并获取值
                </Button>
                <Button @click="handleResetBoolean">重置</Button>
              </Space>
            </template>
            <YlConfigMetadataForm @register="registerBoolean" />
          </Card>

          <Card title="表单数据" class="mt-4" v-if="formDataBoolean">
            <pre>{{ JSON.stringify(formDataBoolean, null, 2) }}</pre>
          </Card>
        </TabPane>

        <!-- Tab 5: 多表单渲染示例 -->
        <TabPane key="multi" tab="多表单渲染">
          <Card title="多配置组渲染" class="mb-4">
            <template #extra>
              <Space>
                <Button @click="handleSetPropsMulti">加载配置</Button>
                <Button type="primary" @click="handleValidateMulti">
                  验证并获取值
                </Button>
                <Button @click="handleResetMulti">重置</Button>
              </Space>
            </template>
            <YlConfigMetadataForm @register="registerMulti" />
          </Card>

          <Card title="表单数据" class="mt-4" v-if="formDataMulti">
            <pre>{{ JSON.stringify(formDataMulti, null, 2) }}</pre>
          </Card>
        </TabPane>

        <!-- Tab 6: 标题自定义 -->
        <TabPane key="headerCustom" tab="标题自定义">
          <Card title="自定义标题与隐藏" class="mb-4">
            <template #extra>
              <Space>
                <Checkbox v-model:checked="hideRoot">隐藏根标题</Checkbox>
                <Checkbox v-model:checked="hideNested">隐藏嵌套标题</Checkbox>
              </Space>
            </template>

            <YlConfigMetadataForm
              :metadata="complexMetadata"
              :hide-root-header="hideRoot"
              :hide-nested-header="hideNested"
            >
              <template #rootHeader="{ group }">
                <div
                  class="mb-4 rounded bg-blue-100 p-2 font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  自定义根标题: {{ group.name }}
                </div>
              </template>
              <template #nestedHeader="{ group }">
                <div
                  class="mb-2 rounded bg-green-100 p-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300"
                >
                  自定义嵌套标题: {{ group.name }}
                </div>
              </template>
            </YlConfigMetadataForm>
          </Card>
        </TabPane>

        <!-- Tab 7: 底部按钮 -->
        <TabPane key="actionFooter" tab="底部按钮">
          <Card title="底部操作栏示例" class="mb-4">
            <template #extra>
              <Space>
                <Checkbox v-model:checked="showAction">显示操作栏</Checkbox>
                <Checkbox v-model:checked="showSubmit">显示提交</Checkbox>
                <Checkbox v-model:checked="showReset">显示重置</Checkbox>
              </Space>
            </template>

            <YlConfigMetadataForm
              :metadata="basicMetadata"
              :show-action="showAction"
              :show-submit-button="showSubmit"
              :show-reset-button="showReset"
              submit-button-text="保存设置"
              @submit="handleDemoSubmit"
              @reset="handleDemoReset"
            />
          </Card>
        </TabPane>

        <!-- Tab 8: Vben Form Integration -->
        <TabPane key="vbenForm" tab="Vben Form 集成">
          <Card title="Vben Form 集成示例" class="mb-4">
            <template #extra>
              <Button type="primary" @click="handleVbenFormSubmit">
                获取 Vben Form 数据
              </Button>
            </template>
            <VbenForm />
          </Card>
          <Card title="表单数据" class="mt-4" v-if="formDataVben">
            <pre>{{ JSON.stringify(formDataVben, null, 2) }}</pre>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
