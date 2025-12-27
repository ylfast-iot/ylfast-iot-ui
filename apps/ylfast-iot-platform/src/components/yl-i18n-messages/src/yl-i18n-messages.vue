<script lang="ts" setup>
import type {
  I18nMessage,
  I18nMessageRow,
  I18nMessagesData,
  YlI18nMessagesActionType,
  YlI18nMessagesProps,
} from './types';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Input, message, Modal, Textarea } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

import {
  createEmptyTranslations,
  ensureAllLanguages,
  exportToJson,
  generateId,
  importFromJson,
  mergeI18nData,
  validateI18nData,
} from './helper';

defineOptions({
  name: 'YlI18nMessages',
});
const props = withDefaults(defineProps<YlI18nMessagesProps>(), {
  languages: () => ['zh_CN', 'en_US', 'en'],
  size: 'middle',
  readonly: false,
  showToolbar: true,
  bordered: true,
});
const emit = defineEmits<{
  change: [value: I18nMessagesData];
  register: [action: YlI18nMessagesActionType];
  'update:modelValue': [value: I18nMessagesData];
}>();
// 图标
const PlusIcon = createIconifyIcon('lucide:plus');
const TrashIcon = createIconifyIcon('lucide:trash-2');
const DownloadIcon = createIconifyIcon('lucide:download');
const UploadIcon = createIconifyIcon('lucide:upload');
const LanguagesIcon = createIconifyIcon('lucide:languages');
const EditIcon = createIconifyIcon('lucide:edit');

// 内部状态
const innerProps = reactive<Partial<YlI18nMessagesProps>>({});
const currentLanguages = ref<string[]>([...props.languages]);
const dataSource = ref<I18nMessageRow[]>([]);

// 合并 props
const getProps = computed<YlI18nMessagesProps>(() => {
  return { ...props, ...innerProps };
});

// 当前数据
const currentValue = computed<I18nMessagesData>(() => {
  const result: I18nMessagesData = {};
  for (const row of dataSource.value) {
    result[row.key] = { ...row.translations };
  }
  return result;
});

// 初始化 vxe-table
const initialGridOptions: VxeGridProps<I18nMessageRow> = {
  border: true,
  columns: [],
  data: [],
  height: 'auto',
  keepSource: false,
  showOverflow: true,
  editConfig: {
    mode: 'cell',
    trigger: 'click',
    showIcon: false,
    showStatus: false,
  },
  rowConfig: {
    keyField: 'id',
  },
  pagerConfig: {
    enabled: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: initialGridOptions,
  gridEvents: {
    editClosed: handleEditClosed,
  },
});

// 更新表格列
function updateGridColumns() {
  const cols: VxeGridProps<I18nMessageRow>['columns'] = [
    {
      title: $t('ylI18nMessages.key'),
      field: 'key',
      width: 180,
      fixed: 'left',
      editRender: getProps.value.readonly
        ? undefined
        : {
            name: 'AInput',
            props: { placeholder: $t('ylI18nMessages.placeholder.key') },
          },
      slots: { header: 'header_key' },
    },
  ];

  // 动态语言列
  for (const lang of currentLanguages.value) {
    cols.push({
      title: lang,
      field: `translations.${lang}`,
      minWidth: 150,
      editRender: getProps.value.readonly
        ? undefined
        : {
            name: 'AInput',
            props: { placeholder: $t('ylI18nMessages.placeholder.value') },
          },
      slots: { header: 'header_lang' },
    });
  }

  // 操作列
  if (!getProps.value.readonly) {
    cols.push({
      title: $t('common.action.label'),
      width: 80,
      align: 'center',
      slots: { default: 'action' },
    });
  }

  gridApi.setGridOptions({
    columns: cols,
    border: getProps.value.bordered,
    height: getProps.value.height || 'auto',
    editConfig: getProps.value.readonly
      ? undefined
      : {
          mode: 'cell',
          trigger: 'click',
          showIcon: false,
          showStatus: false,
        },
  });
}

// 更新表格数据
function updateGridData() {
  gridApi.setGridOptions({ data: [...dataSource.value] });
}

// 从 props 初始化数据
function initDataFromProps() {
  const value = getProps.value.modelValue || getProps.value.value || {};
  const rows: I18nMessageRow[] = [];

  for (const key of Object.keys(value)) {
    const translations = value[key];
    if (translations) {
      rows.push({
        id: generateId(),
        key,
        translations: ensureAllLanguages(translations, currentLanguages.value),
      });
    }
  }

  dataSource.value = rows;
  updateGridData();
}

// 监听 props 变化
watch(
  () => [props.modelValue, props.value],
  () => {
    initDataFromProps();
  },
  { deep: true },
);

watch(
  () => props.languages,
  (newLangs) => {
    if (newLangs && newLangs.length > 0) {
      currentLanguages.value = [...newLangs];
      // 确保所有行都包含新语言
      for (const row of dataSource.value) {
        row.translations = ensureAllLanguages(
          row.translations,
          currentLanguages.value,
        );
      }
      updateGridColumns();
      updateGridData();
    }
  },
  { deep: true },
);

