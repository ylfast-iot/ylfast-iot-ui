import { $t } from '@vben/locales';

/**
 * 文件类型分类
 */
export type FileTypeCategory =
  | 'ARCHIVE'
  | 'AUDIO'
  | 'CODE'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'OTHER'
  | 'VIDEO';

/**
 * 文件类型枚举配置
 */
export interface FileTypeCategoryDict {
  /** 值 */
  value: FileTypeCategory;
  /** 标签 */
  label: string;
  /** 图标 */
  icon: string;
  /** 颜色 */
  color?: string;
  /** 支持的扩展名 */
  extensions: string[];
}

/**
 * 文件类型枚举配置
 */
export const FILE_TYPE_CATEGORY_ENUMS: {
  [key in FileTypeCategory]: FileTypeCategoryDict;
} = {
  IMAGE: {
    value: 'IMAGE',
    get label() {
      return $t('file.type.image');
    },
    icon: 'lucide:image',
    color: 'blue',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
  },
  VIDEO: {
    value: 'VIDEO',
    get label() {
      return $t('file.type.video');
    },
    icon: 'lucide:video',
    color: 'purple',
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
  },
  AUDIO: {
    value: 'AUDIO',
    get label() {
      return $t('file.type.audio');
    },
    icon: 'lucide:music',
    color: 'green',
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  },
  DOCUMENT: {
    value: 'DOCUMENT',
    get label() {
      return $t('file.type.document');
    },
    icon: 'lucide:file-text',
    color: 'orange',
    extensions: [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'md',
      'csv',
    ],
  },
  ARCHIVE: {
    value: 'ARCHIVE',
    get label() {
      return $t('file.type.archive');
    },
    icon: 'lucide:archive',
    color: 'cyan',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'jar', 'war', 'ear'],
  },
  CODE: {
    value: 'CODE',
    get label() {
      return $t('file.type.code');
    },
    icon: 'lucide:code',
    color: 'geekblue',
    extensions: [
      'js',
      'ts',
      'jsx',
      'tsx',
      'vue',
      'java',
      'py',
      'go',
      'rs',
      'c',
      'cpp',
      'h',
      'css',
      'scss',
      'less',
      'html',
      'xml',
      'json',
      'yaml',
      'yml',
    ],
  },
  OTHER: {
    value: 'OTHER',
    get label() {
      return $t('file.type.other');
    },
    icon: 'lucide:file',
    color: 'gray',
    extensions: [],
  },
};

/**
 * 根据文件扩展名获取文件类型分类
 */
export function getFileTypeCategory(extension: string): FileTypeCategory {
  const ext = extension.toLowerCase().replace('.', '');

  for (const [key, config] of Object.entries(FILE_TYPE_CATEGORY_ENUMS)) {
    if (config.extensions.includes(ext)) {
      return key as FileTypeCategory;
    }
  }

  return 'OTHER';
}

/**
 * 根据文件扩展名获取文件类型信息
 */
export function getFileTypeInfo(extension: string): FileTypeCategoryDict {
  const category = getFileTypeCategory(extension);
  return FILE_TYPE_CATEGORY_ENUMS[category];
}
