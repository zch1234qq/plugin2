import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore0 from "../_node0";
import utils, { updateResData } from "../../../common/utils";
import { Button, Flex, Modal } from "antd";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import "./imageCrop.css";

/**
 * 图片裁剪节点组件
 * 根据指定的左、右、上、下百分比边界裁剪图片
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 图片裁剪节点组件
 */
export default function ImageCrop({id, data}: {id: string, data: NodeData}) {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const formatPercent = (value: number) => (Math.round(value * 100) / 100).toString();
  const parsePercent = (value: string | number, fallback = 0) => {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return clamp(parsed, 0, 100);
  };
  const buildCropFromEdges = (leftValue: string, rightValue: string, topValue: string, bottomValue: string): PercentCrop => {
    const x = clamp(parsePercent(leftValue), 0, 99);
    const y = clamp(parsePercent(topValue), 0, 99);
    const maxWidth = 100 - x;
    const maxHeight = 100 - y;
    const width = clamp(100 - parsePercent(leftValue) - parsePercent(rightValue), 1, maxWidth);
    const height = clamp(100 - parsePercent(topValue) - parsePercent(bottomValue), 1, maxHeight);
    return {
      unit: "%",
      x,
      y,
      width,
      height
    };
  };

  // 四个边界值的状态（百分比）
  const [left, setLeft] = useState("0");
  const [right, setRight] = useState("0");
  const [top, setTop] = useState("0");
  const [bottom, setBottom] = useState("0");
  const [imageUrl,setImageUrl]=useState("");
  const placeholderImage =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="750" viewBox="0 0 1000 750">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#ffffff"/>
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8e8e8" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="1000" height="750" fill="url(#grid)"/>
      </svg>`
    );
  const [crop, setCrop] = useState<PercentCrop>({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
  
  // 控制弹窗显示的状态
  const [modalVisible, setModalVisible] = useState(false);
  
  // 使用ref保存当前值，以便在异步操作中访问
  const leftRef = useRef(left);
  const rightRef = useRef(right);
  const topRef = useRef(top);
  const bottomRef = useRef(bottom);

  // 从节点数据中加载保存的值
  useEffect(() => {
    const nextLeft = data.values[0] || left;
    const nextRight = data.values[1] || right;
    const nextTop = data.values[2] || top;
    const nextBottom = data.values[3] || bottom;

    if (data.values[0]) {
      setLeft(data.values[0]);
      leftRef.current = data.values[0];
    } else {
      data.values[0] = left;
    }
    
    if (data.values[1]) {
      setRight(data.values[1]);
      rightRef.current = data.values[1];
    } else {
      data.values[1] = right;
    }
    
    if (data.values[2]) {
      setTop(data.values[2]);
      topRef.current = data.values[2];
    } else {
      data.values[2] = top;
    }
    
    if (data.values[3]) {
      setBottom(data.values[3]);
      bottomRef.current = data.values[3];
    } else {
      data.values[3] = bottom;
    }

    setCrop(buildCropFromEdges(nextLeft, nextRight, nextTop, nextBottom));
  }, []);

  // 当值变化时更新ref
  useEffect(() => {
    leftRef.current = left;
  }, [left]);
  
  useEffect(() => {
    rightRef.current = right;
  }, [right]);
  
  useEffect(() => {
    topRef.current = top;
  }, [top]);
  
  useEffect(() => {
    bottomRef.current = bottom;
  }, [bottom]);

  useEffect(() => {
    if (modalVisible) {
      setCrop(buildCropFromEdges(left, right, top, bottom));
    }
  }, [modalVisible]);

  const handleCropChange = (nextCrop: PercentCrop) => {
    const x = clamp(parsePercent(nextCrop.x || 0), 0, 99);
    const y = clamp(parsePercent(nextCrop.y || 0), 0, 99);
    const maxWidth = 100 - x;
    const maxHeight = 100 - y;
    const width = clamp(parsePercent(nextCrop.width || maxWidth, maxWidth), 1, maxWidth);
    const height = clamp(parsePercent(nextCrop.height || maxHeight, maxHeight), 1, maxHeight);

    const nextLeft = formatPercent(x);
    const nextTop = formatPercent(y);
    const nextRight = formatPercent(100 - x - width);
    const nextBottom = formatPercent(100 - y - height);

    setCrop({ unit: "%", x, y, width, height });
    setLeft(nextLeft);
    setRight(nextRight);
    setTop(nextTop);
    setBottom(nextBottom);
    data.values[0] = nextLeft;
    data.values[1] = nextRight;
    data.values[2] = nextTop;
    data.values[3] = nextBottom;
  };

  /**
   * 裁剪图片
   * @param {string} base64Image - 输入的base64格式图片
   * @returns {Promise<string>} 裁剪后的base64格式图片
   */
  const cropImage = async (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建图片对象
        const img = new Image();
        img.onload = () => {
          // 获取原始图片尺寸
          const originalWidth = img.width;
          const originalHeight = img.height;
          
          // 计算裁剪区域（将百分比转换为像素）
          const leftPx = Math.round(originalWidth * (parseFloat(leftRef.current) / 100));
          const rightPx = Math.round(originalWidth * (parseFloat(rightRef.current) / 100));
          const topPx = Math.round(originalHeight * (parseFloat(topRef.current) / 100));
          const bottomPx = Math.round(originalHeight * (parseFloat(bottomRef.current) / 100));
          
          // 计算裁剪后的宽度和高度
          const croppedWidth = originalWidth - leftPx - rightPx;
          const croppedHeight = originalHeight - topPx - bottomPx;
          
          // 确保裁剪区域有效
          if (croppedWidth <= 0 || croppedHeight <= 0) {
            reject(new Error("裁剪区域无效，请调整裁剪参数"));
            return;
          }
          
          // 创建canvas进行裁剪
          const canvas = document.createElement('canvas');
          canvas.width = croppedWidth;
          canvas.height = croppedHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("无法创建绘图上下文"));
            return;
          }
          
          // 在canvas上绘制裁剪后的图片
          // 使用精确的像素坐标，避免浮点数导致的变形
          ctx.drawImage(
            img,
            Math.round(leftPx), Math.round(topPx), // 源图像的起始点（四舍五入到整数像素）
            Math.round(croppedWidth), Math.round(croppedHeight), // 源图像的裁剪尺寸
            0, 0, // 目标图像的起始点
            Math.round(croppedWidth), Math.round(croppedHeight) // 目标图像的尺寸
          );
          
          // 将canvas转换为base64，使用PNG格式保持质量
          const croppedBase64 = canvas.toDataURL('image/jpeg', 1.0);
          resolve(croppedBase64);
        };
        
        img.onerror = () => {
          reject(new Error("图片加载失败"));
        };
        
        // 设置图片源
        img.src = base64Image;
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * 处理节点运行
   * @param {Res} input - 输入结果
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    setImageUrl(input.msg);
    try {
      // 检查输入是否为base64图片
      if (!input.msg.startsWith('data:image')) {
        return updateResData(input,{
          success: false,
          msg: "输入不是有效的base64图片"
        });
      }
      
      // 裁剪图片
      const croppedImage = await cropImage(input.msg);
      return updateResData(input,{
        success: true,
        msg: croppedImage,
        datas: input.datas
      }); 
    } catch (error: any) {
      utils.log(`图片裁剪失败: ${error.message}`);
      return updateResData(input,{
        success: false,
        msg: `图片裁剪失败: ${error.message}`
      });
    }
  }

  return (
    <div onDoubleClick={()=>{setModalVisible(true)}}>
      <NodeCore0
        handles={[1, 1]}
        colors={[1,1]}
        run0={run}
        id={id}
        data={data}
        width={100}
      >        
        <Modal 
          title="调整裁剪区域" 
          open={modalVisible} 
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={400}
          zIndex={1050}
          getContainer={document.body}
        >
          <div style={{ width: "100%", position: "relative", margin: "20px 0", backgroundColor: "#fff", borderRadius: "8px", padding: "8px", border: "1px solid #f0f0f0" }}>
            <ReactCrop
              className="image-crop-editor"
              crop={crop}
              onChange={(_, percentCrop) => handleCropChange(percentCrop)}
              minWidth={5}
              minHeight={5}
              keepSelection
              ruleOfThirds
            >
              <img
                src={imageUrl || placeholderImage}
                alt="crop-source"
                style={{ display: "block", maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }}
              />
            </ReactCrop>
          </div>
          
          <Flex justify="center">
            <Button type="primary" onClick={() => setModalVisible(false)}>
              确定
            </Button>
          </Flex>
        </Modal>
      </NodeCore0>
    </div>
  );
} 