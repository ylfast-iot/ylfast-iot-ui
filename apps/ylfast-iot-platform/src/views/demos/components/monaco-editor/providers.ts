import type { MonacoCompletionProvider } from '#/components/yl-monaco-editor/src/types';

import { createUniversalProviders } from '#/components/yl-monaco-editor/src/dts-converter';
import { monaco } from '#/components/yl-monaco-editor/src/monaco';

/**
 * 案例 1: SQL 关键字增强
 * 单一职责: 仅关注 SQL 语言的关键字大写补全
 */
export const sqlKeywordProvider: MonacoCompletionProvider = {
  language: 'sql',
  provider: {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const keywords = [
        'SELECT',
        'FROM',
        'WHERE',
        'GROUP BY',
        'ORDER BY',
        'INSERT',
        'UPDATE',
        'DELETE',
        'JOIN',
        'LEFT JOIN',
      ];

      return {
        suggestions: keywords.map((key) => ({
          label: key,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: key,
          detail: 'Standard SQL Keyword',
          range,
        })),
      };
    },
  },
};

/**
 * 案例 2: Python 代码片段 (Snippets)
 * 单一职责: 仅关注 Python 常用语法的模版生成
 */
export const pythonSnippetProvider: MonacoCompletionProvider = {
  language: 'python',
  provider: {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: [
          {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'Define a new function',
            // eslint-disable-next-line no-template-curly-in-string
            insertText: 'def ${1:function_name}(${2:args}):\n\t${3:pass}',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Function Snippet',
          },
          {
            label: 'ifmain',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'if __name__ == "__main__": ...',
            // eslint-disable-next-line no-template-curly-in-string
            insertText: 'if __name__ == "__main__":\n\t${1:main()}',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Main Entry Snippet',
          },
          {
            label: 'try',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              // eslint-disable-next-line no-template-curly-in-string
              'try:\n\t${1:pass}\nexcept ${2:Exception} as e:\n\t${3:print(e)}',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Try/Except Block',
          },
        ],
      };
    },
  },
};

/**
 * 案例 3: 动态 JSON 提示 (模拟 API 数据)
 * 单一职责: 模拟根据上下文提供特定的 JSON Key
 */
export const jsonKeyProvider: MonacoCompletionProvider = {
  language: 'json',
  provider: {
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // 简单的判断：如果在一个 "device": { ... } 块内
      // (注意：实际项目中建议使用 json-parser 进行更精确的 AST 判断，这里仅做演示)
      const isInDeviceContext = textUntilPosition.includes('"device"');

      if (!isInDeviceContext) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: [
          {
            label: 'deviceId',
            kind: monaco.languages.CompletionItemKind.Property,
            // eslint-disable-next-line no-template-curly-in-string
            insertText: '"deviceId": "${1:00001}",',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'IoT Device ID',
          },
          {
            label: 'temperature',
            kind: monaco.languages.CompletionItemKind.Property,
            // eslint-disable-next-line no-template-curly-in-string
            insertText: '"temperature": ${1:25.5},',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Device Sensor Data',
          },
        ],
      };
    },
  },
};

/**
 * IoT Parser 的 .d.ts 定义
 * 包含链式调用支持
 */
export const iotParserExtraLib = `
interface IoTBuffer {
    /** 获取指定位置的整数 */
    getInt(index: number): number;
    /** 追加 Buffer */
    appendBuffer(buf: IoTBuffer): void;
    /** 转换为字符串 */
    toString(encoding?: string): string;
}

interface IoTPayloadParser {
    /** 设置固定长度解析模式 */
    fixed(size: number): IoTPayloadParser;
    /** 设置定界符解析模式 */
    delimited(delimited: string): IoTPayloadParser;
    /** 注入处理逻辑 */
    handler(callback: (buffer: IoTBuffer, parser: IoTPayloadParser) => void): IoTPayloadParser;
    /** 设置解析结果 */
    result(buffer: any): IoTPayloadParser;
    /** 完成解析并重置 */
    complete(): IoTPayloadParser;
    /** 创建新 Buffer */
    newBuffer(): IoTBuffer;
}

/** IoT Payload Parser Instance */
declare var parser: IoTPayloadParser;
`;

/**
 * 案例 4/5/6: 自动生成的多语言 Provider
 * 使用 createUniversalProviders 工具，一次生成 JS/Python/Java 的提示
 */
export const universalParserProviders = createUniversalProviders(
  iotParserExtraLib,
  ['javascript', 'python', 'java'],
);
