import QR from "../assets/qr_cs_me.png" 
import { Flex, Image } from "antd"

export default function ComQRSvcMe() {
  return(
    <Flex vertical align="center" justify="center">
      <Flex style={{width:"100%"}} justify="center">
        <p style={{fontWeight:600}}>客服</p>
        <p style={{color:"#666"}}>(企业微信)</p>
      </Flex>
      <Image src={QR} width={200} height="auto" preview={false} />
      <p>工作时间：8:00-22:00</p>
    </Flex>
  )
}
