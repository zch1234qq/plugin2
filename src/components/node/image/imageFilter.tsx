import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css';
import ImageDisplay from "../../ImageDisplay";
import { Button, Flex, Slider, Tooltip, Modal, Select, Switch } from "antd";
import { SettingOutlined, RedoOutlined } from "@ant-design/icons";
import NodeCore0 from "../_node0";
import { updateResData } from "../../../common/utils";

/**
 * 图像过滤器节点组件
 * 使用Canvas API实现灰度化、二值化、边缘检测等处理
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 图像过滤器节点组件
 */
export default function ImageFilter({id, data}: {id: string, data: NodeData}) {
  const [imageUrl, setImageUrl] = useState("");
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  
  // Modal控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 过滤参数
  const [filterType, setFilterType] = useState("grayscale"); // 默认灰度
  const [threshold, setThreshold] = useState(128);          // 二值化阈值: 0-255, 默认128
  const [edgeType, setEdgeType] = useState("sobel");        // 边缘检测类型: sobel/canny, 默认sobel
  const [invert, setInvert] = useState(false);              // 颜色反转: 是/否, 默认否
  
  // 临时参数 - 用于Modal中的修改
  const [tempFilterType, setTempFilterType] = useState(filterType);
  const [tempThreshold, setTempThreshold] = useState(threshold);
  const [tempEdgeType, setTempEdgeType] = useState(edgeType);
  const [tempInvert, setTempInvert] = useState(invert);
  
  // 引用值
  const filterTypeRef = useRef(filterType);
  const thresholdRef = useRef(threshold);
  const edgeTypeRef = useRef(edgeType);
  const invertRef = useRef(invert);
  const processingRef = useRef(false); // 防止重复处理

  useEffect(()=>{
    if(data.values[0]){
      setFilterType(data.values[0]);
      filterTypeRef.current = data.values[0];
      setTempFilterType(data.values[0]);
    }
    if(data.values[1]){
      setThreshold(parseInt(data.values[1]));
      thresholdRef.current = parseInt(data.values[1]);
      setTempThreshold(parseInt(data.values[1]));
    }
    if(data.values[2]){
      setEdgeType(data.values[2]);
      edgeTypeRef.current = data.values[2];
      setTempEdgeType(data.values[2]);
    }
    if(data.values[3]){
      setInvert(data.values[3] === "true");
      invertRef.current = data.values[3] === "true";
      setTempInvert(data.values[3] === "true");
    }
  },[data]);
  
  // 同步状态到ref
  // useEffect(() => {
  //   filterTypeRef.current = filterType;
  //   data.values[0] = filterType;
  // }, [filterType, data]);
  
  // useEffect(() => {
  //   thresholdRef.current = threshold;
  //   data.values[1] = threshold.toString();
  // }, [threshold, data]);
  
  // useEffect(() => {
  //   edgeTypeRef.current = edgeType;
  //   data.values[2] = edgeType;
  // }, [edgeType, data]);
  
  // useEffect(() => {
  //   invertRef.current = invert;
  //   data.values[3] = invert ? "true" : "false";
  // }, [invert, data]);
  
  // // 初始化参数
  // useEffect(() => {
  //   if (data.values[0]) setFilterType(data.values[0]);
  //   if (data.values[1]) setThreshold(parseInt(data.values[1]));
  //   if (data.values[2]) setEdgeType(data.values[2]);
  //   if (data.values[3]) setInvert(data.values[3] === "true");
  // }, [data]);

  /**
   * 执行图像过滤处理
   * @param {Res} input - 输入内容
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success || processingRef.current) {
      return input;
    }
    processingRef.current = true; // 设置处理标志
    try {
      // 防止重复处理相同的图像
      if (input.msg === originalImageUrl && imageUrl) {
        processingRef.current = false;
        return updateResData(input,{
          success: true,
          msg: imageUrl
        }); 
      }
      
      // 设置原始图像URL
      setOriginalImageUrl(input.msg);
      
      // 创建图像对象
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // 返回Promise以等待图像加载
      const processedImageUrl = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          try {
            // 创建Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('无法创建画布上下文'));
              return;
            }
            
            // 设置Canvas尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制原始图像
            ctx.drawImage(img, 0, 0);
            
            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // 应用过滤器
            switch (filterTypeRef.current) {
              case 'grayscale':
                // 灰度处理
                for (let i = 0; i < data.length; i += 4) {
                  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  data[i] = data[i + 1] = data[i + 2] = avg;
                }
                break;
              
              case 'binary':
                // 二值化处理
                for (let i = 0; i < data.length; i += 4) {
                  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  const value = avg < thresholdRef.current ? 0 : 255;
                  data[i] = data[i + 1] = data[i + 2] = value;
                }
                break;
              
              case 'edge':
                // 边缘检测 (简化版)
                if (edgeTypeRef.current === 'sobel') {
                  // 首先转为灰度
                  for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;
                  }
                  
                  // 创建临时副本用于边缘检测
                  const tempData = new Uint8ClampedArray(data);
                  
                  // Sobel算子(简化版)
                  const width = canvas.width;
                  for (let y = 1; y < canvas.height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                      const idx = (y * width + x) * 4;
                      
                      // 计算x方向梯度
                      const gx = 
                        -1 * tempData[((y-1) * width + (x-1)) * 4] +
                        1 * tempData[((y-1) * width + (x+1)) * 4] +
                        -2 * tempData[(y * width + (x-1)) * 4] +
                        2 * tempData[(y * width + (x+1)) * 4] +
                        -1 * tempData[((y+1) * width + (x-1)) * 4] +
                        1 * tempData[((y+1) * width + (x+1)) * 4];
                      
                      // 计算y方向梯度
                      const gy = 
                        -1 * tempData[((y-1) * width + (x-1)) * 4] +
                        -2 * tempData[((y-1) * width + x) * 4] +
                        -1 * tempData[((y-1) * width + (x+1)) * 4] +
                        1 * tempData[((y+1) * width + (x-1)) * 4] +
                        2 * tempData[((y+1) * width + x) * 4] +
                        1 * tempData[((y+1) * width + (x+1)) * 4];
                      
                      // 计算梯度大小
                      const mag = Math.sqrt(gx * gx + gy * gy);
                      
                      // 阈值化
                      const value = mag > thresholdRef.current ? 255 : 0;
                      data[idx] = data[idx + 1] = data[idx + 2] = value;
                    }
                  }
                } else {
                  // 简化的Canny检测 (实际上是Laplacian)
                  // 首先转为灰度
                  for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;
                  }
                  
                  // 创建临时副本
                  const tempData = new Uint8ClampedArray(data);
                  
                  // Laplacian算子
                  const width = canvas.width;
                  for (let y = 1; y < canvas.height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                      const idx = (y * width + x) * 4;
                      
                      const val = 
                        -1 * tempData[((y-1) * width + (x-1)) * 4] +
                        -1 * tempData[((y-1) * width + x) * 4] +
                        -1 * tempData[((y-1) * width + (x+1)) * 4] +
                        -1 * tempData[(y * width + (x-1)) * 4] +
                        8 * tempData[(y * width + x) * 4] +
                        -1 * tempData[(y * width + (x+1)) * 4] +
                        -1 * tempData[((y+1) * width + (x-1)) * 4] +
                        -1 * tempData[((y+1) * width + x) * 4] +
                        -1 * tempData[((y+1) * width + (x+1)) * 4];
                      
                      // 阈值化
                      const value = Math.abs(val) > thresholdRef.current ? 255 : 0;
                      data[idx] = data[idx + 1] = data[idx + 2] = value;
                    }
                  }
                }
                break;
            }
            
            // 如果需要反转颜色
            if (invertRef.current) {
              for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];         // 红
                data[i + 1] = 255 - data[i + 1]; // 绿
                data[i + 2] = 255 - data[i + 2]; // 蓝
              }
            }
            
            // 将处理后的数据绘制回Canvas
            ctx.putImageData(imageData, 0, 0);
            
            // 转换为base64
            const base64 = canvas.toDataURL('image/jpeg');
            resolve(base64);
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => {
          reject(new Error('图像加载失败'));
        };
        
        // 设置图像源
        img.src = input.msg;
      });
      
      // 设置处理后的图像URL
      setImageUrl(processedImageUrl);
      
      processingRef.current = false; // 清除处理标志
      return updateResData(input,{
        success: true,
        msg: processedImageUrl
      }); 
    } catch (error: any) {
      console.error("图像处理错误:", error);
      processingRef.current = false; // 清除处理标志
      return updateResData(input,{
        success: false,
        msg: `图像处理错误: ${error.message}`
      });   
    }
  }
  
  /**
   * 应用参数设置并处理当前图像
   */
  const applyParamsAndProcess = () => {
    // 设置参数
    setFilterType(tempFilterType);
    setThreshold(tempThreshold);
    setEdgeType(tempEdgeType);
    setInvert(tempInvert);
    setIsModalOpen(false);
    // 同步状态到ref
    filterTypeRef.current = tempFilterType;
    thresholdRef.current = tempThreshold;
    edgeTypeRef.current = tempEdgeType;
    invertRef.current = tempInvert;
    data.values[0] = tempFilterType;
    data.values[1] = tempThreshold.toString();
    data.values[2] = tempEdgeType;
    data.values[3] = tempInvert ? "true" : "false";
    
    // 处理当前图像 (使用setTimeout避免状态更新后立即调用造成的递归)
    if (originalImageUrl) {
      setTimeout(() => {
        run({ success: true, msg: originalImageUrl }).then(result => {
          if (result.success) {
            setImageUrl(result.msg);
          }
        });
      }, 0);
    }
  };
  
  return (
    <div onDoubleClick={() => {
      setTempFilterType(filterType);
      setTempThreshold(threshold);
      setTempEdgeType(edgeType);
      setTempInvert(invert);
      setIsModalOpen(true);
    }}>
      <NodeCore0 
        run0={run} 
        id={id} 
        width={100}
        data={data} 
        handles={[1,1]} 
        colors={[1,1]}
      >
        <Flex vertical align="center" style={{position:"absolute", top:0, left:0, width: "100%"}}>
          <div>
            {imageUrl && (
              <ImageDisplay 
                src={imageUrl}
                height={100}
              />
            )}
          </div>
          
          <Button
            type="default"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              setTempFilterType(filterType);
              setTempThreshold(threshold);
              setTempEdgeType(edgeType);
              setTempInvert(invert);
              setIsModalOpen(true);
            }}
            style={{marginTop: '4px'}}
          >
            调整参数
          </Button>
        </Flex>
        
        {/* 参数调整Modal */}
        <Modal
          title="图像过滤器参数设置"
          open={isModalOpen}
          onOk={applyParamsAndProcess}
          onCancel={() => setIsModalOpen(false)}
          okText="应用"
          cancelText="取消"
          width={400}
        >
          <Flex vertical gap="middle" style={{ marginTop: '20px' }}>
            <div>
              <Tooltip title="选择过滤器类型">
                <span style={{ marginRight: '8px', display: 'block' }}>过滤器类型:</span>
              </Tooltip>
              <Select
                value={tempFilterType}
                onChange={(value) => setTempFilterType(value)}
                style={{ width: '100%' }}
                options={[
                  { value: 'grayscale', label: '灰度化' },
                  { value: 'binary', label: '二值化' },
                  { value: 'edge', label: '边缘检测' }
                ]}
              />
            </div>
            
            {tempFilterType === 'binary' && (
              <div>
                <Tooltip title="二值化阈值，低于此值为黑色，高于为白色">
                  <span style={{ marginRight: '8px', display: 'block' }}>阈值: {tempThreshold}</span>
                </Tooltip>
                <Slider
                  min={0}
                  max={255}
                  value={tempThreshold}
                  onChange={(value) => setTempThreshold(value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            
            {tempFilterType === 'edge' && (
              <>
                <div>
                  <Tooltip title="边缘检测算法">
                    <span style={{ marginRight: '8px', display: 'block' }}>边缘检测类型:</span>
                  </Tooltip>
                  <Select
                    value={tempEdgeType}
                    onChange={(value) => setTempEdgeType(value)}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'sobel', label: 'Sobel算子' },
                      { value: 'canny', label: 'Canny算子' }
                    ]}
                  />
                </div>
                
                <div>
                  <Tooltip title="边缘检测阈值，高于此值视为边缘">
                    <span style={{ marginRight: '8px', display: 'block' }}>阈值: {tempThreshold}</span>
                  </Tooltip>
                  <Slider
                    min={0}
                    max={255}
                    value={tempThreshold}
                    onChange={(value) => setTempThreshold(value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}
            
            <div>
              <Tooltip title="反转图像颜色">
                <Flex align="center" gap="small">
                  <span>颜色反转:</span>
                  <Switch
                    checked={tempInvert}
                    onChange={(checked) => setTempInvert(checked)}
                  />
                </Flex>
              </Tooltip>
            </div>
            
            <Flex justify="center">
              <Button
                type="default"
                icon={<RedoOutlined />}
                onClick={() => {
                  setTempFilterType("grayscale");
                  setTempThreshold(128);
                  setTempEdgeType("sobel");
                  setTempInvert(false);
                }}
              >
                重置参数
              </Button>
            </Flex>
          </Flex>
        </Modal>
      </NodeCore0>
    </div>
  );
} 