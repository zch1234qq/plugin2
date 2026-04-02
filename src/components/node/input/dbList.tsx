import { EnumNodeType, NodeData, RecordNodeType, Res } from "../../../common/types/types";
import '../style.css'
import NodeCore0 from "../_node0";
import { useAtom } from "jotai";
import store, { stateDebug } from "../../../common/store/store";
import lineStorage from "../../../common/lineStorage";
import { Button, Checkbox, Flex, Tooltip } from "antd";
import { useRef, useState } from "react";
import { useEffect } from "react";
import config from "../../../common/config/config";
import { updateResData } from "../../../common/utils";

export default function DbList({id,data}:{id:string,data:NodeData}){
  const [,setDebug]=useAtom(stateDebug)
  const [v0,setV0]=useState("1")
  const v0Ref=useRef(v0)
  const [showNode,_]=useState(!(data.values[-1]=="1"))
  const {relations}=store

  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0])
      v0Ref.current=data.values[0]
    }
  },[data.values])

  async function run(input:Res):Promise<Res>{
    try {
      const keyToUseList = config.keyToMemoryGen; // 使用与 DbRead 相同的键
      const lines = await lineStorage.listLines(keyToUseList);
      
      let resultStr = "";
      let csvStr = "";
      
      if (lines.length > 0) {
        resultStr = lines.map(line => `${line}`).join('\n');
        csvStr = lines.join('\n');
      } else {
        resultStr = "记忆为空";
      }
      return updateResData(input,{
        success: true,
        msg: csvStr,
      });
      
    } catch (error) {
      
      // 返回错误结果
      return updateResData(input,{
        success: false,
        msg: `记忆失败: ${error}`
      });
    }
  }

  async function callbackTrigger(){
    if(v0==="1"&&(relations[id]!=undefined&&relations[id].length>0)){
      await lineStorage.clearLines(config.keyToMemoryGen);
    }
  }

  return(
    <div>
      <NodeCore0 
        root={true} // 设置为根节点,可以独立运行
        handles={[1,0]} // 有1个输出,没有输入
        run0={run} 
        id={id} 
        data={data}
        width={100}
        callbackTrigger={callbackTrigger}
      >
        {showNode&&
        <Flex vertical>
          <Tooltip title="当存在上游时，执行自动清除">
            <Flex justify="space-between">
              <Checkbox 
                checked={v0==="1"}
              onChange={(e)=>{
                let value=e.target.checked?"1":"0"
                setV0(value)
                v0Ref.current=value
                data.values[0]=value
              }}
            >
            </Checkbox>
              <div>自动清空</div>
            </Flex>
          </Tooltip>
          {
            v0==="0"&&(
              <Button danger type="primary" onClick={()=>{
                lineStorage.clearLines(config.keyToMemoryGen);
                setDebug({
                  show: true,
                  data: `已清空记忆中的所有数据`,
                  loading: false,
                  msgtype:"text",
                  nodeId: id,
                  nodeType: RecordNodeType[EnumNodeType.DbList]
                  });
                }}
              >清空记忆</Button>
            )
          }
          </Flex>
        }
      </NodeCore0>
    </div>
  )
} 