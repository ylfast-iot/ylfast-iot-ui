import type {
  ConfigMetadata,
  ConfigPropertyMetadata,
} from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { defineAsyncComponent } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useVModel } from '@vueuse/core';
import { Col, Row, Tooltip } from 'ant-design-vue';

import { YlMarkdown } from '#/components/yl-markdown';
import { getSpan, isVisible } from '#/utils/config-metadata';

import ConfigFormItem from './components/ConfigFormItem.vue';
import StrategyInputFormItem from './components/StrategyInputFormItem.vue';

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
  registerRef: (property: string, el: any) => void;
}

export function renderConfigMetadataFormItems(props: RenderProps) {
  const groups = Array.isArray(props.metadata)
    ? props.metadata
    : [props.metadata].filter(Boolean);

  const formModel = useVModel(props, 'model');

  function getObjPropertyMetadata(
    prop: ConfigPropertyMetadata,
  ): ConfigMetadata | ConfigMetadata[] | undefined {
    if (prop.type.type !== 'OBJECT') return;
    const metadata = prop.type.expands?.configMetadata;

    if (metadata && 'property' in metadata) {
      return { name: '', properties: [metadata] };
    } else if (Array.isArray(metadata)) {
      return metadata.map((item) => {
        if ('property' in item) {
          return { name: '', properties: [item] };
        }
        return item;
      });
    }
    return metadata;
  }

  // Linkage logic helper
  function getActiveLinkageMetadata(prop: ConfigPropertyMetadata):
    | undefined
    | {
        linkageProperty: string;
        metadata: ConfigMetadata | ConfigMetadata[] | undefined;
      } {
    const linkageMap = prop.type.expands?.linkagePropertyEnumMapConfig;
    const linkageProperty = prop.type.expands?.linkageProperty || '';
    if (!linkageMap) return undefined;

    const val = formModel.value[prop.property];
    if (val === undefined || val === null) return undefined;

    const config = linkageMap[String(val)];
    if (!config) return undefined;

    let linkageMetadata:
      | undefined
      | {
          linkageProperty: string;
          metadata: ConfigMetadata | ConfigMetadata[] | undefined;
        };

    if ('properties' in config && Array.isArray(config.properties)) {
      linkageMetadata = {
        linkageProperty,
        metadata: config as ConfigMetadata,
      };
    } else if ('property' in config) {
      linkageMetadata = {
        linkageProperty,
        metadata: {
          name: '',
          properties: [config as ConfigPropertyMetadata],
        },
      };
    } else if (Array.isArray(config)) {
      linkageMetadata = {
        linkageProperty,
        metadata: config.filter(Boolean).map((item) => {
          return 'properties' in item
            ? (item as ConfigMetadata)
            : ({
                name: '',
                properties: [item as ConfigPropertyMetadata],
              } as ConfigMetadata);
        }),
      };
    }
    if (linkageMetadata) {
      if (Array.isArray(linkageMetadata.metadata)) {
        linkageMetadata.metadata = linkageMetadata.metadata.filter(
          (meta) => meta.properties && meta.properties.length > 0,
        );
        if (linkageMetadata.metadata.length === 0) {
          return undefined;
        }
      } else if (
        !linkageMetadata.metadata?.properties ||
        linkageMetadata.metadata?.properties.length === 0
      ) {
        return undefined;
      }
      // 默认值
      formModel.value[linkageMetadata.linkageProperty] =
        formModel.value[linkageMetadata.linkageProperty] || {};
    }
    return linkageMetadata;
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
            {group.properties.map((prop) => {
              const linkageMetadata = getActiveLinkageMetadata(prop);
              const objectMetadata = getObjPropertyMetadata(prop);
              return isVisible(prop) ? (
                <Col key={prop.property} span={getSpan(prop)}>
                  {/* 对象特殊处理*/}
                  {objectMetadata ? (
                    <ConfigFormItem prop={prop}>
                      <div class="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <YlConfigMetadataForm
                          hideNestedHeader={props.hideNestedHeader}
                          hideRootHeader={props.hideRootHeader}
                          isNested={true}
                          metadata={objectMetadata}
                          model={formModel.value[prop.property]}
                          onUpdate:model={(val) =>
                            (formModel.value[prop.property] = val)
                          }
                          ref={(el) => props.registerRef(prop.property, el)}
                          v-slots={props.slots}
                        />
                      </div>
                    </ConfigFormItem>
                  ) : (
                    <StrategyInputFormItem
                      onUpdate:value={(val: any) =>
                        (formModel.value[prop.property] = val)
                      }
                      prop={prop}
                      ref={(el) => props.registerRef(prop.property, el)}
                      value={formModel.value[prop.property]}
                    ></StrategyInputFormItem>
                  )}

                  {linkageMetadata && linkageMetadata.metadata && (
                    <div class="mb-4 mt-2 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <YlConfigMetadataForm
                        hideNestedHeader={props.hideNestedHeader}
                        hideRootHeader={props.hideRootHeader}
                        isNested={true}
                        metadata={linkageMetadata.metadata}
                        model={formModel.value[linkageMetadata.linkageProperty]}
                        onUpdate:model={(val) =>
                          (formModel.value[linkageMetadata.linkageProperty] =
                            val)
                        }
                        ref={(el) =>
                          props.registerRef(linkageMetadata.linkageProperty, el)
                        }
                        v-slots={props.slots}
                      />
                    </div>
                  )}
                </Col>
              ) : null;
            })}
          </Row>
        </div>
      ))}
    </>
  );
}
