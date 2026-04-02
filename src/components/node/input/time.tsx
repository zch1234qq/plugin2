import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import Shell from "../shell1";
import { Flex, Tooltip } from "antd";
import ComNodeInput from "../../ComNodeInput";
import ComHandleDot from "../../ComHandleDot";
import { usePlugin } from "../../../common/pluginContext";
import HandleOutputText from "../../HandleOutputText";

export default function Time({id,data}:{id:string,data:NodeData}){
  // 使用usePlugin钩子获取plugin变量
  const { plugin } = usePlugin();
  const [v0,setV0Core]=useState("获取北京时间")
  const v0Ref=useRef(v0)
  const [updateFlag,setUpdateFlag]=useState(false)
  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0])
      v0Ref.current=data.values[0]
    }else{
      data.values[0]=v0
    }
  },[])

  const runs:Record<string, (res: Res) => Promise<Res>>={
    "0":run0
  }
  
  function setV0(value:string){
    setV0Core(value)
    v0Ref.current=value
    data.values[0]=value
    setUpdateFlag(!updateFlag)
  }

  // 获取当前北京时间
  function getBeijingTime(): string {
    const now = new Date();
    // 北京时间是UTC+8
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    
    // 格式化时间为YYYY-MM-DD HH:mm:ss格式
    const year = beijingTime.getUTCFullYear();
    const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getUTCDate()).padStart(2, '0');
    const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
    const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  async function run0(input:Res):Promise<Res> {
    const beijingTime = getBeijingTime();
    
    var result:Res={
      ...input,
      success:true,
      msg:beijingTime
    } as Res
    
    // 更新节点显示的时间
    setV0(beijingTime);
    
    return result
  }

  return (
    <div>
      <Shell root={true} id={id} data={data} runs={runs} updateFlag={updateFlag}>
        <ComHandleDot/>
        <HandleOutputText />
      </Shell>
    </div>
  )
}