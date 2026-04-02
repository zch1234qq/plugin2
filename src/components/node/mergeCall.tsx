import { useEffect, useState } from "react";
import { useRef } from "react";
import { NodeData, Res } from "../../common/types/types";
import NodeCore2Top from "./_node2top";
import { Checkbox, Flex, Radio, Tooltip } from "antd";

type Argvs={
  id:string,
  data:NodeData
}

export default function MergeCall({id,data}:Argvs){
  const [v0,setV0] = useState<string>("0");
  const v0Ref = useRef(v0);
  
  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0]);
      v0Ref.current = data.values[0];
    }
  },[]);

  function onValueChange(value:string){
    setV0(value);
    v0Ref.current = value;
    data.values[0] = value;
  }

  async function run(input0: Res, _input1: Res):Promise<Res>{
    input0.msg=""
    return input0;
  }
  
  return(
    <NodeCore2Top width={100} run={run} id={id} data={data} tips={["输入1", "输入2", "合并结果"]}>
    </NodeCore2Top>
  )
} 