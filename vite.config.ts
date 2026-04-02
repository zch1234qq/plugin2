import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babel from '@rollup/plugin-babel';
import path from 'path';

export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'pdfjs-dist'],
  },
  server: {
    host: '0.0.0.0', // 监听所有 IP 地址
    port: 5173,      // 指定端口号（可选）
    allowedHosts: ['localhost', '127.0.0.1',"worker0"],
  },
  plugins: [
    react(),

    babel({
      babelHelpers: 'bundled',
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  build: {
    minify: 'terser', // 启用代码压缩
    sourcemap: false, // 可选，生成 sourcemap
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        // 忽略 eval 警告
        pure_funcs: ['eval']
      },
      format: {
        // 禁用注释输出
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd'],
          pdfjs: ['pdfjs-dist']
        }
      }
    }
  },
});
