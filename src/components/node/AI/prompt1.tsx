import { useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore1 from "../_node1";
import aiShellService from "../../../common/service/aiShellService";
import { updateResData } from "../../../common/utils";

export default function Prompt1({id,data}:{id:string,data:NodeData}){
  const [v0,setV0]=useState("")
  const v0Ref=useRef(v0)
  async function run(input:Res):Promise<Res>{
    if(!input.success){
      return input
    }
    if(input.msg.length==0){
      return updateResData(input,{success:true,msg:""})
    }
    var result={...input} as Res
    const res = await aiShellService.Gptprompt(v0Ref.current,input.msg,data.sharer)
    const resultData=res.data
    result.success=resultData.success
    if(resultData.success){
      result.msg=resultData.msg
    }else{
      result.code=resultData.code
      result.msg=resultData.message
      if(resultData.code==0){
        throw new Error(resultData.message)
      }
    }
    result=updateResData(result,{msgtypeRe:"text",headers:""})
    return result
  }
  return (
    <div>
      <NodeCore1
        placeholder="提问/布置任务"
        v0Ref={v0Ref}
        root={false}
        handles={[1,1]}
        colors={[0,0]}
        run0={run}
        v0={v0}
        setV0={setV0}
        id={id}
        data={data}
      ></NodeCore1>
    </div>
  )
}