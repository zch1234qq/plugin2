import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import { useRef, useState } from "react";
import NodeCore1 from "../_node1";

export default function In1({id,data}:{id:string,data:NodeData}){
  const [v0,setV0]=useState("")
  const v0Ref=useRef(v0)
  
  async function run(input:Res):Promise<Res>{
    let result:Res={
      ...input,
      success:true,msg:""} as Res
    if(v0Ref.current!=""){
      result.msg=v0Ref.current
      result.success=true
      return result
    }
    result.success=false
    result.msg="缺少输入"
    return result
  }

  return(
    <NodeCore1
      v0Ref={v0Ref}
      root={true}
      handles={[1,0]}
      colors={[0,0]}
      tips={["输出文字","输入"]}
      run0={run}
      v0={v0}
      setV0={setV0}
      id={id}
      data={data}
    ></NodeCore1>
  )
}