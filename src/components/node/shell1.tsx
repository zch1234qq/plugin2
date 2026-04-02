import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './style.css'
import { Button, Flex, Modal, Spin, Tooltip, theme as antdTheme } from 'antd';
import utils, { updateResData, RetryConfig } from '../../common/utils.tsx';
import { EnumNodeType, HandleWrapRes, NodeData, RecordMsgType, RecordNodeColor, RecordNodeColorDark, RecordNodeLabel, RecordNodeTextColor, RecordNodeTextColorDark, Relation, Res, TypeMsg } from '../../common/types/types.tsx';
import { LogError } from '../../common/Http.tsx';
import { useAtom } from 'jotai';
import store, { stateDebug, selectedIdState, showDebugState, TableTrigger, triggeringState, getPrevTypeMsg, setPrevTypeMsg, stateGlobalTypeMsg } from '../../common/store/store.tsx';
import { useReactFlow,useNodeConnections } from '@xyflow/react';
import * as Icon from "@ant-design/icons"
import sound from '../../assets/sound.mp3'
import config from '../../common/config/config.tsx';
import { RecordIframe } from '../../common/types/types.tsx';
import { showMissingUpstreamNodeError } from '../../utils/nodeErrorUtils';
import DebugContentPanel from '../ComDrawerStatic/DebugContentPanel.tsx';
import CleanupRegistry from '../../common/CleanupRegistry.tsx';
import ComShare from '../ComShare.tsx';
import { usePlugin } from '../../common/pluginContext.tsx';
import { playSound } from '../../common/audio';

// 创建一个专门处理 iframe 的组件
const IframeComponent = ({ iframeHtml }: { iframeHtml: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current || !iframeHtml) return;
    
    // 解析 iframe HTML 字符串
    const parser = new DOMParser();
    const doc = parser.parseFromString(iframeHtml, 'text/html');
    const iframeElement = doc.querySelector('iframe');
    
    if (iframeElement) {
      // 确保 iframe 有正确的属性
      iframeElement.width = '100%';
      iframeElement.height = '100%';
      iframeElement.style.border = 'none';
      iframeElement.allowFullscreen = true;
      
      // 确保 src 属性正确
      const src = iframeElement.getAttribute('src');
      if (src && !src.startsWith('http')) {
        iframeElement.src = 'https:' + src;
      }
      
      // 清空容器并添加新的 iframe
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframeElement);
    }
    
    // 组件卸载时清理 iframe
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [iframeHtml]);
  
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>;
};

type Argvs= {
  data:NodeData,
  showNode?:boolean,
  setShowNode?:React.Dispatch<React.SetStateAction<boolean>>,
  updateFlag?:boolean,
  root?:boolean,
  id:string,
  runs:Record<string,(res:Res)=>Promise<Res>>,
  onClick?:()=>void,
  onDoubleClick?:()=>void,
  width?:number,
  children: React.ReactNode,
  callbackTrigger?:()=>void,
}

// 添加一个固定的 message key

