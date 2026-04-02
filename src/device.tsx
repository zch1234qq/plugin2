export const isMobile = () => {
  if (typeof window === 'undefined') return false
  const userAgent = navigator.userAgent.toLowerCase()
  return /mobile|android|iphone|ipad|phone|micromessenger|alipay|ios|ipod|mini/i.test(userAgent)
}

/**
 * 检测是否在支付宝小程序环境中
 * 支付宝小程序环境特征：
 * 1. 存在 window.my 对象
 * 2. userAgent 包含 alipay
 * 3. 缺少某些浏览器标准API
 */
export const isAlipayMiniProgram = () => {
  if (typeof window === 'undefined') return false

  // 检查是否存在支付宝小程序的全局对象
  if (window.my && typeof window.my === 'object') {
    return true
  }

  // 检查 userAgent
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('alipay') && userAgent.includes('miniprogram')) {
    return true
  }

  // 检查是否缺少浏览器标准API（支付宝小程序环境）
  if (typeof window.open === 'undefined' || window.open === null) {
    return true
  }

  return false
}