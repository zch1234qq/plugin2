const fs = require('fs');
const path = require('path');

// 确保 public 目录存在
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 复制 pdf.worker.mjs 到 public 目录
const workerSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.mjs');
const workerDest = path.resolve(publicDir, 'pdf.worker.mjs');

try {
  fs.copyFileSync(workerSrc, workerDest);
  console.log('成功复制 PDF Worker 文件到 public 目录');
} catch (error) {
  console.error('复制 PDF Worker 文件时出错:', error);
  process.exit(1);
} 