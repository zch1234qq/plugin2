import {  Button, Drawer, Flex, FloatButton, Form, Input, Modal, Typography } from "antd"
import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import './globals.css'
import server from "../common/service/server.tsx"
import { Link, useSearchParams } from "react-router-dom";
import { LogError } from "../common/Http.tsx";
import { agreeState, passwordState, phoneState, stateCountToken, stateCreated, stateUserInfo, tokenState } from "../common/store/store";
import { useAtom } from "jotai";
import { ComProtocol } from "../components/protocol";
import { DataLog, EnumProtocls, RecordPlugins, TypeCaptchaRes, TypeRes, TypeUserInfo } from "../common/types/types.tsx";
import ComCusSvc from "../components/ComCusSvc.tsx";
import CaptchaA from "../components/CaptchaA/index.tsx";
import { useCustomNavigate } from "../common/hooks/useCustomNavigate";
import { LeftOutlined } from "@ant-design/icons";
import { Packaging } from "../common/classes.tsx";

const Msgs={
  msgFormatPassword:"格式错误，密码应由6-12位数字和字母组成"
}
export default function Login() {
  const [,setToken]=useAtom(tokenState)
  const [,setCountToken]=useAtom(stateCountToken)
  const [searchParams] = useSearchParams();
  const navigate = useCustomNavigate()
  const [agree,setArgree]=useAtom(agreeState)
  const [showProtocol,setShowProtocol]=useState(false)
  const [mode,setMode]=useState(0)
  const [code,setCode]=useState("")
  const [phone,setPhone]=useAtom(phoneState)
  const [password,setPassword]=useAtom(passwordState)
  const [disSmsSend,setDisSmsSend]=useState(false)
  const [,setUserInfo]=useAtom(stateUserInfo)
  const [,setCreated]=useAtom(stateCreated)
  const [ldSms,setLdSms]=useState(false)
  const [ldLogup,setLdLogup]=useState(false)
  const [ldLogin,setLdLogin]=useState(false)
  const [params]=useSearchParams()
  const refInvitecode=useRef("")

  useEffect(()=>{
    let invitecode=params.get("invitecode")
    if(invitecode){
      refInvitecode.current=invitecode
    }
  },[params])

  useEffect(() => {
    if (!(showProtocol && mode === 0 && agree === "0")) {
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      if (!ldLogup) {
        setArgree("1")
      }
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
    }
  }, [agree, ldLogup, mode, setArgree, showProtocol])
  /**
   * 判断是否为中国移动号码
   */
  async function logup() {
    setLdLogup(true)
    server.logup(phone,password,code,refInvitecode.current)
    .then(async res=>{
      await afterProcess(res)
    })
    .catch(error=>{
      LogError(error)
    })
  }
  async function afterProcess(res:TypeRes<DataLog>) {
    const data=res.data
    if(data.success){
      let user:TypeUserInfo=data.user
      if(user.created==null){
        user.created=[]
      }
      window.messageApi.success(data.message)
      setToken(data.token)
      setCountToken(data.token_count)
      setUserInfo(user)
      let rdCreated:RecordPlugins={} as RecordPlugins
      if(data.created!=undefined){
        if(data.created.length!=data.user.created.length){
          for(let i=0;i<data.user.created.length;i++){
            let id=String(data.user.created[i])
            let {data:_data}=await server.read(id)
            if(_data.success){
              rdCreated[id]=_data.plugin
            }
          }
        }
      }
      data.created?.forEach((item)=>{
        if(item.license==undefined){
          item.license=0
        }
        rdCreated[Packaging.GetIdStrStatic(item)]=item
      })
      setCreated(rdCreated)
      handleLoginSuccess()
    }else{
      setArgree("0")
      window.messageApi.error(data.message)
    }
  }

  async function login(){
    setLdLogin(true)
    server.login(phone,password)
    .then(async res=>{
      if(res.data.success){
        await afterProcess(res)
      }else{
        window.messageApi.error(res.data.message)
        setLdLogin(false)
        setArgree("0")
        setShowProtocol(false)
      }
    })
    .catch(error=>{
      LogError(error)
    })
  }

  const checkAgree=useCallback((mode:number)=>{
    setShowProtocol(true)
    setMode(mode)
  },[])

  const hideProtocol = () => {
    // 先移除验证码相关状态
    setLdSms(false);
    setDisSmsSend(false);
    setCode("");
    
    // 延迟后再关闭抽屉，给验证码组件时间清理
    setTimeout(() => {
      setShowProtocol(false);
    }, 100);
  };
  const formatError=useMemo(()=>{
    if(password==""||phone==""||phone.length!=11){
      return true
    }
    if(password.length<6||password.length>12){
      return true
    }
    return false
  },[phone,password])

  const canLogin = useMemo(() => {
    return password.length >= 6 && phone.length === 11
  }, [password.length, phone.length])

  
  async function smsSend (captchaVerifyParam: string):Promise<TypeCaptchaRes>{
    setLdSms(true)
    setDisSmsSend(true)
    let result=false
    await server.SendSms(phone,captchaVerifyParam)
    .then(res=>{
      let data=res.data
      if(data.success){
        window.messageApi.success(data.message)
      }else{
        window.messageApi.error(data.message)
      }
      result=data.success_verify_cap
    })
    .catch(error=>{
      LogError(error)
    })
    .finally(()=>{  
      setLdSms(false)
    })
    if(result){
      return {
        captchaResult: true,
        bizResult: true
      };
    }else{
      return {
        captchaResult: false,
        bizResult: false
      };
    }
  }

  const handleLoginSuccess = () => {
    const nextPath = searchParams.get('next') || '/';
    navigate(nextPath, { replace: true });
  };

  useEffect(() => {
    return () => {
      setShowProtocol(false);
      setMode(0);
      setLdSms(false);
      setDisSmsSend(false);
    };
  }, []);

  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <Bar></Bar>
      <Flex vertical justify="center" align="center" gap="middle" style={{maxWidth:"21.25em",width:"60%",height:"100%"}}>
        <Flex vertical align="center" gap="small">
          <Typography.Title level={3} style={{ margin: 0 }}>
            注册 / 登录
          </Typography.Title>
        </Flex>
        <Form size="large" style={{width:"100%"}}>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              // { 
              //   validator: (_, value) => {
              //     if (!value) return Promise.resolve();
              //     if (/^1(4[0146]|48|72)\d{8}$/.test(value)) {
              //       return Promise.reject(new Error('物联网卡不支持注册'));
              //     }
              //     return Promise.resolve();
              //   }
              // },
            ]}
          >
            <Input addonBefore="手机" maxLength={11} value={phone} onChange={(e)=>{
              setPhone(e.target.value)
            }} onPressEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (canLogin) {
                checkAgree(1)
              }
            }}></Input>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: Msgs.msgFormatPassword },
              { pattern: /^[a-zA-Z0-9]{6,12}$/, message: Msgs.msgFormatPassword },
            ]}
          >
            <Input.Password security="password" autoFocus addonBefore="密码" value={password} onChange={(e)=>{
              setPassword(e.target.value)
            }} onPressEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (canLogin) {
                checkAgree(1)
              }
            }}></Input.Password>
          </Form.Item>
        </Form>
        <Flex justify="space-between" align="start" style={{width:"100%"}}>
          <Button onClick={()=>{
            if(formatError){
              if(password.length>0){
                window.messageApi.warning(Msgs.msgFormatPassword)
              }else{
                window.messageApi.warning("请补全手机号和密码，然后点击注册按钮")
              }
            }else{
              checkAgree(0)
            }
          }} size="large">注册</Button>
          <Flex vertical align="center" gap={"middle"}>
            <Button disabled={!canLogin} type="primary" size="large" onClick={()=>{
              checkAgree(1)
            }}>登录</Button>
            <Typography.Text type="secondary">
              <Link to="/reset" style={{textDecoration:"underline"}}>忘记密码</Link>
            </Typography.Text>
          </Flex>
        </Flex>
      </Flex>
      <Drawer 
        loading={ldLogup}
        onClose={hideProtocol}
        placement="bottom"
        open={showProtocol&&mode==0}
      >
        <Flex vertical justify="center" align="center" style={{width:"100%"}}>
          <div style={{maxWidth:"18.75em",width:"80%"}}>
            {agree=="0"&&
            <>
              <Flex vertical gap={"middle"} align="center" justify="center" style={{width:"100%"}}>
                <ProtocolAll></ProtocolAll>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0, textAlign: "center" }}>
                  点击同意按钮或按下回车键即代表您同意上述协议，将为您进行注册。
                </Typography.Paragraph>
              </Flex>
            <Flex wrap justify="space-between" style={{width:"100%"}}>
              <Button onClick={hideProtocol}>取消</Button>
              <Button loading={ldLogup} onClick={()=>{
                setArgree("1")
              }}
              type="primary">同意</Button>
            </Flex>
          </>
          }
          {
            agree=="1"&&
            <Flex vertical gap={"middle"}>
              <Flex style={{width:"100%"}}>
                <Input maxLength={4} value={code} onChange={(e)=>{
                  let value=e.target.value
                  setCode(value)
                }}></Input>
                <CaptchaA callback={smsSend}>
                  <Button id="captcha-button" loading={ldSms} disabled={disSmsSend}>获取验证码</Button>
                </CaptchaA>
              </Flex>
              <Button disabled={code.length<4} type="primary" onClick={logup}>完成注册</Button>
            </Flex>
          }
          </div>
        </Flex>
      </Drawer>
      <Modal centered onCancel={hideProtocol} cancelText={"取消"} loading={ldLogin} okText={"同意"} 
        okButtonProps={{ id: "login-protocol-ok" }}
        afterOpenChange={(open) => {
          if (open) {
            // 避免“按回车打开弹窗”的同一次 keyup 触发 OK
            setTimeout(() => {
              (document.getElementById("login-protocol-ok") as HTMLButtonElement | null)?.focus()
            }, 0)
          }
        }}
        onClose={hideProtocol} onOk={login}
        open={showProtocol&&mode==1}>
        <ProtocolAll></ProtocolAll>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          点击同意按钮或按下回车键即代表您同意上述协议，将为您进行登录。
        </Typography.Paragraph>
      </Modal>
    </div>
  )
}

function ProtocolAll({}){
  return(
    <Flex wrap gap={4} justify="center">
      <Typography.Text>请您认真阅读</Typography.Text>
      <ComProtocol title={EnumProtocls.Service}></ComProtocol>
      <Typography.Text>和</Typography.Text>
      <ComProtocol title={EnumProtocls.Privacy}></ComProtocol>
    </Flex>
  )
}


function Bar(){
  const navigate = useCustomNavigate()
  const handleBack = () => {
    setTimeout(() => {
      navigate(-1);
    }, 50);
  };
  
  return(
    <Flex>
      <FloatButton 
        style={{insetInlineStart:12}} 
        icon={<LeftOutlined/>} 
        onClick={handleBack}
      />     
      <ComCusSvc/>
    </Flex>
  )
}