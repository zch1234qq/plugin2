import { Flex, Button, Modal, Tooltip, Checkbox } from "antd";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as Icon from '@ant-design/icons';
import { useAtom, useAtomValue } from "jotai";
import { createPortal } from "react-dom";
import { stateDebug, stateGlobalTypeMsg, stateHeaders, stateDownloadIncludeHeader, stateMemoryDownloadFormat } from "../../common/store/store.tsx";
import memory, { atomMemory } from "../../common/store/memory.tsx";
import ComCsvTable from '../ComCsvTable.tsx';
import DebugContentPanel from './DebugContentPanel.tsx';
import MemoryDownloadActions from "./MemoryDownloadActions.tsx";

// 导入样式
import './style.css';
import lineStorage from "../../common/lineStorage.ts";
import config from "../../common/config/config.tsx";

/**
 * 静态内容调试抽屉组件 - 用于显示调试数据
 * @param {string} content - 要显示的内容
 */
export default function ComDrawerStatic({content="",buttonShare}:{content:string,buttonShare?: React.ReactNode}){
  const [debug,] = useAtom(stateDebug);
  const [headers] = useAtom(stateHeaders);
  const globalTypeMsg = useAtomValue(stateGlobalTypeMsg);
  const [downloadIncludeHeader, setDownloadIncludeHeader] = useAtom(stateDownloadIncludeHeader);
  const memoryDownloadFormat = useAtomValue(stateMemoryDownloadFormat);
  const [displayContent, setDisplayContent] = useState("");
  // 图片预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, ] = useState('');
  const [stateMemory,]=useAtom<string[]>(atomMemory);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const debugWindowRef = useRef<HTMLDivElement | null>(null);
  const [memoryPortalContainer, setMemoryPortalContainer] = useState<HTMLDivElement | null>(null);

  // 增加全屏状态，用于控制 drawer 的绝对定位全屏显示
  const [isMemoryFullScreen, setIsMemoryFullScreen] = useState(false);
  // 独立的调试窗口全屏状态
  
  useEffect(() => {
    //将信息初始化到stateMemory
    memory.initializeMemory();
    const handleResize = () => {
      const newIsLandscape = window.innerWidth > window.innerHeight;
      setIsLandscape(newIsLandscape);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const debugWindow = debugWindowRef.current;
    const parentElement = debugWindow?.parentElement;

    if (!parentElement) {
      return;
    }

    const portalContainer = document.createElement("div");
    portalContainer.className = "com-drawer-static-memory-portal";
    parentElement.appendChild(portalContainer);
    setMemoryPortalContainer(portalContainer);

    return () => {
      setMemoryPortalContainer((current) => current === portalContainer ? null : current);
      if (portalContainer.parentElement) {
        portalContainer.parentElement.removeChild(portalContainer);
      }
    };
  }, []);


  // isLandscape 变化会触发重新布局，这里不需要额外副作用
  
  const ComMemoryZone=useMemo(()=>{
    const memoryContent = stateMemory.join("\n");
    let memoryPreview: React.ReactNode;
    switch (memoryDownloadFormat) {
      case "excel":
      case "csv":
        memoryPreview = <ComCsvTable data={memoryContent} />;
        break;
      case "word":
      case "txt":
      case "markdown":
      default:
        memoryPreview = (
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {memoryContent}
          </pre>
        );
        break;
    }

    return(
      <Flex vertical justify="flex-start" align="stretch" className="com-memory-show">
        <Flex
          wrap="wrap"
          gap="small"
          align="center"
          justify="space-between"
          className="com-drawer-static-header com-memory-header"
          style={{padding: 0}}
        >
          <div className="com-drawer-static-header-title">全部记忆</div>
          <Tooltip
            title={
              <p>已写入{stateMemory.length}次</p>
            }
          >
            <span className="com-drawer-static-header-meta">{stateMemory.length}</span>
          </Tooltip>
          <Tooltip title="清空记忆">
            <Button
              danger
              size="middle"
              className="com-drawer-static-icon-button"
              icon={<Icon.DeleteFilled />}
              onClick={async ()=>{
                // setStateMemory([]);
                const result = await lineStorage.clearLines(config.keyToMemoryGen);
                if(result.success){
                  window.messageApi.success(result.msg);
                }else{
                  window.messageApi.error(result.msg);
                }
              }}
            />
          </Tooltip>
          <Tooltip title="勾选后在下载时会自动添加表头(需配合转行类节点)">
            <Checkbox
              checked={downloadIncludeHeader}
              onChange={(e) => setDownloadIncludeHeader(e.target.checked)}
            >
              表头
            </Checkbox>
          </Tooltip>
          <MemoryDownloadActions
            stateMemory={stateMemory}
            headers={headers}
            downloadIncludeHeader={downloadIncludeHeader}
          />
          <Tooltip title={isMemoryFullScreen ? "退出全屏" : "全屏"} placement={!isMemoryFullScreen ? "top" : "bottom"}>
            <Button
              // type="text"
              // shape="circle"
              size="middle"
              className="com-drawer-static-icon-button"
              icon={isMemoryFullScreen ? <Icon.FullscreenExitOutlined/> : <Icon.FullscreenOutlined />}
              onClick={(e)=>{
                e.stopPropagation();
                // 使用函数式更新避免闭包问题
                setIsMemoryFullScreen(prevState => {
                  const newState = !prevState;
                  return newState;
                });
              }}
            />
          </Tooltip>
        </Flex>
        <div className="com-drawer-static-content com-memory-content" style={{boxSizing:"border-box"}}>
          {memoryPreview}
        </div>
      </Flex>
    );
  },[stateMemory,isMemoryFullScreen,downloadIncludeHeader,headers,memoryDownloadFormat]);
  
  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  // 复制内容到剪贴板
  const handleCopy = async () => {
    // 如果是"latest"类型，使用globalTypeMsg
    const currentType = debug.msgtype === "latest" ? globalTypeMsg : debug.msgtype;
    try {
      switch (currentType) {
        case "img":
          // 如果是base64图片数据
          if (debug.data && debug.data.startsWith('data:image')) {
            try {
              // 尝试创建一个可下载的链接
              const link = document.createElement('a');
              link.href = debug.data;
              link.download = `image-${new Date().getTime()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.messageApi.success('已开始下载图片');
            } catch (imgErr) {
              // 如果下载失败，退回到复制链接
              await navigator.clipboard.writeText(debug.data);
              window.messageApi.success('已复制图片链接到剪贴板');
              console.warn('无法直接下载图片，已复制链接', imgErr);
            }
          } else {
            // 如果是URL，直接复制
            await navigator.clipboard.writeText(debug.data);
            window.messageApi.success('已复制图片链接到剪贴板');
          }
          break;
          
        case "excel":
          try {
            // 尝试将CSV格式化为可以直接粘贴到Excel的格式
            const formattedCSV = debug.data
              .replace(/\n/g, '\r\n') // 确保换行符在所有系统上一致
              .replace(/,/g, '\t'); // 用制表符替换逗号，便于粘贴到Excel
            
            await navigator.clipboard.writeText(formattedCSV);
            window.messageApi.success('已复制表格数据到剪贴板 (可直接粘贴到Excel)');
          } catch (csvErr) {
            // 如果格式化失败，复制原始数据
            await navigator.clipboard.writeText(debug.data);
            window.messageApi.success('已复制原始CSV数据到剪贴板');
            console.warn('CSV格式化失败，已复制原始数据', csvErr);
          }
          break;
          
        case "text":
        default:
          // 默认文本复制
          await navigator.clipboard.writeText(debug.data);
          window.messageApi.success('已复制文本到剪贴板');
          break;
      }
    } catch (err) {
      window.messageApi.error('复制失败');
      console.error('复制内容失败:', err);
    }
  };

  const debugWindowStyle = useMemo<CSSProperties>(() => ({
    width: isLandscape ? "100%" : "50%",
    height: isLandscape ? "50%" : "100%",
  }), [isLandscape]);

  const memoryWindowStyle = useMemo<CSSProperties>(() => ({
    width: isMemoryFullScreen ? "100vw" : (isLandscape ? "100%" : "50%"),
    height: isMemoryFullScreen ? "100vh" : (isLandscape ? "50%" : "100%"),
    position: isMemoryFullScreen ? "fixed" : "absolute",
    top: isMemoryFullScreen ? 0 : (isLandscape ? "50%" : 0),
    left: isMemoryFullScreen ? 0 : (isLandscape ? 0 : "50%"),
    right: isMemoryFullScreen ? 0 : undefined,
    bottom: isMemoryFullScreen ? 0 : undefined,
    zIndex: isMemoryFullScreen ? 10000 : 1,
    borderTop: isLandscape && !isMemoryFullScreen ? "1px solid var(--border-color, #e8e8e8)" : undefined,
    borderLeft: !isLandscape && !isMemoryFullScreen ? "1px solid var(--border-color, #e8e8e8)" : undefined,
  }), [isLandscape, isMemoryFullScreen]);

  return(
      <>
      {/* 自定义预览模态框 */}
      <Modal
        open={previewVisible}
        footer={null}
        closable={false}
        onCancel={() => setPreviewVisible(false)}
        width="auto"
        style={{ maxWidth: '90%', maxHeight: '90%' }}
        bodyStyle={{ padding: 0 }}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', cursor: 'pointer' }}
        wrapClassName="custom-image-preview"
        keyboard={true}
      >
        <img 
          src={previewImage} 
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain'
          }}
          onClick={(e) => e.stopPropagation()}
          alt="预览图片" 
        />
      </Modal>
      
      <div
        ref={debugWindowRef}
        className="com-drawer-static-window com-drawer-static-debug-window"
        style={debugWindowStyle}
      >
        <DebugContentPanel
          debug={debug}
          displayContent={displayContent}
          handleCopy={handleCopy}
          buttonShare={buttonShare}
        />
      </div>
      
      {memoryPortalContainer ? createPortal(
        <div
          className="com-drawer-static-window com-drawer-static-memory-window com-drawer-static-bottom-half"
          style={memoryWindowStyle}
        >
          {ComMemoryZone}
        </div>,
        memoryPortalContainer
      ) : null}
    </>
  );
}