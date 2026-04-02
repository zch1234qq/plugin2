import Shell from "../shell1";
import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css';
import utils, { updateResData } from "../../../common/utils";
import { useAtom } from "jotai";
import { stateDebug } from "../../../common/store/store";
import ImageDisplay from "../../ImageDisplay";
import { Button, Flex, Slider, Tooltip, Modal } from "antd";
import { RedoOutlined, SettingOutlined } from "@ant-design/icons";
import HandleInputImg from "../../HandleInputImg";
import HandleOutputImg from "../../HandleOutputImg";

/**
 * 图像增强节点组件
 * 用于增强图像的亮度、对比度、饱和度和锐度
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 图像增强节点组件
 */
export default function ImageEnhance({id, data}: {id: string, data: NodeData}) {
  const [updateFlag,setUpdateFlag] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [, setDebug] = useAtom(stateDebug);
  
  // Modal控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 增强参数
  const [brightness, setBrightness] = useState(100); // 亮度: 0-200, 默认100
  const [contrast, setContrast] = useState(100);     // 对比度: 0-200, 默认100
  const [saturation, setSaturation] = useState(100); // 饱和度: 0-200, 默认100
  const [sharpness, setSharpness] = useState(0);     // 锐度: 0-10, 默认0
  
  // 临时参数 - 用于Modal中的修改
  const [tempBrightness, setTempBrightnessCore] = useState(brightness);
  const [tempContrast, setTempContrastCore] = useState(contrast);
  const [tempSaturation, setTempSaturationCore] = useState(saturation);
  const [tempSharpness, setTempSharpnessCore] = useState(sharpness);
  
  // 引用值
  const brightnessRef = useRef(brightness);
  const contrastRef = useRef(contrast);
  const saturationRef = useRef(saturation);
  const sharpnessRef = useRef(sharpness);
  useEffect(()=>{
    if(data.values[0]){
      setBrightness(parseInt(data.values[0]));
      setTempBrightness(parseInt(data.values[0]));
    }
    if(data.values[1]){
      setContrast(parseInt(data.values[1]));
      setTempContrast(parseInt(data.values[1]));
    }
    if(data.values[2]){
      setSaturation(parseInt(data.values[2]));
      setTempSaturation(parseInt(data.values[2]));
    }
    if(data.values[3]){
      setSharpness(parseInt(data.values[3]));
      setTempSharpness(parseInt(data.values[3]));
    }
  },[]);

  function setTempBrightness(value:number){
    setTempBrightnessCore(value);
    setBrightness(value);
    brightnessRef.current = value;
    data.values[0] = value.toString();
    setUpdateFlag(!updateFlag);
  }

  function setTempContrast(value:number){
    setTempContrastCore(value);
    setContrast(value);
    contrastRef.current = value;
    data.values[1] = value.toString();
    setUpdateFlag(!updateFlag);
  }
  
  function setTempSaturation(value:number){
    setTempSaturationCore(value);
    setSaturation(value);
    saturationRef.current = value;
    data.values[2] = value.toString();
    setUpdateFlag(!updateFlag);
  }
  
  function setTempSharpness(value:number){
    setTempSharpnessCore(value);
    setSharpness(value);
    sharpnessRef.current = value;
    data.values[3] = value.toString();
    setUpdateFlag(!updateFlag);
  }

  // 初始化参数
  useEffect(() => {
    if (data.values[0]) setBrightness(parseInt(data.values[0]));
    if (data.values[1]) setContrast(parseInt(data.values[1]));
    if (data.values[2]) setSaturation(parseInt(data.values[2]));
    if (data.values[3]) setSharpness(parseInt(data.values[3]));
  }, [data]);

  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0": run
  };

  /**
   * 执行图像增强处理
   * @param {Res} input - 输入结果，包含图像数据
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }

    try {
      // 检查输入是否为图片
      if (input.msg.startsWith('data:image')) {
        // 保存原始图像
        setOriginalImageUrl(input.msg);
        
        // 应用图像增强
        const enhancedImage = await enhanceImage(
          input.msg,
          brightnessRef.current,
          contrastRef.current,
          saturationRef.current,
          sharpnessRef.current
        );
        
        // 显示处理后的图像
        setImageUrl(enhancedImage);
        
        // 返回处理结果
        return updateResData(input,{
          success: true,
          msg: enhancedImage,
          datas: input.datas
        });
      } else {
        setDebug({
          show: true,
          data: "输入的数据不是图片格式",
          loading: false,
          msgtype: "text",
          nodeId: id,
          nodeType: "图像增强"
        });
        return updateResData(input,{
          success: false,
          msg: "输入应为图片格式"
        });
      }
    } catch (error) {
      console.error("图像增强处理失败:", error);
      setDebug({
        show: true,
        data: `图像增强处理失败: ${error}`,
        loading: false,
        msgtype: "text",
        nodeId: id,
        nodeType: "图像增强"
      });
      return updateResData(input,{
        success: false,
        msg: `处理失败: ${error}`
      });
    }
  }

  /**
   * 图像增强处理
   * @param {string} imageData - Base64格式的图像数据
   * @param {number} brightness - 亮度值
   * @param {number} contrast - 对比度值
   * @param {number} saturation - 饱和度值
   * @param {number} sharpness - 锐度值
   * @returns {Promise<string>} 增强后的Base64格式图像数据
   */
  async function enhanceImage(
    imageData: string,
    brightness: number, 
    contrast: number, 
    saturation: number, 
    sharpness: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 创建图片对象
        const img = new Image();
        img.onload = () => {
          try {
            // 创建Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error("无法获取Canvas上下文"));
              return;
            }
            
            // 设置Canvas尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制原始图像
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // 应用亮度和对比度
            const brightnessF = brightness / 100;
            const contrastF = contrast / 100;
            const saturationF = saturation / 100;
            
            for (let i = 0; i < data.length; i += 4) {
              // 获取RGB值
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];
              
              // 转换为HSL
              let hsl = rgbToHsl(r, g, b);
              
              // 应用亮度（亮度在HSL中是第三个参数）
              hsl[2] = hsl[2] * brightnessF;
              if (hsl[2] > 1) hsl[2] = 1;
              
              // 应用饱和度（饱和度在HSL中是第二个参数）
              hsl[1] = hsl[1] * saturationF;
              if (hsl[1] > 1) hsl[1] = 1;
              
              // 转回RGB
              let rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
              
              r = rgb[0];
              g = rgb[1];
              b = rgb[2];
              
              // 应用对比度
              r = ((r / 255 - 0.5) * contrastF + 0.5) * 255;
              g = ((g / 255 - 0.5) * contrastF + 0.5) * 255;
              b = ((b / 255 - 0.5) * contrastF + 0.5) * 255;
              
              // 锐化处理
              if (sharpness > 0 && i > 0 && i < data.length - 4) {
                // 简单锐化：增强当前像素与周围像素的差异
                const prevR = data[i - 4];
                const prevG = data[i - 3];
                const prevB = data[i - 2];
                
                r = r + (r - prevR) * (sharpness / 10);
                g = g + (g - prevG) * (sharpness / 10);
                b = b + (b - prevB) * (sharpness / 10);
              }
              
              // 确保值在0-255范围内
              data[i] = Math.max(0, Math.min(255, r));
              data[i + 1] = Math.max(0, Math.min(255, g));
              data[i + 2] = Math.max(0, Math.min(255, b));
            }
            
            // 更新图像数据
            ctx.putImageData(imageData, 0, 0);
            
            // 转换为Base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error("图片加载失败"));
        };
        
        img.src = imageData;
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * RGB转HSL颜色
   */
  function rgbToHsl(r: number, g: number, b: number): number[] {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [h, s, l];
  }
  
  /**
   * HSL转RGB颜色
   */
  function hslToRgb(h: number, s: number, l: number): number[] {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [r * 255, g * 255, b * 255];
  }
  
  /**
   * 重置所有参数到默认值
   */
  const resetAllParams = () => {
    setTempBrightness(100);
    setTempContrast(100);
    setTempSaturation(100);
    setTempSharpness(0);
  };
  
  /**
   * 应用临时参数到实际参数
   */
  const applyParams = async () => {
    setBrightness(tempBrightness);
    setContrast(tempContrast);
    setSaturation(tempSaturation);
    setSharpness(tempSharpness);
    
    setIsModalOpen(false);
    
    // 如果有原始图像，重新应用处理
    if (originalImageUrl) {
      try {
        const enhancedImage = await enhanceImage(
          originalImageUrl,
          tempBrightness,
          tempContrast,
          tempSaturation,
          tempSharpness
        );
        setImageUrl(enhancedImage);
      } catch (error) {
        console.error("重新应用图像增强失败:", error);
      }
    }
  };
  
  /**
   * 打开设置Modal
   */
  const openSettingsModal = () => {
    // 初始化临时值为当前值
    setTempBrightness(brightness);
    setTempContrast(contrast);
    setTempSaturation(saturation);
    setTempSharpness(sharpness);
    setIsModalOpen(true);
  };
  
  /**
   * 关闭设置Modal
   */
  const closeSettingsModal = () => {
    setIsModalOpen(false);
  };
  
  function onClick() {
    utils.log(id);
  }

  return (
    <Shell 
      width={100} 
      data={data} 
      updateFlag={updateFlag} 
      id={id} 
      runs={runs} 
      onClick={onClick}
      onDoubleClick={()=>setIsModalOpen(true)}
    >
      <HandleInputImg />
      <HandleOutputImg />
      
      {imageUrl && (
        <div className="image-container" style={{ marginBottom: '10px' }}>
          <ImageDisplay 
            src={imageUrl}
            alt="增强后的图像"
            containerStyle={{ padding: "5px" }}
          />
        </div>
      )}
      
      <Flex justify="center" style={{ marginBottom: '10px' }}>
        <Button 
          type="primary" 
          icon={<SettingOutlined />} 
          onClick={openSettingsModal}
          size="small"
        >
          调整参数
        </Button>
      </Flex>
      
      {/* 参数调整Modal */}
      <Modal
        title="图像增强参数设置"
        open={isModalOpen}
        onOk={applyParams}
        onCancel={closeSettingsModal}
        okText="应用"
        cancelText="取消"
        width={400}
      >
        <Flex vertical gap="middle" style={{ marginTop: '20px' }}>
          <div>
            <Tooltip title="调整图像明暗程度">
              <span style={{ marginRight: '8px', display: 'block' }}>亮度: {tempBrightness}%</span>
            </Tooltip>
            <Slider
              min={0}
              max={200}
              value={tempBrightness}
              onChange={(value) => setTempBrightness(value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Tooltip title="调整图像明暗对比程度">
              <span style={{ marginRight: '8px', display: 'block' }}>对比度: {tempContrast}%</span>
            </Tooltip>
            <Slider
              min={0}
              max={200}
              value={tempContrast}
              onChange={(value) => setTempContrast(value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Tooltip title="调整图像色彩鲜艳程度">
              <span style={{ marginRight: '8px', display: 'block' }}>饱和度: {tempSaturation}%</span>
            </Tooltip>
            <Slider
              min={0}
              max={200}
              value={tempSaturation}
              onChange={(value) => setTempSaturation(value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Tooltip title="调整图像边缘清晰度">
              <span style={{ marginRight: '8px', display: 'block' }}>锐度: {tempSharpness}</span>
            </Tooltip>
            <Slider
              min={0}
              max={10}
              value={tempSharpness}
              onChange={(value) => setTempSharpness(value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <Flex justify="center">
            <Button
              type="default"
              icon={<RedoOutlined />}
              onClick={resetAllParams}
            >
              重置参数
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </Shell>
  );
} 