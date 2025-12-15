<script setup lang="ts">
import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import {
  Col,
  Collapse,
  CollapsePanel,
  Form,
  FormItem,
  Row,
  Switch,
} from 'ant-design-vue';

interface PropertyExpands {
  groupId?: string;
  propertyValueWebDisplay?: boolean;
  storageType?: {
    ignore?: boolean;
    'json-string'?: boolean;
  };
  [key: string]: any;
}

const props = defineProps<{
  disabled?: boolean;
  value: PropertyExpands;
}>();

const emit = defineEmits(['update:value', 'change']);

const localValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val);
    emit('change', val);
  },
});

const activeKey = ref(['1', '2']);
</script>

<template>
  <Collapse v-model:active-key="activeKey">
    <!-- Group 1: Storage Config -->
    <CollapsePanel key="1" :header="$t('thingModel.property.storageConfig')">
      <div v-if="localValue.storageType">
        <Form layout="vertical">
          <Row :gutter="24">
            <Col :span="12">
              <FormItem :label="$t('thingModel.property.storageJson')">
                <Switch
                  v-model:checked="localValue.storageType['json-string']"
                  :disabled="disabled"
                />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem :label="$t('thingModel.property.storageIgnore')">
                <Switch
                  v-model:checked="localValue.storageType.ignore"
                  :disabled="disabled"
                />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </div>
    </CollapsePanel>

    <!-- Group 2: Other Config -->
    <CollapsePanel key="2" :header="$t('thingModel.property.otherConfig')">
      <Form layout="vertical">
        <FormItem :label="$t('thingModel.property.webDisplay')">
          <Switch
            v-model:checked="localValue.propertyValueWebDisplay"
            :disabled="disabled"
          />
        </FormItem>
      </Form>
    </CollapsePanel>
  </Collapse>
</template>
