import type { MonacoCompletionProvider } from './types';

import { monaco } from './monaco';

// --- 1. 中间表示层 (Intermediate Representation) ---

interface MethodDefinition {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
  doc: string;
}

interface InterfaceDefinition {
  name: string;
  methods: MethodDefinition[];
}

interface VariableDefinition {
  name: string;
  type: string;
}

interface DtsParseResult {
  interfaces: Record<string, InterfaceDefinition>;
  globalVars: VariableDefinition[];
}

// --- 2. 解析器 (Parser) ---

/**
 * 健壮的 .d.ts 解析器
 * 支持:
 * 1. 多个 interface 定义
 * 2. 多个 declare var 全局变量
 * 3. 基础的方法链 (Fluent API) 识别 (通过返回类型匹配接口名)
 */
function parseDts(dtsContent: string): DtsParseResult {
  const result: DtsParseResult = { interfaces: {}, globalVars: [] };

  // 1. 提取所有 declare var [name]: [type];
  const globalVarRegex = /declare\s+var\s+(\w+)\s*:\s*(\w+)\s*;?/g;
  let varMatch;
  // eslint-disable-next-line no-cond-assign
  while ((varMatch = globalVarRegex.exec(dtsContent)) !== null) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.globalVars.push({ name: varMatch[1]!, type: varMatch[2]! });
  }

  // 2. 提取所有 interface Block
  const interfaceRegex = /interface\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let ifaceMatch;

  // eslint-disable-next-line no-cond-assign
  while ((ifaceMatch = interfaceRegex.exec(dtsContent)) !== null) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const interfaceName = ifaceMatch[1]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const body = ifaceMatch[2]!;

    // 如果接口已存在，则在原有基础上追加方法
    if (!result.interfaces[interfaceName]) {
      result.interfaces[interfaceName] = { name: interfaceName, methods: [] };
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const targetIface = result.interfaces[interfaceName]!;

    // 3. 提取方法定义 (增强版：基于括号匹配解析)
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const methodBlockRegex = /(?:\/\*\*\s*([\s\S]*?)\s*\*\/)?\s*(\w+)\s*\(/g;
    let blockMatch;

    // eslint-disable-next-line no-cond-assign
    while ((blockMatch = methodBlockRegex.exec(body)) !== null) {
      const rawDoc = blockMatch[1] || '';
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const methodName = blockMatch[2]!;
      const startIdx = methodBlockRegex.lastIndex;

      let depth = 1;
      let endIdx = startIdx;
      while (depth > 0 && endIdx < body.length) {
        if (body[endIdx] === '(') depth++;
        else if (body[endIdx] === ')') depth--;
        endIdx++;
      }

      // eslint-disable-next-line unicorn/prefer-string-slice
      const paramsStr = body.substring(startIdx, endIdx - 1).trim();
      const rest = body.slice(Math.max(0, endIdx)).trim();

      const returnMatch = rest.match(/^\s*:\s*(\w+)/);
      if (returnMatch) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const returnType = returnMatch[1]!;

        const params: { name: string; type: string }[] = [];
        if (paramsStr) {
          let currentParam = '';
          let pDepth = 0;
          for (const char of paramsStr) {
            if (char === ',' && pDepth === 0) {
              params.push(parseSingleParam(currentParam));
              currentParam = '';
            } else {
              currentParam += char;
              if (char === '(') pDepth++;
              else if (char === ')') pDepth--;
            }
          }
          if (currentParam.trim()) {
            params.push(parseSingleParam(currentParam));
          }
        }

        const doc = rawDoc
          .split('\n')
          .map((line) => line.replace(/^\s*\*\s?/, '').trim())
          .filter((line, index, arr) => {
            if (line) return true;
            return (
              index > 0 &&
              index < arr.length - 1 &&
              arr[index - 1] &&
              arr[index + 1]
            );
          })
          .join('\n');

        // 去重：如果已存在同名方法，先移除旧的
        const existingIdx = targetIface.methods.findIndex(
          (m) => m.name === methodName,
        );
        if (existingIdx !== -1) {
          targetIface.methods.splice(existingIdx, 1);
        }
        targetIface.methods.push({ name: methodName, params, returnType, doc });
      }
      methodBlockRegex.lastIndex = endIdx;
    }
  }

  return result;
}

