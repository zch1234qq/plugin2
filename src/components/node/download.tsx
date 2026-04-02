import Shell from "./shell1";
import { useEffect, useState, useRef, useCallback } from "react";
import utils from "../../common/utils";
import { NodeData, RecordNodeLabel, Res } from "../../common/types/types";
import './style.css'
import { Button } from "antd";
// 使用Tauri的插件API保存文件
import { DownloadTaskItem, stateDownloadManagerVisible, stateDownloadPath, stateDownloadTasks } from "../../common/store/store";
import { useAtom } from "jotai";
import { open } from '@tauri-apps/plugin-dialog';
import {invoke} from "@tauri-apps/api/core"
import { downloadDir,join } from "@tauri-apps/api/path";
import config from "../../common/config/config";
import { exportCsvToXlsx } from "../../utils/exportToXlsxUtils";
import { exportMultiSheetsToXLSX, exportToDocxFile, isValidCSV, saveBlobWithAbort, saveTextFile } from "../../utils/downloadFormatUtils";
import HandleInputText from "../HandleInputText";
import HandleOutputText from "../HandleOutputText";

const fileTypeOptions = [
  { value: 'excel', label: 'excel' },
  { value: 'sheets', label: 'sheets' },
  { value: 'csv', label: 'csv' },
  { value: 'txt', label: 'txt' },
  { value: 'docx', label: 'word' },
  { value: 'markdown', label: 'md' },
  { value: '图片', label: '图片' }
];
export default function Download({id,data}:{id:string,data:NodeData}){
  const [updateFlag,]=useState(false)
  const [ ,setResult]=useState("")
  const [v0,setV0Core]=useState("excel")
  const v0Ref=useRef(v0)
  // 添加下载控制器引用
  const abortControllerRef = useRef<AbortController | null>(null);
  const downloadingRef = useRef(false);
  const [downloadPath,setDownloadPath]=useAtom(stateDownloadPath)
  const [, setDownloadTasks] = useAtom(stateDownloadTasks)
  const [, setDownloadManagerVisible] = useAtom(stateDownloadManagerVisible)
  const refDownloadPath=useRef(downloadPath)
  const lastSavedPathRef = useRef("")
  const [selectingPath, setSelectingPath] = useState(false);
  const defaultPath=useRef("")
  const [showNode,_]=useState(true)
  // 添加下拉菜单状态
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createDownloadTask = useCallback((fileName: string, fileType: string): string | null => {
    if (!config.isDesktop) return null;
    const now = Date.now();
    const taskId = `download_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const task: DownloadTaskItem = {
      id: taskId,
      fileName,
      fileType,
      status: "in_progress",
      progress: 5,
      createdAt: now,
      updatedAt: now,
    };
    setDownloadTasks((prev) => [task, ...prev].slice(0, 200));
    setDownloadManagerVisible(true);
    return taskId;
  }, [setDownloadManagerVisible, setDownloadTasks]);

  const updateDownloadTask = useCallback((taskId: string | null, patch: Partial<DownloadTaskItem>) => {
    if (!taskId) return;
    setDownloadTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, ...patch, updatedAt: Date.now() } : item))
    );
  }, [setDownloadTasks]);

  /**
   * 保存数据到文件（支持文本和二进制数据）
   * @param fileName - 文件名（包含扩展名）
   * @param data - 要保存的数据（可以是 Blob、Uint8Array 或其他二进制数据）
   * @returns Promise<void>
   */
  async function SaveCustom(fileName: string, data: Blob | Uint8Array): Promise<void> {
    let pathAbs = await join(refDownloadPath.current || defaultPath.current, fileName);
    
    try {
      let base64String: string;
      
      // 处理不同类型的输入数据
      if (data instanceof Blob) {
        // 如果是 Blob 类型，转换为 ArrayBuffer 再转 Base64
        const arrayBuffer = await data.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        base64String = btoa(
          bytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
      } else if (data instanceof Uint8Array) {
        // 如果是 Uint8Array 类型，直接转换为 Base64
        base64String = btoa(
          data.reduce((str, byte) => str + String.fromCharCode(byte), '')
        );
      } else {
        throw new Error('不支持的数据类型');
      }
      
      // 调用 Tauri 命令保存文件
      await invoke('save_file_to_path', {
        path: pathAbs,
        content: base64String,
        isBase64: true  // 注意这里使用驼峰命名法
      });
      lastSavedPathRef.current = pathAbs;
    } catch (error) {
      console.error('下载失败:', error);
      window.messageApi.error(`保存文件失败: ${error}`);
      throw error;
    }
  }

  
  async function InitPathDownload() {
    let v=await downloadDir()
    defaultPath.current=v
  }

  useEffect(()=>{
    refDownloadPath.current=downloadPath
  },[downloadPath])

  useEffect(()=>{
    setV0Core(data.values[0]||"excel")
    v0Ref.current=data.values[0]||"excel"
  },[data.values])

  // 监听程序退出和组件卸载，中断下载操作
  useEffect(() => {
    InitPathDownload()
    // 处理窗口关闭事件
    const handleBeforeUnload = () => {
      if (downloadingRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    // 组件卸载时清理
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 中止任何正在进行的下载
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 添加点击外部关闭下拉菜单的功能
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    // 添加全局点击事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 清理事件监听器
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function setV0(value:string){
    setV0Core(value)
    data.values[0]=value
    v0Ref.current=value
  }

  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run
  };

  const switchTypeMsg=useCallback((input:Res)=>{
    switch(v0){
      case "excel":
        input.msgtypeRe="excel"
        break
      case "sheets":
        input.msgtypeRe="excel"
        break
      case "csv":
        input.msgtypeRe="excel"
        break 
      case "图片":
        input.msgtypeRe="img"
        break
      default:
        input.msgtypeRe="text"
    }
    return input
  },[v0])


  async function run(input:Res):Promise<Res>{
    input=switchTypeMsg(input)
    setResult(input.msg)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // 中止之前可能正在进行的下载
    }
    abortControllerRef.current = new AbortController();
    downloadingRef.current = true;
    try {
      if (v0Ref.current==="图片") {
        const fileName = input.datas?.["name"] || `${input.loopIteration??1}${RecordNodeLabel[data.label]}`;
        const imageType = input.msg.split(';')[0]?.split('/')[1] || "png";  // 获取图片类型 (png/jpeg等)
        const finalFileName = `${fileName}.${imageType}`;
        lastSavedPathRef.current = "";
        const taskId = createDownloadTask(finalFileName, "图片");
        try {
          updateDownloadTask(taskId, { progress: 20 });
          const cleanedUrl = input.msg.split(',').length > 1
            ? `data:image/${imageType};base64,${input.msg.split(',')[1]}`
            : input.msg;
          const blob = await fetch(cleanedUrl, { signal: abortControllerRef.current.signal }).then(res => res.blob());
          updateDownloadTask(taskId, { progress: 70 });
          await saveBlobWithAbort(blob, finalFileName, abortControllerRef.current.signal, {
            isDesktop: config.isDesktop,
            saveCustom: SaveCustom,
          });
          updateDownloadTask(taskId, {
            status: "success",
            progress: 100,
            path: lastSavedPathRef.current || undefined,
            error: undefined,
          });
          window.messageApi.success(`图片已成功保存为 ${finalFileName}`);
          if (input.datas) {
            input.datas["name"] = finalFileName;
          }else{
            input.datas={
              "name": finalFileName
            }
          }
          return input;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            updateDownloadTask(taskId, {
              status: "cancelled",
              progress: undefined,
              error: undefined,
            });
            utils.log(`图片下载已取消`);
            window.messageApi.info('图片下载已取消');
          } else {
            updateDownloadTask(taskId, {
              status: "error",
              progress: undefined,
              error: (error as Error)?.message || String(error),
            });
            utils.log(`保存base64图片时出错: ${error}`);
            window.messageApi.error('保存图片失败');
          }
          return input;
        }
      }
      
      // 原有的文本处理逻辑
      await convertToTable(input, input.loopIteration??1, abortControllerRef.current.signal);
      return input;
    } finally {
      downloadingRef.current = false;
    }
  }

  function onClick(){
    utils.log(id);
  }

  type ExportMessages = {
    success: string | (() => string);
    abort: string;
    abortLog?: string;
    error: string;
    errorLogPrefix: string;
  };

  async function executeExport(
    signal: AbortSignal,
    task: () => Promise<void>,
    messages: ExportMessages,
    taskId: string | null
  ): Promise<void> {
    try {
      updateDownloadTask(taskId, {
        status: "in_progress",
        progress: 20,
      });
      await task();
      if (!signal.aborted) {
        updateDownloadTask(taskId, {
          status: "success",
          progress: 100,
          path: lastSavedPathRef.current || undefined,
          error: undefined,
        });
        const successMsg = typeof messages.success === 'function' ? messages.success() : messages.success;
        window.messageApi.success(successMsg);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        updateDownloadTask(taskId, {
          status: "cancelled",
          progress: undefined,
          error: undefined,
        });
        if (messages.abortLog) {
          utils.log(messages.abortLog);
        }
        window.messageApi.info(messages.abort);
      } else {
        updateDownloadTask(taskId, {
          status: "error",
          progress: undefined,
          error: (e as Error)?.message || String(e),
        });
        utils.log(`${messages.errorLogPrefix}: ${e}`);
        window.messageApi.error(messages.error);
      }
    }
  }
 
  async function convertToTable(input: Res, loopIteration: number, signal: AbortSignal) {
    let result = input.msg;

    try {
      if (signal.aborted) {
        throw new DOMException('下载已取消', 'AbortError');
      }
      
      const processedContent = result || "";
      const isEmptyContent = processedContent.trim() === "";
      const fileType = v0Ref.current;
      const fileName = input.datas?.["name"] || `${loopIteration}${RecordNodeLabel[data.label]}`;

      if (!isEmptyContent && (fileType === 'excel' || fileType === 'csv')) {
        if (!isValidCSV(processedContent)) {
          window.messageApi.error(`输入数据格式不正确，无法保存为${fileType === 'excel' ? 'Excel' : 'CSV'}格式`);
          return;
        }
      }

      const extension = fileType === "docx" ? "docx" : fileType === "markdown" ? "md" : fileType;
      lastSavedPathRef.current = "";
      const taskId = createDownloadTask(`${fileName}.${extension}`, fileType);

      let docxOutputType: 'docx' | 'txt' = 'docx';
      const exportByType: Record<string, () => Promise<void>> = {
        excel: () =>
          exportCsvToXlsx({
            csvData: processedContent,
            fileName,
            signal,
            isDesktop: config.isDesktop,
            saveCustom: SaveCustom,
          }),
        sheets: () =>
          isEmptyContent
            ? exportCsvToXlsx({
                csvData: "",
                fileName,
                signal,
                isDesktop: config.isDesktop,
                saveCustom: SaveCustom,
              })
            : exportMultiSheetsToXLSX({
                sheets: JSON.parse(processedContent),
                fileName,
                signal,
                isDesktop: config.isDesktop,
                saveCustom: SaveCustom,
              }),
        csv: () =>
          saveTextFile({
            content: processedContent,
            filename: fileName,
            fileType: 'csv',
            signal,
            isDesktop: config.isDesktop,
            saveCustom: SaveCustom,
          }),
        docx: async () => {
          docxOutputType = await exportToDocxFile({
            content: processedContent,
            fileName,
            signal,
            isDesktop: config.isDesktop,
            saveCustom: SaveCustom,
          });
        },
      };

      const defaultExport = () =>
        saveTextFile({
          content: processedContent,
          filename: fileName,
          fileType,
          signal,
          isDesktop: config.isDesktop,
          saveCustom: SaveCustom,
        });

      const exportMessagesByType: Record<string, ExportMessages> = {
        excel: {
          success: isEmptyContent ? '空Excel文件已成功导出' : 'Excel文件已成功导出',
          abort: 'Excel导出已取消',
          abortLog: !isEmptyContent ? 'Excel导出已取消' : undefined,
          error: isEmptyContent ? '导出空Excel文件失败' : '转换为Excel格式失败',
          errorLogPrefix: isEmptyContent ? '导出空Excel文件时出错' : '转换为Excel格式时出错',
        },
        sheets: {
          success: isEmptyContent ? '空Excel文件已成功导出' : 'Excel文件已成功导出',
          abort: 'Excel导出已取消',
          abortLog: !isEmptyContent ? 'Excel导出已取消' : undefined,
          error: isEmptyContent ? '导出空Excel文件失败' : '转换为Excel格式失败',
          errorLogPrefix: isEmptyContent ? '导出空Excel文件时出错' : '转换为Excel格式时出错',
        },
        csv: {
          success: isEmptyContent ? '空CSV文件已成功导出' : 'CSV文件已成功导出',
          abort: 'CSV导出已取消',
          abortLog: !isEmptyContent ? 'CSV导出已取消' : undefined,
          error: isEmptyContent ? '导出空CSV文件失败' : '转换为CSV格式失败',
          errorLogPrefix: isEmptyContent ? '导出空CSV文件时出错' : '转换为CSV格式时出错',
        },
        docx: {
          success: () => (docxOutputType === 'docx' ? 'Word文件已成功导出' : 'Word导出失败，已回退为TXT文件'),
          abort: 'Word导出已取消',
          abortLog: 'Word导出已取消',
          error: '转换为Word格式失败',
          errorLogPrefix: '转换为Word格式时出错',
        },
      };

      const defaultMessages: ExportMessages = {
        success: isEmptyContent ? `空${fileType.toUpperCase()}文件已成功导出` : `${fileType.toUpperCase()}文件已成功导出`,
        abort: '文件导出已取消',
        error: `保存文件失败: ${fileType}`,
        errorLogPrefix: '保存文件时出错',
      };

      const exportTask = exportByType[fileType] || defaultExport;
      const exportMessages = exportMessagesByType[fileType] || defaultMessages;

      await executeExport(signal, exportTask, exportMessages, taskId);
      return;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        utils.log(`文件导出已取消`);
        window.messageApi.info('文件导出已取消');
      } else {
        utils.log(`保存文件时出错: ${error}`);
        window.messageApi.error(`保存文件失败: ${error}`);
      }
    }
  }
 
  /**
   * 打开文件夹选择对话框设置下载路径
   */
  async function selectDownloadPath() {
    if (selectingPath) return; // 防止重复点击
    
    setSelectingPath(true);
    try {
      if (config.isDesktop) {
        // 在Tauri 2环境中使用对话框API
        const selected = await open({
          directory: true,
          multiple: false,
          title: "选择下载文件保存位置"
        });
        
        if (selected) {
          // 更新全局状态中的下载路径
          setDownloadPath(selected);
          window.messageApi.success(`下载路径已设置为: ${selected}`);
        }
      } else {
        // 在浏览器环境中提示不支持
        window.messageApi.info("浏览器环境不支持选择下载路径，文件将保存到浏览器默认下载位置");
      }
    } catch (error) {
      console.error("选择下载路径失败:", error);
      window.messageApi.error("网页端仅使用默认路径");
    } finally {
      setSelectingPath(false);
    }
  }

  return(
    <Shell width={100} data={data} updateFlag={updateFlag} id={id} runs={runs} onClick={onClick}
    >
      {showNode&&
        <div 
          className="nodrag custom-dropdown-container" 
          style={{ 
            pointerEvents: 'all',
            position: 'relative',
            width: '100%'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          ref={dropdownRef}
        >
          {/* 自定义下拉框 */}
          <div 
            className="custom-dropdown-header"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              padding: '4px 8px',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <span translate="no">{fileTypeOptions.find(opt => opt.value === v0)?.label || v0}</span>
            <span style={{ fontSize: '12px' }}>▼</span>
          </div>
          
          {/* 下拉菜单 */}
          {dropdownOpen && (
            <div 
              className="custom-dropdown-menu"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '2px',
                zIndex: 99999,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {fileTypeOptions.map(option => (
                <div 
                  key={option.value}
                  translate="no"
                  className="custom-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setV0(option.value);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer',
                    backgroundColor: v0 === option.value ? '#e6f7ff' : 'transparent',
                    borderLeft: v0 === option.value ? '2px solid #1890ff' : 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = v0 === option.value ? '#e6f7ff' : 'transparent';
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      }
      {
        config.isDesktop&&showNode&&
        <div style={{marginTop:2}}>
          <Button 
            type="primary"
            onClick={selectDownloadPath}
            loading={selectingPath}
            style={{ width: '100%' }}
          >
            设置路径
          </Button>
        </div>
      }
      <HandleInputText />
      <HandleOutputText />
    </Shell>
  )
}