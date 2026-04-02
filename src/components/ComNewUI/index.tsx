import { useEffect, useState } from "react";
import config from "../../common/config/config"
import { Tooltip } from "antd"

interface props{
  content:string,
  color:string,
  underline:boolean
  fontsize:number,
  showTooltip?:boolean
}

export function ComNewUI({content,color,underline=false,fontsize=14,showTooltip=false}:props){
  // 下划线样式，添加偏移效果
  const linkStyle = {
    color: color,
    fontSize: fontsize,
    textDecoration: underline ? "underline" : "none",
    textUnderlineOffset: underline ? "2px" : "unset" // 添加下划线偏移
  };
  const [open, setOpen] = useState(true);
  useEffect(() => {
    var timer = setTimeout(() => {
      setOpen(false);
    }, 3000);
    return () => {
      clearTimeout(timer);
    }
  }, []);

  if(showTooltip){
    return(
      <Tooltip open={open} title="新版已上线，更加易用，点击体验。" placement="right">
        <a target="blank" href={config.newUI} style={linkStyle}>{content}</a>
      </Tooltip>
    )
  }
  return(
    <a target="blank" href={config.newUI} style={linkStyle}>{content}</a>
  )
}