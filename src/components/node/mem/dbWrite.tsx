import {  NodeData, Res } from "../../../common/types/types";
import './style.css'
import lineStorage from "../../../common/lineStorage";
import NodeCore0 from "../_node0";
import config from "../../../common/config/config";
import { updateResData } from "../../../common/utils";
import { Checkbox, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { globalStore, stateHeaders } from "../../../common/store/store";
export default function DbWrite({id,data}:{id:string,data:NodeData}){
  const [v0,setV0]=useState(data.values?.[0]||"1")
  const refV0=useRef(v0)

  useEffect(()=>{
    refV0.current=v0
    data.values[0]=v0
  },[v0])
  
  async function run(input:Res):Promise<Res>{
    try {
      if(refV0.current=="1"){
        //如果input.msg是多行文本的话,就为每一行前面添加文件名
        let filename=input.datas?.["name"]||""
        //如果文件名包含路径,就只保留文件名
        filename=filename.split("/").pop()||filename
        let lines=input.msg.split("\n")
        input.msg=lines.map(line=>filename+","+line).join("\n")
        // 勾选“文件名溯源”后，输出 headers 需要将“文件名”插到最前面
        const oldHeader = input.headers || ""
        input.headers = "文件名," + oldHeader
        // 持久化保存刚生成的 headers，供后续节点/页面复用
        globalStore.set(stateHeaders, input.headers)
      }
      const keyToUse = config.keyToMemoryGen;
      const success = await lineStorage.writeLine(keyToUse, input.msg)
      
      let res=updateResData(input,{success: success})
      return res
    } catch (error) {
      return  updateResData(input,{
        success: false,
        msg: `记忆写入失败: ${error}`
      })
    }
  }
  return(
    <NodeCore0 
      width={100}
      handles={[1,1]} 
      run0={run} 
      id={id} 
      data={data}
    >
      {/* <ComDbActions 
        id={id} 
        nodeType={RecordNodeLabel[EnumNodeType.DbWrite]}
        dbKey={config.keyToMemoryGen}
      /> */}
      <Tooltip title="勾选后，文件名会被自动写入记忆">
        <Checkbox
           style={{padding:0,width:"100%",fontSize:"0.6rem"}}
          checked={v0=="1"}
          onChange={(e)=>{
            setV0(e.target.checked?"1":"0")
          }}
        >
          文件名溯源
        </Checkbox>
      </Tooltip>
    </NodeCore0>
  )
}