<script setup lang="ts">
import { reactive } from 'vue';

import {
  Alert,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Switch,
} from 'ant-design-vue';

import { NotifyConfigSelector } from '#/components/business/notify/config-selector';
import DingTalkOrgSelect from '#/components/business/notify/dingTalk/DingTalkOrgSelect.vue';
import DingTalkUserSelect from '#/components/business/notify/dingTalk/DingTalkUserSelect.vue';
import AliyunSmsSignSelect from '#/components/business/notify/sms/AliyunSmsSignSelect.vue';
import AliyunSmsTemplateSelect from '#/components/business/notify/sms/AliyunSmsTemplateSelect.vue';
import { NotifyTemplateSelector } from '#/components/business/notify/template-selector';
import WeChatOrgSelect from '#/components/business/notify/wechat/WeChatOrgSelect.vue';
import WeChatTagSelect from '#/components/business/notify/wechat/WeChatTagSelect.vue';
import WeChatUserSelect from '#/components/business/notify/wechat/WeChatUserSelect.vue';

/**
 * 演示页面：通知业务选择器 (增强型)
 * 作者：yaolonga
 * 邮箱：1638538651@qq.com
 */

const formModel = reactive({
  configId: '2019649135693455360',
  departmentId: '',
  isTree: true,
  // 基础示例
  dingTalkUser: undefined,
  dingTalkOrg: undefined,
  wechatUser: undefined,
  wechatOrg: undefined,
  wechatTag: undefined,
  smsSign: undefined,
  smsTemplate: undefined,
  // 联动示例
  linkageDeptId: '',
  linkageUserId: undefined,
  // 多选/单选对比
  singleUser: undefined,
  multipleUser: [],
  // 搜索控制对比
  noSearchUser: undefined,
  formattedDeptIds: '',
  // 通用选择器
  notifyConfig: undefined,
  notifyTemplate: undefined,
});

const labelCol = { span: 6 };
const wrapperCol = { span: 18 };
</script>

<template>
  <div class="p-4">
    <Card title="Notify Selectors (通知业务选择器增强演示)">
      <Alert
        message="配置说明"
        description="本页面展示了重构后的单一职责业务组件，支持属性透传 (v-bind)、多占位符解析、联动过滤及树形去重。"
        type="info"
        show-icon
        class="mb-4"
      />

      <Form :model="formModel" :label-col="labelCol" :wrapper-col="wrapperCol">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="Global Config ID">
              <Input
                v-model:value="formModel.configId"
                placeholder="输入通知配置ID"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="Global Tree Mode">
              <Space>
                <Switch v-model:checked="formModel.isTree" />
                <span>{{ formModel.isTree ? '开启树形' : '列表模式' }}</span>
              </Space>
            </Form.Item>
          </Col>
        </Row>

        <!-- 联动与单/多选演示 -->
        <Divider orientation="left">
          Cascading & Selection Mode (联动与单/多选演示)
        </Divider>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="1. 选择部门 (单选)"
              extra="联动起点：选择此处将影响右侧用户列表"
            >
              <DingTalkOrgSelect
                v-model:value="formModel.linkageDeptId"
                config-id="${configId}"
                :is-tree="true"
                :multiple="false"
                :form-model="formModel"
                placeholder="请选择一个部门"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="2. 加载用户 (单选)"
              extra="根据左侧选中的部门 ID 过滤结果"
            >
              <DingTalkUserSelect
                v-model:value="formModel.linkageUserId"
                config-id="${configId}"
                department-id="${linkageDeptId}"
                :multiple="false"
                :form-model="formModel"
                placeholder="请选择该部门下的用户"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="用户单选" extra="explicit :multiple='false'">
              <DingTalkUserSelect
                v-model:value="formModel.singleUser"
                config-id="${configId}"
                :multiple="false"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="用户多选" extra="默认模式 :multiple='true'">
              <DingTalkUserSelect
                v-model:value="formModel.multipleUser"
                config-id="${configId}"
                :multiple="true"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="禁用搜索"
              extra=":allow-search='false' - 仅限从列表选择"
            >
              <DingTalkUserSelect
                v-model:value="formModel.noSearchUser"
                config-id="${configId}"
                :allow-search="false"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          General Selectors (通用选择器演示)
        </Divider>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="通知配置">
              <NotifyConfigSelector v-model:value="formModel.notifyConfig" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="通知模板">
              <NotifyTemplateSelector
                v-model:value="formModel.notifyTemplate"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          Manufacturer Components (基础组件概览)
        </Divider>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="钉钉用户">
              <DingTalkUserSelect
                v-model:value="formModel.dingTalkUser"
                config-id="${configId}"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="钉钉部门">
              <DingTalkOrgSelect
                v-model:value="formModel.dingTalkOrg"
                config-id="${configId}"
                :is-tree="formModel.isTree"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="企微用户">
              <WeChatUserSelect
                v-model:value="formModel.wechatUser"
                config-id="${configId}"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="企微部门">
              <WeChatOrgSelect
                v-model:value="formModel.wechatOrg"
                config-id="${configId}"
                :is-tree="formModel.isTree"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="企微标签">
              <WeChatTagSelect
                v-model:value="formModel.wechatTag"
                config-id="${configId}"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="短信签名">
              <AliyunSmsSignSelect
                v-model:value="formModel.smsSign"
                config-id="${configId}"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="短信模板">
              <AliyunSmsTemplateSelect
                v-model:value="formModel.smsTemplate"
                config-id="${configId}"
                :form-model="formModel"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Card type="inner" title="Form State (表单状态预览)">
          <pre class="max-h-96 overflow-auto rounded bg-gray-100 p-2 text-xs">{{
            JSON.stringify(formModel, null, 2)
          }}</pre>
        </Card>
      </Form>
    </Card>
    <!-- 多选格式化演示 -->
    <Card title="多选格式化演示 (arrayValueFormat: ',')" class="mt-4">
      <Form :model="formModel" layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="部门多选 (字符串结果)"
              extra="设置了 arrayValueFormat: ','"
            >
              <DingTalkOrgSelect
                v-model:value="formModel.formattedDeptIds"
                config-id="${configId}"
                :multiple="true"
                array-value-format=","
                :form-model="formModel"
                placeholder="选择多个部门"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="原始绑定值 (String)">
              <div class="rounded border bg-gray-50 p-2 dark:bg-gray-800">
                <code class="text-blue-600 dark:text-blue-400">
                  {{ formModel.formattedDeptIds || '(空)' }}
                </code>
              </div>
              <div class="mt-2 text-xs text-gray-400">
                类型: {{ typeof formModel.formattedDeptIds }}
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </div>
</template>

<style scoped>
pre {
  line-height: 1.2;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
