# Antd 官方标准字号治理方案

## 目标

在现有 React + Ant Design v5 项目中，尽量基于 Antd 官方标准能力，统一管理字号，减少业务组件中的 `fontSize` 硬编码，避免额外自定义一套复杂的字号系统。

## 现状判断

- 项目已经存在全局主题入口：`src/main.tsx`
- 当前全局仅配置了 `token.fontSize`
- 项目中大量业务组件直接写死了 `fontSize`
- `Typography` 组件使用较少
- 部分 Antd 组件已经在使用 `size="small|middle|large"`，说明可以继续沿用官方推荐路径

## 主方案

### 1. 全局通过 `ConfigProvider` 统一基础字号

主入口统一放在 `src/main.tsx`，使用 Antd v5 官方主题能力：

- `theme.token.fontSize`
- `theme.token.fontSizeSM`
- `theme.token.fontSizeLG`
- `theme.cssVar`
- 必要时使用 `theme.components`

推荐结构：

```tsx
<ConfigProvider
  theme={{
    cssVar: true,
    algorithm: theme === 'dark'
      ? antTheme.darkAlgorithm
      : antTheme.defaultAlgorithm,
    token: {
      borderRadius: 3,
      fontSize: 14,
      fontSizeSM: 12,
      fontSizeLG: 16,
    },
    components: {
      Button: {
        contentFontSize: 14,
        contentFontSizeSM: 12,
        contentFontSizeLG: 16,
      },
      Input: {},
      Select: {},
      Table: {},
      Menu: {},
      Modal: {},
      Form: {},
    },
  }}
>
```

说明：

- 建议基础字号回归 Antd 默认视觉基线，优先采用 `14`
- 开启 `cssVar: true`，符合 Antd v5 官方推荐
- `components` 只在全局视觉确实不协调时再补，不建议一开始过度配置

## 改造优先级

### 2. 第一优先：文本展示优先改为 `Typography`

最符合 Antd 官方标准的做法，是将大量文本展示从原始标签和内联字号改为：

- `Typography.Title`
- `Typography.Text`
- `Typography.Paragraph`

适用场景：

- 页面标题
- 区块标题
- 普通说明文字
- 次级说明文字
- 帮助提示文案

替换原则：

- 标题使用 `Typography.Title`
- 普通文本使用 `Typography.Text`
- 长说明使用 `Typography.Paragraph`
- 次级说明优先使用 `type="secondary"`

### 3. 第二优先：Antd 组件优先使用 `size`

适用组件：

- `Button`
- `Input`
- `Select`
- `Checkbox`
- `Radio`
- `Form`
- `Modal`
- `Table`
- `Tag`

原则：

- 能用 `size="small|middle|large"` 的，优先使用 `size`
- 不要给这些组件直接写 `style={{ fontSize: ... }}`
- 因为官方 `size` 会联动高度、内边距和字号，整体更稳定

### 4. 第三优先：自定义容器文本依附 Antd token

对于不是 Antd 原生文本组件的区域，例如：

- node 卡片
- 自定义上传区
- 自定义面板头
- ReactFlow 节点内部文本
- 非 Antd 原生文本容器

建议：

- 使用 `theme.useToken()`
- 优先读取 `token.fontSizeSM`
- 优先读取 `token.fontSize`
- 优先读取 `token.fontSizeLG`
- 颜色使用 `token.colorText`、`token.colorTextSecondary`

这样仍然属于“依附 Antd 官方 token”，而不是独立发明一套新的项目字体系统。

### 5. 第四优先：图标尺寸与文字字号分离

项目里有不少 `fontSize` 实际是用于图标而不是文本。

建议明确区分：

- 文字大小交给 `Typography`、`theme token`、`size`
- 图标大小单独处理

不要把图标尺寸治理和文字字号治理混在一起。

## 建议的文件改造顺序

### 第一批

- `src/main.tsx`
- `src/pages/Home.tsx`
- `src/pages/Login.tsx`
- `src/pages/setting/page.tsx`
- `src/pages/plansplit_/page.tsx`

原因：

- 这些页面文本层级清晰
- 更容易直接切换到 `Typography`
- 更接近标准 Antd 页面写法

### 第二批

- `src/components/ComCard.tsx`
- `src/components/ComCsvTable.tsx`
- `src/components/TokenCounter.tsx`
- `src/components/ComActivation.tsx`

原因：

- 都是通用 UI 组件
- 适合优先消除裸写字号

### 第三批

- `src/components/node/**`

原因：

- 自定义程度最高
- 不适合一开始做全量重构
- 建议按“文本先改、图标后分离、特殊布局最后处理”的顺序逐步收敛

## 代码规范建议

建议后续在团队内明确以下约束：

1. 页面文本默认优先使用 `Typography`
2. Antd 组件优先使用 `size`
3. 自定义文本优先通过 `theme.useToken()` 读取官方 token
4. 禁止新增裸写 `fontSize: '12px'` 这类样式
5. 图标尺寸不纳入文字字号体系

## 最终结论

如果目标是“以官方标准方案为主，避免自定义”，则最优路线是：

- 全局基线：`ConfigProvider.theme.token`
- 文本语义：`Typography`
- 组件大小：`size`
- 局部微调：`theme.components`
- 自定义区域补充：`theme.useToken()`

不建议将“独立自定义字号体系文件”作为主方案。

## 官方参考文档

- [Customize Theme](https://ant.design/docs/react/customize-theme/)
- [CSS Variables](https://ant.design/docs/react/css-variables/)
- [Typography](https://ant.design/components/typography)
