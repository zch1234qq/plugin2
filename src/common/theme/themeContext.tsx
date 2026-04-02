import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAtom } from 'jotai';
import { stateSystemPrefersDark, stateThemeMode, actualThemeState } from '../store/store';
import Storage from '../Storage';

/**
 * 主题上下文类型定义
 * @typedef {Object} ThemeContextType
 * @property {'light'|'dark'} theme - 当前主题
 * @property {'light'|'dark'|'system'} themeMode - 主题模式设置
 * @property {(mode: 'light'|'dark'|'system') => void} setThemeMode - 设置主题模式
 */
interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题提供器组件 - 支持手动切换或跟随系统
 * @param {Object} props - 组件属性
 * @param {ReactNode} props.children - 子组件
 */
export const ThemeProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // 使用jotai状态
  const [themeMode, setThemeMode] = useAtom(stateThemeMode);
  const [theme] = useAtom(actualThemeState);
  const [, setSystemPrefersDark] = useAtom(stateSystemPrefersDark);
  
  // 初始化主题模式
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await Storage.getItemAsync("themeMode") as 'light' | 'dark' | 'system' | null;
        if (savedThemeMode) {
          setThemeMode(savedThemeMode);
        }
      } catch (error) {
        console.error("加载主题设置失败:", error);
      }
    };
    
    loadThemeMode();
  }, []);

  // 监听系统主题变化 (仅当模式为"system"时需要)
  useEffect(() => {
    if (themeMode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    
    // 初始化一次，确保无需刷新即可正确跟随系统
    setSystemPrefersDark(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setSystemPrefersDark, themeMode]);

  // 应用主题到文档
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 使用主题的自定义Hook
 * @returns {ThemeContextType} 主题上下文
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme必须在ThemeProvider内部使用');
  }
  return context;
}; 