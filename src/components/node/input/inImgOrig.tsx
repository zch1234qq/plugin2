import { NodeData, Relation, Res } from "../../../common/types/types";
import '../style.css'
import { useEffect, useRef, useState } from "react";
import { Button, Flex, Modal, Tooltip, Upload } from "antd";
import { DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import * as Icon from '@ant-design/icons';
import NodeCore0 from "../_node0";
import pdfjs from "../../../common/pdf/pdfLoader";
import utilsImg from "../../../common/utilsImg";
import ImageDisplay from "../../ImageDisplay";
import config from "../../../common/config/config";
import { updateResData } from "../../../common/utils";
import store, { stateCountToken } from "../../../common/store/store";
import { useAtomValue } from "jotai";
import HandleOutputImg from "../../HandleOutputImg";

/**
 * 将PDF转换为图片数组
 * @param pdfUrl PDF文件的URL或base64数据
 * @param samplingRate 抽样率，值为1-10，1表示不抽样，10表示最大抽样
 * @returns 返回PDF各页的图片数组
 */
async function pdfToImgFun(pdfUrl: string, samplingRate: number = 1): Promise<string[]> {
  console.time("pdfConversion");
  let dpi = 300; // 提高 DPI 以获得更清晰的图片
  let scale = dpi / 72; // 计算缩放比例
  
  try {
    let pdfData = pdfUrl;
    let pdf = null;
    if (pdfUrl.startsWith('data:application/pdf;base64,')) {
      pdfData = atob(pdfUrl.split(',')[1]);
      // 转换为Uint8Array
      const pdfBytes = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        pdfBytes[i] = pdfData.charCodeAt(i);
      }
      
      // 修改为使用导入的pdfjs
      const loadingTask = pdfjs.getDocument({data: pdfBytes});
      pdf = await loadingTask.promise;
    } else {
      // 修改为使用导入的pdfjs
      const loadingTask = pdfjs.getDocument({data: pdfData});
      pdf = await loadingTask.promise;
    }
    const arr: string[] = [];
    // 遍历处理每一页
    for (let index = 0; index < pdf.numPages; index++) {
      try {
        // 渲染页面到canvas元素
        const page = await pdf.getPage(index + 1);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const canvasContext = canvas.getContext("2d", { willReadFrequently: true });
        
        if (!canvasContext) {
          console.error("无法获取canvas上下文");
          continue;
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
          canvasContext,
          viewport,
          // 添加更多渲染参数以提高质量
          enhanceTextSelection: true,
          useRenderTextMode: 2, // 高质量文本渲染模式
          renderInteractiveForms: false
        };
        
        // 渲染PDF页面到canvas
        await page.render(renderContext as any).promise;
        // 如果需要抽样处理
        if (samplingRate > 1) {
          // 创建一个新的缩小的canvas
          const sampledCanvas = document.createElement("canvas");
          const sampledCtx = sampledCanvas.getContext("2d", { willReadFrequently: true });
          if (!sampledCtx) {
            console.error("无法获取抽样canvas上下文");
            continue;
          }
          
          // 计算抽样后的尺寸
          const sampledWidth = Math.floor(canvas.width / samplingRate);
          const sampledHeight = Math.floor(canvas.height / samplingRate);
          sampledCanvas.width = sampledWidth;
          sampledCanvas.height = sampledHeight;
          
          // 绘制抽样后的图像（相当于抽行抽列）
          sampledCtx.drawImage(
            canvas, 
            0, 0, canvas.width, canvas.height, 
            0, 0, sampledWidth, sampledHeight
          );
          
          // 将抽样后的画布导出为图片
          try {
            const imgDataUrl = sampledCanvas.toDataURL('image/jpeg', 1.0);
            arr.push(imgDataUrl);
          } catch (e) {
            console.error(`第${index + 1}页抽样导出失败:`, e);
            // 尝试使用原始尺寸作为备选
            try {
              const imgDataUrl = canvas.toDataURL('image/jpeg', 1.0);
              arr.push(imgDataUrl);
            } catch (e2) {
              console.error(`第${index + 1}页原始导出也失败:`, e2);
            }
          }
        } else {
          // 不抽样，使用原始尺寸
          try {
            const imgDataUrl = canvas.toDataURL('image/jpeg', 1.0);
            arr.push(imgDataUrl);
          } catch (e) {
            console.error(`第${index + 1}页导出失败:`, e);
          }
        }
      } catch (pageError) {
        console.error(`处理PDF第${index + 1}页时出错:`, pageError);
      }
    }
    console.timeEnd("pdfConversion");
    return arr;
  } catch (error) {
    console.error("PDF转换过程中发生错误:", error);
    console.timeEnd("pdfConversion");
    throw error;
  }
}

