import Shell from "./shell1";
import { useState, useEffect } from "react";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import utils from "../../common/utils";
import ImageDisplay from "../../components/ImageDisplay";
import ComDropdown from "../../components/ComDropdown";
import config from "../../common/config/config";
import utilsImg from "../../common/utilsImg";
import HandleInputText from "../HandleInputText";
import HandleOutputImg from "../HandleOutputImg";
/**
 * 显示节点组件
 * 用于显示图片或其他内容
 */
export default function Display({id, data}: {id: string, data: NodeData}) {
  const [updateFlag,] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [samplingRatio, setSamplingRatio] = useState(data.values[0] ? Number(data.values[0]) : 1);

  useEffect(() => {
    data.values[0] = samplingRatio.toString();
  }, [samplingRatio]);
  
  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0": run
  };
  /**
   * 运行节点，显示输入的图片
   * @param input 输入结果
   * @returns 原样返回输入
   */
  async function run(input: Res): Promise<Res> {
    if(!input.success) {
      return input;
    }
    try {
      // 检查输入是否为URL格式
      const isUrl = input.msg.startsWith("http");
      if (isUrl) {
          //将网络图片转为  dataurl图片
          input.msg=await utilsImg.processHttpImageWithSampling(input.msg, Number(data.values[0]));
        // 直接使用URL作为图片源
        setImageUrl(input.msg);
      } else {
        // 原有逻辑，处理base64图片
        input.msg = await utilsImg.processImageWithSampling(input.msg, Number(data.values[0]));
        setImageUrl(input.msg);
      }
      return input;
    } catch (error) {
      console.error('图片处理失败:', error);
      // 出错时尝试直接显示原始输入
      setImageUrl(input.msg);
      return input;
    }
  }
  function onClick() {
    utils.log(id);
  }
  
  return (
    <Shell width={100} data={data} updateFlag={updateFlag} id={id} runs={runs} onClick={onClick}>
      <HandleInputText />
      <HandleOutputImg />
      {imageUrl && (
        <div className="image-container" style={{width:"100%",height:"100%",position:"absolute",top:0,left:0,right:0,bottom:0}}>
          <ImageDisplay 
            src={imageUrl}
            alt="显示的图像"
            containerStyle={{ padding: "5px" }}
          />
        </div>
      )}
      <ComDropdown options={config.samplingOptions} value={samplingRatio} onChange={(value) => {
        setSamplingRatio(Number(value));
      }} />
    </Shell>
  )
} 