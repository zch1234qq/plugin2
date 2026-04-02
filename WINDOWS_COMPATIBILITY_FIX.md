# Windows 安装包兼容性问题解决方案

## 问题描述

在构建 Windows 安装包时，可能会遇到以下错误：
> 安装包的版本与正在运行的 Windows版本不兼容
> 请检查计算机的系统信息以了解需要 x86还是 x64

## 根本原因

这个问题是由于构建时没有指定具体的 Windows 架构（x86 或 x64）导致的。Tauri 默认构建的安装包可能与目标系统的架构不匹配。

## 解决方案

### 步骤 1：安装必要的 Rust 工具链

首先，确保安装了针对不同架构的 Rust 工具链：

```bash
# 安装 32 位 (x86) 工具链
rustup target add i686-pc-windows-msvc

# 安装 64 位 (x64) 工具链
rustup target add x86_64-pc-windows-msvc
```

### 步骤 2：使用架构特定的构建命令

我们已经在 `package.json` 文件中添加了针对不同架构的构建脚本：

#### 构建 32 位 (x86) Windows 安装包

```bash
npm run build:windows:x86
```

#### 构建 64 位 (x64) Windows 安装包

```bash
npm run build:windows:x64
```

#### 构建签名的 32 位 (x86) Windows 安装包

```bash
npm run build:windows:x86:signed
```

#### 构建签名的 64 位 (x64) Windows 安装包

```bash
npm run build:windows:x64:signed
```

### 步骤 3：选择合适的架构

- **32 位 (x86)**：适用于 32 位 Windows 系统或需要兼容 32 位系统的场景
- **64 位 (x64)**：适用于 64 位 Windows 系统，性能更好

### 步骤 4：构建过程

1. 确保已安装所有依赖：
   ```bash
   npm install
   ```

2. 选择合适的构建命令执行构建

3. 构建完成后，安装包将生成在 `src-tauri/target/{target}/release/bundle/` 目录中

## 常见问题解决

### 构建失败，显示找不到 std crate 或其他核心依赖

这可能是由于 Rust 工具链配置问题导致的。尝试以下解决方案：

1. 更新 Rust 工具链：
   ```bash
   rustup update
   ```

2. 清理 cargo 缓存：
   ```bash
   cargo clean --manifest-path src-tauri/Cargo.toml
   ```

3. 重新安装依赖：
   ```bash
   npm install
   ```

4. 再次尝试构建

### 如何检查系统架构

在 Windows 系统中，可以通过以下步骤检查系统架构：

1. 右键点击「此电脑」，选择「属性」
2. 在「系统」窗口中查看「系统类型」
3. 将会显示「64 位操作系统，基于 x64 的处理器」或「32 位操作系统，基于 x86 的处理器」

## 构建输出目录

- 32 位 (x86) 安装包：`src-tauri/target/i686-pc-windows-msvc/release/bundle/`
- 64 位 (x64) 安装包：`src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`

## 注意事项

- 构建 32 位 (x86) 安装包需要安装 32 位 Rust 工具链
- 构建 64 位 (x64) 安装包需要安装 64 位 Rust 工具链
- 签名版本需要配置签名证书，详情请参考 `src-tauri/tauri.windows.sign.local.json` 文件
- 对于大型应用，构建过程可能需要较长时间，请耐心等待

## 总结

通过使用针对特定架构的构建命令，您可以构建与目标 Windows 系统兼容的安装包，从而解决「安装包的版本与正在运行的 Windows版本不兼容」的问题。