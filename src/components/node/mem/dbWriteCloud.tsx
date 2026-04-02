import { NodeData, Res } from "../../../common/types/types";
import './style.css'
import NodeCore0 from "../_node0";
import { updateResData } from "../../../common/utils";
import server from "../../../common/service/server";
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import Input from "antd/es/input/Input";
import Password from "antd/es/input/Password";
import { stateCloudMemPassword } from "../../../common/store/store";
import Tooltip from "antd/es/tooltip";

export default function DbWriteCloud({id,data}:{id:string,data:NodeData}){
  const [v0,setV0]=useState(data.values[0]||"")
  const [cloudPwd, setCloudPwd] = useAtom(stateCloudMemPassword)
  const [v1,setV1]=useState(data.values[1]||cloudPwd||"")
  const refv0=useRef(v0)
  const refv1=useRef(v1)
  const stopDragBubble = (e: any) => e?.stopPropagation?.()

  useEffect(()=>{
    refv0.current=v0
    refv1.current=v1
    data.values[0]=v0
    data.values[1]=v1
    // 同步到持久化密码（用户手动修改也会保存）
    setCloudPwd(v1 || "")
  },[v0,v1])
  
  async function run(input:Res):Promise<Res>{
    try {
      // 调用云端写入API
      let res:any=await server.cloudWrite(
        1, // 设备ID，可以根据实际情况修改或从配置中获取
        input.msg, // 要写入的值
        refv0.current, // 用户名，可以从用户状态中获取
        refv1.current // 密码，可以从用户状态中获取`
      )
      if(res.data.success){
        if(res.data.password){
          setV1(res.data.password)
          window.messageApi.info({
            content: `密码为: ${res.data.password}`
          })
        }else{
          window.messageApi.info({
            content: `写入成功`
          })
        }
      }else{
        
        return updateResData(input,{
          success: false,
          msg: res.data.message
        })
      }
      return input
    } catch (error:any) {
      return updateResData(input,{
        success: false,
        msg: `云端写入失败: ${error.message}`
      })
    }
  }

  return(
    <NodeCore0 
      width={200}
      handles={[1,1]} 
      run0={run} 
      id={id} 
      data={data}
    >
      <Tooltip title="用户名为空时，默认向当前账号的记忆写入">
        <Input
          className="nodrag"
          name={`cloud-mem-username-${id}`}
          autoComplete="off"
          value={v0}
          onChange={(e)=>{
            setV0(e.target.value)
          }}
          placeholder="用户名(可为空)"
          onMouseDown={stopDragBubble}
        />
      </Tooltip>
      <Tooltip title="密码为空时，自动重置密码">
        <Password
          className="nodrag"
          name={`cloud-mem-password-${id}`}
          // 避免浏览器/密码管理器在节点重新渲染时自动回填
          autoComplete="new-password"
          value={v1}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setV1(e.target.value)}
          placeholder="密码(可为空)"
          onMouseDown={stopDragBubble}
        />
      </Tooltip>
    </NodeCore0>
  )
}