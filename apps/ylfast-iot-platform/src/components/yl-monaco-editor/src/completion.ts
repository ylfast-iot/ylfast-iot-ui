import type { IDisposable, languages } from 'monaco-editor';

import { monaco } from './monaco';

/**
 * Manager for handling Monaco Editor completions and extra libraries.
 * Ensures strict typing and manages lifecycle of providers.
 */
export class CompletionManager {
  private disposables: IDisposable[] = [];
  private editorModelId: null | string = null;

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  /**
   * Registers custom d.ts libraries for JS/TS.
   */
  public registerExtraLibs(
    language: string,
    libs: { content: string; filePath?: string }[],
  ) {
    const ts = (monaco.languages as any).typescript;
    if (!ts) return;

    libs.forEach((lib, index) => {
      const fileName = lib.filePath || `extra-lib-${index}.d.ts`;
      const path = `ts:///${this.editorModelId || 'global'}/${fileName}`;

      if (language === 'javascript' || language === 'any') {
        this.disposables.push(
          ts.javascriptDefaults.addExtraLib(lib.content, path),
        );
      }
      if (language === 'typescript' || language === 'any') {
        this.disposables.push(
          ts.typescriptDefaults.addExtraLib(lib.content, path),
        );
      }
    });
  }

  /**
   * Registers a simple object-based suggestion provider.
   * - For JS/TS: Adds a d.ts library (Global effect).
   * - For others: Adds a keyword completion provider (Scoped effect).
   */
  public registerObjectSuggestions(
    language: string,
    suggestions: Record<string, any>,
  ) {
    if (!suggestions || Object.keys(suggestions).length === 0) {
      return;
    }

    const isJsTs = language === 'javascript' || language === 'typescript';

    if (isJsTs) {
      this.registerJsTsExtraLib(suggestions);
    } else {
      this.registerKeywordProvider(language, suggestions);
    }
  }

  /**
   * Registers a list of standard Monaco completion item providers.
   * Scoped to the current editor model.
   * Also registers any embedded extraLibs (for JS/TS).
   */
  public registerProviders(
    providers: {
      language: string;
      provider: languages.CompletionItemProvider & {
        extraLibs?: { content: string; filePath?: string }[];
      };
    }[],
  ) {
    providers.forEach(({ language, provider }) => {
      // 1. Register Extra Libs if present (JS/TS only)
      if (
        (language === 'javascript' || language === 'typescript') &&
        provider.extraLibs &&
        provider.extraLibs.length > 0
      ) {
        this.registerExtraLibs(language, provider.extraLibs);
      }

      // 2. Register Completion Provider
      // Wrap provider to enforce scoping
      const scopedProvider: languages.CompletionItemProvider = {
        ...provider,
        provideCompletionItems: (model, position, context, token) => {
          // Only provide items if the model matches our editor instance
          if (this.editorModelId && model.id !== this.editorModelId) {
            return { suggestions: [] };
          }
          return provider.provideCompletionItems(
            model,
            position,
            context,
            token,
          );
        },
      };

      const disposable = monaco.languages.registerCompletionItemProvider(
        language,
        scopedProvider,
      );
      this.disposables.push(disposable);
    });
  }

  /**
   * Sets the current editor model ID to scope completions.
   */
  public setContext(modelId: string) {
    this.editorModelId = modelId;
  }

  /**
   * Registers global extra lib for JS/TS from simple object suggestions.
   * Recursively generates interfaces for better property completion.
   */
  private registerJsTsExtraLib(suggestions: Record<string, any>) {
    const ts = (monaco.languages as any).typescript;
    if (!ts) return;

    let interfaces = '';
    let declarations = '';

    // Helper to check if a value is a plain object
    const isObj = (val: any) =>
      val && typeof val === 'object' && !Array.isArray(val);

    // Helper to generate interface name
    const getInterfaceName = (key: string) =>
      `${key.charAt(0).toUpperCase() + key.slice(1)}Type`;

    // Recursive function to generate type definition
    const generateType = (
      obj: Record<string, any>,
      interfaceName: string,
    ): string => {
      let content = `interface ${interfaceName} {\n`;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const val = obj[key];
          // Check for "description" field convention or use value as doc
          const valStr = typeof val === 'string' ? val : '';
          const doc =
            isObj(val) && val.description && Object.keys(val).length === 1
              ? val.description
              : valStr;

          if (doc) {
            content += `  /** ${doc} */\n`;
          }

          if (isObj(val) && !val.description) {
            // Nested object
            const nestedInterfaceName = interfaceName + getInterfaceName(key);
            interfaces += generateType(val, nestedInterfaceName);
            content += `  ${key}: ${nestedInterfaceName};\n`;
          } else {
            // Primitive or leaf
            content += `  ${key}: any;\n`;
          }
        }
      }
      content += '}\n';
      return content;
    };

    try {
      for (const key in suggestions) {
        if (Object.prototype.hasOwnProperty.call(suggestions, key)) {
          const val = suggestions[key];
          if (isObj(val)) {
            const interfaceName = getInterfaceName(key);
            interfaces += generateType(val, interfaceName);
            declarations += `/** Custom Suggestion Object */\ndeclare var ${key}: ${interfaceName};\n`;
          } else {
            const description =
              typeof val === 'string' ? val : JSON.stringify(val);
            declarations += `/** ${description} */\ndeclare var ${key}: any;\n`;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to generate extra lib content', error);
    }

    const extraLibContent = interfaces + declarations;

    if (!extraLibContent) return;

    const libPath = `ts:///${this.editorModelId || 'global'}/custom-suggestions.d.ts`;

    // Add to both JS and TS defaults
    this.disposables.push(
      ts.javascriptDefaults.addExtraLib(extraLibContent, libPath),
      ts.typescriptDefaults.addExtraLib(extraLibContent, libPath),
    );
  }

  private registerKeywordProvider(
    language: string,
    suggestions: Record<string, any>,
  ) {
    const provider: languages.CompletionItemProvider = {
      provideCompletionItems: (model, position) => {
        if (this.editorModelId && model.id !== this.editorModelId) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const items = Object.keys(suggestions).map((key) => ({
          label: key,
          kind: monaco.languages.CompletionItemKind.Variable,
          documentation: String(suggestions[key]),
          insertText: key,
          range,
          detail: 'Custom Suggestion',
        }));

        return { suggestions: items };
      },
    };

    const disposable = monaco.languages.registerCompletionItemProvider(
      language,
      provider,
    );
    this.disposables.push(disposable);
  }
}
