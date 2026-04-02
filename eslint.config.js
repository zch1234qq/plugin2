import { ESLint } from 'eslint';

export default [
  ESLint.config({
    ignores: ['node_modules', 'dist'], // 忽略特定目录
    files: ['src/**/*.js', 'src/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn', // 变量未使用仅警告
      'react/react-in-jsx-scope': 'off', // 关闭对 React import 的强制要求
      'no-console': 'off', // 允许使用 console
      'react/prop-types': 'off', // 关闭 PropTypes 检查
    },
  }),
];
