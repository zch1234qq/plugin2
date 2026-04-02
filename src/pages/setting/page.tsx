import { Button, Flex, Typography, theme as antTheme } from "antd";
import LoadingCus from "../../components/loadingCus";
import * as Icon from '@ant-design/icons'
import { useAtom } from "jotai";
import { tokenState,stateUserInfo } from "../../common/store/store";
import "./style.css"
import Storage from "../../common/Storage";
import ComAuthCheck from "../../components/ComAuthCheck";
import { useState, useMemo } from "react";
import { useCustomNavigate } from "../../common/hooks/useCustomNavigate";
import ComBack from "../../components/ComBack";
import TokenCounter from "../../components/TokenCounter";
import ComCusSvc from "../../components/ComCusSvc";
import ComActivation from "../../components/ComActivation";
import _ from "lodash";
import ComModalinvite from "../../components/ComModalinvite";
import ComAccountId from "../../components/ComAccountId";

function RightArrow() {
  return (
    <Icon.RightOutlined style={{
      position: "absolute",
      right: 0,
      padding: 12
    }} />
  )
}

export default function Setting({}) {
  const [next,setNext]=useState("/setting")
  return (
    <ComAuthCheck next={next}>
      <ComCusSvc></ComCusSvc>
      <SettingContent setNext={setNext} />
    </ComAuthCheck>
  )
}

function SettingContent({setNext}:{setNext:Function}) {
  const [,setToken]=useAtom(tokenState)
  const { token } = antTheme.useToken();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showModalInvite,setShowModalInvite]=useState(false)

  return(
    <LoadingCus isLoading={false}>
      <ComBack/>
      <ComAccountId/>
      <Flex vertical gap="small" className="container">
        <Flex justify="space-between" align="center">
          <TokenCounter/>
        </Flex>
        {/* <Flex gap="small" justify="space-between" align="center">
          <div className="countToken-title">当前版本：{userinfo.plan.name}</div>
          <div>过期时间：{formatUTCToLocalTime}</div>
        </Flex> */}
        <ComActivation />
        <ButtonJump color="blue" to="/plan" title="购买资源点"></ButtonJump>
        <ButtonJump to="/privacy" title="隐私政策"></ButtonJump>
        <ButtonJump to="/service" title="用户协议"></ButtonJump>
        {/* <ButtonOnClick type="primary" title="邀请好友" onClick={()=>{
          setShowModalInvite(true)
        }}></ButtonOnClick> */}
        <ButtonJump to="/localmodel" title="接入本地AI"></ButtonJump>
        <Button
          className="bt"
          size="large" 
          style={{color: token.colorText}}
          onClick={()=>{
            window.open("https://space.bilibili.com/678279553?spm_id_from=333.1007.0.0", "_blank")
          }}>B站主页
          <RightArrow />
          </Button>
        <Button 
          loading={logoutLoading}
          className="bt"
          size="large" 
          onClick={async ()=>{
            setLogoutLoading(true)
            await Storage.clearAll();
            localStorage.clear()
            setToken("");
            setNext("/");
            window.messageApi.success({
              content:"退出成功",
              key:"success"
            });
            setLogoutLoading(false)
          }}
        >退出登录</Button>
      </Flex>
      <ComModalinvite open={showModalInvite} onCancel={()=>{
        setShowModalInvite(false)
      }}></ComModalinvite>
    </LoadingCus> 
  )
}

type Argv={
  title:string,
  to:string,
  type?:any,
  url?:boolean,
  color?:string
}

function ButtonJump({title,to,type="default",url=false,color="black"}:Argv){
  const navigate=useCustomNavigate()
  const { token } = antTheme.useToken();
  if(to==""){
    return<></>
  }

  const resolvedColor =
    color === "blue"
      ? token.colorPrimary
      : color === "black"
        ? token.colorText
        : color;

  return(
    <Button 
      type={type} 
      size="large"
      className="bt"
      style={{color: resolvedColor}}
      onClick={()=>{
        if(url){
          window.open(to, "_blank")
        }else{
          navigate(to)
        }
      }}
    >
      {title}
      <RightArrow />
    </Button>
  )
}
