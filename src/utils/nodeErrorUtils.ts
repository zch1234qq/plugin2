/**
 * @description 节点错误消息工具
 */
import config from '../common/config/config.tsx';

/**
 * @description 显示缺少上游节点的错误消息
 * @param {string} convertLabel - 节点标签
 * @param {boolean} showDebug - 是否显示调试模式
 * @param {Function} setDebug - 设置调试状态的函数
 * @param {string} [messageKey] - 消息唯一标识，默认为config.MESSAGE_KEY
 */
export function showMissingUpstreamNodeError(
  convertLabel: string,
  showDebug: boolean,
  setDebug: (debugState: any) => void,
  messageKey?: string
): void {
  const msg = `"${convertLabel}"缺少上游节点`;
  
  if (showDebug) {
    setDebug({
      success: false,
      data: msg
    });
  } else {
    if (window.messageApi) {
      window.messageApi.error({
        content: msg,
        key: messageKey || config.MESSAGE_KEY
      });
    }
  }
}

/**
 * @description 显示通用节点错误消息
 * @param {string} message - 错误消息内容
 * @param {boolean} showDebug - 是否显示调试模式
 * @param {Function} setDebug - 设置调试状态的函数
 * @param {string} [messageKey] - 消息唯一标识，默认为config.ERROR_KEY
 */
export function showNodeError(
  message: string,
  showDebug: boolean,
  setDebug: (debugState: any) => void,
  messageKey?: string
): void {
  if (showDebug) {
    setDebug({
      success: false,
      data: message
    });
  } else {
    if (window.messageApi) {
      window.messageApi.error({
        content: message,
        key: messageKey || config.ERROR_KEY
      });
    }
  }
}

/**
 * @description 显示节点成功消息
 * @param {string} message - 成功消息内容
 * @param {boolean} showDebug - 是否显示调试模式
 * @param {Function} setDebug - 设置调试状态的函数
 * @param {string} [messageKey] - 消息唯一标识，默认为config.MESSAGE_KEY
 */
export function showNodeSuccess(
  message: string,
  showDebug: boolean,
  setDebug: (debugState: any) => void,
  messageKey?: string
): void {
  if (showDebug) {
    setDebug({
      success: true,
      data: message
    });
  } else {
    if (window.messageApi) {
      window.messageApi.info({
        content: message,
        key: messageKey || config.MESSAGE_KEY
      });
    }
  }
}

export default {
  showMissingUpstreamNodeError,
  showNodeError,
  showNodeSuccess
};