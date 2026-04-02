/**
 * @description 全局消息工具
 */
export const showMessage = {
  /**
   * @description 显示缺少上游节点的错误消息
   * @param {string} [key] - 消息唯一标识
   */
  missingUpstreamNode: (key?: string) => {
    if (window.messageApi) {
      window.messageApi.error({
        content: '缺少上游节点，请先添加上游节点',
        key: key || `missing-upstream-node-${Date.now()}`,
        duration: 3,
      });
    }
  },
  /**
   * @description 显示成功消息
   * @param {string} content - 消息内容
   * @param {string} [key] - 消息唯一标识
   */
  success: (content: string, key?: string) => {
    if (window.messageApi) {
      window.messageApi.success({
        content,
        key: key || `success-${Date.now()}`,
        duration: 3,
      });
    }
  },
  
  /**
   * @description 显示错误消息
   * @param {string} content - 消息内容
   * @param {string} [key] - 消息唯一标识
   */
  error: (content: string, key?: string) => {
    if (window.messageApi) {
      window.messageApi.error({
        content,
        key: key || `error-${Date.now()}`,
        duration: 3,
      });
    }
  },
  
  /**
   * @description 显示警告消息
   * @param {string} content - 消息内容
   * @param {string} [key] - 消息唯一标识
   */
  warning: (content: string, key?: string) => {
    if (window.messageApi) {
      window.messageApi.warning({
        content,
        key: key || `warning-${Date.now()}`,
        duration: 3,
      });
    }
  },
  
  /**
   * @description 显示信息消息
   * @param {string} content - 消息内容
   * @param {string} [key] - 消息唯一标识
   */
  info: (content: string, key?: string) => {
    if (window.messageApi) {
      window.messageApi.info({
        content,
        key: key || `info-${Date.now()}`,
        duration: 3,
      });
    }
  }
};