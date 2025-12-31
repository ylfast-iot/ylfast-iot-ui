import type { ComputedRef } from 'vue';

import type {
  ConfigMetadata,
  ConfigPropertyMetadata,
} from '#/types/config-metadata';
import type { Recordable } from '#/types/data-type';

import { defineAsyncComponent } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { useVModel } from '@vueuse/core';
import { Descriptions, DescriptionsItem, Tooltip } from 'ant-design-vue';

import { YlMarkdown } from '#/components/yl-markdown';
import { isVisible } from '#/utils/config-metadata';

import DescItem from './components/DescItem.vue';

// 异步导入以处理循环依赖
const YlConfigMetadataDesc = defineAsyncComponent(
  () => import('./yl-config-metadata-desc.vue'),
);

const QuestionCircleOutlined = createIconifyIcon(
  'ant-design:question-circle-outlined',
);

interface RenderProps {
  metadata: ConfigMetadata | ConfigMetadata[];
  model: Recordable;
  editMode: boolean;
  isNested: boolean;
  hideRootHeader?: boolean;
  hideNestedHeader?: boolean;
  slots?: any;
  registerRef: (property: string, el: any) => void;
  parentProps: ComputedRef<any>;
}

/**
 * 渲染配置元数据描述列表项
 */
export function renderConfigMetadataDescItems(props: RenderProps) {
  const groups = Array.isArray(props.metadata)
    ? props.metadata
    : [props.metadata].filter(Boolean);

  const formModel = useVModel(props, 'model');

  /**
   * 获取对象属性的元数据
   */
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

  /**
   * 获取激活的联动元数据
   */
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
        <div class={'mb-10'} key={index}>
          {/* 组标题 */}
          {(group.name || group.description) && (
            <div class="mb-4">
              {props.isNested
                ? !props.hideNestedHeader &&
                  (props.slots?.nestedHeader ? (
                    props.slots.nestedHeader({ group })
                  ) : (
                    <div class="mb-3 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="h-1 w-1 rounded-full bg-primary/50"></div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-sm font-medium text-muted-foreground">
                            {group.name || group.description}
                          </span>
                          {group.description && (
                            <Tooltip title={group.description}>
                              <span class="inline-flex items-center">
                                <QuestionCircleOutlined class="cursor-help text-xs text-muted-foreground/70" />
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
                          title={`${group.name || $t('ylConfigMetadataDesc.document')} ${$t('ylConfigMetadataDesc.description')}`}
                          triggerText={$t('ylConfigMetadataDesc.document')}
                          triggerType="button"
                        />
                      )}
                    </div>
                  ))
                : !props.hideRootHeader &&
                  (props.slots?.rootHeader ? (
                    props.slots.rootHeader({ group })
                  ) : (
                    <div class="mb-5 flex items-center justify-between border-b border-border pb-3">
                      <div class="flex items-center gap-3">
                        <div class="h-5 w-1 rounded-sm bg-primary"></div>
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold text-foreground">
                            {group.name || group.description}
                          </span>
                          {group.description && (
                            <Tooltip title={group.description}>
                              <span class="inline-flex items-center">
                                <QuestionCircleOutlined class="cursor-help text-lg text-muted-foreground" />
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
                          title={`${group.name || $t('ylConfigMetadataDesc.document')} ${$t('ylConfigMetadataDesc.description')}`}
                          triggerText={$t('ylConfigMetadataDesc.document')}
                          triggerType="button"
                        />
                      )}
                    </div>
                  ))}
            </div>
          )}

          {/* 描述列表 */}
          <Descriptions {...props.parentProps.value}>
            {(() => {
              // 过滤出可见的属性
              const visibleProps = group.properties.filter((prop) =>
                isVisible(prop),
              );
              const totalItems = visibleProps.length;

              return visibleProps.map((prop, index) => {
                const linkageMetadata = getActiveLinkageMetadata(prop);
                const objectMetadata = getObjPropertyMetadata(prop);
                const isRequired = prop.type.expands?.required;
                const isLastItem = index === totalItems - 1;

                // 计算当前项的 span
                // 默认每项占 1 列，最后一项填充剩余空间
                let itemSpan = 1;
                if (isLastItem && totalItems > 1) {
                  // 计算剩余空间：总列数 - (已使用列数 % 总列数)
                  // 这里假设默认是 3 列布局（xl: 3）
                  const columnsPerRow = 3;
                  const usedColumns = (totalItems - 1) % columnsPerRow;

                  itemSpan =
                    usedColumns === 0
                      ? columnsPerRow // 前面的项正好填满，最后一项占满整行
                      : columnsPerRow - usedColumns; // 填充剩余空间
                }

                return (
                  <DescriptionsItem
                    key={prop.property}
                    label={
                      <div class="flex items-center gap-1">
                        {isRequired && <span class="text-red-500">*</span>}
                        <span>{prop.name || prop.property}</span>
                        {prop.description && (
                          <Tooltip title={prop.description}>
                            <QuestionCircleOutlined class="cursor-help text-xs text-muted-foreground" />
                          </Tooltip>
                        )}
                      </div>
                    }
                    span={itemSpan}
                  >
                    {/* 主字段内容 */}
                    <div class="space-y-2">
                      {/* 对象特殊处理 */}
                      {objectMetadata ? (
                        <div class="rounded border border-dashed border-border/60 bg-muted/30 p-2.5">
                          <YlConfigMetadataDesc
                            editMode={props.editMode}
                            hideNestedHeader={props.hideNestedHeader}
                            hideRootHeader={props.hideRootHeader}
                            isNested={true}
                            metadata={objectMetadata}
                            model={formModel.value[prop.property]}
                            onUpdate:model={(val: Recordable) =>
                              (formModel.value[prop.property] = val)
                            }
                            ref={(el: any) =>
                              props.registerRef(prop.property, el)
                            }
                            showEditButton={false}
                            v-slots={props.slots}
                          />
                        </div>
                      ) : (
                        <DescItem
                          editMode={props.editMode}
                          onUpdate:value={(val: any) =>
                            (formModel.value[prop.property] = val)
                          }
                          prop={prop}
                          ref={(el: any) =>
                            props.registerRef(prop.property, el)
                          }
                          value={formModel.value[prop.property]}
                        />
                      )}

                      {/* 联动配置 - 放在同一个描述项中 */}
                      {linkageMetadata && linkageMetadata.metadata && (
                        <div class="mt-2 rounded border-l-2 border-primary/30 bg-primary/5 py-2 pl-3 pr-2.5">
                          <YlConfigMetadataDesc
                            {...props.parentProps.value}
                            editMode={props.editMode}
                            hideNestedHeader={props.hideNestedHeader}
                            hideRootHeader={props.hideRootHeader}
                            isNested={true}
                            metadata={linkageMetadata.metadata}
                            model={
                              formModel.value[linkageMetadata.linkageProperty]
                            }
                            onUpdate:model={(val: Recordable) =>
                              (formModel.value[
                                linkageMetadata.linkageProperty
                              ] = val)
                            }
                            ref={(el: any) =>
                              props.registerRef(
                                linkageMetadata.linkageProperty,
                                el,
                              )
                            }
                            showEditButton={false}
                            v-slots={props.slots}
                          />
                        </div>
                      )}
                    </div>
                  </DescriptionsItem>
                );
              });
            })()}
          </Descriptions>
        </div>
      ))}
    </>
  );
}
