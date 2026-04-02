import Shell from "../shell1";
import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import { Slider} from "antd";
import { updateResData } from "../../../common/utils";
import HandleInputImg from "../../HandleInputImg";
import HandleOutputImg from "../../HandleOutputImg";

export default function ImageRotate({id, data}: {id: string, data: NodeData}) {
  const [updateFlag,] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0); // 默认0度
  const rotationDegreeRef = useRef(rotationDegree);
  const [originalImage, setOriginalImage] = useState(""); // 存储原始图片

  useEffect(()=>{
    if(data.values[0]){
      setRotationDegree(Number(data.values[0]));
      rotationDegreeRef.current = Number(data.values[0]);
    }
  },[data])

  // 更新ref值
  const updateRotationDegreeRef = (value: number) => {
    setRotationDegree(value);
    rotationDegreeRef.current = value;
    data.values[0] = value.toString();
  };

  const rotateImage = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        // 计算旋转后的画布尺寸
        const angle = (rotationDegreeRef.current * Math.PI) / 180;
        const sin = Math.abs(Math.sin(angle));
        const cos = Math.abs(Math.cos(angle));
        
        canvas.width = img.width * cos + img.height * sin;
        canvas.height = img.height * cos + img.width * sin;

        // 移动到canvas中心点
        ctx.translate(canvas.width/2, canvas.height/2);
        // 旋转
        ctx.rotate(angle);
        
        // 绘制图片
        ctx.drawImage(
          img, 
          -img.width/2, 
          -img.height/2, 
          img.width, 
          img.height
        );

        // 转换为base64
        resolve(canvas.toDataURL());
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      img.src = base64Image;
    });
  };

  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0":run
  }
    
    
    
  async function run(input: Res): Promise<Res> {
    if (!input.success) return input;
    
    try {
      if (!input.msg.startsWith('data:image')) {
        return updateResData(input,{
          success: false,
          msg: '输入不是有效的base64图片'
        });
      }

      // 保存原始图片用于预览
      setOriginalImage(input.msg);
      // 实际旋转处理仍然执行
      const rotatedImage = await rotateImage(input.msg);

      return updateResData(input,{ 
        success: true,
        msg: rotatedImage
      });

    } catch (error) {
      console.error('旋转图片失败:', error);
      return updateResData(input,{
        success: false,
        msg: `处理失败: ${error}`
      });
    }
  }

  return (
    <Shell width={100} data={data} updateFlag={updateFlag} id={id} runs={runs}>
      <HandleInputImg />
      <HandleOutputImg />
      {originalImage && (
        <div style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%', // 固定高度
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          top:0,
          left:0,
          right:0,
          bottom:0
        }}>
          <img 
            src={originalImage} 
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `rotate(${rotationDegree}deg)`,
              transition: 'transform 0.1s ease'
            }}
          />
        </div>
      )}
      <div 
        className="nodrag"
        style={{ 
          width: '100%', 
          background: 'rgba(255,255,255,0.01)',
          pointerEvents: 'auto',
          position:"absolute",
          top:"100%",
          left:0
        }}
      >
        <Slider
          min={-180}
          max={180}
          value={rotationDegree}
          onChange={updateRotationDegreeRef}
          style={{ flex: 1 }}
          tooltip={{ formatter: (value) => `${value}°` }}
        />
      </div>
    </Shell>
  );
} 