/** 辅助函数：解析单个参数字符串 (e.g., "name: type") */
function parseSingleParam(p: string): { name: string; type: string } {
  const parts = p.split(':');
  if (parts.length < 2) {
    return { name: p.trim().replace('?', ''), type: 'any' };
  }
  const name = parts[0]?.trim().replace('?', '');
  const type = parts.slice(1).join(':').trim(); // 考虑类型本身包含冒号的情况
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return { name, type };
}

// --- 3. 提供者生成器 (Provider Generator) ---

/**
 * 通用的补全逻辑生成器
 */
function createLanguageProvider(
  ir: DtsParseResult,
  config: {
    formatMethod: (m: MethodDefinition) => {
      detail: string;
      insertText: string;
      label: string;
    };
    language: string;
    mapType: (tsType: string) => string;
  },
): MonacoCompletionProvider['provider'] {
  const { globalVars, interfaces } = ir;

  return {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.slice(
        0,
        Math.max(0, position.column - 1),
      );
      const word = model.getWordUntilPosition(position);

      // --- 场景 1: 变量后的方法提示 (e.g., parser. or parser.fixed(1).) ---
      // 我们通过简单的后缀回溯来猜测当前的类型
      let currentTypeName: string | undefined;

      // a. 检查是否直接跟在全局变量后面: var. or var.pre
      for (const v of globalVars) {
        // 允许在点号后跟上正在输入的单词
        const regex = new RegExp(`${v.name}\\s*\\.[\\w]*$`);
        if (regex.test(textUntilPosition)) {
          currentTypeName = v.type;
          break;
        }
      }

      // b. 逻辑增强: 支持链式调用 (e.g., .fixed(n).)
      // 如果前面是一个方法调用结束，且我们知道该方法返回什么接口
      if (!currentTypeName) {
        // 允许在点号后跟上正在输入的单词
        const chainMatch = textUntilPosition.match(
          /(\w+)\s*\([^()]*\)\s*\.\w*$/,
        );
        if (chainMatch) {
          const lastMethodName = chainMatch[1];
          for (const iface of Object.values(interfaces)) {
            const method = iface.methods.find((m) => m.name === lastMethodName);
            if (method && interfaces[method.returnType]) {
              currentTypeName = method.returnType;
              break;
            }
          }
        }
      }

      // c. 启发式增强: 如果还是没找到，尝试通过变量名模糊匹配接口 (解决回调参数补全问题)
      if (!currentTypeName) {
        const varMatch = textUntilPosition.match(/(\w+)\s*\.\w*$/);
        if (varMatch) {
          const varName = varMatch[1]?.toLowerCase();
          if (varName && varName.length > 2) {
            // 评分排序：优先完全匹配，然后前缀匹配，最后包含匹配
            const candidates = Object.keys(interfaces)
              .map((ifaceName) => {
                const lowerIface = ifaceName.toLowerCase();
                let score = 0;
                if (lowerIface === varName) score = 100;
                else if (lowerIface.startsWith(varName)) score = 50;
                else if (
                  lowerIface.includes(varName) ||
                  varName.includes(lowerIface)
                )
                  score = 10;
                return { ifaceName, score };
              })
              .filter((c) => c.score > 0)
              .sort((a, b) => b.score - a.score);

            if (candidates.length > 0) {
              currentTypeName = candidates[0]?.ifaceName;
            }
          }
        }
      }

      if (currentTypeName && interfaces[currentTypeName]) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const targetIface = interfaces[currentTypeName]!;
        const suggestions = targetIface.methods.map((m) => {
          const { label, detail, insertText } = config.formatMethod(m);
          return {
            label,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: m.doc
              ? {
                  value: m.doc,
                  isTrusted: true,
                  supportHtml: true,
                }
              : undefined,
            detail,
            // 增加 sortText 确保排序在内置属性之前
            sortText: `00_${label}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            },
          };
        });
        return { suggestions };
      }

      // --- 场景 2: 全局变量提示 (Top-level) ---
      const textBeforeWord = lineContent.slice(
        0,
        Math.max(0, word.startColumn - 1),
      );
      // 确保不在 . 后面
      if (!textBeforeWord.trim().endsWith('.')) {
        return {
          suggestions: globalVars.map((v) => ({
            label: v.name,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: v.name,
            detail: v.type,
            documentation: 'Auto-generated from DTS',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            },
          })),
        };
      }

      return { suggestions: [] };
    },
  };
}

// --- 4. 具体语言配置 ---

const TYPE_MAP_JAVA: Record<string, string> = {
  boolean: 'boolean',
  number: 'int',
  string: 'String',
  void: 'void',
  any: 'Object',
};

const TYPE_MAP_PYTHON: Record<string, string> = {
  boolean: 'bool',
  number: 'int',
  string: 'str',
  any: 'Any',
};

function formatMethodForPython(m: MethodDefinition) {
  const paramSnippet = m.params
    .map((p, index) => `\${${index + 1}:${p.name}}`)
    .join(', ');

  return {
    label: m.name,
    detail: `(${m.params.map((p) => p.name).join(', ')}) -> ${m.returnType}`,
    insertText: `${m.name}(${paramSnippet})`,
  };
}

function formatMethodForJava(m: MethodDefinition) {
  const paramSnippet = m.params
    .map((p, index) => {
      if (p.name.toLowerCase().includes('callback')) {
        return `(${p.name}) -> {\n\t\${${index + 1}}\n}`;
      }
      return `\${${index + 1}:${p.name}}`;
    })
    .join(', ');

  const javaParams = m.params
    .map((p) => `${TYPE_MAP_JAVA[p.type] || p.type} ${p.name}`)
    .join(', ');
  const javaReturn = TYPE_MAP_JAVA[m.returnType] || m.returnType;

  return {
    label: m.name,
    detail: `${javaReturn} ${m.name}(${javaParams})`,
    insertText: `${m.name}(${paramSnippet})`,
  };
}

function formatMethodForJsTs(m: MethodDefinition) {
  const paramSnippet = m.params
    .map((p, index) => `\${${index + 1}:${p.name}}`)
    .join(', ');

  const signature = `(${m.params.map((p) => `${p.name}`).join(', ')})`;

  return {
    label: `${m.name}${signature}`, // 包含签名，使其与原生补全（仅名称）区分开
    detail: `(${m.params.map((p) => `${p.name}: ${p.type}`).join(', ')}) => ${m.returnType}`,
    insertText: `${m.name}(${paramSnippet})`,
  };
}

// --- 5. 统一入口 ---

/**
 * 根据 .d.ts 内容，自动为多种语言生成提示提供者
 */
export function createUniversalProviders(
  dtsContent: string,
  languagesList: string[] = ['javascript', 'python', 'java'],
): MonacoCompletionProvider[] {
  const ir = parseDts(dtsContent);
  const providers: MonacoCompletionProvider[] = [];

  if (ir.globalVars.length === 0) {
    console.warn('[DtsConverter] No global vars found in d.ts');
  }

  languagesList.forEach((lang) => {
    switch (lang) {
      case 'java': {
        providers.push({
          language: 'java',
          provider: createLanguageProvider(ir, {
            language: 'java',
            mapType: (t) => TYPE_MAP_JAVA[t] || t,
            formatMethod: formatMethodForJava,
          }),
        });
        break;
      }
      case 'javascript':
      case 'typescript': {
        // 对于 JS/TS，我们既保留 extraLibs (用于原生悬停/类型检查)，
        // 又添加自定义 Provider (用于补全方法签名 Snippet)
        const langProvider = createLanguageProvider(ir, {
          language: lang,
          mapType: (t) => t,
          formatMethod: formatMethodForJsTs,
        });

        providers.push({
          language: lang,
          provider: {
            ...langProvider,
            extraLibs: [{ content: dtsContent, filePath: 'generated.d.ts' }],
          },
        });
        break;
      }
      case 'python': {
        providers.push({
          language: 'python',
          provider: createLanguageProvider(ir, {
            language: 'python',
            mapType: (t) => TYPE_MAP_PYTHON[t] || t,
            formatMethod: formatMethodForPython,
          }),
        });
        break;
      }
    }
  });

  return providers;
}
