'use client'
import { Row, Col, Typography, message, Button, theme as antTheme } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './globals.css'
import ComCard from "../components/ComCard.tsx";
import ComCreateCard from "../components/ComCreateCard";
import { Packaging } from "../common/classes.tsx";
import server from "../common/service/server.tsx";
import { LogError } from "../common/Http.tsx";
import { useAtom, useAtomValue } from "jotai";
import { currentIndexState, stateCreated, statePackaging, statePlugins, tokenState, stateUserInfo } from "../common/store/store.tsx";
import LoadingCus from "../components/loadingCus.tsx";
import * as Icon from '@ant-design/icons'
import _ from 'lodash';
import { useCustomNavigate } from "../common/hooks/useCustomNavigate.tsx";
import ComBack from "../components/ComBack.tsx";
import ComCusSvc from "../components/ComCusSvc.tsx";
import { useSearchParams } from "react-router-dom";
import ComModalShare from "../components/ComModalShare.tsx";
import ComModalTemplate from "../components/ComModalTemplate.tsx";
import { importWorkflowCreateAndSave } from "../common/workflowTransfer";
import { exportWorkflowsToZip } from "../common/utils/workflowExport";
import JSZip from "jszip";

const { Title } = Typography;

export default function TableNew() {
  const [,setPackagingCore]=useAtom(statePackaging)
  const [loading,setLoading]=useState(true)
  const [params]=useSearchParams()
  const [modalShare,setModalShare]=useState(false)
  const [shareId,setShareId]=useState("")
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dropHandlerRef = useRef<((file: File) => void) | null>(null)
  const dragCounterRef = useRef(0)

  useEffect(()=>{
    if(params.get("share")){
      var shareIdTem=params.get("share")||""
      setModalShare(true)
      setShareId(shareIdTem)
    }
    setLoading(false)
  },[params])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.types?.includes("Files")) {
      dragCounterRef.current += 1
      setIsDraggingOver(true)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.dataTransfer?.types?.includes("Files")) return
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) setIsDraggingOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDraggingOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (!file) return
    const isJson = file.name.toLowerCase().endsWith(".json") || file.type === "application/json"
    const isZip = file.name.toLowerCase().endsWith(".zip")
      || file.type === "application/zip"
      || file.type === "application/x-zip-compressed"
    if (isJson || isZip) {
      dropHandlerRef.current?.(file)
      return
    }
    message.warning("请导入json或zip类型的文件")
  }, [])

  function setPackaging(packaging:Packaging,ref:boolean){
    packaging.isRef=ref
    setPackagingCore(packaging)
  }
  
  return(
    <LoadingCus isLoading={loading}>
      <div
        style={{ width: "100%", height: "100%", minHeight: "100vh", boxSizing: "border-box" }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {
          modalShare&&
          <ComModalShare shareId={shareId}></ComModalShare>
        }
        <ComBack></ComBack>
        {/* <ComCusSvc></ComCusSvc> */}
        <IconSetting></IconSetting>
        {isDraggingOver && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(24, 144, 255, 0.12)",
              border: "3px dashed #1890ff",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1890ff",
              pointerEvents: "none",
            }}
          >
            松开鼠标导入应用
          </div>
        )}
        <div style={{ 
          width: "100%", 
          height: "100%", 
          padding: "24px",
          boxSizing: "border-box",
          overflow: "auto"
        }}>
          <PluginsCreated setPackaging={setPackaging} registerDropHandler={(fn) => { dropHandlerRef.current = fn }} />
        </div>
      </div>
    </LoadingCus>
  )
}

function IconSetting() {
  const navigate=useCustomNavigate()
  const token=useAtomValue(tokenState)
  const click=useCallback(()=>{
    if(token==""){
      navigate("/localmodel")
    }else{
      navigate("/setting")
    }
  },[token])
  return(
    <Icon.SettingOutlined 
      style={{
        fontSize: 24,
        padding: 12,
        position: "absolute",
        zIndex: 1000,
        right: 0,
        top: 0
      }} 
      onClick={click}
    ></Icon.SettingOutlined>
  )
}

