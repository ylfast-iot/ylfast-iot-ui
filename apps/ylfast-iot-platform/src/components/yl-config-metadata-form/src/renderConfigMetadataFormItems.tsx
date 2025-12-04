import type {
  ConfigMetadata,
  ConfigPropertyMetadata,
} from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { defineAsyncComponent } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Col, Row, Tooltip } from 'ant-design-vue';

import { YlMarkdown } from '#/components/yl-markdown';
import { getSpan, isVisible } from '#/utils/config-metadata';

import ConfigFormItem from './components/ConfigFormItem.vue';

// Async import to handle circular dependency
const YlConfigMetadataForm = defineAsyncComponent(
  () => import('./yl-config-metadata-form.vue'),
);

const QuestionCircleOutlined = createIconifyIcon(
  'ant-design:question-circle-outlined',
);

interface RenderProps {
  metadata: ConfigMetadata | ConfigMetadata[];
  model: Recordable;
  isNested: boolean;
  hideRootHeader?: boolean;
  hideNestedHeader?: boolean;
  slots?: any;
  registerRef: (el: any) => void;
}

export function renderConfigMetadataFormItems(props: RenderProps) {
  const groups = Array.isArray(props.metadata)
    ? props.metadata
    : [props.metadata].filter(Boolean);
  const formModel = props.model;

  // Linkage logic helper
  function getActiveLinkage(
    prop: ConfigPropertyMetadata,
  ): ConfigMetadata | undefined {
    const linkageMap = prop.type.expands?.linkagePropertyEnumMapConfig;
    if (!linkageMap) return undefined;

    const val = formModel[prop.property];
    if (val === undefined || val === null) return undefined;

    const config = linkageMap[String(val)];
    if (!config) return undefined;

    if ('properties' in config && Array.isArray(config.properties)) {
      return config as ConfigMetadata;
    } else if ('property' in config) {
      return {
        name: '',
        properties: [config as ConfigPropertyMetadata],
      };
    }
    return undefined;
  }

  return (
    <>
      {groups.map((group, index) => (
        <div key={index}>
          {(group.name || group.description) && (
            <div class="mb-4">
              {props.isNested
                ? !props.hideNestedHeader &&
                  (props.slots?.nestedHeader ? (
                    props.slots.nestedHeader({ group })
                  ) : (
                    <div class="mb-4 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="h-1.5 w-1.5 rounded-full bg-primary/70"></div>
                        <div class="flex items-center gap-2">
                          <span class="text-base font-semibold text-gray-700 dark:text-gray-200">
                            {group.name}
                          </span>
                          {group.description && (
                            <Tooltip title={group.description}>
                              <span class="inline-flex items-center">
                                <QuestionCircleOutlined class="cursor-help text-xs text-gray-400 dark:text-gray-500" />
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      {group.document && (
                        <YlMarkdown
                          buttonSize="small"
                          buttonType="text"
                          displayMode="modal"
                          modelValue={group.document}
                          title={`${group.name || $t('ylConfigMetadataForm.document')} ${$t('ylConfigMetadataForm.description')}`}
                          triggerText={$t('ylConfigMetadataForm.document')}
                          triggerType="button"
                        />
                      )}
                    </div>
                  ))
                : !props.hideRootHeader &&
                  (props.slots?.rootHeader ? (
                    props.slots.rootHeader({ group })
                  ) : (
                    <div class="mb-5 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                      <div class="flex items-center gap-3">
                        <div class="h-5 w-1 rounded-sm bg-primary"></div>
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {group.name}
                          </span>
                          {group.description && (
                            <Tooltip title={group.description}>
                              <span class="inline-flex items-center">
                                <QuestionCircleOutlined class="cursor-help text-lg text-gray-400 dark:text-gray-500" />
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      {group.document && (
                        <YlMarkdown
                          buttonSize="small"
                          buttonType="text"
                          displayMode="modal"
                          modelValue={group.document}
                          title={`${group.name || $t('ylConfigMetadataForm.document')} ${$t('ylConfigMetadataForm.description')}`}
                          triggerText={$t('ylConfigMetadataForm.document')}
                          triggerType="button"
                        />
                      )}
                    </div>
                  ))}
            </div>
          )}

          <Row gutter={16}>
            {group.properties.map((prop) =>
              isVisible(prop) ? (
                <Col key={prop.property} span={getSpan(prop)}>
                  <ConfigFormItem
                    onUpdate:value={(val: any) =>
                      (formModel[prop.property] = val)
                    }
                    prop={prop}
                    ref={props.registerRef}
                    value={formModel[prop.property]}
                  />

                  {getActiveLinkage(prop) && (
                    <div class="mb-4 mt-2 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <YlConfigMetadataForm
                        hideNestedHeader={props.hideNestedHeader}
                        hideRootHeader={props.hideRootHeader}
                        isNested={true}
                        metadata={getActiveLinkage(prop)}
                        model={formModel}
                        onChange={(val: any) => Object.assign(formModel, val)}
                        ref={props.registerRef}
                        v-slots={props.slots}
                      />
                    </div>
                  )}
                </Col>
              ) : null,
            )}
          </Row>
        </div>
      ))}
    </>
  );
}
