import type { languages } from 'monaco-editor';

import type { PropType } from 'vue';

export type Theme = 'auto' | 'hc-black' | 'hc-light' | 'vs' | 'vs-dark';
export type FoldingStrategy = 'auto' | 'indentation';
export type RenderLineHighlight = 'all' | 'gutter' | 'line' | 'none';

export interface Options {
  automaticLayout: boolean; // 自适应布局
  foldingStrategy: FoldingStrategy; // 折叠方式
  renderLineHighlight: RenderLineHighlight; // 行亮
  selectOnLineNumbers: boolean; // 显示行号
  placeholder: string;
  minimap: {
    enabled: boolean;
  };
  fontSize: number;
  scrollBeyondLastLine: boolean;
  overviewRulerBorder: boolean;
  lineNumbers: 'interval' | 'off' | 'on' | 'relative';
  roundedSelection: boolean;
  autoIndent: 'advanced' | 'brackets' | 'full' | 'keep' | 'none';
  readOnly?: boolean;
  [key: string]: any; // Allow other monaco options
}

/**
 * Definition for a custom completion provider that can be passed via props.
 */
export interface MonacoCompletionProvider {
  /**
   * Target language (e.g., 'javascript', 'python').
   * If omitted, it might apply to the current editor's language if supported by logic.
   */
  language: string;
  /**
   * Standard Monaco CompletionItemProvider.
   * Can also carry extra library definitions (d.ts) for JS/TS.
   */
  provider: languages.CompletionItemProvider & {
    extraLibs?: MonacoExtraLib[];
  };
}

/**
 * Definition for extra libraries (d.ts) for JS/TS.
 */
export interface MonacoExtraLib {
  content: string;
  filePath?: string;
}

export const editorProps = {
  modelValue: {
    type: String as PropType<string>,
    default: '',
  },
  width: {
    type: [String, Number] as PropType<number | string>,
    default: '100%',
  },
  height: {
    type: [String, Number] as PropType<number | string>,
    default: '100%',
  },
  language: {
    type: String as PropType<string>,
    default: 'javascript',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  theme: {
    type: String as PropType<Theme>,
    validator(value: string): boolean {
      return ['auto', 'hc-black', 'hc-light', 'vs', 'vs-dark'].includes(value);
    },
    default: 'auto',
  },
  /**
   * Simple object-based suggestions (key-value).
   * For JS/TS, this will be converted to simple d.ts declarations (var [key]: any).
   */
  customObjectSuggestion: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  /**
   * Scope name to load pre-registered providers (e.g., 'protocol-script').
   * Providers found in this scope will be merged with completionProviders.
   */
  scope: {
    type: String as PropType<string>,
    default: '',
  },
  /**
   * Advanced: List of custom completion providers to register.
   */
  completionProviders: {
    type: Array as PropType<MonacoCompletionProvider[]>,
    default: () => [],
  },
  /**
   * Advanced: List of extra libraries (d.ts) to register for JS/TS.
   */
  extraLibs: {
    type: Array as PropType<MonacoExtraLib[]>,
    default: () => [],
  },
  options: {
    type: Object as PropType<Partial<Options>>,
    default: () => ({
      automaticLayout: true,
      foldingStrategy: 'indentation',
      renderLineHighlight: 'all',
      lineNumbers: 'on',
      roundedSelection: true,
      minimap: {
        enabled: true,
      },
      placeholder: 'Please enter...',
      fontSize: 14,
      autoIndent: 'advanced',
      scrollBeyondLastLine: false,
      overviewRulerBorder: false,
      fixedOverflowWidgets: true,
    }),
  },
};