type ArgvsPlugins={
  plugins:Packaging[],
  label:string,
  setPackaging:(packaging:Packaging,ref:boolean)=>void,
  isRef?:boolean
  create?:()=>void,
  onTemplateCreate?:()=>void
  onImport?:(file: File)=>void | Promise<void>
  onExport?:()=>void
}
function Plugins({plugins,label,setPackaging,isRef=false,create, onTemplateCreate, onImport, onExport}:ArgvsPlugins & {create?:()=>void, onTemplateCreate?:()=>void, onImport?:(file: File)=>void | Promise<void>, onExport?:()=>void}) {
  const [_,setIndex]=useAtom(currentIndexState)
  const { token: antdToken } = antTheme.useToken();
  return (
    <div style={{ marginBottom: "32px", boxSizing: "border-box", width: "100%", textAlign: "left" }}>
      <div style={{ 
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        gap: "12px",
        marginBottom: "16px",
      }}>
        <Title level={3} style={{ 
          fontSize: antdToken.fontSizeLG,
          fontWeight: 600,
          margin: 0,
          boxSizing: "border-box",
          textAlign: "left",
          userSelect: "none",
        }}>
          {label}
        </Title>
        {
          plugins.length>0&&
          <Button type="default" onClick={onExport}
            title="导出全部应用"
          >
            导出
          </Button>
        }
      </div>
      {
        <Row gutter={[16, 16]} justify="start">
          {plugins.map((item,index)=>{
            return (
              <Col key={index} xs={12} sm={12} md={8} lg={8} xl={6}>
                <div onClick={()=>{
                  setPackaging(item,isRef)
                  setIndex(item.id)
                }}>
                  <ComCard plugin={item}/>
                </div>
              </Col>
            )
          })}
          {/* 虚线框的新建按钮 */}
          {create && (
            <Col xs={12} sm={12} md={8} lg={8} xl={6}>
              <ComCreateCard 
                onNewCreate={create}
                onTemplateCreate={onTemplateCreate!}
                onImport={onImport!}
              />
            </Col>
          )}
        </Row>
      }
    </div>
  )
}

