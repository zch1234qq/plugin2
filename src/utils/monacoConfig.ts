import * as monaco from 'monaco-editor';
import { setup, mount, E_EDITOR_THEME } from 'monaco-python';

// 初始化Python语言支持
export async function initializePythonLanguageSupport() {
  try {
    // 使用 monaco-python 的 setup 函数初始化
    const wrapper = await setup({
      theme: E_EDITOR_THEME.LIGHT_MODERN,
      // 添加自定义代码片段
      snippets: {
        'print': {
          body: 'print(${1:value})',
          description: '打印输出到控制台'
        },
        'len': {
          body: 'len(${1:object})',
          description: '返回对象的长度'
        },
        'if': {
          body: ['if ${1:condition}:', '\t${2:pass}'],
          description: 'if条件语句'
        },
        'for': {
          body: ['for ${1:item} in ${2:iterable}:', '\t${3:pass}'],
          description: 'for循环语句'
        },
        'import numpy': {
          body: 'import numpy as np',
          description: '导入numpy模块'
        },
        'import pandas': {
          body: 'import pandas as pd',
          description: '导入pandas模块'
        },
        'import matplotlib': {
          body: 'import matplotlib.pyplot as plt',
          description: '导入matplotlib绘图模块'
        }
      }
    });
    
    return wrapper;
  } catch (error) {
    console.warn('monaco-python 初始化失败，使用基础配置:', error);
    return null;
  }
}

// 配置基础Python语言设置（作为备用方案）
export function configureBasicPythonSupport() {
  // 配置Python语言设置
  monaco.languages.setLanguageConfiguration('python', {
    comments: {
      lineComment: '#',
      blockComment: ['\'\'\'', '\'\'\'']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: '\'', close: '\'', notIn: ['string', 'comment'] },
      { open: '"""', close: '"""', notIn: ['string'] },
      { open: '\'\'\'', close: '\'\'\'', notIn: ['string'] }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '\'', close: '\'' }
    ],
    folding: {
      markers: {
        start: new RegExp('^\\s*#\\s*region\\b'),
        end: new RegExp('^\\s*#\\s*endregion\\b')
      }
    },
    indentationRules: {
      increaseIndentPattern: new RegExp('^\\s*(class|def|elif|else|except|finally|for|if|try|with|while).*:\\s*$'),
      decreaseIndentPattern: new RegExp('^\\s*(elif|else|except|finally)\\b.*$')
    }
  });

  // 注册自定义代码补全提供者
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: 'print',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'print(${1:value})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '打印输出到控制台',
          documentation: '将指定的值打印到标准输出'
        },
        {
          label: 'len',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'len(${1:object})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '返回对象的长度',
          documentation: '返回对象（字符串、列表、元组等）的长度'
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'if ${1:condition}:\n\t${2:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'if条件语句',
          documentation: '条件控制语句'
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'for循环语句',
          documentation: '遍历可迭代对象的循环语句'
        },
        {
          label: 'import numpy',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: 'import numpy as np',
          detail: '导入numpy模块',
          documentation: '导入数值计算库numpy，并设置别名为np'
        },
        {
          label: 'import pandas',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: 'import pandas as pd',
          detail: '导入pandas模块',
          documentation: '导入数据分析库pandas，并设置别名为pd'
        },
        {
          label: 'import matplotlib',
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: 'import matplotlib.pyplot as plt',
          detail: '导入matplotlib绘图模块',
          documentation: '导入绘图库matplotlib，并设置pyplot别名为plt'
        }
      ];
      
      return { suggestions };
    }
  });
}

// 获取增强的编辑器选项
export function getPythonEditorOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    // 代码提示配置
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    // 代码格式化
    formatOnType: true,
    formatOnPaste: true,
    // 参数提示
    parameterHints: {
      enabled: true
    },
    // 代码折叠
    folding: true,
    foldingStrategy: 'indentation',
    // 自动缩进
    autoIndent: 'full',
    // 括号匹配
    matchBrackets: 'always',
    // 智能提示
    snippetSuggestions: 'inline',
    // 代码导航
    links: true,
    // 括号着色
    bracketPairColorization: {
      enabled: true
    }
  };
}

// 获取 JavaScript 编辑器选项（Monaco 内置支持 JS/TS）
export function getJavaScriptEditorOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: "line",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    formatOnType: true,
    formatOnPaste: true,
    parameterHints: {
      enabled: true,
    },
    folding: true,
    // JS/TS 的 foldingStrategy 更适合 indentation
    foldingStrategy: "indentation",
    autoIndent: "full",
    matchBrackets: "always",
    snippetSuggestions: "inline",
    links: true,
    bracketPairColorization: {
      enabled: true,
    },
  };
}