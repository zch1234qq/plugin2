import { Modal, Card } from "antd";
import { useEffect, useState } from "react";
import server from "../../common/service/server";
import config from "../../common/config/config";

type Argv={
  open:boolean,
  onCancel:()=>void
}
export default function ComModalinvite({open,onCancel}:Argv){
  const [link,setLink]=useState("")
  useEffect(()=>{
    if(open){
      // 获取用户信息
      server.InviteCreateLink().then(res=>{
        var data=res.data
        if(data.success){
          setLink(`${config.webUrl}index.html#`+data.link)
        }else{
          window.messageApi.error({
            content:data.message,
            key:"error"
          })
        }
      })
    }
  },[open])
  
  return(
    <Modal
      open={open}
      onCancel={onCancel}
      // footer={null}
      onOk={async ()=>{
        try{
          await navigator.clipboard.writeText(link)
          window.messageApi.success({
            content:"复制链接成功",
            key:"success"
          })
        }catch(err){
          window.messageApi.error({
            content:"此设备不支持自动复制链接，请手动复制",
            key:"error"
          })
        }
      }}
      closeIcon={null}
      okText="复制专属链接"
      cancelText="关闭"
    >
      <Card>
        {/* 显示链接 */}
        {link}
        {/* 复制链接按钮 */}
      </Card>
    </Modal>
  )
}