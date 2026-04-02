import { useMemo } from "react"
import { stateUserInfo } from "../../common/store/store"
import { useAtom } from "jotai"
import { Typography, theme as antTheme } from 'antd';
export default function ComAccountId(){
  const [userinfo,]=useAtom(stateUserInfo)
  const { token: antdToken } = antTheme.useToken();
  const formatAccountId=useMemo(()=>{
    //将手机号中间4位替换为*
    if(!userinfo.phone) return "--"
    return userinfo.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
  },[userinfo.phone])
  if(!userinfo.phone){
    return(<div></div>)
  }
  return(
    <div style={{
      display: "flex",
      width: "90%",
      color:"gray",
      flexDirection: "column",
      gap: "10px",
    padding: "10px 20px"
  }}>
    <Typography.Text style={{fontSize: antdToken.fontSizeLG}}>
      账户ID：{formatAccountId}
    </Typography.Text>
  </div>
  )
}