import React from 'react';
import { message } from 'antd';
import { MessageInstance } from 'antd/es/message/interface';

// 直接在文件中声明
declare global {
  interface Window {
    messageApi: MessageInstance;
  }
}

/**
 * @description 消息提供者组件
 */
export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();
  
  // 将 messageApi 挂载到全局，方便在其他组件中使用
  React.useEffect(() => {
    // 创建全局访问点
    window.messageApi = messageApi;
  }, [messageApi]);
  
  return (
    <>
      {contextHolder}
      {children}
    </>
  );
}; 