/**
 * 图片组节点组件
 * 支持多图片输入，包括PDF文件(自动转换为图片)
 */
export default function InImgOrig({id, data}: {id: string, data: NodeData}) {
  const [imageList, setImageList] = useState<{
    name: string, 
    dataUrl: string,      // 原始数据
    compressedUrl?: string, // 压缩后的数据
    type: string, 
    originalType?: string
  }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false); // 添加处理状态标记
  const imageListRef = useRef(imageList);
  const refRelations = useRef<Record<string, Relation[]>>(store.relations);
  const fileProcessingQueue = useRef<File[]>([]);
  const isProcessingQueue = useRef<boolean>(false);
  const countToken = useAtomValue(stateCountToken);
  const [alert, setAlert] = useState(false);
  const alertTimeoutRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    imageListRef.current = imageList;
  }, [imageList]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current !== undefined) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * 运行节点，返回当前选中的图片
   */
  async function run0(input: Res): Promise<Res> {
    if(imageListRef.current.length==0){
      return updateResData(input,{success:false,msg:"请先添加图片"})
    }
    let inputIndex = 0;
    if(refRelations.current[id]){
      if (input.success && input.msg) {
        inputIndex = parseInt(input.msg.trim())-1;
        if(!inputIndex){
          inputIndex = 0;
        }
      }
    }
    if (imageListRef.current.length > 0 && inputIndex >= 0 && inputIndex < imageListRef.current.length) {
      input=updateResData(input,{msgtype:"img",datas:{name:imageListRef.current[inputIndex].name}})
      const image = imageListRef.current[inputIndex];
      image.name=image.name.split(".")[0]
      try {
        // 检查是否已有压缩版本
        if (image.compressedUrl) {
          return updateResData(input,{msg:image.compressedUrl})
        }
        let processedDataUrl = image.dataUrl;
        try {
          //sampleratio>1 表示最大尺寸=5000
          const compressedDataUrl = await utilsImg.processImageWithSampling(image.dataUrl, 1.1);
          setImageList(prev => prev.map((item, idx) => 
            idx === inputIndex 
              ? { ...item, compressedUrl: compressedDataUrl }
              : item
          ));
          processedDataUrl = compressedDataUrl;
        } catch (compressionError) {
          console.error('图片压缩失败:', compressionError);
        }
        return updateResData(input,{msg:processedDataUrl})
      } catch (error) {
        console.error('图片处理失败:', error);
        return updateResData(input,{msg:image.dataUrl})
      }
    }
    input=updateResData(input,{msg:"",continue:true,msgtype:"text",datas:{}})
    return input
  }

  /**
   * 处理单个文件上传
   */
  const processSingleFile = async (file: File): Promise<boolean> => {
    try {
      if (file.type.startsWith('image/')) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target!.result!.toString();
            setImageList(prev => [...prev, { 
              name: file.name, 
              dataUrl: dataUrl,
              type: file.type,
              originalType: file.type
            }]);
            resolve(true);
          };
          reader.onerror = () => {
            window.messageApi.error(`文件 ${file.name} 读取失败`);
            resolve(false);
          };
          reader.readAsDataURL(file);
        });
      }
      // 处理PDF文件
      else if (file.type === 'application/pdf') {
        const messageKey = `pdfProcessing-${file.name}`;
        window.messageApi.loading({ 
          content: `正在处理PDF文件 ${file.name}...`, 
          key: messageKey,
          duration: 0
        });
        
        return new Promise(async (resolve) => {
          try {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const pdfDataUrl = e.target!.result!.toString();
                try {
                  const samplingRate = 1;
                  const imageArray = await pdfToImgFun(pdfDataUrl, samplingRate);
                  
                  if (imageArray && imageArray.length > 0) {
                    const newImages = imageArray.map((imgDataUrl, index) => ({
                      name: `${file.name} - 第${index + 1}页`, 
                      dataUrl: imgDataUrl,
                      type: 'image/jpeg',
                      originalType: 'application/pdf'
                    }));
                    
                    setImageList(prev => [...prev, ...newImages]);
                    window.messageApi.success({ 
                      content: `PDF文件 ${file.name} 已转换为${imageArray.length}张图片`, 
                      key: messageKey
                    });
                    resolve(true);
                  } else {
                    window.messageApi.error({ 
                      content: '网页端不支持pdf转换，请使用电脑客户端，或者直接使用图片', 
                      key: messageKey
                    });
                    resolve(false);
                  }
                } catch (error) {
                  console.error("PDF转换失败:", error);
                  window.messageApi.error({ 
                    content: config.Errors.pdf, 
                    key: messageKey
                  });
                  resolve(false);
                }
              } catch (error) {
                console.error("PDF数据URL处理失败:", error);
                window.messageApi.error({ 
                  content: `PDF数据处理失败: ${error instanceof Error ? error.message : String(error)}`, 
                  key: messageKey
                });
                resolve(false);
              }
            };
            
            reader.onerror = (error) => {
              console.error("PDF文件读取失败:", error);
              window.messageApi.error({ 
                content: `文件 ${file.name} 读取失败`, 
                key: messageKey
              });
              resolve(false);
            };
            
            reader.readAsDataURL(file);
          } catch (error) {
            console.error("PDF处理主流程失败:", error);
            window.messageApi.error({ 
              content: `PDF处理失败: ${error instanceof Error ? error.message : String(error)}`, 
              key: messageKey
            });
            resolve(false);
          }
        });
      } else {
        window.messageApi.error(`不支持的文件类型: ${file.name}，请上传图片或PDF文件`);
        return false;
      }
    } catch (error) {
      console.error(`文件 ${file.name} 处理失败:`, error);
      window.messageApi.error(`文件处理失败: ${error}`);
      return false;
    }
  };
  /**
   * 处理文件队列
   */
  const processFileQueue = async () => {
    if (isProcessingQueue.current || fileProcessingQueue.current.length === 0) {
      return;
    }
    try {
      isProcessingQueue.current = true;
      setIsProcessing(true);
      
      // 处理队列中的所有文件，确保按顺序处理
      while (fileProcessingQueue.current.length > 0) {
        const file = fileProcessingQueue.current[0];
        await processSingleFile(file);
        // 处理完成后从队列中移除
        fileProcessingQueue.current.shift();
      }
    } finally {
      isProcessingQueue.current = false;
      setIsProcessing(false);
      onUpload()
    }
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (file: File) => {
    if (isProcessing) {
      window.messageApi.warning('正在处理文件，请稍候再试');
      return false;
    }
    // 将文件添加到处理队列
    fileProcessingQueue.current.push(file);
    // 如果队列未在处理中，开始处理
    if (!isProcessingQueue.current) {
      processFileQueue();
    }
    return false; // 阻止默认上传行为
  };
  /**
   * 渲染右键菜单
   */
  const renderContextMenu = () => {
    return null; // 简化实现，先不添加右键菜单
  };
  // 添加键盘事件监听
  useEffect(() => {
    // 只有在模态框打开时才添加键盘监听
    if (selectedImageIndex !== -1) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          if (selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
          } else {
            window.messageApi.warning("已经是第一张图片");
          }
        } else if (e.key === 'ArrowRight') {
          if (selectedImageIndex < imageList.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
          } else {
            window.messageApi.warning("已经是最后一张图片");
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedImageIndex, imageList.length]);

  function onUpload(): void {
    let length=imageListRef.current.length
    let min=Math.min(countToken/2000,length)
    if(min<length){
      setAlert(true)
      if (alertTimeoutRef.current !== undefined) {
        clearTimeout(alertTimeoutRef.current);
      }
      alertTimeoutRef.current = window.setTimeout(()=>{
        setAlert(false)
      },10000)
    }
  }

  return (
    <NodeCore0 data={data} id={id} run0={run0}
      handles={[-1,0]} root={true} tips={["序号","图片"]}
    >
      <HandleOutputImg />
      <div style={{ height: "100%", zIndex: 10000, overflowY: "auto", overflowX: "hidden" }}>
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gap: '2px',
            maxHeight: '150px',
          }}
        >
          <div
            style={{
              width: '100%', 
              aspectRatio: '1/1',
              backgroundColor: '#f8f8f8',
              cursor: 'pointer',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
            title="上传图片"
          >
            <Upload 
              id="image-upload"
              showUploadList={false}
              accept="image/*,.pdf"
              beforeUpload={handleFileUpload}
              multiple={true}
              maxCount={200}
              disabled={isProcessing}
            >
              <Tooltip title={"图片数量不建议超过资源点数的一半,以避免资源点不足导致中断"} open={alert}>
                <Icon.PlusOutlined style={{ fontSize: '16px' }}/>
              </Tooltip>
            </Upload>
          </div>
          <div 
            style={{ 
              width: '100%', 
              aspectRatio: '1/1',
              backgroundColor: '#fff0f0',
              cursor: 'pointer',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
            onClick={() => {
              setImageList([]);
              setSelectedImageIndex(-1);
            }}
            title="清空所有图片"
          >
            <DeleteOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />
          </div>
          
          {imageList.map((item, index) => (
            <div 
              key={index}
              style={{ 
                width: '100%', 
                aspectRatio: '1/1',
                backgroundColor: selectedImageIndex === index ? '#e6f7ff' : '#f0f0f0',
                cursor: 'pointer',
                border: selectedImageIndex === index ? '1px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}
              // onClick={() => handleSelectImage(index)}
              title={item.name}
            >
              <div 
                style={{position:"absolute",fontSize:8,zIndex:10000,top:0,right:0,backgroundColor:"rgba(0,0,0,0.5)",color:"white",padding:"1px 3px",borderRadius:"2px"}}
                onClick={()=>{
                  setImageList(imageList.filter((_,i)=>i!==index))
                }}
              >
                X
              </div>
              <ImageDisplay
                src={item.dataUrl}
                alt={item.name}
                onClick={() => {
                  setSelectedImageIndex(index)
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
          {/* 预览模态框 */}
      {imageList.length>0&&selectedImageIndex!=-1&&
      <Modal
        open={selectedImageIndex!=-1}
        footer={null}
        onCancel={()=>{
          setSelectedImageIndex(-1)
        }}
        width="auto"
        centered
        styles={{ 
          body: { padding: 0, backgroundColor: "transparent" }
        }}
        style={{ maxWidth: "90vw" }}
      >
        <Flex justify="center" vertical gap="middle">
          <img 
            src={imageList[selectedImageIndex].dataUrl} 
            alt={imageList[selectedImageIndex].name} 
            style={{ 
              maxWidth: "100%", 
              maxHeight: "80vh",
              margin: "0 auto",
              display: "block"
            }} 
          />
          <Flex justify="center" gap="middle">
            <Tooltip title="移除此图">
              <Button
                size="large"
                icon={<DeleteOutlined style={{ fontSize: '16px', color: 'white' }} />}
                type="primary"
                danger
                onClick={()=>{
                  setImageList(imageList.filter((_,i)=>i!==selectedImageIndex))
                }}
              ></Button>
            </Tooltip>
            <Tooltip title="上一张">
              <Button 
                size="large" 
                icon={<LeftOutlined />}
                onClick={()=>{
                  if(selectedImageIndex>0){
                    setSelectedImageIndex(selectedImageIndex-1)
                  }else{
                    window.messageApi.warning("已经是第一张图片")
                  }
                }}
              ></Button>
            </Tooltip>
            <Tooltip title="下一张">
              <Button 
                size="large" 
                icon={<RightOutlined />}
                onClick={()=>{
                  if(selectedImageIndex<imageList.length-1){
                    setSelectedImageIndex(selectedImageIndex+1)
                  }else{
                    window.messageApi.warning("已经是最后一张图片")
                  }
                }}
              ></Button>
            </Tooltip>
          </Flex>
        </Flex>
      </Modal>
      }
      {renderContextMenu()}
    </NodeCore0>
  );
} 
