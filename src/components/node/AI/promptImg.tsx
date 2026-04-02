import { useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types.tsx";
import '../style.css'
import NodeCore2 from "../_node2.tsx";
import utils, { updateResData } from "../../../common/utils.tsx";
import aiShellService from "../../../common/service/aiShellService.ts";

type Argvs={
  id:string,
  data:NodeData
}

export default function PromptImg({id,data}:Argvs){
  const [v0,setV0]=useState("")
  const input0=useRef("")
  const input1=useRef("")

  async function run(input0: string, img: string):Promise<Res>{
    var result={
      success:false
    } as Res
    utils.sleep(10)
    
    if (!img.startsWith('data:image')) {
      return {
        success: false,
        msg: "输入必须是图片"
      };
    }
    try {
      
      // 使用图片URL而不是base64数据
      await aiShellService.GptImg(v0,img, input0,data.sharer)
      .then(res=>{
        var resultData=res.data
        result.success=resultData.success
        result.msg=resultData.msg
        if(!resultData.success){
          result.msg=resultData.message
          if(resultData.code==0){
            throw new Error(resultData.message)
          }
        }
      })
      .catch(error=>{
        result.success=false
        result.msg=error.message
        throw new Error(error.message)
      })
    } catch (error: any) {
      throw error
    }
    result=updateResData(result,{msgtypeRe:"text",headers:""})
    return result
  }

  return(
    <NodeCore2 
      input0={input0}
      input1={input1}
      run={run} 
      v0={v0} 
      setV0={setV0} 
      id={id} 
      data={data} 
    />
  )
}