import React from "react"
import config from "../../common/config/config"
import { Tooltip } from "antd"
import { isAlipayMiniProgram } from "../../device"

interface props{
  content:string,
  color:string,
  underline:boolean
  fontsize:number,
  showTooltip?:boolean
}

export function ComConnectSvc0({content,color,underline=false,fontsize=14,showTooltip=false}:props){
  const showJumpErrorToast = (msg: string) => {
    // 优先使用小程序原生 toast（避免在小程序里 messageApi 不存在导致静默失败）
    if (typeof window !== 'undefined') {
      if (window.my?.showToast) {
        window.my.showToast({ content: msg, type: 'fail', duration: 2500 })
        return
      }
      if (window.wx?.showToast) {
        window.wx.showToast({ title: msg, icon: 'none', duration: 2500 })
        return
      }
      if (window.messageApi?.error) {
        window.messageApi.error(msg)
        return
      }
    }
    // 最后兜底
    alert(msg)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isAlipayMiniProgram()) {
      e.preventDefault()
      const msg = '受小程序环境限制，无法跳转'
      console.error(msg)
      showJumpErrorToast(msg)
      return false
    }

    // 某些容器环境（含部分小程序 WebView）缺少跳转底层能力：避免点击后无反馈
    if (typeof window !== 'undefined' && (typeof window.open !== 'function' || window.open === null)) {
      e.preventDefault()
      showJumpErrorToast('当前环境不支持打开外部链接，请在浏览器中打开后重试')
      return false
    }
  }

  if(showTooltip){
    return(
      <Tooltip title="点击联系人工客服">
        <a
          target="blank"
          href={config.customerService0}
          onClick={handleClick}
          style={{color:color,textDecoration:underline?"underline":"none",fontSize:fontsize}}
        >
          {content}
        </a>
      </Tooltip>
    )
  }
  return(
    <a
      target="blank"
      href={config.customerService0}
      onClick={handleClick}
      style={{color:color,textDecoration:underline?"underline":"none",fontSize:fontsize}}
    >
      {content}
    </a>
  )
}