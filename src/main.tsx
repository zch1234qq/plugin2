import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConfigProvider, theme as antTheme } from 'antd'
import { Provider } from 'jotai'
import { globalStore } from './common/store/store'
import { ThemeProvider, useTheme } from './common/theme/themeContext'
import { MessageProvider } from './components/MessageProvider'
import React from 'react'

// 安全启用 vConsole - 只在开发环境或通过URL参数启用
// const shouldEnableVConsole = import.meta.env.DEV ||
//   new URLSearchParams(window.location.search).has('debug')

// if (shouldEnableVConsole) {
//   // 配置 vConsole，只启用必要的插件以减少安全风险
//   new VConsole({ // eslint-disable-line @typescript-eslint/no-unused-vars
//     defaultPlugins: ['system', 'network', 'element', 'storage'],
//     maxLogNumber: 1000,
//     // 禁用一些可能有安全风险的功能
//     disableLogScrolling: false,
//     theme: 'dark'
//   })
// }

function AntdThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
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
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <Provider store={globalStore}>
    <ThemeProvider>
      <AntdThemeBridge>
        <MessageProvider>
          <App />
        </MessageProvider>
      </AntdThemeBridge>
    </ThemeProvider>
  </Provider>
)
