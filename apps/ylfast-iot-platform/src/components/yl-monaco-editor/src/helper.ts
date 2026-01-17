import { monaco } from './monaco';

/**
 * 初始化语法提示配置
 * 使用新版建议的方式访问语言 defaults
 */
export function initSyntaxPrompt() {
  // 现代版本中，typescript 命名空间通常直接挂载在 monaco.languages 下，
  // 但为了避免过时警告，我们可以通过类型断言或直接访问相应的提供者
  const ts = (monaco.languages as any).typescript;
  if (ts) {
    // JS 配置
    ts.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    ts.javascriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      checkJs: false, // 设为 false 以避免大量外部库未定义的错误
    });

    // TS 配置
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      module: ts.ModuleKind.ESNext,
      lib: ['esnext'],
    });
  }

  // 同理可以配置 JSON/CSS 等
  const json = (monaco.languages as any).json;
  if (json) {
    json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [],
    });
  }
}
