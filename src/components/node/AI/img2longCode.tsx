import { useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore1 from "../_node1";
import mqrb from "../../../common/service/mqrb";
import { updateResData } from "../../../common/utils";
import utilsImg from "../../../common/utilsImg";
export default function LongCode({id, data}: {id: string, data: NodeData}) {
  const [v0, setV0] = useState("");
  const v0Ref = useRef(v0);
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    if (!input.msg.startsWith('data:image')&&!input.msg.startsWith('http')) {
      return updateResData(input,{  
        success: false,
        msg: "输入必须是图片"
      });
    }else if(input.msg.startsWith('http')){
      //将网络图片转为  dataurl图片
      try {
        input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
      } catch (error) {
        console.error('网络图片处理失败:', error);
        // 出错时尝试直接使用URL
        // 注意：如果直接使用HTTP URL，后续的canvas操作可能会失败
        // 但至少可以让流程继续执行
      }
    }
    let resOCR=await mqrb.GptOcr("",input.msg,"",data.sharer)
    if(!resOCR.data.success){
      return updateResData(input,{  
        success: false,
        msg: resOCR.data.message,
      });
    }
    let prompt="帮我提取输入文本中最长的编码,并返回编码,,# 指令:请**严格**从用户输入中提取一个特定的编码字符串。该编码可能是中英文混合的可能中间存在特殊符号,但是不会存在空格。"
    if(v0Ref.current){
      prompt=`"帮我提取输入文本中${v0Ref.current}开头的编码,# 指令:请**严格**从用户输入中提取一个特定的编码字符串。该编码可能是中英文混合的可能中间存在特殊符号,但是不会存在空格。"`
    }
    try {
      await mqrb.Gptprompt(
        prompt,
        resOCR.data.msg,
        data.sharer
      )
      .then(res=>{
        let _data=res.data
        input.success=_data.success
        if(_data.success){
          input.msg=_data.msg
        }else{
          input.msg=_data.message
          if(_data.code==0){
            throw new Error(_data.message)
          }
        }
      })
      return updateResData(input,{msgtypeRe:"text",headers:undefined});
    } catch (error) {
      throw error
    }
  }

  return (
    <div>
      <NodeCore1
        root={false}
        handles={[1, 1]}
        colors={[0, 1]}
        run0={run}
        v0={v0} 
        setV0={setV0}
        v0Ref={v0Ref}
        id={id}
        data={data}
        placeholder="编码前缀"
      />
    </div>
  );
}