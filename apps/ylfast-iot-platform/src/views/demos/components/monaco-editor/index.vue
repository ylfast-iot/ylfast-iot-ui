<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card } from 'ant-design-vue';

import {
  getRegisteredScopes,
  registerEditorScope,
  YlMonacoEditor,
} from '#/components/yl-monaco-editor';

import {
  jsonKeyProvider,
  pythonSnippetProvider,
  sqlKeywordProvider,
  universalParserProviders,
} from './providers';

const code = ref(`// Try typing 'parser.' to see chainable methods
parser.fixed(4)
  .handler(function(buffer, parser) {
    var len = buffer.getInt(0);
    parser.fixed(len).result(buffer);
  })
  .handler(function(buffer, parser) {
    parser.result(buffer).complete();
  });
`);

const language = ref('javascript');
const theme = ref<'auto' | 'hc-black' | 'vs' | 'vs-dark'>('auto');
const readOnly = ref(false);
const currentScope = ref('tcp-script-parser'); // 当前演示的作用域
const registeredScopes = ref<string[]>([]);

// 模拟系统初始化：注册 Scope

// 在实际项目中，这可以在 main.ts 或 业务模块的 setup 中执行一次

function registerScopes() {
  // 1. 注册协议脚本作用域 (包含 JS/Python/Java 的 Parser 支持)

  registerEditorScope('protocol-script', [...universalParserProviders]);

  // 2. 注册 SQL 查询作用域

  registerEditorScope('sql-query', [sqlKeywordProvider]);

  // 3. 注册通用 Python 脚本作用域

  registerEditorScope('python-script', [pythonSnippetProvider]);

  // 4. 注册 JSON 配置作用域

  registerEditorScope('json-config', [jsonKeyProvider]);
}

// 立即执行注册，确保子组件挂载时能读取到配置

registerScopes();

onMounted(() => {
  registeredScopes.value = getRegisteredScopes();
});

function handleMount(_editor: any) {}

function handleLanguageChange(newLang: string) {
  // 根据语言自动切换一些 demo 代码，方便测试
  switch (newLang) {
    case 'java': {
      code.value = '// Try typing "parser." to see Java method signatures\n';
      currentScope.value = 'protocol-script';

      break;
    }
    case 'javascript': {
      code.value =
        '// Try typing "parser." to see chainable methods\nparser.fixed(4).handler(function(buf, p) {\n  p.result(buf).complete();\n});';
      currentScope.value = 'protocol-script';

      break;
    }
    case 'json': {
      code.value =
        '{\n\t// Try typing "deviceId" inside "device" object\n\t"device": {\n\t\t\n\t}\n}';
      currentScope.value = 'json-config';

      break;
    }
    case 'python': {
      code.value =
        '# Try typing "parser." to see methods\n# Or "def", "ifmain" for snippets\n';
      currentScope.value = 'protocol-script'; // 默认用协议脚本

      break;
    }
    case 'sql': {
      code.value = '-- Try typing "sel" or "whe" (Uppercase suggestion)\n';
      currentScope.value = 'sql-query'; // 自动切换 Scope

      break;
    }
    // No default
  }
}
</script>

<template>
  <Page title="Monaco Editor 演示">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="控制面板" class="mb-4">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span class="w-20">语言:</span>
            <select
              v-model="language"
              class="rounded border border-border p-1"
              @change="
                handleLanguageChange(($event.target as HTMLSelectElement).value)
              "
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="sql">SQL (Ext)</option>
              <option value="python">Python (Ext)</option>
              <option value="json">JSON (Ext)</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-20">Scope:</span>
            <select
              v-model="currentScope"
              class="rounded border border-border p-1"
            >
              <option value="">(None)</option>
              <option
                v-for="scope in registeredScopes"
                :key="scope"
                :value="scope"
              >
                {{ scope }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-20">主题:</span>
            <select v-model="theme" class="rounded border border-border p-1">
              <option value="auto">跟随系统 (auto)</option>
              <option value="vs">Light (vs)</option>
              <option value="vs-dark">Dark (vs-dark)</option>
              <option value="hc-black">High Contrast (hc-black)</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-20">只读:</span>
            <input type="checkbox" v-model="readOnly" />
          </div>

          <div class="mt-4">
            <p class="font-bold">JS/TS 对象提示 (输入 context. 触发):</p>

            <div class="mt-2 rounded bg-accent p-2 text-xs opacity-70">
              已注入: context, utils
            </div>
          </div>

          <div class="mt-4">
            <p class="font-bold">
              当前激活的 Scope: {{ currentScope || 'None' }}
            </p>

            <p class="text-xs text-muted-foreground">
              切换上方 Scope 或语言下拉框可自动变更。
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="编辑器实例"
        class="h-[500px]"
        :body-style="{ height: '400px' }"
      >
        <YlMonacoEditor
          v-model="code"
          :language="language"
          :theme="theme"
          :read-only="readOnly"
          :scope="currentScope"
          height="100%"
          @editor-mounted="handleMount"
        />
      </Card>

      <Card title="当前代码值" class="col-span-full">
        <pre class="max-h-60 overflow-auto rounded bg-accent p-4 text-sm">
          {{ code }}
        </pre>
      </Card>
    </div>
  </Page>
</template>
