import { useEffect, useRef, useState } from "react";
import {  NodeData, Res } from "../../../common/types/types.tsx";
import '../style.css'
import utils, { updateResData } from "../../../common/utils.tsx";
import Shell from "../shell1.tsx";
import ComNodeInput from "../../ComNodeInput.tsx";
import ModalCus from "../../modeCus.tsx";
import aiShellService from "../../../common/service/aiShellService.ts";
import configNode from "../../../common/config/configNode.tsx";
import utilsImg from "../../../common/utilsImg.tsx";
import HandleInputImg from "../../HandleInputImg.tsx";
import HandleOutputText from "../../HandleOutputText.tsx";
/**
 * 图像提示节点组件（内置提示词）
 * 用于向图像提问，只需要一个图像输入
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 图像提示节点组件
 */
export default function PromptImgConst({id, data}: {id: string, data: NodeData}) {
  const [v0, setV0] = useState("");
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("0");
  const v0Ref = useRef(v0);
  const v1Ref = useRef(v1);
  const v2Ref = useRef(v2);
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);

  useEffect(()=>{
    if(data.values[0]){
      v0Ref.current=data.values[0]
      setV0(data.values[0])
    }
    if(data.values[1]){
      v1Ref.current=data.values[1]
      setV1(data.values[1])
    }
    if(data.values[2] !== undefined){
      v2Ref.current=data.values[2]
      setV2(data.values[2] === "1"? "1" : "0")
    }
  },[])

  useEffect(()=>{
    data.values[0]=v0
    v0Ref.current=v0
  },[v0])

  useEffect(()=>{
    data.values[1]=v1
    v1Ref.current=v1
  },[v1])

  useEffect(()=>{
    v2Ref.current = v2;
    data.values[2]=v2
  },[v2])

  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run,
  };

  /**
   * 处理图像和提示词
   * @param {Res} input - 输入图像
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    if (!input.msg.startsWith('data:image')&&!input.msg.startsWith('http')) {
      return updateResData(input,{success: false,msg: "输入必须是图片"});
    }else if(input.msg.startsWith('http')){
      //将网络图片转为  dataurl图片
      input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
    }
    // 显示处理状态
    utils.log(id + input.msg);
    var result = {
      ...input,
    } as Res;
    try {
      const prompt = v0Ref.current;
      // 非OCR模式：直接使用GptImg处理图像
      const response = await aiShellService.GptImg(prompt, input.msg, v1Ref.current, data.sharer);
      const resultData = response.data;
      result.success = resultData.success;
      result.msg = resultData.msg;
      if (!resultData.success) {
        result.msg=resultData.message
        if(resultData.code==0){
          throw new Error(resultData.message)
        }
      }
    } catch (error: any) {
      throw error
    }
    result=updateResData(result,{msgtypeRe:"text",headers:""})
    return result;
  }

  
  function onChangeV0(value:string){
    data.values[0]=value
    utils.update(value,v0Ref,setV0,setUpdateFlag,updateFlag)
  }

  function onChangeV1(value:string){ 
    data.values[1]=value
    utils.update(value,v1Ref,setV1,setUpdateFlag,updateFlag)
  }

  return (
    <Shell
      id={id}
      data={data}
      runs={runs}
      updateFlag={updateFlag}
    >
      <HandleInputImg />
      <HandleOutputText tip="输出对图片的理解" />
      <ComNodeInput
        value={v1}
        onChange={(value:string)=>{
          setV1(value)
          onChangeV1(value)
        }}
        placeholder={configNode.phQues}
        onDoubleClick={() => setOpen2(true)}
      />
          <ComNodeInput
            value={v0}
            onChange={(value:string)=>{
              setV0(value)
              onChangeV0(value)
            }}
            placeholder="指令"
            placement="bottom"
            onDoubleClick={() => setOpen(true)}
          />
      <ModalCus
        open={open2}
        setOpen={setOpen2}
        value={v1}
        onChange={(e:any)=>{
          let value=e.target.value
          setV1(value)
          onChangeV1(value)
        }}
        placeholder={configNode.phQues}
      />
      <ModalCus
        placeholder="指令"
        open={open}
        setOpen={setOpen}
        value={v0}
        onChange={(e:any)=>{
          let value=e.target.value
          setV0(value)
          onChangeV0(value)
        }}
      />
    </Shell>
  );
}

