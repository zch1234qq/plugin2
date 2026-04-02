import { useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore1 from "../_node1";
import { updateResData } from "../../../common/utils";
import aiShellService from "../../../common/service/aiShellService";
import utilsImg from "../../../common/utilsImg";
export default function Img2Table({id, data}: {id: string, data: NodeData}) {
  const [v0, setV0] = useState("");
  const v0Ref = useRef(v0);

  async function run(input: Res): Promise<Res> {
    input=updateResData(input,{
      ...input,
      msgtype:"excel",
    })
    if (!input.success) {
      return input;
    }

    if (!input.msg.startsWith('data:image')&&!input.msg.startsWith('http')) {
      return updateResData(input,{success: false,msg: "输入必须是图片"});
    }else if(input.msg.startsWith('http')){
      //将网络图片转为  dataurl图片
      try {
        input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
      } catch (error) {
        console.error('网络图片处理失败:', error);
        // 出错时尝试直接使用URL
      }
    }
    let prompt="我有一张图片，其中包含一个表格，表格有列名和多行数据。请你帮我将它提取出来，并且转成标准的 CSV 格式。要求使用英文逗号分隔，\n 表示换行，第一行为列名，只返回 CSV 纯文本字符串，不要任何额外描述或解释。"
    let ques="请将这张图片的表格数据转换为标准 CSV 格式。"
    if(v0Ref.current){
      prompt=prompt+"\n4.输入信息的相关行业是:"+v0Ref.current
    }
    try {
      const result = await aiShellService.GptImg(
        prompt,
        input.msg,
        ques,
        data.sharer
      );
      if (!result.data.success) {
        result.data.msg=result.data.message
        if(result.data.code==0){
          throw new Error(result.data.message||"处理失败")
        }
      }
      return updateResData(input,{success: result.data.success,msg:result.data.msg,msgtypeRe:"excel",headers:""});
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
        tips={["输出表格","输入图片"]}
        run0={run}
        v0={v0} 
        setV0={setV0}
        v0Ref={v0Ref}
        id={id}
        data={data}
        placeholder="行业"
      />
    </div>
  );
}