import Shell from "./shell1";
import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import utils, { updateResData } from "../../common/utils";
import { useAtom } from "jotai";
import { stateDebug } from "../../common/store/store";
import ImageDisplay from "../ImageDisplay";
import ComDropdown from "../ComDropdown";
import config from "../../common/config/config";
import utilsImg from "../../common/utilsImg";
import HandleInputImg from "../HandleInputImg";
import HandleOutputImg from "../HandleOutputImg";
/**
 * 调整大小节点组件
 * 用于调整图片尺寸，修改图片分辨率
 */
export default function Resize({id, data}: {id: string, data: NodeData}) {
  const [updateFlag,] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [, setDebug] = useAtom(stateDebug);
  const [samplingRatio, setSamplingRatio] = useState(1);
  const samplingRatioRef = useRef(samplingRatio);

  useEffect(()=>{
    if(data.values[0]){
      setSamplingRatio(Number(data.values[0]))
    }
  },[data.values])

  useEffect(() => {
    samplingRatioRef.current = samplingRatio;
    data.values[0]=samplingRatio.toString()
  }, [samplingRatio]);
  
  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0": run
  };
  /**
   * 运行节点，调整图片尺寸
   * @param input 输入结果
   * @returns 处理后的图片
   */
  async function run(input: Res): Promise<Res> {
    if(!input.success) {
      return input;
    }

    // 检查输入是URL还是Base64
    let imageSource = input.msg;
    imageSource = await utilsImg.processImageWithSampling(imageSource, samplingRatioRef.current)
    setDebug(prev => ({
      ...prev,
      show: true,
      data: "图像尺寸已调整",
      loading: false,
      nodeType: "调整尺寸",
      nodeId: id
    }));
    // 设置图像URL
    setImageUrl(imageSource);
    // 返回处理后的图像
    return updateResData(input,{success: true,msg: imageSource});
  }
  function onClick() {
    utils.log(id);
  }
  
  return (
    <Shell width={100} data={data} updateFlag={updateFlag} id={id} runs={runs} onClick={onClick}>
      <HandleInputImg />
      <HandleOutputImg />
      {imageUrl && (
        <div className="image-container">
          <ImageDisplay 
            src={imageUrl}
            alt="调整尺寸后的图像"
            // containerStyle={{ padding: "5px" }}
          />
        </div>
      )}
      <ComDropdown options={config.samplingOptions} value={samplingRatio} onChange={(value) => {
        setSamplingRatio(Number(value));
      }} />
    </Shell>
  )
} 