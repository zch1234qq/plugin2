const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 读取构建后的 JS 文件
const filePath = path.join(__dirname, 'build', 'static', 'js', 'main.xxxx.js');
const code = fs.readFileSync(filePath, 'utf8');

// 应用混淆
const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.7,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: true,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: true,
  rotateStringArray: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}).getObfuscatedCode();

// 写回文件
fs.writeFileSync(filePath, obfuscatedCode); 