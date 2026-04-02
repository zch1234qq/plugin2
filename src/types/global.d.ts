import { MessageInstance } from 'antd/es/message/interface';

declare global {
  interface Window {
    messageApi?: MessageInstance;
    my?: {
      showToast?: (args: { content: string; type?: 'success' | 'fail' | 'exception' | 'none'; duration?: number }) => void;
    };
    wx?: {
      showToast?: (args: { title: string; icon?: 'success' | 'error' | 'loading' | 'none'; duration?: number }) => void;
    };
    __wxjs_environment?: string;
  }
}

export {}