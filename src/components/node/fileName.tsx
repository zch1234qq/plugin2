import { NodeData, Res } from "../../common/types/types";
import NodeCore0 from "./_node0";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "antd";
import { updateResData } from "../../common/utils";
import HandleInputText from "../HandleInputText";
import HandleOutputText from "../HandleOutputText";

/**
 * 文件名节点组件
 * 从上游节点的 datas.name 中提取文件名并输出
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 文件名节点组件
 */
export default function FileName({id, data}: {id: string, data: NodeData}) {
  const [v0,setV0]=useState(data.values[0] || "0")

  useEffect(()=>{
    data.values[0]=v0
  },[v0])

  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    try {
      // 从输入的datas中提取文件名
      let name = input.datas?.["name"] || "";
      if(data.values?.[0]==="0"){
        name=name.split(".")[0]
      }
      return updateResData(input,{msg:name,msgtypeRe:"text"})
    } catch (error) {
      console.error("提取文件名失败:", error);
      return updateResData(input, {success: false, msg: `提取文件名失败: ${error instanceof Error ? error.message : String(error)}`})
    }
  }
  
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <NodeCore0
        data={data}
        id={id}
        run0={run}
        handles={[1, 1]}
        colors={[0, 0]}
        tips={["输出文件名", "输入数据源"]}
        width={100}
      >
        <HandleInputText tip="输入数据源" />
        <HandleOutputText tip="输出文件名" />
        <Checkbox checked={v0==="1"} onChange={(e)=>{
          let value=e.target.checked
          if(value){
            setV0("1")
          }else{
            setV0("0")
          }
        }}>
          保留扩展名
        </Checkbox>
      </NodeCore0>
    </div>
  );
} 