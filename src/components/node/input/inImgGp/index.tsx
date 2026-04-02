import { NodeData, Relation, Res } from "../../../../common/types/types";
import './style.css'
import { useEffect, useRef, useState } from "react";
import { Button, Flex, Modal, Popover, Tooltip, Upload, theme as antdTheme } from "antd";
import { DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import * as Icon from '@ant-design/icons';
import NodeCore0 from "../../_node0";
import pdfjs from "../../../../common/pdf/pdfLoader";
import utilsImg from "../../../../common/utilsImg";
import ImageDisplay from "../../../ImageDisplay";
import ComDropdown from "../../../ComDropdown"; // 导入自定义下拉选择器
import config from "../../../../common/config/config";
import { updateResData } from "../../../../common/utils";
import store, { stateCountToken } from "../../../../common/store/store";
import { useAtomValue } from "jotai";

/**
 * 将PDF转换为图片数组
 * @param pdfUrl PDF文件的URL或base64数据
 * @param samplingRate 抽样率，值为1-10，1表示不抽样，10表示最大抽样
 * @returns 返回PDF各页的图片数组
 */
async function pdfToImgFun(pdfUrl: string, samplingRate: number = 1): Promise<string[]> {
  console.time("pdfConversion");
  let dpi = 200; // 提高 DPI 以获得更清晰的图片
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

function getNameWithoutExtension(fileName: string): string {
  const name = (fileName || "").trim();
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return name;
  }
  return name.slice(0, lastDotIndex);
}

/**
 * 图片组节点组件
 * 支持多图片输入，包括PDF文件(自动转换为图片)
 */
export default function ImageGroup({id, data}: {id: string, data: NodeData}) {
  const [imageList, setImageList] = useState<{
    name: string, 
    dataUrl: string,      // 原始数据
    compressedUrl?: string, // 压缩后的数据
    type: string, 
    originalType?: string
  }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [completedImageIndexes, setCompletedImageIndexes] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false); // 添加处理状态标记
  const [samplingRatio, setSamplingRatio] = useState<number>(0.9); // 抽样率状态，1表示不进行抽样
  const imageListRef = useRef(imageList);
  const completedImageIndexesRef = useRef(completedImageIndexes);
  const samplingRatioRef = useRef(samplingRatio); // 创建一个ref跟踪最新的samplingRatio值
  const refRelations = useRef<Record<string, Relation[]>>(store.relations);
  // 添加文件处理队列
  const fileProcessingQueue = useRef<File[]>([]);
  const isProcessingQueue = useRef<boolean>(false);
  const countToken = useAtomValue(stateCountToken);
  const [, setAlert] = useState(false);
  const alertTimeoutRef = useRef<number | undefined>(undefined);
  const fileOrderCollator = useRef(new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }));
  const { token } = antdTheme.useToken();
  
  useEffect(()=>{
    if(data.values[0]){
      setSamplingRatio(Number(data.values[0]))
    }
  },[])

  useEffect(()=>{
    data.values[0]=samplingRatio.toString()
    samplingRatioRef.current=samplingRatio
  },[samplingRatio])

  useEffect(() => {
    imageListRef.current = imageList;
  }, [imageList]);

  useEffect(() => {
    completedImageIndexesRef.current = completedImageIndexes;
  }, [completedImageIndexes]);
  
  useEffect(() => {
    samplingRatioRef.current = samplingRatio; // 更新ref值
  }, [samplingRatio]);

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
    const previousIndex = inputIndex - 1;
    if (previousIndex >= 0 && previousIndex < imageListRef.current.length) {
      setCompletedImageIndexes((prev) => {
        if (prev.has(previousIndex)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(previousIndex);
        return next;
      });
    }
    if (imageListRef.current.length > 0 && inputIndex >= 0 && inputIndex < imageListRef.current.length) {
      const image = imageListRef.current[inputIndex];
      const imageName = getNameWithoutExtension(image.name);
      input=updateResData(input,{msgtype:"img",datas:{name:imageName}})
      const currentRatio = samplingRatioRef.current;
      try {
        // 检查是否已有压缩版本
        if (image.compressedUrl) {
          if (currentRatio < 1) {
            const processedDataUrl = await utilsImg.processImageWithSampling(image.compressedUrl, currentRatio);
            return updateResData(input,{msg:processedDataUrl,msgtypeRe:"img"})
          }
          return updateResData(input,{msg:image.compressedUrl,msgtypeRe:"img"})
        }
        let processedDataUrl = image.dataUrl;
        try {
          const compressedDataUrl = await utilsImg.processImageWithSampling(image.dataUrl, 1);
          setImageList(prev => prev.map((item, idx) => 
            idx === inputIndex 
              ? { ...item, compressedUrl: compressedDataUrl }
              : item
          ));
          processedDataUrl = compressedDataUrl;
        } catch (compressionError) {
          console.error('图片压缩失败:', compressionError);
        }
        if (currentRatio < 1) {
          try {
            processedDataUrl = await utilsImg.processImageWithSampling(processedDataUrl, currentRatio);
          } catch (samplingError) {
            console.error('图片抽样处理失败:', samplingError);
          }
        }
        return updateResData(input,{msg:processedDataUrl,msgtypeRe:"img"})
      } catch (error) {
        console.error('图片处理失败:', error);
        return updateResData(input,{msg:image.dataUrl,msgtypeRe:"img"})
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
      const lowerName = (file.name || '').toLowerCase();
      const ext = lowerName.includes('.') ? lowerName.split('.').pop()! : '';
      const isHeicLike = ext === 'heic' || ext === 'heif';
      const inferredImageMime = isHeicLike ? (ext === 'heif' ? 'image/heif' : 'image/heic') : '';
      const isImage = file.type.startsWith('image/') || isHeicLike;
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';

      if (isImage) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target!.result!.toString();
            setImageList(prev => [...prev, { 
              name: getNameWithoutExtension(file.name), 
              dataUrl: dataUrl,
              type: file.type || inferredImageMime || 'image/*',
              originalType: file.type || inferredImageMime || 'image/*'
            }]);
            resolve(true);
          };
          reader.onerror = () => {
            window.messageApi.error(`文件 ${file.name} 读取失败`);
            resolve(false);
          };
          // Windows 上 HEIC/HEIF 常出现 file.type 为空，导致 DataURL 头部缺少 mime
          const fileForRead =
            !file.type && inferredImageMime
              ? new File([file], file.name, { type: inferredImageMime })
              : file;
          reader.readAsDataURL(fileForRead);
        });
      }
      // 处理PDF文件
      else if (isPdf) {
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
                    const baseName = getNameWithoutExtension(file.name);
                    const newImages = imageArray.map((imgDataUrl, index) => ({
                      name: `${baseName} - 第${index + 1}页`, 
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
            
            const fileForRead =
              !file.type && ext === 'pdf'
                ? new File([file], file.name, { type: 'application/pdf' })
                : file;
            reader.readAsDataURL(fileForRead);
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
      
      // 排序：优先按文件夹路径顺序，其次按文件名顺序
      if (fileProcessingQueue.current.length > 1) {
        fileProcessingQueue.current.sort((a, b) => {
          const pathA = (a as File & { webkitRelativePath?: string }).webkitRelativePath || a.name;
          const pathB = (b as File & { webkitRelativePath?: string }).webkitRelativePath || b.name;
          const cmp = fileOrderCollator.current.compare(pathA, pathB);
          if (cmp !== 0) return cmp;
          return (a.lastModified || 0) - (b.lastModified || 0);
        });
      }
      
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

  function callbackTrigger(){
    // 仅当存在多张图片时才自动清理，避免单图场景被误删
    if (imageListRef.current.length <= 1) {
      return;
    }
    const doneIndexes = completedImageIndexesRef.current;
    if (!doneIndexes || doneIndexes.size === 0) {
      return;
    }
    const nextImageList = imageListRef.current.filter((_, idx) => !doneIndexes.has(idx));
    // run0 紧接着会读取 ref，这里先同步 ref，避免读到 setState 之前的旧值
    window.messageApi.success(`已自动移除${doneIndexes.size}张已完成图片`)
    imageListRef.current = nextImageList;
    completedImageIndexesRef.current = new Set();
    setImageList(nextImageList);
    setCompletedImageIndexes(new Set());
    setSelectedImageIndex(-1);
  }

  return (
    <NodeCore0 data={data} id={id} run0={run0}
      handles={[1,0]} colors={[1,0]} root={true} tips={["输出图片","输入序号"]}
      callbackTrigger={callbackTrigger}
    >
      <div style={{ height: "100%", zIndex: 10000, overflowY: "auto", overflowX: "hidden" }}
        onClick={()=>{
          console.log(completedImageIndexesRef.current)
        }}
      >
        <div className="imgCount" style={{color:'gray'}}>
          {imageList.length==0?"":imageList.length}
        </div>
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '2px',
          }}
        >
          <div
            style={{
              width: '100%', 
              aspectRatio: '1/1',
              backgroundColor: token.colorBgContainer,
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              color: token.colorTextSecondary,
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
            title="输入图片"
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* 单文件上传按钮 */}
              <Upload 
                id="image-upload"
                showUploadList={false}
                accept="image/*,.pdf,.heic,.heif"
                beforeUpload={handleFileUpload}
                multiple={true}
                maxCount={1000}
                disabled={isProcessing}
              >
                <Tooltip title={"选择图片文件（支持多选）"}>
                  <Icon.PlusOutlined style={{ fontSize: 16 }} />
                </Tooltip>
              </Upload>
            </div>
          </div>
          {/* <div
            style={{
              width: '100%', 
              aspectRatio: '1/1',
              backgroundColor: token.colorBgContainer,
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              color: token.colorTextSecondary,
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
            title="输入文件夹"
          >
            <Upload 
              id="folder-upload"
              showUploadList={false}
              beforeUpload={handleFileUpload}
              directory={true}
              multiple={true}
              disabled={isProcessing}
            >
              <Tooltip title={"选择文件夹"}>
                <Icon.FolderOpenOutlined style={{ fontSize: 16 }} />
              </Tooltip>
            </Upload>
          </div> */}
          <div 
            style={{ 
              width: '100%', 
              aspectRatio: '1/1',
              cursor: 'pointer',
              backgroundColor: token.colorBgContainer,
              border: `1px solid ${token.colorBorder}`,
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
              setCompletedImageIndexes(new Set());
            }}
            title="清空所有图片"
          >
            <DeleteOutlined style={{ fontSize: '16px'}} />
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
              {completedImageIndexes.has(index)&& (
                  <Icon.CheckCircleFilled style={{
                      position: "absolute",
                      zIndex: 10001,
                      fontSize: 11,fontWeight: "bold", color: "#52c41a" 
                    
                    }} 
                    title="已完成，下次运行时会自动移除"
                  />
              )}
              <div 
                style={{position:"absolute",fontSize:8,zIndex:10000,top:0,right:0,backgroundColor:"rgba(0,0,0,0.5)",color:"white",padding:"1px 3px",borderRadius:"2px"}}
                onClick={()=>{
                  setImageList(imageList.filter((_,i)=>i!==index))
                  setCompletedImageIndexes((prev) => {
                    if (prev.size === 0) {
                      return prev;
                    }
                    const next = new Set<number>();
                    prev.forEach((i) => {
                      if (i < index) next.add(i);
                      if (i > index) next.add(i - 1);
                    });
                    return next;
                  });
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
      <ComDropdown
        title="降低清晰度可节约资源点，但可能导致图片模糊。"
        options={config.samplingOptions}
        value={samplingRatio}
        onChange={(value) => {
          setSamplingRatio(Number(value));
        }}
        enableWheel={true}
        placeholder="选择清晰度"
      />
    </NodeCore0>
  );
}