// 监听语言列表变化
watch(
  currentLanguages,
  () => {
    updateGridColumns();
  },
  { deep: true },
);

// 处理编辑完成事件 - 同步数据并触发变更
function handleEditClosed(params: any) {
  // vxe-table edit-closed 事件参数格式
  const { row } = params;
  if (!row) return;

  // 从表格中获取当前的行数据，同步到 dataSource
  const index = dataSource.value.findIndex((r) => r.id === row.id);
  if (index !== -1) {
    // 更新 dataSource 中对应的数据
    dataSource.value[index] = { ...row };
    emitChange();
  }
}

// 触发变更事件
function emitChange() {
  // 不再从表格同步回 dataSource，避免新增时的竞争状态
  // 数据同步已在 handleEditClosed 中处理
  const value = currentValue.value;
  emit('change', value);
  emit('update:modelValue', value);
}

// 添加新键 - 直接新增一行
async function addKey(key?: string, translations?: I18nMessage) {
  const newKey = key || `key_${Date.now()}`;
  const newRow: I18nMessageRow = {
    id: generateId(),
    key: newKey,
    translations: translations
      ? ensureAllLanguages(translations, currentLanguages.value)
      : createEmptyTranslations(currentLanguages.value),
  };

  dataSource.value = [...dataSource.value, newRow];
  updateGridData();
  emitChange();
}

// 更新键名
async function updateKey(oldKey: string, newKey: string) {
  const row = dataSource.value.find((r) => r.key === oldKey);
  if (row) {
    row.key = newKey;
    updateGridData();
    emitChange();
  }
}

// 删除键
async function removeKey(key: string) {
  const index = dataSource.value.findIndex((r) => r.key === key);
  if (index !== -1) {
    dataSource.value.splice(index, 1);
    updateGridData();
    emitChange();
  }
}

// 处理删除键
function handleRemoveKey(row: I18nMessageRow) {
  const index = dataSource.value.findIndex((r) => r.id === row.id);
  if (index !== -1) {
    dataSource.value.splice(index, 1);
    updateGridData();
    emitChange();
  }
}

// 添加语言 - 直接新增一列
async function addLanguage(lang?: string) {
  const newLang = lang || `lang_${currentLanguages.value.length + 1}`;

  if (currentLanguages.value.includes(newLang)) {
    message.warning($t('ylI18nMessages.error.languageExists'));
    return;
  }

  currentLanguages.value = [...currentLanguages.value, newLang];

  // 为所有行添加新语言
  for (const row of dataSource.value) {
    if (!(newLang in row.translations)) {
      row.translations[newLang] = '';
    }
  }

  updateGridColumns();
  updateGridData();
  emitChange();
}

// 删除语言
async function removeLanguage(language: string) {
  const index = currentLanguages.value.indexOf(language);
  if (index !== -1) {
    currentLanguages.value = currentLanguages.value.filter(
      (l) => l !== language,
    );

    // 从所有行中删除该语言
    for (const row of dataSource.value) {
      delete row.translations[language];
    }

    updateGridColumns();
    updateGridData();
    emitChange();
  }
}

// 更新语言代码（重命名）
async function updateLanguage(oldLang: string, newLang: string) {
  if (oldLang === newLang) return;

  if (currentLanguages.value.includes(newLang)) {
    message.warning($t('ylI18nMessages.error.languageExists'));
    return;
  }

  const index = currentLanguages.value.indexOf(oldLang);
  if (index !== -1) {
    const newLangs = [...currentLanguages.value];
    newLangs[index] = newLang;
    currentLanguages.value = newLangs;

    // 同步更新所有行的翻译 key
    for (const row of dataSource.value) {
      const translation = row.translations[oldLang];
      if (translation !== undefined) {
        row.translations[newLang] = translation;
        delete row.translations[oldLang];
      }
    }

    updateGridColumns();
    updateGridData();
    emitChange();
  }
}

// 更新翻译
async function updateTranslation(key: string, lang: string, value: string) {
  const row = dataSource.value.find((r) => r.key === key);
  if (row) {
    row.translations[lang] = value;
    updateGridData();
    emitChange();
  }
}

// 导入数据
async function handleImport() {
  const content = await new Promise<string>((resolve) => {
    let inputValue: string = '';

    Modal.confirm({
      title: $t('ylI18nMessages.import'),
      width: 600,
      content: () =>
        h(Textarea, {
          value: inputValue,
          placeholder: $t('ylI18nMessages.placeholder.importJson'),
          rows: 10,
          'onUpdate:value': (val: string) => {
            inputValue = val;
          },
        }),
      onOk: () => {
        resolve(inputValue);
      },
      onCancel: () => {
        resolve('');
      },
    });
  });

  if (!content) return;

  try {
    const importedData = importFromJson(content);
    if (!validateI18nData(importedData)) {
      message.error($t('ylI18nMessages.error.invalidData'));
      return;
    }

    await importData(importedData, true);
    message.success($t('ylI18nMessages.success.imported'));
  } catch {
    message.error($t('ylI18nMessages.error.importFailed'));
  }
}

