import ComQRSvcMe from "./ComQRSvcMe"
import ComQRSvcYy from "./ComQRSvcYy"
import { useState } from "react"
import { useEffect } from "react"
import { Flex, Typography, theme as antTheme } from "antd" 
import config from "../common/config/config"

//根据时间动态显示不同的客服二维码
export default function ComQrSvcDynamic(){
  const [qr,setQr]=useState<React.ReactNode>(null)
  const { token } = antTheme.useToken();

  useEffect(()=>{
    const now=new Date()
    const hour=now.getHours()
    const weekday=now.getDay()
    if(hour>=8&&hour<=15&&weekday>=1&&weekday<=5){
      // setQr(<ComQRSvcYy />)
      setQr(<ComQRSvcMe />)
    }else{
      setQr(<ComQRSvcMe />)
    }
  },[])
  return(
    <Flex vertical align="center" justify="center">
      {qr}
      <Typography.Link
        href={config.customerService0}
        target="_blank"
        style={{fontSize: token.fontSize}}
      >
        点击联系微信客服(无需添加好友)
      </Typography.Link>
    </Flex>
  )
}