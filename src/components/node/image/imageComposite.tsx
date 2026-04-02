import { useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore2Top from "../_node2top";
import { Slider} from "antd";    
import { updateResData } from "../../../common/utils";

export default function ImageComposite({ id, data }: { id: string, data: NodeData }) {
  // 使用data.values存储偏移量设置（百分比值 -50 到 50）
  const [offsetXPercent, setOffsetXPercent] = useState(data.values[0] ? parseInt(data.values[0]) : 0);
  const [offsetYPercent, setOffsetYPercent] = useState(data.values[1] ? parseInt(data.values[1]) : 0);
  const [updateFlag, setUpdateFlag] = useState(false);
  // 预览图片状态
  const [_, setPreviewImage] = useState<string | null>(null);
  // 输入图片引用
  const inputImage1 = useRef<string | null>(null);
  const inputImage2 = useRef<string | null>(null);
  const refX=useRef(offsetXPercent);
  const refY=useRef(offsetYPercent);
  
  // 更新X偏移百分比设置
  const handleOffsetXChange = (value: number) => {
    setOffsetXPercent(value);
    data.values[0] = value.toString();
    refX.current = value;
    updateCompositePreview();
    setUpdateFlag(!updateFlag);
  };

  // 更新Y偏移百分比设置
  const handleOffsetYChange = (value: number) => {
    value=-value
    setOffsetYPercent(value);
    data.values[1] = value.toString();
    refY.current = value;
    updateCompositePreview();
    setUpdateFlag(!updateFlag);
  };
  
  // 自定义输入处理函数
  const customRun = async (input0: Res, input1: Res): Promise<Res> => {
    // 存储当前输入图片用于预览
    if (input0.success && input0.msg?.startsWith('data:image/')) {
      inputImage1.current = input0.msg;
    }
    
    if (input1.success && input1.msg?.startsWith('data:image/')) {
      inputImage2.current = input1.msg;
    }
    
    // 如果两个输入都有效，更新预览图片
    if (inputImage1.current && inputImage2.current) {
      updateCompositePreview();
    }
    
    // 原始合成函数
    return compositeImages(input0, input1);
  };

  // 实时更新合成图片预览
  const updateCompositePreview = async () => {
    if (inputImage1.current && inputImage2.current) {
      try {
        const result = await compositeImagesInternal(
          inputImage1.current,
          inputImage2.current,
          refX.current,
          refY.current
        );
        
        if (result) {
          setPreviewImage(result);
        }
      } catch (error) {
        console.error("预览合成失败:", error);
      }
    }
  };

  // 内部图片合成函数（不输出Res对象，仅用于预览）
  const compositeImagesInternal = async (
    backgroundSrc: string,
    overlaySrc: string,
    xOffset: number,
    yOffset: number
  ): Promise<string | null> => {
    try {
      // 创建两个图片对象
      const backgroundImage = new Image();
      const overlayImage = new Image();

      // 加载背景图片
      const loadBackgroundImage = new Promise<void>((resolve, reject) => {
        backgroundImage.onload = () => resolve();
        backgroundImage.onerror = () => reject(new Error("背景图片加载失败"));
        backgroundImage.src = backgroundSrc;
      });

      // 加载覆盖图片
      const loadOverlayImage = new Promise<void>((resolve, reject) => {
        overlayImage.onload = () => resolve();
        overlayImage.onerror = () => reject(new Error("覆盖图片加载失败"));
        overlayImage.src = overlaySrc;
      });

      // 等待两张图片都加载完成
      await Promise.all([loadBackgroundImage, loadOverlayImage]);

      // 创建canvas元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      // 设置canvas尺寸为背景图片的尺寸
      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;

      // 绘制背景图片
      ctx.drawImage(backgroundImage, 0, 0);
      
      // 计算覆盖图片的位置（居中加上偏移量）
      // 将百分比转换为实际像素偏移
      const xOffsetPixels = (backgroundImage.width * xOffset) / 100;
      const yOffsetPixels = (backgroundImage.height * yOffset) / 100;
      
      const x = (canvas.width - overlayImage.width) / 2 + xOffsetPixels;
      const y = (canvas.height - overlayImage.height) / 2 + yOffsetPixels;
      
      // 绘制覆盖图片
      ctx.drawImage(overlayImage, x, y);

      // 将canvas转换为base64图片
      return canvas.toDataURL();
    } catch (error) {
      console.error("合成图片失败:", error);
      return null;
    }
  };

  // 合成两张图片 - 节点运行时使用
  async function compositeImages(input0: Res, input1: Res): Promise<Res> {
    try {
      // 检查两个输入是否都是图片
      if (!input0.msg?.startsWith('data:image/') || !input1.msg?.startsWith('data:image/')) {
        return updateResData(input0,{
          success: false, 
          msg: "输入必须是图片格式" 
        });
      }

      // 创建两个图片对象
      const backgroundImage = new Image();
      const overlayImage = new Image();

      // 加载背景图片
      const loadBackgroundImage = new Promise<void>((resolve, reject) => {
        backgroundImage.onload = () => resolve();
        backgroundImage.onerror = () => reject(new Error("背景图片加载失败"));
        backgroundImage.src = input0.msg;
      });

      // 加载覆盖图片
      const loadOverlayImage = new Promise<void>((resolve, reject) => {
        overlayImage.onload = () => resolve();
        overlayImage.onerror = () => reject(new Error("覆盖图片加载失败"));
        overlayImage.src = input1.msg;
      });

      // 等待两张图片都加载完成
      await Promise.all([loadBackgroundImage, loadOverlayImage]);

      // 创建canvas元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return updateResData(input0,{
          success: false, 
          msg: "Canvas上下文创建失败" 
        });
      }

      // 设置canvas尺寸为背景图片的尺寸
      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;

      // 绘制背景图片
      ctx.drawImage(backgroundImage, 0, 0);
      
      // 计算覆盖图片的位置（居中加上偏移量）
      // 将百分比转换为实际像素偏移
      const xOffset = (backgroundImage.width * refX.current) / 100;
      const yOffset = (backgroundImage.height * refY.current) / 100;
      
      const x = (canvas.width - overlayImage.width) / 2 + xOffset;
      const y = (canvas.height - overlayImage.height) / 2 + yOffset;
      
      // 绘制覆盖图片
      ctx.drawImage(overlayImage, x, y);

      // 将canvas转换为base64图片
      const compositeImageBase64 = canvas.toDataURL();

      return updateResData(input0,{
        success: true,
        msg: compositeImageBase64,
        msgtype: "img",
        datas: {
          name: "composite_image"
        }
      });
    } catch (error) {
      return updateResData(input0,{
        success: false,
        msg: `图片合成失败: ${error}`
      }); 
    }
  }

  return (
    <NodeCore2Top
      run={customRun}
      id={id} width={100}
      data={data}
      tips={["输入背景图", "输入覆盖图", "输出合成图"]}
      colors={[1,1,1]}
    >
      <Slider
        min={-50}
        max={50}
        value={offsetXPercent}
        onChange={handleOffsetXChange}
        className="nodrag"
        style={{position:"absolute",width:"100%",left:0,top:"103%"}}
      />
      <Slider
        vertical
        min={-50}
        max={50}
        value={-offsetYPercent}
        onChange={handleOffsetYChange}
        className="nodrag"
        style={{ position:"absolute",height:"100%",top:0,left:"-35%"}}
      />
      {/* <ImageDisplay
        src={previewImage || data.values[2] || ""}
      /> */}
    </NodeCore2Top>
  );
} 