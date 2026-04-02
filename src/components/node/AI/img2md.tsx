import { NodeData, Res } from "../../../common/types/types.tsx";
import NodeCore0 from "../_node0.tsx";
import aiShellService from "../../../common/service/aiShellService.ts";
import { updateResData } from "../../../common/utils.tsx";
import utilsImg from "../../../common/utilsImg";
import HandleInputImg from "../../HandleInputImg.tsx";
import HandleOutputText from "../../HandleOutputText.tsx";

/**
 * 清除markdown文本中的代码块标记
 * @param text - 可能包含markdown代码块标记的文本
 * @returns 清除了代码块标记的文本
 */
function cleanMarkdownCodeBlockMarkers(text: string): string {
  // 检查文本是否以```markdown或```md开头，以```结尾
  let cleanText = text;
  
  // 清除开头的```markdown或```md标记
  const startRegex = /^\s*```(markdown|md)\s*\n/;
  if (startRegex.test(cleanText)) {
    cleanText = cleanText.replace(startRegex, '');
  }
  
  // 清除结尾的```标记
  const endRegex = /\n\s*```\s*$/;
  if (endRegex.test(cleanText)) {
    cleanText = cleanText.replace(endRegex, '');
  }
  
  return cleanText;
}

export default function MdFromImg({id,data}:{id:string,data:NodeData}){
  async function run0(input:Res):Promise<Res> {
    // input=updateResData(input,{
    //   ...input,
    //   msgtype:"md",
    // })
    var result=input
    try{
      // 处理网络图片
      if(input.msg.startsWith('http')){
        try {
          input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
        } catch (error) {
          console.error('网络图片处理失败:', error);
          // 出错时尝试直接使用URL
        }
      }
      let res=await aiShellService.GptOcr("",input.msg,"",data.sharer)
      let resultData=res.data
      result.success=resultData.success
      if(resultData.success){
        result.msg=resultData.msg
        //文字转markdown
        let md=await aiShellService.Gptprompt(
          "帮我将输入的文字转换为markdown格式,# 指令:请**严格**将用户输入的文字转换为markdown格式。",
          resultData.msg,data.sharer
        )
        result.success=md.data.success
        if(md.data.success){
          // 清除可能存在的markdown代码块标记
          result.msg = cleanMarkdownCodeBlockMarkers(md.data.msg);
        }else{
          result.msg=md.data.message
          if(md.data.code==0){
            throw new Error(md.data.message)
          }
        }
      }else{
        result.msg=resultData.message
        if(resultData.code==0){
          throw new Error(resultData.message)
        }
      }
    }catch(e){
      throw e
    }
    result=updateResData(result,{msgtypeRe:"md",headers:""})
    return result
  }
  return (
    <NodeCore0 handles={[0,-1]} run0={run0} id={id} data={data}>
      <HandleInputImg />
      <HandleOutputText />
    </NodeCore0>
  )
}