// 导出数据
function handleExport() {
  const json = exportToJson(currentValue.value);

  // 创建下载
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'i18n-messages.json';
  a.click();
  URL.revokeObjectURL(url);

  message.success($t('ylI18nMessages.success.exported'));
}

// 处理重命名语言
function handleRenameLanguage(oldLang: string) {
  let newLang = oldLang;
  Modal.confirm({
    title: $t('ylI18nMessages.addLanguage'),
    content: () =>
      h(Input, {
        value: newLang,
        placeholder: $t('ylI18nMessages.placeholder.language'),
        'onUpdate:value': (val: string) => {
          newLang = val;
        },
      }),
    onOk: () => {
      if (newLang && newLang !== oldLang) {
        updateLanguage(oldLang, newLang);
      }
    },
  });
}

// 设置 props
async function setProps(newProps: Partial<YlI18nMessagesProps>) {
  Object.assign(innerProps, newProps);
  updateGridColumns();
}

// 获取数据
function getValue(): I18nMessagesData {
  return currentValue.value;
}

// 设置数据
async function setValue(value: I18nMessagesData) {
  const rows: I18nMessageRow[] = [];

  for (const key of Object.keys(value)) {
    const translations = value[key];
    if (translations) {
      rows.push({
        id: generateId(),
        key,
        translations: ensureAllLanguages(translations, currentLanguages.value),
      });
    }
  }

  dataSource.value = rows;
  updateGridData();
  emitChange();
}

// 清空数据
async function clear() {
  dataSource.value = [];
  updateGridData();
  emitChange();
}

// 导入
async function importData(data: I18nMessagesData, merge = true) {
  if (merge) {
    const merged = mergeI18nData(currentValue.value, data);

    // 更新语言列表
    for (const key of Object.keys(merged)) {
      const translations = merged[key];
      if (translations) {
        for (const lang of Object.keys(translations)) {
          if (!currentLanguages.value.includes(lang)) {
            currentLanguages.value.push(lang);
          }
        }
      }
    }

    setValue(merged);
  } else {
    setValue(data);
  }
}

// 导出
function exportData(): I18nMessagesData {
  return getValue();
}

// Action 对象
const action: YlI18nMessagesActionType = {
  setProps,
  getValue,
  setValue,
  addKey,
  removeKey,
  updateKey,
  addLanguage,
  removeLanguage,
  updateTranslation,
  importData,
  exportData,
  clear,
};

// 注册
onMounted(() => {
  initDataFromProps();
  updateGridColumns();
  emit('register', action);
});

// 暴露给外部
defineExpose(action);
</script>

<template>
  <div class="yl-i18n-messages">
    <Grid>
      <!-- 键名列标题自定义 -->
      <template #header_key>
        <div class="key-header">
          <span>{{ $t('ylI18nMessages.key') }}</span>
          <div v-if="!getProps.readonly" class="header-actions">
            <span class="icon-btn icon-btn-primary" @click="addKey()">
              <PlusIcon class="size-3" />
            </span>
            <span class="icon-btn" @click="addLanguage()">
              <LanguagesIcon class="size-3" />
            </span>
            <span class="icon-btn" @click="handleImport">
              <UploadIcon class="size-3" />
            </span>
            <span class="icon-btn" @click="handleExport">
              <DownloadIcon class="size-3" />
            </span>
          </div>
        </div>
      </template>

      <!-- 语言列标题自定义 -->
      <template #header_lang="{ column }">
        <div class="key-header">
          <span>{{ column.title }}</span>
          <div v-if="!getProps.readonly" class="header-actions">
            <span
              class="icon-btn"
              @click="handleRenameLanguage(column.title as string)"
            >
              <EditIcon class="size-3" />
            </span>
            <span
              class="icon-btn icon-btn-danger"
              @click="removeLanguage(column.title as string)"
            >
              <TrashIcon class="size-3" />
            </span>
          </div>
        </div>
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <span class="icon-btn icon-btn-danger" @click="handleRemoveKey(row)">
          <TrashIcon class="size-3" />
        </span>
      </template>
    </Grid>
  </div>
</template>

<style scoped>
.yl-i18n-messages {
  width: 100%;
}

.key-header {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.key-header span:first-child {
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: hsl(var(--muted));
  border-radius: 50%;
  transition: all 0.2s;
}

.icon-btn:hover {
  opacity: 0.7;
}

.icon-btn-primary {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
}

.icon-btn-primary:hover {
  background: hsl(var(--primary) / 80%);
}

.icon-btn-danger {
  color: hsl(var(--destructive));
}

.icon-btn-danger:hover {
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 10%);
}
</style>
