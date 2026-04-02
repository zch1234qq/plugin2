import { DataCloudReadItem, EnumNodeType, NodeData, RecordNodeType, Res } from "../../../common/types/types";
import './style.css'
import NodeCore0 from "../_node0";
import utils, { updateResData } from "../../../common/utils";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { stateDebug } from "../../../common/store/store";
import server from "../../../common/service/server";
import { Button, Checkbox, Flex } from "antd";

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000
const pad2 = (num: number) => String(num).padStart(2, "0")

export default function DbReadCloud({id,data}:{id:string,data:NodeData}){
  const [,setDebug]=useAtom(stateDebug)
  const deviceId = 1
  const [showTimestamp, setShowTimestamp] = useState(data.values[0] === "1")

  useEffect(() => {
    data.values[0] = showTimestamp ? "1" : "0"
  }, [showTimestamp])

  const setNodeDebug = (text: string, loading = false) => {
    setDebug({
      show: true,
      data: text,
      loading,
      msgtype: "text",
      nodeId: id,
      nodeType: RecordNodeType[EnumNodeType.DbReadCloud]
    });
  }

  const getAuth = () => ({
    username: data.values[0] || "",
    password: data.values[1] || ""
  })

  const formatBeijingTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) {
      return timestamp
    }
    const beijingDate = new Date(date.getTime() + BEIJING_OFFSET_MS)
    const year = beijingDate.getUTCFullYear()
    const month = pad2(beijingDate.getUTCMonth() + 1)
    const day = pad2(beijingDate.getUTCDate())
    const hour = pad2(beijingDate.getUTCHours())
    const minute = pad2(beijingDate.getUTCMinutes())
    const second = pad2(beijingDate.getUTCSeconds())
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  async function run(input:Res):Promise<Res>{
    utils.log(input);
    setNodeDebug("开始从云端记忆读取数据...", true);
    
    try {
      const { username, password } = getAuth()
      const res = await server.cloudRead(deviceId, username, password)
      
      const payload = res.data
      
      if(payload.success){
        const list: DataCloudReadItem[] = Array.isArray(payload.data) ? payload.data : []
        const value = list
          .map((item) => data.values[0] === "1" ? `${formatBeijingTime(item.timestamp)},${item.value}` : item.value)
          .join("\n")
        
        // 返回成功结果
        return updateResData(input,{
          success: true,
          msg: value || "记忆为空",
        })
      }else{
        // 返回错误结果
        return updateResData(input,{
          success: false,
          msg: payload.message || "云端记忆读取失败"
        })
      }
    } catch (error:any) {
      // 显示错误信息
      // 返回错误结果
      return updateResData(input,{
        success: false,
        msg: `云端记忆读取失败: ${error.message}`
      })
    }
  }

  const handleClearCloudMemory = async () => {
    const res = await server.cloudClear();
    if(res.data.success){
      window.messageApi.success("已清空云端记忆中的所有数据");
    }else{
      window.messageApi.error(res.data.message || "清空失败");
    }
  }

  return(
    <NodeCore0 
      width={200}
      root={true}
      handles={[1,0]} 
      run0={run} 
      id={id} 
      data={data}
    >
      <Flex vertical>
        <Button
          danger
          type="primary"
          onClick={handleClearCloudMemory}
        >
          清空记忆
        </Button>
        <Checkbox
          checked={showTimestamp}
          onChange={(e) => setShowTimestamp(e.target.checked)}
        >
          时间
        </Checkbox>
      </Flex>
    </NodeCore0>
  )
}
