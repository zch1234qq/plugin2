import { Button, FloatButton, message } from "antd";
import { Packaging } from "../common/classes.tsx";
import React, { useCallback } from "react";
import server from "../common/service/server";
import config from "../common/config/config.tsx";
import _ from "lodash";
import { RiShareForwardFill } from "react-icons/ri";

export default function ComShare({plugin,buttonShare,onClick}:{plugin:Packaging,buttonShare?:React.ReactNode ,onClick?:()=>Promise<void>}){
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片的点击事件
    let pluginTemp=_.cloneDeep(plugin)
    pluginTemp.adminid=""
    server.shareCreate(72,pluginTemp)
    .then(res=>{
      if(res.data.success){
        let code=res.data.code
        let url=`${config.webUrl}#/table?share=${code}`  
        navigator.clipboard.writeText(url)
        .then(() => {
          message.success('已复制分享链接，粘贴发送给他人吧');
        })
        .catch(() => {
          message.error('复制失败，请手动复制');
        });
      }else{
        message.error(res.data.message);
      }
    })
    .catch((error) => {
      // 检查是否是circuit breaker错误
      if (error instanceof Error && error.message && error.message.includes('circuit breaker')) {
        message.error('服务器繁忙，请稍后重试');
      } else {
        message.error('分享失败，请稍后重试');
      }
    });
  }, [plugin]);
  if(buttonShare){
    // 检查buttonShare是否为React元素，如果是则克隆并添加onClick事件
    if (React.isValidElement(buttonShare)) {
      return React.cloneElement(buttonShare, {
        onClick: (e: React.MouseEvent) => {
          // 先执行原有onClick事件（如果有）
          buttonShare.props.onClick?.(e);
          // 再执行组件的onClick事件（如果有）
          onClick?.().then(() => {
            handleShare(e);
          });
        }
      });
    }
    return buttonShare;
  }
  return(
    <FloatButton 
      type="primary" 
      icon={<RiShareForwardFill size={24} color="white" style={{marginInlineEnd:12}} />}
      style={{insetInlineEnd:12,position:"absolute",right:12,top:12}}
      onClick={(e)=>{
        onClick?.()
        .then(()=>{
          handleShare(e)
        })
      }}
    />
  )
}