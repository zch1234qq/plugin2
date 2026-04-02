import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import { useEffect, useRef, useState } from "react";
import { Upload, Modal } from "antd";
import { DeleteOutlined } from '@ant-design/icons';
import * as Icon from '@ant-design/icons';
import NodeCore0 from "../_node0";
import { fileToText } from "../../../common/file-converter";
import { updateResData } from "../../../common/utils";
import store from "../../../common/store/store";

function getNameWithoutExtension(fileName: string): string {
  const name = (fileName || "").trim();
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return name;
  }
  return name.slice(0, lastDotIndex);
}

/**
 * 文件组节点组件
 * 支持多文件输入
 */
export default function FileGroup({id, data}: {id: string, data: NodeData}) {
  const [fileList, setFileList] = useState<{
    name: string, 
    content: string,
    type: string
  }[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFileContent, setCurrentFileContent] = useState("");
  const [currentFileName, setCurrentFileName] = useState("");
  const fileListRef = useRef(fileList);
  const {relations}=store
  // 添加文件处理队列
  const fileProcessingQueue = useRef<File[]>([]);
  const isProcessingQueue = useRef<boolean>(false);
  
  // useEffect(()=>{
  //   refRelations.current=relations
  // },[])

  useEffect(() => {
    fileListRef.current = fileList;
  }, [fileList]);
  
  /**
   * 运行节点，返回当前选中的文件内容
   */
  async function run0(input: Res): Promise<Res> {
    if(fileListRef.current.length==0){
      return updateResData(input,{success:false,msg:"请先添加文件"})  
    }
    let inputIndex = 0;
    if(relations[id]){
      if (input.success && input.msg) {
        inputIndex = parseInt(input.msg.trim())-1;
        if(!inputIndex){
          inputIndex = 0;
        }
      }
    }
    if (fileListRef.current.length > 0 && inputIndex >= 0 && inputIndex < fileListRef.current.length) {
      const file = fileListRef.current[inputIndex];
      input = updateResData(input, {datas:{name:getNameWithoutExtension(file.name)}})
      return updateResData(input,{msg:file.content})
    }
    return updateResData(input,{success:true,msg:"",continue:true})
  }

  /**
   * 处理单个文件上传
   */
  const processSingleFile = async (file: File): Promise<boolean> => {
    try {
      const messageKey = `fileProcessing-${file.name}`;
      
      return new Promise(async (resolve) => {
        try {
          const content = await fileToText(file);
          setFileList(prev => [...prev, { 
            name: getNameWithoutExtension(file.name), 
            content: content,
            type: file.type
          }]);
          resolve(true);
        } catch (error) {
          console.error(`文件 ${file.name} 处理失败:`, error);
          window.messageApi.error({ 
            content: `文件处理失败: ${error instanceof Error ? error.message : String(error)}`, 
            key: messageKey
          });
          resolve(false);
        }
      });
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
      
      window.messageApi.success({ 
        content: `文件处理完成`, 
        key: "file"
      });
    } finally {
      isProcessingQueue.current = false;
      setIsProcessing(false);
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
   * 处理多个文件上传
   */
  const handleFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    if (isProcessing) {
      window.messageApi.warning('正在处理文件，请稍候再试');
      return;
    }
    
    // 将所有文件添加到处理队列，保持原始顺序
    const files = Array.from(fileList);
    fileProcessingQueue.current.push(...files);
    
    // 如果队列未在处理中，开始处理
    if (!isProcessingQueue.current) {
      processFileQueue();
    }
  };

  /**
   * 处理文件选择并显示文件内容
   */
  const handleSelectFile = (index: number) => {
    setSelectedFileIndex(index);
    if (index >= 0 && index < fileList.length) {
      setCurrentFileName(fileList[index].name);
      setCurrentFileContent(fileList[index].content);
      setModalVisible(true);
    }
  };

  /**
   * 关闭模态窗口
   */
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  /**
   * 渲染右键菜单
   */
  const renderContextMenu = () => {
    return null; // 简化实现，先不添加右键菜单
  };

  /**
   * 渲染文件图标，根据文件类型显示不同图标
   */
  const renderFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <Icon.FilePdfOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />;
    } else if (fileType.includes('text')) {
      return <Icon.FileTextOutlined style={{ fontSize: '16px' }} />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('xlsx')) {
      return <Icon.FileExcelOutlined style={{ fontSize: '16px' }} />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <Icon.FileWordOutlined style={{ fontSize: '16px' }} />;
    } else if (fileType.includes('csv')) {
      return <Icon.FileOutlined style={{ fontSize: '16px' }} />;
    } else {
      return <Icon.FileOutlined style={{ fontSize: '16px' }} />;
    }
  };

  return (
    <NodeCore0 data={data} id={id} run0={run0}
      handles={[1,0]} root={true} tips={["文件内容","序号"]}
    >
      {/* <Handle className="handleRed" id={"0"} type="source" position={Position.Bottom}></Handle> */}
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
            title="上传文件"
          >
            <Upload 
              id="file-upload"
              showUploadList={false}
              accept=".txt,.csv,.doc,.docx,.xlsx,.xls,.pdf"
              beforeUpload={handleFileUpload}
              multiple={true}
              maxCount={1000}
              disabled={isProcessing}
            >
              <Icon.PlusOutlined style={{ fontSize: '16px' }} />
              <input 
                id="file-upload-input" 
                type="file"
                style={{ display: 'none' }} 
                multiple 
                accept=".txt,.csv,.doc,.docx,.xlsx,.xls,.pdf" 
                onChange={(e) => handleFilesUpload(e.target.files)}
              />
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
              setFileList([]);
              setSelectedFileIndex(-1);
            }}
            title="清空所有文件"
          >
            <DeleteOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />
          </div>
          
          {fileList.map((item, index) => (
            <div 
              key={index}
              style={{ 
                width: '100%', 
                aspectRatio: '1/1',
                backgroundColor: selectedFileIndex === index ? '#e6f7ff' : '#f0f0f0',
                cursor: 'pointer',
                border: selectedFileIndex === index ? '1px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column'
              }}
              onClick={() => handleSelectFile(index)}
              title={`点击查看: ${item.name}`}
            >
              {renderFileIcon(item.type)}
              <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%', whiteSpace: 'nowrap' }}>
                {item.name.length > 10 ? `${item.name.substring(0, 10)}...` : item.name}
              </div>
            </div>
          ))}
        </div>

        {/* 移除底部预览区域，只保留模态窗口 */}
      </div>
      {/* 模态窗口显示完整文件内容 */}
      <Modal
        title={currentFileName}
        open={modalVisible}
        onOk={handleCloseModal}
        onCancel={handleCloseModal}
        width={800}
        footer={null}
      >
        <pre style={{ 
          maxHeight: '60vh', 
          overflow: 'auto',
          padding: '10px',
          border: '1px solid #e8e8e8',
          borderRadius: '2px',
          backgroundColor: '#f5f5f5',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {currentFileContent}
        </pre>
      </Modal>
      {renderContextMenu()}
    </NodeCore0>
  );
} 