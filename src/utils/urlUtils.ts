/**
 * @description 构建应用内 URL
 * @param {string} path - 路径
 * @param {Record<string, string>} params - URL 参数
 * @returns {string} 完整 URL
 */
export function buildAppUrl(path: string, params?: Record<string, string>): string {
  // 如果有这样的工具函数，可能需要修改
  // 从:
  // return `/path/to/page?param=value`;
  // 到:
  // 让路由器处理即可，不要手动构建带 # 的路径
} 