type ArgvsPluginsCreated={
  setPackaging:(packaging:Packaging,ref:boolean)=>void
  registerDropHandler?:(fn: ((file: File) => void) | null)=>void
}
function PluginsCreated({setPackaging, registerDropHandler}:ArgvsPluginsCreated) {
  const [token,]=useAtom(tokenState)
  const userinfo=useAtomValue(stateUserInfo)
  const [created,setCreated]=useAtom(stateCreated)
  const [,setLoading]=useState(false)
  const [modalTemplateVisible, setModalTemplateVisible] = useState(false);
  const [plugins,setPlugins]=useAtom(statePlugins)
  const createdRef = useRef(created)
  const pluginsRef = useRef(plugins)

  useEffect(() => {
    createdRef.current = created
  }, [created])

  useEffect(() => {
    pluginsRef.current = plugins
  }, [plugins])
  const create=()=> {
    setLoading(true)
    let length=Object.keys(created).length
    let name=`新应用${length+1}`
    server.create(name)
    .then(res=>{
      var data=res.data
      if(data.success){
        let plugin=data.plugin
        setPackaging(plugin,false)
        if(plugin.id>=0){
          created[plugin.id.toString()]=plugin
        }else{
          created[Packaging.GetIdStrStatic(plugin)]=plugin
        }
        let createds=_.cloneDeep(created)
        if(!plugin.name){
          plugin.name=Packaging.GetIdStrStatic(plugin)
        }
        createds[Packaging.GetIdStrStatic(plugin)]=plugin
        setCreated(createds)
        return
        // navigate("/editor?type=edit&&id="+Packaging.GetIdStrStatic(plugin))
      }else{
        window.messageApi.error({
          content:data.message,
          key:"error"
        })
      }
    })
    .catch(error=>{
      LogError(error)
    })
    .finally(()=>{
      setLoading(false)
    })
  }

  const createFromTemplate = (template: Packaging) => {
    setLoading(true);
    server.create(template.name)
    .then(res=>{
      let data=res.data
      if(data.success){
        let plugin=data.plugin
        handleCloneToExisting(template,plugin.uuid)
      } else {
        window.messageApi.error({
          content:data.message,
          key:"error"
        })
      }
    })
    .finally(() => {
      setLoading(false);
      setModalTemplateVisible(false);
    });
  };
  const handleCloneToExisting = async (template: Packaging,targetId: string) => {
    let idInComing=template.id
    let temp=plugins[targetId]!
    // return
    if(!temp){
      setLoading(true)
      await server.getPublished(idInComing,0)
      .then(res=>{
        let data=res.data
        if(data.success){
          temp=data.plugin as Packaging
          setPlugins({...plugins,
            [targetId]:temp
          })
        }
      })
    }
    temp.uuid=targetId
    temp.id=-2
    server.save(temp)
    setCreated({...created,
      [targetId]:{...temp,uuid:targetId} as Packaging
    })
    setTimeout(()=>{
      // navigate(`/editor?type=edit&id=${targetId}`);
      setLoading(false)
    },50)
  };

  const importFromJson = useCallback(async (file: File) => {
    if (!file) return;

    const importOneByRaw = async (raw: string, fileName?: string) => {
      return importWorkflowCreateAndSave(
        { raw, fileName },
        {
          adminid: userinfo?.adminid || "",
          createPlugin: async (name) => {
            const res: any = await server.create(name);
            const data: any = res?.data || {};
            if (!data.success || !data.plugin) {
              throw new Error(data.message || "CREATE_PLUGIN_FAILED");
            }
            return data.plugin as Packaging;
          },
          savePlugin: async (p) => {
            const res: any = await server.save(p);
            const data: any = res?.data || {};
            if (data.success === false) {
              throw new Error(data.message || "SAVE_PLUGIN_FAILED");
            }
          },
        }
      );
    };

    const importSingleJson = async () => {
      const raw = await file.text();
      const newPlugin = await importOneByRaw(raw, file.name);
      const key = Packaging.GetIdStrStatic(newPlugin as Packaging);
      const nextPlugins = { ...pluginsRef.current, [key]: newPlugin as Packaging };
      const nextCreated = { ...createdRef.current, [key]: newPlugin as Packaging };
      setPlugins(nextPlugins);
      setCreated(nextCreated);
      setPackaging(newPlugin as Packaging, false);
      return 1;
    };

    const importFromZip = async () => {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith(".json"));
      if (!entries.length) {
        throw new Error("ZIP_HAS_NO_JSON");
      }

      const nextPlugins = { ...pluginsRef.current };
      const nextCreated = { ...createdRef.current };
      let lastImported: Packaging | null = null;

      for (const entry of entries) {
        const raw = await entry.async("string");
        const filename = entry.name.split("/").pop() || entry.name;
        const newPlugin = await importOneByRaw(raw, filename);
        const key = Packaging.GetIdStrStatic(newPlugin as Packaging);
        nextPlugins[key] = newPlugin as Packaging;
        nextCreated[key] = newPlugin as Packaging;
        lastImported = newPlugin as Packaging;
      }

      setPlugins(nextPlugins);
      setCreated(nextCreated);
      if (lastImported) setPackaging(lastImported, false);
      return entries.length;
    };

    message.open({ key: "importWorkflow", type: "loading", content: "正在导入..." });
    try {
      const lowerName = file.name.toLowerCase();
      const importedCount = lowerName.endsWith(".zip") ? await importFromZip() : await importSingleJson();
      const successText = importedCount > 1 ? `导入成功（共 ${importedCount} 个应用）` : "导入成功";
      message.open({ key: "importWorkflow", type: "success", content: successText });
    } catch (error) {
      console.error("导入应用时发生错误:", error);
      let msg = "导入失败：请确认选择的是导出的 JSON/ZIP 文件";
      if (error instanceof Error) {
        if (error.message === "INVALID_WORKFLOW_FILE") {
          msg = "文件格式不正确：请确认 JSON 内容有效";
        } else if (error.message === "ZIP_HAS_NO_JSON") {
          msg = "ZIP 中未找到可导入的 JSON 文件";
        } else if (error.name === "SyntaxError") {
          msg = "JSON 解析失败：请确认文件内容是有效 JSON";
        } else if (error.message === "CREATE_PLUGIN_FAILED") {
          msg = "创建应用失败";
        } else if (error.message === "SAVE_PLUGIN_FAILED") {
          msg = "保存应用失败";
        } else if (error.message?.trim()) {
          // 保留上游抛出的原始错误信息（例如接口返回的 data.message）
          msg = error.message;
        }
      } else if (typeof error === "string" && error.trim()) {
        msg = error;
      }
      message.open({ key: "importWorkflow", type: "error", content: msg });
    }
  }, [setCreated, setPlugins, setPackaging, userinfo]);

  const exportAllToZip = useCallback(async () => {
    const allPlugins = Object.values(createdRef.current || {});
    if (!allPlugins.length) {
      message.warning("暂无可导出的应用");
      return;
    }

    message.open({ key: "exportWorkflowZip", type: "loading", content: "正在打包导出..." });
    try {
      await exportWorkflowsToZip(allPlugins);
      message.open({ key: "exportWorkflowZip", type: "success", content: "已将全部应用导出为压缩包，使用此压缩包可以方便地迁移全部应用到其他设备或账号" });
    } catch (error) {
      console.error("批量导出应用时发生错误:", error);
      const msg = error instanceof Error && error.message === "EMPTY_WORKFLOW_DATA"
        ? "存在未保存的应用，无法导出"
        : "导出失败，请稍后重试";
      message.open({ key: "exportWorkflowZip", type: "error", content: msg });
    }
  }, []);

  useEffect(() => {
    registerDropHandler?.(importFromJson)
    return () => registerDropHandler?.(null)
  }, [importFromJson, registerDropHandler]);

  const MemoArrCreated=useMemo(()=>{
    let createds=Object.values(created)
    return createds
  },[created])
  const MemoPlugs=useMemo(()=>{
    return <Plugins 
      setPackaging={setPackaging} 
      label="已创建" 
      plugins={MemoArrCreated} 
      create={create} 
      onTemplateCreate={() => setModalTemplateVisible(true)}
      onImport={importFromJson}
      onExport={exportAllToZip}
    ></Plugins>
  },[MemoArrCreated, setPackaging, create, setModalTemplateVisible, importFromJson, exportAllToZip])

  return(
    <div style={{
      height: "100%",
      width: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      paddingBottom: "80px"
    }}>
      {
        token!=""&&
        <div>
          {MemoPlugs}
          {/* {
            MemoArrCreated.length < 3 &&
            <div style={{
              position: "fixed",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              width: "calc(100% - 48px)",
              maxWidth: "400px"
            }}>
              <Button
                loading={loading} 
                onClick={create} 
                type="primary"
                size="large"
                style={{
                  width: "100%",
                  height: "48px",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.4)"
                }}
              >
                创建新应用
              </Button>
            </div>
          } */}
        </div>
      }
      <ComModalTemplate 
        open={modalTemplateVisible}
        onCancel={() => setModalTemplateVisible(false)}
        onConfirm={createFromTemplate}
      />
    </div>
  )
}