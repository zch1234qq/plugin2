import Shell from "../shell1";
import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import utils, { updateResData } from "../../../common/utils";
import { useAtom } from "jotai";
import { stateDebug } from "../../../common/store/store";
import ImageDisplay from "../../ImageDisplay";
import ComDropdown from "../../ComDropdown";
import HandleInputImg from "../../HandleInputImg";
import HandleOutputImg from "../../HandleOutputImg";

/**
 * 图片压缩节点组件
 * 用于压缩图片文件大小，保持相同尺寸但降低质量
 */
export default function ImgCompress({id, data}: {id: string, data: NodeData}) {
  const [updateFlag,] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [originalSize, setOriginalSize] = useState(0); // 存储原始图片大小
  const [compressedSize, setCompressedSize] = useState(0); // 存储压缩后图片大小
  const [, setDebug] = useAtom(stateDebug);
  // 将 samplingRatio 重命名为 compressionQuality, 0.1-1.0之间，值越小压缩率越高
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const compressionQualityRef = useRef(compressionQuality);

  useEffect(()=>{
    if(data.values[0]){
      setCompressionQuality(Number(data.values[0]))
    }
  },[data.values])

  useEffect(() => {
    compressionQualityRef.current = compressionQuality;
    data.values[0]=compressionQuality.toString()
  }, [compressionQuality]);
  
  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0": run
  };

  /**
   * 压缩图片并返回结果
   * @param imageData 原始图片数据
   * @param quality 压缩质量，0.1-1.0之间
   * @returns 压缩后的图片Base64字符串
   */
  async function compressImage(imageData: string, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个图像对象
        const img = new Image();
        img.onload = () => {
          // 使用naturalWidth和naturalHeight获取图片的真实尺寸
          const realWidth = img.naturalWidth;
          const realHeight = img.naturalHeight;
          
          // 创建Canvas，使用图片的真实尺寸
          const canvas = document.createElement('canvas');
          canvas.width = realWidth;
          canvas.height = realHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取Canvas上下文'));
            return;
          }
          
          // 绘制图像，保持原始比例
          ctx.drawImage(img, 0, 0, realWidth, realHeight);
          
          // 使用toDataURL进行压缩，保持高质量
          const compressedData = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedData);
        };
        
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
        
        // 设置图片源，并确保跨域属性
        if (imageData.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
          img.src = imageData;
        } else {
          reject(new Error("输入应为图片格式"));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 计算Base64图片的大致文件大小（KB）
   * @param base64String Base64图片字符串
   * @returns 图片大小（KB）
   */
  function calculateImageSize(base64String: string): number {
    // 移除Base64前缀
    const base64WithoutPrefix = base64String.split(',')[1] || base64String;
    // 计算大致大小
    const sizeInBytes = (base64WithoutPrefix.length * 3) / 4;
    // 转为KB并返回
    return Math.round(sizeInBytes / 1024);
  }

  /**
   * 运行节点，压缩输入的图片
   * @param input 输入结果
   * @returns 压缩后的图片
   */
  async function run(input: Res): Promise<Res> {
    if(!input.success) {
      return input;
    }

    try {
      // 获取图片数据
      let imageSource = input.msg;
      // 计算原始图片大小
      const originalSizeKB = calculateImageSize(imageSource);
      setOriginalSize(originalSizeKB);
      
      // 压缩图片
      const compressedImage = await compressImage(imageSource, compressionQualityRef.current);
      
      // 计算压缩后大小
      const compressedSizeKB = calculateImageSize(compressedImage);
      setCompressedSize(compressedSizeKB);
      
      // 设置调试信息
      setDebug(prev => ({
        ...prev,
        show: true,
        data: `图像已压缩：${originalSizeKB}KB → ${compressedSizeKB}KB (${Math.round((compressedSizeKB/originalSizeKB)*100)}%)`,
        loading: false,
        nodeType: "图片压缩",
        nodeId: id
      }));
      
      // 设置图像URL
      setImageUrl(compressedImage);
      
      // 返回压缩后的图像
      return updateResData(input,{
        success: true,
        msg: compressedImage
      });   
    } catch (error) {
      console.error("图片压缩失败:", error);
      setDebug(prev => ({
        ...prev,
        show: true,
        data: `图像压缩失败: ${error instanceof Error ? error.message : String(error)}`,
        loading: false,
        nodeType: "图片压缩",
        nodeId: id
      }));
      return input; // 如果失败，返回原始输入
    }
  }

  function onClick() {
    utils.log(id);
  }
  
  // 创建压缩质量选项
  const qualityOptions = [
    { label: "高质量 (90%)", value: 0.9 },
    { label: "中等质量 (80%)", value: 0.8 },
    { label: "低质量 (60%)", value: 0.6 },
    { label: "极低质量 (40%)", value: 0.4 },
    { label: "最低质量 (20%)", value: 0.2 },
  ];
  
  return (
    <Shell width={100} data={data} updateFlag={updateFlag} id={id} runs={runs} onClick={onClick}>
      <HandleInputImg />
      <HandleOutputImg />
      {imageUrl && (
        <div className="image-container">
          <ImageDisplay 
            src={imageUrl}
            alt="压缩后的图像"
            containerStyle={{ padding: "5px" }}
          />
          {originalSize > 0 && compressedSize > 0 && (
            <div style={{ 
              fontSize: '10px',
              textAlign: 'center',
              padding: '2px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '3px',
              marginTop: '2px'
            }}>
              压缩率: {Math.round((compressedSize/originalSize)*100)}% 
              ({originalSize}KB → {compressedSize}KB)
            </div>
          )}
        </div>
      )}
      <ComDropdown 
        options={qualityOptions} 
        value={compressionQuality} 
        onChange={(value) => {
          setCompressionQuality(Number(value));
        }} 
      />
    </Shell>
  )
} 