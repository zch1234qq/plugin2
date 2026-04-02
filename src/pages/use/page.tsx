'use client'
import { Button, Card, Drawer, Dropdown, Flex, Input } from "antd";
import "./style.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import server, { ConvertBase64ToUrl } from "../../common/service/server.tsx";
import LoadingCus from "../../components/loadingCus";
import { useSearchParams } from "react-router-dom";
import { LogError } from "../../common/Http.tsx";
import utilsImg from "../../common/utilsImg";
import InputCus from "../../components/inputCus";
import * as Icon from '@ant-design/icons'
import ComAuthCheck from "../../components/ComAuthCheck";
import ImageDisplay from "../../components/ImageDisplay";
import { useCustomNavigate } from "../../common/hooks/useCustomNavigate.tsx";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Modal } from "antd";
import { useAtom } from "jotai";
import { stateJitaiAuthPassword } from "../../common/store/store.tsx";

const size="large"
export default function Page() {
  const navigate=useCustomNavigate()
  const answerTextStyle = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  } as const
  const [searchParams, _] = useSearchParams();
  const id=searchParams.get("id")
  const [jitaiAuthPassword, setJitaiAuthPassword] = useAtom(stateJitaiAuthPassword)
  const [authPassword, setAuthPassword] = useState("")
  const [needPassword,setNeedPassword]=useState(false)
  const [needText,setNeedText]=useState(false)
  const [needImg,setNeedImg]=useState(false)
  const [sending,setSending]=useState(false)
  const [image,setImageCore]=useState<string>("")
  const [answer,setAnswer]=useState("")
  const [text,setText]=useState("")
  const [file,setFile]=useState<File>({} as File)
  const [loading,setLoading]=useState(true)
  const [fullScreen,setFullScreen]=useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [disabled,setDisabled]=useState(false)
  const sendingRef = useRef(false)
  const inputH=15

  useEffect(()=>{
    setLoading(true)
    server.use(id!)
    .then(res=>{
      var data=res.data
      var typeinput=data.plugin.typeinput
      if(typeinput[0]=="1"){
        setNeedText(true)
      }
      if(typeinput[1]=="1"){
        setNeedImg(true)
      }
      if(typeinput[2]=="1"){
        setNeedPassword(true)
      }
      if(!data.success){
        setDisabled(true)
        window.messageApi.error({
          content:data.message,
          key:"error"
        })
      }
    })
    .catch(error=>{
      LogError(error)
    })
    .finally(()=>{
      setLoading(false)
    })
  },[])

  useEffect(() => {
    if (!id) return
    const savedPassword = jitaiAuthPassword[id] || ""
    setAuthPassword(savedPassword)
  }, [id, jitaiAuthPassword])

  const persistAuthPassword = useCallback((pwd: string) => {
    if (!id) return
    setJitaiAuthPassword((prev) => {
      if ((prev[id] || "") === pwd) {
        return prev
      }
      return { ...prev, [id]: pwd }
    })
  }, [id, setJitaiAuthPassword])
  
  async function send() {
    if (!id) return
    if (disabled) return
    if (sendingRef.current) return
    // 需要密码但未设置：允许点击发送，但改为提醒并弹出设置密码弹窗
    if (needPassword && authPassword === "") {
      setPasswordModalOpen(true)
      window.messageApi.info("请先设置密码后再发送")
      return
    }

    sendingRef.current = true
    setSending(true)

    try {
      let img = ""
      if (needImg) {
        // 先抽样压缩得到 base64，再上传到 server 获取可访问 URL，最后再 run
        const sampled = await utilsImg.processImageWithSampling(file!, 0.9)
        const uploaded = await ConvertBase64ToUrl(sampled)
        if (!uploaded?.success || !uploaded?.url) {
          window.messageApi.error("图片上传失败，请稍后重试")
          return
        }
        img = uploaded.url
      }

      const res = await server.run(id!, text, img,authPassword)
      const data = res.data

      if (!data.success) {
        window.messageApi.error({
          content: data.message,
          key: "error",
        })
      }

      setAnswer(data.answer)
      setText("")
    } catch (error) {
      LogError(error)
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const NavBar=useMemo(()=>{
    return(
      <Flex justify="space-between" style={{width:"100%",position:"absolute",top:0,left:0}}>
        <Icon.LeftCircleTwoTone onClick={()=>{
          navigate(-1)
        }} className="icon"/>
        <Flex gap="middle" align="center">
          {
            needPassword&&
            <Icon.KeyOutlined
              className="icon"
              onClick={()=>{
                if (sending || disabled) return
                setPasswordModalOpen(true)
              }}
            />
          }
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                { key: "copy", label: "复制链接", icon: <Icon.CopyTwoTone /> },
                { key: "home", label: "返回首页", icon: <Icon.HomeTwoTone /> },
              ],
              onClick: async ({ key }) => {
                if (key === "copy") {
                  try {
                    // 判断是否在 Tauri 环境
                    if ('__TAURI__' in window) {
                      await writeText(window.location.href);
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                    }
                    window.messageApi.success('链接已复制，可粘贴发送给好友');
                  } catch (err) {
                    window.messageApi.error('复制失败，请手动复制地址栏链接');
                    console.error('复制失败:', err);
                  }
                }
                if (key === "home") {
                  navigate("/table")
                }
              },
            }}
          >
            <Icon.MoreOutlined className="icon" />
          </Dropdown>
        </Flex>
      </Flex>
    )
  },[navigate, needPassword, sending, disabled])

  const MemoImgH=useMemo(()=>{
    let height=image==""?0:10
    return height
  },[image])

  const MemoBtDisable=useMemo(()=>{
    // 密码缺失不禁用按钮（点击后由 send() 触发弹窗提醒）
    return (needImg&&image=="")||(needText&&text=="")
  },[needImg,image,needText,text])

  return(
    <ComAuthCheck>
      <LoadingCus isLoading={loading}>
        <Flex vertical align="center" justify="end" style={{width:"100%",height:"100dvh"}}>
          <Modal
            title="设置密码"
            open={passwordModalOpen}
            okText="确定"
            cancelText="取消"
            onOk={()=>{
              if (needPassword && authPassword === "") {
                window.messageApi.warning("请先输入密码")
                return
              }
              // 避免每次输入都持久化导致频闪：仅在确认时保存
              persistAuthPassword(authPassword)
              setPasswordModalOpen(false)
            }}
            onCancel={()=>setPasswordModalOpen(false)}
            destroyOnClose
          >
            <Input.Password
              size={size}
              disabled={sending||disabled}
              style={{width:"100%"}}
              value={authPassword}
              onChange={(e)=>setAuthPassword(e.target.value)}
              placeholder="请输入应用密码"
              name={`jitai-auth-password-${id || "unknown"}`}
              // 避免浏览器/密码管理器自动回填导致的抖动/闪烁
              autoComplete="new-password"
              autoFocus
              onBlur={() => {
                // 失焦也同步一次，防止用户直接关弹窗丢失输入
                persistAuthPassword(authPassword)
              }}
            />
          </Modal>
          <Drawer onClose={()=>{
            setFullScreen(false)
          }} open={fullScreen} height={"100dvh"} placement="bottom">
            <div style={answerTextStyle}>{answer}</div>
          </Drawer>
        <Flex vertical align="center" justify="center" style={{height:(100-inputH-MemoImgH)+"%",alignItems:"center",width:"90%"}}>
          {
            answer!=""&&
            <Card style={{width:"100%",maxHeight:"90%",overflow:"auto",margin:"auto"}}>
              <Flex justify="center" style={{width:"100%",maxHeight:"100%"}}>
                <div style={answerTextStyle}>{answer}</div>
              </Flex>
              <div style={{padding:10,position:"absolute",right:0,top:0}}>
                <Icon.FullscreenOutlined color="blue" onClick={()=>{
                  setFullScreen(true)
                }}></Icon.FullscreenOutlined>
              </div>
            </Card>
          }
        </Flex>
        <Flex id="sd" gap={"small"} vertical style={{width:"90%",height:((inputH+MemoImgH)+"%"),padding:10,backgroundColor:"#fff",boxSizing:"border-box",borderRadius:10,flexDirection:"column",justifyContent:"center"}} align="center">
          {
            image!=null&&image!=""&&
            <div style={{zIndex:10,padding:5,boxSizing:"border-box",width:"100%",height:(100*MemoImgH/(inputH+MemoImgH))+"%",
            display:"flex",justifyContent:"start",alignItems:"stretch"}}>
              <ImageDisplay 
                src={image}
                alt="上传的图片"
                width="auto"
                height="100%"
                containerStyle={{ maxHeight: "100%" }}
              />
            </div>
          }
          <Flex gap={"small"} justify="center" align="end" style={{maxHeight:(inputH*100/(inputH+MemoImgH))+"%",width:"100%"}}>
            {
              needImg&&
              <>
                <InputCus size={size} setFile={setFile} setImage={setImageCore}></InputCus>
              </>
            }
            {
              needText&&
              <>
                <Input.TextArea autoSize={{minRows:2,maxRows:3}} disabled={sending||disabled} size={size} style={{width:"100%",maxHeight:"100%"}} value={text} onChange={(e)=>{
                  setText(e.target.value)
                }} autoFocus placeholder="请输入" 
                ></Input.TextArea>
              </>
            }
              <Button size={size} type="primary" loading={sending} disabled={MemoBtDisable||disabled||sending} onClick={send}>发送</Button>
          </Flex>
          <p style={{color:"gray",fontSize:16,textAlign:"center",width:"100%"}}>页面内容由AI辅助生成</p>
        </Flex>
      </Flex>
      {NavBar}
    </LoadingCus>
    </ComAuthCheck>
  )
}