export default function Shell({data,showNode=true,setShowNode,updateFlag=false,root=false,id="",
  runs,onClick=()=>{},onDoubleClick=()=>{},
  width=200, children, callbackTrigger}:Argvs) {
  const [loading,setLoading]=useState(false)
  const beginId=useRef("")
  const rootRef=useRef(root)
  const [selectedId,setSelectedId]=useAtom(selectedIdState)
  const [selected,setSelected]=useState(false)
  const {deleteElements,getNode,getEdges}=useReactFlow()
  const [result,setResult]=useState("")
  const [msgtype,setMsgType]=useState<TypeMsg>("text")
  const [debug,setDebug]=useAtom(stateDebug)
  const [showDebug,setShowDebug]=useAtom(showDebugState);
  const { token } = antdTheme.useToken();
  const shellRef = useRef<HTMLDivElement>(null);
  const [running,setRunning]=useState(false)
  const [,setTriggering]=useAtom(triggeringState)
  const {rels2,relations,edgeS2T}=store
  const [,setGlobalTypeMsg]=useAtom(stateGlobalTypeMsg)
  const [,setSelectedState]=useState("")
  const [viewVideo,setViewVideo]=useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  // 记录当前运行中本节点已被 trigger 的历史，按 beginId 分桶避免并发串扰
  const triggeredLoopHistoryRef = useRef<Record<string, Record<number, boolean>>>({})
  // 记录当前运行中本节点是否触发过他人，按 beginId 存储 internalRun 调用资格
  const hasTriggeredOthersRef = useRef<Record<string, boolean>>({})
  // 错误弹窗状态
  const [errorModalVisible, setErrorModalVisible] = useState(false)
  const [, setErrorMessage] = useState("")
  const [currentDetail, setCurrentDetail] = useState<HandleWrapRes | null>(null)
  // 组件挂载状态跟踪
  const isMountedRef = useRef(true)
  // 创建清理注册中心实例
  const cleanupRegistry = useRef(new CleanupRegistry())
  // 音频对象引用
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // 事件监听器引用（用于兼容性处理）
  const eventListenersRef = useRef<Array<{emitter: any, event: string, callback: any}>>([])
  const {plugin, markUnsavedChanges}=usePlugin();
  const valuesSnapshot = JSON.stringify(data.values ?? {})
  const lastValuesSnapshotRef = useRef(valuesSnapshot)
  const hasInitializedValuesRef = useRef(false)


  // 使用 ReactFlow 提供的 useNodeConnections 钩子获取输出连接状态
  const outputConnections = useNodeConnections({
    handleType: 'source',
    handleId: '0',
  });
  const isEndNode = outputConnections.length === 0

  // 组件卸载时的清理逻辑
  useEffect(() => {
    // 注册 utils.emEmpty 的 running 事件监听器清理
    const relation = relations[id]
    if (relation) {
      relation.forEach((element: Relation) => {
        const key = needKey(element.to, id, element.handleSource, element.handleTarget)
        cleanupRegistry.current.registerCleanupFunction(() => {
          utils.emRun.off(key, internalRun)
        })
      })
    }
    
    return () => {
      // 设置组件为已卸载状态
      isMountedRef.current = false
      
      // 调用清理注册中心的统一清理方法
      cleanupRegistry.current.cleanup()
      
      // 清理音频对象
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [relations, id])
  
  useEffect(()=>{
    if(data.values[-1]=="1"){
      setShowNode?.(false)
    }else{
      setShowNode?.(true)
    }
  },[data.values])

  useEffect(()=>{
    data.values[-1]=showNode?"0":"1"
  },[showNode])

  useEffect(() => {
    if (!hasInitializedValuesRef.current) {
      hasInitializedValuesRef.current = true
      lastValuesSnapshotRef.current = valuesSnapshot
      return
    }
    if (valuesSnapshot !== lastValuesSnapshotRef.current) {
      lastValuesSnapshotRef.current = valuesSnapshot
      markUnsavedChanges()
    }
  }, [valuesSnapshot, updateFlag, markUnsavedChanges])

  useEffect(()=>{
    flashEvent()
    return ()=>{
      utils.emTrigger.off(triggerEventKey(id),trigger)
    }
  },[root,updateFlag])

  // 组件卸载时的清理逻辑
  useEffect(() => {
    return () => {
      // 设置组件为已卸载状态
      isMountedRef.current = false
      
      // 清理所有事件监听器
      eventListenersRef.current.forEach(({ emitter, event, callback }) => {
        emitter.off(event, callback)
      })
      eventListenersRef.current = []
      
      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      
      // 清理utils.emEmpty监听器
      utils.emEmpty.off("running")
      
      // 清理utils.emRun监听器（如果有残留）
      const relation = relations[id]
      if (relation) {
        relation.forEach((element: Relation) => {
          const key = needKey(element.to, id, element.handleSource, element.handleTarget)
          utils.emRun.off(key, internalRun)
        })
      }
    }
  }, [relations, id])

  const convertLabel=useMemo(()=>{
    var label=data.label
    return RecordNodeLabel[label]||label
  },[data.label])

  function flashEvent() {
    rootRef.current=root
    utils.emTrigger.on(triggerEventKey(id),trigger)
    // 将事件监听器注册到清理中心
    cleanupRegistry.current.registerCleanupFunction(() => {
      utils.emTrigger.off(triggerEventKey(id),trigger)
    })
  }

  const triggerEventKey = useCallback((nodeId: string) => {
    return `${nodeId}_workflow_${data.appid || "default"}`
  }, [data.appid])

  function needKey(
    src:string,
    target:string,
    handleSource:string,
    handleTarget:string,
    loopIteration:number = 0,
    beginId:string = ""
  ) {
    return "need" + src + "_" + target + "_" + handleSource + "_" + handleTarget + "_loop" + loopIteration + "_begin" + beginId;
  }

  const resetTriggerHistory = useCallback((targetBeginId?: string) => {
    if (!targetBeginId) {
      triggeredLoopHistoryRef.current = {}
      hasTriggeredOthersRef.current = {}
      return
    }
    delete triggeredLoopHistoryRef.current[targetBeginId]
    delete hasTriggeredOthersRef.current[targetBeginId]
  }, [])

  const createScopedBeginId = useCallback(() => {
    const appid = data.appid || "default"
    const randomSuffix = Math.random().toString(36).slice(2, 10)
    return `${appid}::${id}::${Date.now()}::${randomSuffix}`
  }, [data.appid, id])

  useEffect(() => {
    const workflowStartCallback = (payload?: { beginId?: string }) => {
      resetTriggerHistory(payload?.beginId)
    }
    utils.emEmpty.on("workflowStart", workflowStartCallback)
    cleanupRegistry.current.registerEventListener(utils.emEmpty, "workflowStart", workflowStartCallback)
    return () => {
      utils.emEmpty.off("workflowStart", workflowStartCallback)
    }
  }, [resetTriggerHistory])

  const Root=(loop:boolean)=>{
    var rel=relations[id]
    let haveUp=false
    if(rel!=undefined){
      if(rel.length!=0){
        haveUp=true
      }
    }
    return root&&(!haveUp||!loop)
  }
  
  async function trigger({beginId,sourceId="-1", loopIteration = 0,fromEnd=true}:{beginId:string,sourceId?:string, loopIteration?:number, fromEnd?:boolean}) {
    
    const triggerHistoryByBeginId = triggeredLoopHistoryRef.current[beginId] || {}
    triggeredLoopHistoryRef.current[beginId] = triggerHistoryByBeginId
    if (triggerHistoryByBeginId[loopIteration]) {
      return
    }
    triggerHistoryByBeginId[loopIteration] = true
    setLoading(true)
    let startedInternalRun = false
    await callbackTrigger?.()
    let edgeT2S:Relation[]=[]
    for(let key in edgeS2T){
      let edges=edgeS2T[key]
      edges.forEach((edge:Relation)=>{
        if(edge.to==id){
          let newRel={to:key,handleTarget:edge.handleTarget,handleSource:edge.handleSource} as Relation
          edgeT2S.push(newRel)
        }
      })
    }
    let relation=relations[id]
    let rel=rels2[id]
    if(data.label==EnumNodeType.Loop){
      const maxLoopCount = parseInt(data.values[0]||"0");
      if(rel!=undefined && rel.length!=0){
        rel.forEach((ship:Relation)=>{
          if(sourceId==ship.to && ship.handleSource=="0"){
            loopIteration = 0;
          }
        })
      }
      if(loopIteration > maxLoopCount){
        if(relation==undefined){
          window.messageApi.error({
            content:"缺少上游节点",
            key:config.MESSAGE_KEY
          })
          utils.emEmpty.emit("running")
          setLoading(false)
          return
        }
        hasTriggeredOthersRef.current[beginId] = true
        startedInternalRun = true
        internalRun({beginId:beginId, handle:"0", res:{success:true, msg:"", loopIteration:loopIteration} as Res})
        return
      }
    }
    if(Root(fromEnd)){
      hasTriggeredOthersRef.current[beginId] = true
      startedInternalRun = true
      internalRun({beginId:beginId, handle:"0", res:{success:true,msg:"", loopIteration:loopIteration} as Res})
    }else{
      setTriggering(true)
        if(data.label==EnumNodeType.Loop){
          loopIteration++;
      }
      if(relation!=undefined){
        hasTriggeredOthersRef.current[beginId] = edgeT2S.length > 0
        for(let i=0;i<edgeT2S.length;i++){
          var src=edgeT2S[i].to;
          TableTrigger[TableTriggerkey(src,loopIteration)]=true
          utils.emTrigger.emit(triggerEventKey(src), {beginId:beginId,sourceId:id, loopIteration:loopIteration,fromEnd:fromEnd});
        }
        relation.forEach((element:Relation)=>{
          var src=element.to;
          var key=needKey(src, id, element.handleSource, element.handleTarget, loopIteration, beginId);
          utils.emRun.on(key, internalRun)
        })
      }else{
        showMissingUpstreamNodeError(convertLabel as string, showDebug, (debugState) => setDebug(prev => ({...prev, ...debugState})), config.MESSAGE_KEY);
        utils.emEmpty.emit("running")
      }
      setTriggering(false)
    }
    if (!startedInternalRun) {
      setLoading(false)
    }
  }
  const TableTriggerkey=useCallback((src:string,loopIteration:number)=>{
    return src+"_"+loopIteration
  },[])

  function ProcessError(msg: string) {
    // 查找第一个换行符的位置
    const firstNewlineIndex = msg.indexOf('\n');
    // 如果没有找到换行符，直接返回原消息
    if (firstNewlineIndex === -1) {
      return { success: true, msg: msg };
    }
    // 分割消息：第一部分和剩余部分
    const msg0 = msg.substring(0, firstNewlineIndex);
    const msg1 = msg.substring(firstNewlineIndex + 1);

    if (msg0.substring(0, 2) === "错误") {
      return { success: false, msg: msg1 };
    } else {
      return { success: true, msg: msg };
    }
  }

  function emitContinue(detail:HandleWrapRes):{
    finished:boolean
  }{
    let res=detail.res
    let loopIteration = detail.res.loopIteration || 0;
    const isLoopNode = data.label === EnumNodeType.Loop;
    if (isLoopNode) {
      loopIteration--;
    }
    res.loopIteration = loopIteration;
    var rel=rels2[id]
    if(detail.beginId===beginId.current&&data.label!=EnumNodeType.Loop){
        onFinished(showDebug,res,res.msg,res.msgtype||"text", detail.beginId)
      return { finished: true }
    }

    if(rel!=undefined && ((detail.beginId!==beginId.current || loopIteration!=0) || data.label==EnumNodeType.Loop)){
      rel.forEach((relation:Relation) => {
        let handleTarget = relation.handleTarget;
        let handleSource = relation.handleSource;
        var key=needKey(id, relation.to, handleSource, handleTarget, loopIteration, detail.beginId);
        if(data.label==EnumNodeType.Loop){
          if(loopIteration <=0){
            handleSource="1"
          }else{
            handleSource="0"
          }
        }
        utils.emRun.emit(key, {
          beginId: detail.beginId, 
          handle: relation.handleTarget, 
          res: res
        });
        utils.emRun.off(key)
      });
    }
    return { finished: false }
  }
  
  // 定义重试配置
  const retryConfig: RetryConfig = {
    maxRetries: 3,          // 最大重试3次
    initialDelayMs: 1000,   // 初始延迟1秒
    maxDelayMs: 10000,      // 最大延迟10秒
    exponentialBackoff: true, // 使用指数退避策略
    retryableErrors: [], // 特定的可重试错误关键词
    onRetry: (attempt, error) => {
      // 如果开启了调试模式，更新调试信息
      if (showDebug) {
        setDebug(prev => ({
          ...prev,
          data: prev.data + `\n[重试 ${attempt}/${retryConfig.maxRetries}] 遇到错误: ${error.message}`
        }));
      }
    }
  };

  const internalRun=useCallback((detail:HandleWrapRes)=>{
    if (!hasTriggeredOthersRef.current[detail.beginId]) {
      return
    }
      // 保存当前detail，用于可能的重试
      setCurrentDetail(detail);
    // 如果组件已卸载，直接返回
    if (!isMountedRef.current) {
      return
    }
    
    let finished=false
    let loopIteration = detail.res.loopIteration || 0;
    const isLoopNode = (data.label === EnumNodeType.Loop);
    var input=detail.res
    if(input.continue&&data.label!=EnumNodeType.Loop){
      emitContinue(detail)
      return
    }
    
    if(!input.success){
      resetTriggerHistory(detail.beginId)
      utils.emEmpty.emit("running")
      return
    }
    
    var run=runs[detail.handle]
    if(run==undefined){
      return
    }
    //擦除input的msgtype
    input.msgtype=undefined
    let msgtype=RecordMsgType[data.label]
    if(msgtype=='latest'){
      msgtype=getPrevTypeMsg()
    }else{
      setPrevTypeMsg(msgtype)
    }
    //清空之前的调试信息
    if (isMountedRef.current) {
      setDebug(prev=>{
        return {...prev,data:"",show:true,nodeType:String(convertLabel),nodeId:id,loading:true}
      })
      setLoading(true)
    }
    
    input=updateResData(input,{
      ...input,
    })
    
    // 使用重试机制包装run函数，并重置重试计数
    if (isMountedRef.current) {
      setRetryCount(0);
    }
    
    const runWithRetry = utils.withRetry(run, {
      ...retryConfig,
      onRetry: (attempt, _error) => {
        if (isMountedRef.current) {
          setRetryCount(attempt);
          // 更新调试信息以显示重试
          setDebug(prev => ({
            ...prev,
            data: `第 ${attempt} 次重试...`,
            show: true,
            success:false
          }));
        }
      }
    });
    runWithRetry(input)
    .then((res:Res)=>{
      // 检查组件是否已卸载
      if (!isMountedRef.current) {
        return
      }
      if(res.skip){
        return
      }
      if(res.success){
        let resCheck=ProcessError(res.msg)
        res.success=resCheck.success
        res.msg=resCheck.msg
      }
      if(!res.success){
        onError()
        resetTriggerHistory(detail.beginId)
        if (isMountedRef.current) {
          setDebug(prev=>{
            return {...prev, type:"static", show:true, data:res.msg, loading:false, nodeType:String(convertLabel), nodeId:id, success:false}
          })
        }
        return
      }
      detail.res=res
      if(res.continue){
        finished= emitContinue(detail).finished
        return
      }
      var rel=rels2[id]
      if(rel==undefined){
        finished=true
      }
      let msgTemp=res.msg
      if (!showDebug&&res.msg!=""){
        window.messageApi.info({
          content: `${msgTemp.substring(0, 100)}${msgTemp.length > 100 ? '...' : ''}`,
          key: config.MESSAGE_KEY
        });
      }
      if (isLoopNode) {
        loopIteration--;
      }
      res.loopIteration = loopIteration;
      var rel=rels2[id]
      if(rel!=undefined && ((detail.beginId!==beginId.current) || data.label==EnumNodeType.Loop)){
        rel.forEach((relation:Relation) => {
          let handleTarget = relation.handleTarget;
          let handleSource = relation.handleSource;
          var key=needKey(id, relation.to, handleSource, handleTarget, loopIteration, detail.beginId);
          if(data.label==EnumNodeType.Loop){
            if(loopIteration <=0){
              handleSource="1"
            }else{
              handleSource="0"
            }
          }
          utils.emRun.emit(key, {
            beginId: detail.beginId, 
            handle: relation.handleTarget, 
            res: res
          });
          utils.emRun.off(key)
        });
      }
      if(detail.beginId===beginId.current&&(loopIteration<=0)){
        beginId.current=""
        finished=true
      }
      
      if (isMountedRef.current) {
        setResult(msgTemp)
      }
      
      if(finished){
        resetTriggerHistory(detail.beginId)
        if(showDebug && isMountedRef.current){
          setDebug(prev=>{
            return {...prev,success:true,type:"static",data:msgTemp,
              nodeType:RecordNodeLabel[data.label],nodeId:id,loading:false}
          })
          if(!res.msgtypeRe){
            setGlobalTypeMsg(msgtype)
            setMsgType(msgtype)
          }else{
            setGlobalTypeMsg(res.msgtypeRe)
            setMsgType(res.msgtypeRe)
          }
        }
        utils.emEmpty.emit("running")
      }else{
        if(showDebug && isMountedRef.current){
          setDebug(prev=>{
            return {...prev,data:msgTemp,success:true,msg:msgTemp}
          })
          if(!res.msgtypeRe){
            setGlobalTypeMsg(msgtype)
          }else{
            setGlobalTypeMsg(res.msgtypeRe)
          }
        }
      }
    })
    .catch((error)=>{
      // 检查组件是否已卸载
      if (!isMountedRef.current) {
        return
      }
      
      utils.log(error)
      onError()
      resetTriggerHistory(detail.beginId)
      // 保存错误信息并显示弹窗
      const errMsg = error.message || "操作失败"
      setErrorMessage(errMsg)
      setErrorModalVisible(true)
      
      if(showDebug && isMountedRef.current) {
        setDebug(prev=>{
          return {...prev,success:false,show:false,data:errMsg,loading:false}
        })
      }
      LogError(error)
    })
    .finally(()=>{
      if (isMountedRef.current) {
        setLoading(false);
      }
    })
  },[beginId, showDebug, resetTriggerHistory])

  function onFinished(showDebug:boolean,res:Res,msgTemp:string,msgtype:TypeMsg,targetBeginId?:string){
    if(showDebug && isMountedRef.current){
      setDebug(prev=>{
        return {...prev,success:true,type:"static",data:msgTemp,
          nodeType:RecordNodeLabel[data.label],nodeId:id,loading:false}
      })
      if(!res.msgtypeRe){
        setGlobalTypeMsg(msgtype)
      }else{
        setGlobalTypeMsg(res.msgtypeRe)
      }
    }
    if (targetBeginId) {
      resetTriggerHistory(targetBeginId)
      if (beginId.current === targetBeginId) {
        beginId.current = ""
      }
    }
    utils.emEmpty.emit("running")
  }

  const onError=()=>{
    setSelectedState("red")
    setSelectedId(id)
    setSelected(true)
    utils.emEmpty.emit("running")
    setErrorModalVisible(true)
  }

  useEffect(()=>{
    if(selectedId==id){
      setSelected(true)
    }else{
      setSelected(false)
    }
  },[selectedId])

  const handleFullDelete = (nodeId:string) => {
    const node = getNode(nodeId)!;
    const relatedEdges = getEdges().filter(
      e => e.source === nodeId || e.target === nodeId
    );
    deleteElements({ nodes: [node], edges: relatedEdges });
  };

  const isDark = useMemo(() => {
    const bg = token.colorBgContainer || token.colorBgBase || '#ffffff';

    const parse = (color: string): { r: number; g: number; b: number } | null => {
      const c = color.trim().toLowerCase();

      // #rgb / #rrggbb
      const hexMatch = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hexMatch) {
        const raw = hexMatch[1];
        const hex = raw.length === 3 ? raw.split('').map(ch => ch + ch).join('') : raw;
        const n = parseInt(hex, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      }

      // rgb() / rgba()
      const rgbMatch = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i);
      if (rgbMatch) {
        return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
      }

      return null;
    };

    const rgb = parse(bg);
    if (!rgb) return false;

    // Perceived luminance (0..1). Lower means darker.
    const toLinear = (v: number) => {
      const s = Math.max(0, Math.min(255, v)) / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
    return L < 0.35;
  }, [token.colorBgBase, token.colorBgContainer]);

  const nodeColor = useMemo(() => {
    return isDark
      ? RecordNodeColorDark[data.label]
      : RecordNodeColor[data.label];
  }, [data.label, isDark]);

  const textColor = useMemo(() => {
    if (isDark) return RecordNodeTextColorDark[data.label] || token.colorText;
    return RecordNodeTextColor[data.label] || token.colorText;
  }, [data.label, isDark, token.colorText]);

  useEffect(() => {
    if (shellRef.current) {
      shellRef.current.style.setProperty('background-color', nodeColor, 'important');
    }
  }, [nodeColor, selected]);

  const onRunHandle = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const scopedBeginId = createScopedBeginId()
    // 广播工作流开始，要求所有节点清空本地触发历史
    utils.emEmpty.emit("workflowStart", { beginId: scopedBeginId })
    resetTriggerHistory(scopedBeginId)
    setDebug(prev=>{
      return {...prev,msgtype:"text",success:true,show:true,data:"",type:"dynamic"}
    })
    //根据rels2的数组长度判断当前节点是否存在下游节点,从而设置 fromEnd
    const fromEnd=isEndNode
    // 确保组件已挂载再更新状态
    if (isMountedRef.current) {
      setGlobalTypeMsg("text")
    }
    
    // 开始运行播放音效
    playSound({ src: sound, audioRef, cleanupRegistry });
    
    window.messageApi.success({
      content:"开始运行",
      key:config.MESSAGE_KEY
    })
    e.currentTarget.ondragstart = () => false;  // 阻止拖拽
    beginId.current = scopedBeginId;
    
    // 确保组件已挂载再更新状态
    if (isMountedRef.current) {
      setRunning(true);
    }
    
    // 添加事件监听器并注册到清理中心
    const runningCallback = () => {
      if (isMountedRef.current) {
        setRunning(false);
      }
    };
    utils.emEmpty.on("running", runningCallback);
    cleanupRegistry.current.registerEventListener(utils.emEmpty, "running", runningCallback);
    
    flashEvent();
    setTimeout(() => {
      // 确保组件已挂载再执行
      if (isMountedRef.current) {
        trigger({beginId: scopedBeginId, loopIteration: 0, fromEnd: fromEnd});
      }
    }, 0);
  }
  const runButtonVisible = isEndNode || isHovering || selected

  return (
    <div 
      ref={shellRef}
      className={`shell ${selected ? 'selected' : ''}`} 
      onClick={()=>{
        onClick()
        setSelectedId(id)
        setSelectedState("blue")
      }}
      onDoubleClick={()=>{
        // onDCSelf()
        onDoubleClick()
      }}
      style={{position:"relative",width:showNode?width:50,height:showNode?100:50}}
    >
      {/* 显示重试次数 */}
      {retryCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          backgroundColor: 'red',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10
        }}>
          {retryCount}
        </div>
      )}
      {
        selected&&showNode&&
        <Flex vertical justify='space-between' style={{top:0,position:"absolute",fontSize:24,height:"100%",left:"105%"}}>
          <Tooltip title="查看最近一次的运行结果">
            <Icon.OrderedListOutlined onClick={()=>{
              if(!result){
                window.messageApi.error({
                  content:"此节点未被运行或运行结果为空",
                  key:config.MESSAGE_KEY
                })
                return
              }
              setShowDebug(true)
              setGlobalTypeMsg(msgtype)
              setDebug({type:"static",msgtype:msgtype,success:true,show:true,data:result,loading:false,nodeType:String(convertLabel),nodeId:id})
            }}
            ></Icon.OrderedListOutlined>
          </Tooltip>
          <Tooltip title="入门视频">
            <Icon.VideoCameraOutlined onClick={()=>{
              setViewVideo(true)
            }}
            ></Icon.VideoCameraOutlined>
          </Tooltip>
          <Tooltip title="删除">
            <Icon.DeleteTwoTone onClick={()=>{
              handleFullDelete(id)
            }} 
          ></Icon.DeleteTwoTone>
          </Tooltip>
        </Flex>
      }
      {children}
      {
        showNode&&
        <p style={{
          padding: 2,
          width: "min",
          color: textColor,
          position: "absolute",
          bottom: 0,
          left: 0,
          userSelect: "none",
          pointerEvents: "none",
        }}>{convertLabel}</p>
      }
      {showNode &&!loading&&
        <div
          style={{position:"absolute",bottom:0,right:0,margin:1,width:24,height:24}}
          onMouseEnter={() => {
            setIsHovering(true)
          }}
          onMouseLeave={() => {
            setIsHovering(false)
          }}
        >
          <Button
            size='small' 
            disabled={running || !runButtonVisible||loading} 
            // loading={loading} 
            type="primary" 
            style={{
              position:"absolute",
              bottom:0,
              right:0,
              margin:0,
              opacity: runButtonVisible ? 1 : 0,
              transform: runButtonVisible ? "translateY(0)" : "translateY(3px)",
              transition: "opacity 0.35s ease-in-out, transform 0.35s ease-in-out",
              pointerEvents: runButtonVisible ? "auto" : "none"
            }}
            icon={<Icon.CaretRightFilled style={{color:'white'}}/>}
            onClick={(e)=>{
              onRunHandle(e)
            }}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          ></Button>
        </div>
      }
      {
        loading&&
        <Spin style={{position:"absolute",bottom:0,right:0,margin:2}}/>
      }
      <Modal 
        open={viewVideo} 
        onCancel={()=>{
          setViewVideo(false)
        }}
        afterClose={()=>{
          // 确保 Modal 完全关闭后清理 iframe
          const iframeContainer = document.querySelector('.iframe-container');
          if (iframeContainer) {
            iframeContainer.innerHTML = '';
          }
        }}
        destroyOnClose={true}
        footer={null}
      >
        {
          viewVideo && data.label && RecordIframe[data.label] && RecordIframe[data.label] !== "" ?
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 587,
            margin:16
          }} className="iframe-container">
            <IframeComponent iframeHtml={RecordIframe[data.label]} key={`iframe-${data.label}`} />
          </div>
          :
          <div>视频即将上线...</div>
        }
      </Modal>
      
      {/* 错误重试弹窗 */}
      <Modal
        title={`${convertLabel}节点报错`}
        open={errorModalVisible}
        onCancel={() =>{
          setErrorModalVisible(false)
          utils.handleRefreshToken(false)
        }
      }
        maskClosable={false}  // 点击遮罩层不关闭弹窗
        footer={[
          <Button key="skip" onClick={() => {
            utils.handleRefreshToken(false)
            setErrorModalVisible(false);
            // 跳过当前节点，继续执行后续节点
            if (currentDetail) {
              const skipRes: Res = {
                ...currentDetail.res,
                success: true,
                continue: true,
                loopIteration: currentDetail.res.loopIteration || 0
              };
              currentDetail.res = skipRes;
              emitContinue(currentDetail);
            }
          }}>
            跳过
          </Button>,
          <Button key="retry" type="primary" onClick={() => {
            utils.handleRefreshToken(false)
            setErrorModalVisible(false);
            // 重新调用 internalRun 函数重试
            if (currentDetail) {
              hasTriggeredOthersRef.current[currentDetail.beginId] = true
              internalRun(currentDetail);
            }
          }}>
            继续运行
          </Button>,
        ]}
      >
        <DebugContentPanel
          debug={debug}
          showHeader={false}
          displayContent={debug.data}
          buttonShare={
            <ComShare   
              plugin={plugin} 
              onClick={async()=>{}}
              buttonShare={
                <Button type="default">
                  点击获取分享链接
                </Button>
              }
            />
          }
        />
      </Modal>
    </div>
  );
}