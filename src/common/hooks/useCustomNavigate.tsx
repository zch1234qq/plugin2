import { useNavigate, NavigateFunction, NavigateOptions, To } from 'react-router-dom';

/**
 * 自定义导航钩子，提供增强的导航功能
 * 适配 HashRouter 模式，不再手动维护历史记录
 * @returns 增强的导航函数
 */
export function useCustomNavigate() {
  const navigate = useNavigate();

  /**
   * 增强的导航函数
   * @param to 导航目标或返回步数
   * @param options 导航选项
   * @returns 导航结果
   */
  const customNavigate = (to: To | number, options?: NavigateOptions) => {
    // 处理登录页面导航 - 始终使用 replace 模式
    // if (typeof to === 'string' && (to.includes('/login')||to.includes('/reset'))) {
    //   return navigate(to, { ...options, replace: true });
    // }
    
    // 处理返回操作，直接使用浏览器历史的返回功能
    if (typeof to === 'number') {
      return navigate(to);
    }
    
    // 处理普通导航
    return navigate(to as To, options);
  };

  return customNavigate as NavigateFunction;
} 