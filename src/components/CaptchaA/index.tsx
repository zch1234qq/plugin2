import React, { useEffect, useRef } from 'react';
import './style.css';
import { TypeCaptchaRes } from '../../common/types/types';

// 声明全局类型
declare global {
  interface Window {
    AliyunCaptchaConfig: any;
    initAliyunCaptcha: any;
  }
}

// 定义组件属性类型
interface CaptchaAProps {
  callback: (captchaVerifyParam: string) => Promise<TypeCaptchaRes>;
  children: React.ReactNode;
  buttonId?: string; // 可选的按钮id，用于支持多个验证码按钮
}

/**
 * 阿里云验证码组件
 * @param props 组件属性
 * @param props.callback - 验证成功后的回调函数
 * @param props.children - 子元素，通常是触发验证码的按钮
 * @param props.buttonId - 可选的按钮id，用于支持多个验证码按钮
 */
function CaptchaA({ callback, children, buttonId = 'captcha-button' }: CaptchaAProps): JSX.Element {
  // 使用 useRef 生成唯一ID
  const captchaId = useRef<string>(`captcha-element-${Math.random().toString(36).substring(2, 9)}`);
  const captchaInstance = useRef<any>(null);
  const mounted = useRef(true);
  const getInstance = (instance: any): void => {
    if (mounted.current) {
      captchaInstance.current = instance;
    }
  }

  // 安全销毁
  const safeDestroy = () => {
    try {
      if (captchaInstance.current && typeof captchaInstance.current.destroy === 'function') {
        captchaInstance.current.destroy();
      }
    } catch (e) {
      console.error('销毁验证码实例时出错:', e);
    }
    captchaInstance.current = null;
  };

  useEffect(() => {
    mounted.current = true;
    let scriptElement: HTMLScriptElement | null = null;
    
    if (window.AliyunCaptchaConfig === undefined) {
      window.AliyunCaptchaConfig = {
        region: "cn",
        prefix: "1do636",
      };
    }

    // 动态加载验证码JS
    const script = document.createElement('script');
    script.src = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js';
    script.async = true;
    
    script.onload = () => {
      if (mounted.current && window.initAliyunCaptcha) {
        initCaptcha();
      }
    };
    
    document.body.appendChild(script);
    scriptElement = script;

    return () => {
      mounted.current = false;
      safeDestroy();
      
      // 移除脚本元素
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []);

  // 初始化验证码
  const initCaptcha = (): void => {
    if (!mounted.current) return;
    
    if (window.initAliyunCaptcha) {
      try {
        captchaInstance.current = window.initAliyunCaptcha({
          SceneId: 'fvj22tgu', // 场景ID
          prefix: '1do636',
          mode: 'popup',
          element: `#${captchaId.current}`,
          button: `#${buttonId}`, // 使用传入的按钮id
          getInstance: getInstance,
          slideStyle: {
              maxWidth: "90%",
          },
          language: 'cn', 
          captchaVerifyCallback: callback
        });
      } catch (e) {
        console.error('初始化验证码时出错:', e);
      }
    }
  };

  return (
    <div className="captcha-a">
      {/* <div id="captcha-button">点击弹出验证码A</div> */}
      <div>
        {children}
      </div>
      <div id={captchaId.current}></div>
    </div>
  );
}

export default CaptchaA;