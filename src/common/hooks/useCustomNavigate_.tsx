import { useNavigate, NavigateFunction, NavigateOptions, To } from 'react-router-dom';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { stateHistory } from '../store/store';

/**
 * 自定义导航钩子，提供增强的导航功能
 * 兼容 Tauri 2 环境
 * @returns 增强的导航函数
 */
export function useCustomNavigate() {
  const navigate = useNavigate();
  const [history, setHistory] = useAtom(stateHistory);
  
  // 初始化历史记录
  useEffect(() => {
    // 如果历史为空且当前不在首页，添加当前页面到历史
    if (history.length === 0) {
      setHistory([{
        pathname: window.location.pathname,
        search: window.location.search
      }]);
    }
  }, []);

  /**
   * 增强的导航函数
   */
  const customNavigate = (to: To | number, options?: NavigateOptions) => {
    // 处理登录页面导航 - 始终使用 replace 模式
    if (typeof to === 'string' && to.includes('/login')) {
      return navigate(to, { ...options, replace: true });
    }
    
    // 处理返回操作
    if (to === -1) {
      // 检查是否有历史记录可以返回
      if (history.length > 1) {
        // 移除当前页面
        const newHistory = [...history];
        newHistory.pop();
        
        // 获取上一个页面
        const prevItem = newHistory[newHistory.length - 1];
        
        // 更新历史记录
        setHistory(newHistory);
        
        // 导航到上一页
        return navigate(prevItem.pathname + prevItem.search, { ...options, replace: true });
      } else {
        return navigate('/', { ...options, replace: true });
      }
    }
    
    // 处理普通导航
    const result = navigate(to as To, options);
    
    // 如果不是 replace 模式，添加到历史记录
    if (!options?.replace && typeof to === 'string' && to !== '/') {
      setTimeout(() => {
        const newItem = {
          pathname: window.location.pathname,
          search: window.location.search
        };
        
        // 避免重复添加
        const lastItem = history[history.length - 1];
        if (!lastItem || 
            lastItem.pathname !== newItem.pathname || 
            lastItem.search !== newItem.search) {
          setHistory([...history, newItem]);
        }
      }, 0);
    }
    
    return result;
  };

  return customNavigate as NavigateFunction;
} 