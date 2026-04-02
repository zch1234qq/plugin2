# Windows 构建指南

## 问题描述

在构建 Windows 安装包时，可能会遇到以下错误：
> 安装包的版本与正在运行的 Windows版本不兼容
> 请检查计算机的系统信息以了解需要 x86还是 x64

## 解决方案

这个问题是由于构建时没有指定具体的 Windows 架构（x86 或 x64）导致的。我们已经在 `package.json` 文件中添加了针对不同架构的构建脚本。

## 构建命令

### 构建 32 位 (x86) Windows 安装包

```bash
npm run build:windows:x86
```

### 构建 64 位 (x64) Windows 安装包

```bash
npm run build:windows:x64
```

### 构建签名的 32 位 (x86) Windows 安装包

```bash
npm run build:windows:x86:signed
```

### 构建签名的 64 位 (x64) Windows 安装包

```bash
npm run build:windows:x64:signed
```

## 如何选择架构

1. **32 位 (x86)**：适用于 32 位 Windows 系统或需要兼容 32 位系统的场景
2. **64 位 (x64)**：适用于 64 位 Windows 系统，性能更好

## 构建过程

1. 确保已安装所有依赖：
   ```bash
   npm install
   ```

2. 选择合适的构建命令执行构建

3. 构建完成后，安装包将生成在 `src-tauri/target/{target}/release/bundle/` 目录中

## 注意事项

- 构建 32 位 (x86) 安装包需要安装 32 位 Rust 工具链：
  ```bash
  rustup target add i686-pc-windows-msvc
  ```

- 构建 64 位 (x64) 安装包需要安装 64 位 Rust 工具链：
  ```bash
  rustup target add x86_64-pc-windows-msvc
  ```

- 签名版本需要配置签名证书，详情请参考 `src-tauri/tauri.windows.sign.local.json` 文件