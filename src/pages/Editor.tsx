import { GraphData, NodeTypes } from "../common/types/types.tsx";

import {  Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Node, Edge, Connection, getConnectedEdges, MarkerType, NodeChange, EdgeChange } from '@xyflow/react';
import { ColorPicker, Flex, Input, Modal} from 'antd';
import { ConnectionCus, EnumNodeType, NodeCus, Relation } from '../common/types/types.tsx';
import { PluginProvider } from '../common/pluginContext';
import './globals.css'
import _ from 'lodash'

import {
  ReactFlow,  
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useStoreApi,
  useReactFlow,
  ReactFlowProvider,
  Controls,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { Button } from 'antd';
import utils, { clearRecord } from '../common/utils';
import { LogError } from '../common/Http.tsx';
import { Branch, Packaging } from '../common/classes';
import server from '../common/service/server.tsx';
import { useLocation } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import store, { stateDebug, stateCreated, showDebugState, heightDebugState, widthDebugState, stateUserInfo, statePlugins } from '../common/store/store.tsx';
import ComDrawer from '../components/ComDrawer.tsx';
import ComDrawerStatic from '../components/ComDrawerStatic/index.tsx';
import { useTheme } from '../common/theme/themeContext.tsx';
import ComDebugSwitch from '../components/ComDebugSwitch';
import { useCustomNavigate } from "../common/hooks/useCustomNavigate.tsx";
import TextArea from "antd/es/input/TextArea";
import { ToolBox } from "../components/ComEditor.tsx";
import ComBack from "../components/ComBack.tsx";
import ComResizeHandle from '../components/ComResizeHandle';
import { showMessage } from '../utils/messageUtils';
import ComTimeToProcess from "../components/ComTimeToProcess";
import ComShare from "../components/ComShare";
import ComZoneBottom from "../components/ComZoneBottom";
import config from "../common/config/config.tsx";
let {rels2,relations,edgeS2T}=store

const initialNodes:NodeCus[] = [
];  

type Selection={
  id:string,
  type:string,
  edge:Edge,
  node:NodeCus
}

const initialEdges = [] as Edge[];
// 定义最小连接距离常量 - 调整这个值来改变自动连接的灵敏度
// 值越小，需要节点距离越近才会触发自动连接
// 值越大，节点之间可以距离更远也能触发自动连接

export default function EditorWithProvider() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}

function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const userinfo=useAtomValue(stateUserInfo)
  const [plugins,setPlugins]=useAtom(statePlugins)
  const [colorHex, setColorHex] = useState<string>('#eeeeee');
  const location=useLocation();
  const searchParams  = new URLSearchParams(location.search);
  const fromId=searchParams.get("fromid")
  const pluginId=searchParams.get("id")
  const [plugin,setPlugin]=useState<Packaging>(new Packaging(-1,"",""))
  const pluginOld=useRef<Packaging>(_.cloneDeep(new Packaging(-1,"","")))
  const [count,setCount]=useState(0)
  const [countInputimg,setCountInputimg]=useState(0) 
  const [countInputtext,setCountInputtext]=useState(0) 
  const nodesRecordRef=useRef<Record<string,NodeCus>>({})
  const loaded=useRef(false)
  const [selBody,setSelBody]=useState<Selection>({} as Selection)
  const [countOfNode,setCountOfNode]=useState(0)
  // 添加状态变量来追踪是否有未保存的更改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  // 添加状态变量来追踪保存按钮的加载状态
  const [saveLoading, setSaveLoading] = useState(false)
  // 添加引用变量来存储初始加载的节点和边状态
  const initialStateRef = useRef<{nodes: NodeCus[], edges: Edge[]}>({nodes: [], edges: []})
  const [debug,setDebug]=useAtom(stateDebug)
  const [created,setCreated]=useAtom(stateCreated)
  const posRef=useRef({x:0,y:0})
  const store = useStoreApi();
  const { getInternalNode } = useReactFlow();
  const [showDebug] = useAtom(showDebugState);
  const [heightDebug, setHeightDebug] = useAtom(heightDebugState);
  const [widthDebug, setWidthDebug] = useAtom(widthDebugState);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [sharer,setSharer]=useState("")
  const workflowIdRef = useRef(pluginId || "plugin_unknown")
  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const withWorkflowId = useCallback((node: NodeCus): NodeCus => {
    return {
      ...node,
      data: {
        ...node.data,
        workflow_id: workflowIdRef.current,
      }
    }
  }, [])


  const localSave=async ()=>{
    const end=getEnd()
    rebuild(edges)
    let nodeTypes:Record<string,string>={} as Record<string,string>
    let newNode=nodes
    newNode.forEach(node=>{
      nodeTypes[node.id] = node.type ?? '';
    })
    // 使用静态方法重置
    Branch.reset();
    let tree:string=""
    if(end!=undefined){
      let branch=new Branch({id:end},relations,nodeTypes,nodesRecordRef)
      let jsonData=branch.attach()
      tree=JSON.stringify(jsonData)
    }else{
      tree=""
    }
    plugin.tree=tree
    var inputType=calInputType()
    plugin.typeinput=inputType
    // 关键：把本地 sharer 同步回 plugin，才能随 created 持久化到磁盘
    plugin.sharer = sharer
    var data:GraphData={} as GraphData
    data.nodes=newNode as NodeCus[]
    data.edges=edges
    plugin.data=JSON.stringify(data)
    created[Packaging.GetIdStrStatic(plugin)]=plugin
    setCreated({...created, [Packaging.GetIdStrStatic(plugin)]: plugin})
    if(JSON.stringify(plugin)===JSON.stringify(pluginOld.current)){
      return
    }
    pluginOld.current=_.cloneDeep(plugin)
  }

  useEffect(()=>{
    if(edges.length>0&&edges[edges.length-1].className!='temp'){
      rebuild(edges)
    }
  },[edges])

  const copiedNodesRef = useRef<NodeCus[]>([]);
  // 添加一个引用来追踪下一个可用的最小ID
  const nextAvailableIdRef = useRef<number>(1);
  
  useEffect(() => {
    if (nodes.length > 0) {
      const maxId = Math.max(
        ...nodes
          .map(node => parseInt(node.id))
          .filter(id => !isNaN(id))
      );
      nextAvailableIdRef.current = maxId + 1;
    }
  }, []);
  // 在节点添加或删除时更新nextAvailableId
  const updateNextAvailableId = useCallback(() => {
    if (nodes.length === 0) {
      nextAvailableIdRef.current = 1;
      return;
    }
    // 创建已使用ID的集合
    const usedIds = new Set(
      nodes
        .map(node => parseInt(node.id))
        .filter(id => !isNaN(id))
    );
    
    // 找到最小未使用ID
    let minAvailable = 1;
    while (usedIds.has(minAvailable)) {
      minAvailable++;
    }
    
    nextAvailableIdRef.current = minAvailable;
  }, [nodes]);
  
  // 监听节点变化
  useEffect(() => {
    updateNextAvailableId();
  }, [nodes.length, updateNextAvailableId]);
  
  useEffect(()=>{
    if(fromId){
      if(plugins[fromId]!=undefined){
        plugins[fromId].uuid=pluginId!
        plugins[fromId].adminid=userinfo.adminid
        deserialize(plugins[fromId])
        return
      }
      server.getPublished(Number(fromId),0)
      .then(res=>{
        let data=res.data
        if(data.success){
          let plugin=data.plugin
          plugin.uuid=pluginId!
          plugin.adminid=userinfo.adminid
          deserialize(data.plugin)
          created[pluginId!]=plugin
          setCreated(created)
          plugins[pluginId!]=plugin
          setPlugins(plugins)
        }else{
          window.messageApi.info("模板ID不存在")
        }
      })
      .catch(error=>{
        LogError(error)
      })
      return
    }
    if(pluginId==""||pluginId==null||loaded.current==true){
      return
    }else{
      loaded.current=true
      var _plugin:Packaging=created[pluginId!]
      if(_plugin==undefined){
        server.use(pluginId!)
        .then(res=>{
          let data=res.data
          let plugin=data.plugin
          if(plugin.license==undefined){
            plugin.license=0
          }
          deserialize(data.plugin)
          created[pluginId!]=plugin
          setCreated(created)
        })
        return
      }else{
        if(_plugin.license==undefined){
          _plugin.license=0
        }
        deserialize(_plugin)
      }
    }
    return ()=>{
      setDebug(prev=>({
        ...prev,
        loading:false,
      }))
    }
  },[])

  // 保存初始状态
  useEffect(() => {
    // 当节点和边加载完成后，保存初始状态
    if (nodes.length > 0 || edges.length > 0) {
      initialStateRef.current = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges))
      };
      setHasUnsavedChanges(false);
    }
  }, []); // 仅在组件初始加载时执行

  const deserialize=(_plugin:Packaging)=>{
    setPlugin(_plugin)
    setSharer(_plugin.sharer||"")
    setColorHex(_plugin.color)
    pluginOld.current=_.cloneDeep(_plugin)
    var nodesStr=_plugin.data
    if(nodesStr!=null&&nodesStr!=""){
      var nodesData:GraphData=JSON.parse(nodesStr)
      if(nodesData.nodes.length!=0){
        // var node0=nodesData.nodes[0]
        let _nodes:NodeCus[]=[]
        nodesData.nodes.forEach(node=>{
          let newNode=_.cloneDeep(node)
          newNode.data.sharer=_plugin.sharer
          _nodes.push(withWorkflowId(newNode))
        })
        counter(nodesData.nodes)
        rebuild(nodesData.edges)
        setNodes(_nodes as Node[])
        setEdges(nodesData.edges)
      }
    }
  }


  const rebuild=useCallback((edges:Edge[])=>{
    clearRecord(relations)
    clearRecord(rels2)
    clearRecord(edgeS2T)
    edges.forEach((edge,_)=>{
      buildS2T(edge as ConnectionCus)
      buildT2S(edge as ConnectionCus)
    })
  },[])

  useEffect(()=>{
    counter(nodes as NodeCus[])
  },[countOfNode])

  useEffect(()=>{
    setCountOfNode(nodes.length)
  },[nodes])

  function counter(nodes:NodeCus[]) {
    let sum=0
    let suminputimg=0
    let suminputtext=0
    clearRecord(nodesRecordRef.current)
    nodes.forEach(node=>{
      nodesRecordRef.current[node.id]=node
      switch (node.type) {
        case "out":
          sum+=1;
          break;
        case "in":
          suminputtext+=1;
          break;
        case "inImg":
          suminputimg+=1;
          break;
        default:
          break;
      }
    })
    setCount(sum)
    setCountInputtext(suminputtext)
    setCountInputimg(suminputimg)
  }
  
  function getEnd() {
    // 如果存在 loop 节点，直接以 loop 节点作为 end（避免按链路查找导致循环/不符合预期）
    const loopNode = nodes.find((n) => n.type === EnumNodeType.Loop);
    if (loopNode?.id) {
      return loopNode.id;
    }

    let end = findEndNode(rels2);
    return end;
  }

  const calInputType=useCallback(()=>{
    var RecordInput:Record<string,number[]>={} as Record<string,number[]>
    nodes.forEach((node:any)=>{
      if(node.type==EnumNodeType.In||node.type==EnumNodeType.InImg||node.type==EnumNodeType.InImgGp){
        var array=RecordInput[node.type]
        if(array==undefined){
          RecordInput[node.type]=[]
        }
        RecordInput[node.type].push(1)
      }
    })
    let countOfImg=0
    let countOfText=0
    Object.keys(RecordInput).forEach((key)=>{
      var array=RecordInput[key]
      if(key==EnumNodeType.InImg||key==EnumNodeType.InImgGp){
        countOfImg=array.length
        return 
      }
      countOfText+=array.length
    })
    return `${countOfText}${countOfImg}`
  },[nodes])

  const save=useCallback((plugin:Packaging)=>{
    return new Promise<void>((resolve, reject) => {
      if(plugin.adminid==undefined||plugin.adminid==""){
        plugin.adminid=userinfo.adminid
      }
      server.save(plugin)
      .then(res=>{
        let data=res.data
        if(data.success){
          showMessage.success(data.message, "editor-success");
          created[Packaging.GetIdStrStatic(plugin)]=plugin
          setCreated(created)
          resolve()
        }else{
          window.messageApi.error({
            content:data.message,
            key:"error"
          })
          reject(new Error(data.message))
        }
      })
      .catch(error=>{
        LogError(error)
        reject(error)
      })
    })
  },[plugin, userinfo.adminid, created, setCreated])

  const handleSave = async () => {
    // 设置保存按钮为加载状态
    setSaveLoading(true);
    const end = getEnd();
    
    rebuild(edges);
    let nodeTypes: Record<string, string> = {};
    let newNode = nodes;
    newNode.forEach(node => {
      nodeTypes[node.id] = node.type ?? '';
    });
    // 使用静态方法重置
    Branch.reset();
    let tree: string = "";
    if (end !== undefined) {
      let branch = new Branch({id: end}, relations, nodeTypes, nodesRecordRef);
      let jsonData = branch.attach();
      tree = JSON.stringify(jsonData);
    } else {
      tree = "";
    }
    plugin.tree = tree;
    var inputType = calInputType();
    plugin.typeinput = inputType;
    plugin.sharer = sharer;
    // 使用优化的方式创建数据对象
    var data: GraphData = {} as GraphData;
    // 创建节点的简化版本，不使用深拷贝整个对象
    data.nodes = nodes.map((node:any) => ({
      ...node,
      data: {
        ...node.data,
        // 清空关系数据，因为它会在加载时重建
        relations: {},
        rels2: {}
      }
    }));
    
    // 直接赋值边，不需要深拷贝
    data.edges = edges;
    
    // 序列化数据
    plugin.data = JSON.stringify(data);
    
    // 比较是否需要保存
    if (JSON.stringify(plugin) === JSON.stringify(pluginOld.current)) {
      window.messageApi.info("已保存")
      setSaveLoading(false);
      return;
    }
    
    try {
      await save(plugin);

      // 保存成功后同步回 created（stateCreated 会写入 Storage）
      const key = Packaging.GetIdStrStatic(plugin);
      setCreated({ ...created, [key]: plugin });
      
      // 保存后更新引用
      pluginOld.current = structuredClone(plugin);
      
      // 重置未保存更改状态
      setHasUnsavedChanges(false);
      
      // 更新初始状态为当前状态
      initialStateRef.current = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges))
      };
    } catch (error) {
      // 保存失败时不重置未保存状态
      console.error('保存失败:', error);
    } finally {
      // 无论保存成功或失败，都将保存按钮的加载状态设置为false
      setSaveLoading(false);
    }
  }

  // 修改历史记录管理，限制历史记录长度
  const [history, setHistory] = useState<{
    past: { nodes: NodeCus[]; edges: Edge[] }[];
    future: { nodes: NodeCus[]; edges: Edge[] }[];
  }>({
    past: [],
    future: [],
  });

  // 添加保存当前状态到历史记录的函数，限制历史记录数量
  const saveToHistory = useCallback(() => {
    setHistory(curr => {
      // 限制历史记录最多保存20条
      const pastHistory = [...curr.past, { nodes, edges }];
      if (pastHistory.length > 20) {
        pastHistory.shift(); // 移除最旧的历史记录
      }
      return {
        past: pastHistory,
        future: [],
      };
    });
  }, [nodes, edges]);

  // 修改重做函数
  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const newFuture = [...history.future];
    const nextState = newFuture.shift()!;

    setHistory({
      past: [...history.past, { nodes, edges }],
      future: newFuture,
    });

    // 重建关系
    rebuild(nextState.edges);
    
    // 更新节点，确保每个节点的 data 中包含最新的关系
    const updatedNodes = nextState.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        workflow_id: workflowIdRef.current,
        relations: relations,
        rels2: rels2,
        edgeS2T: edgeS2T
      }
    }));

    setNodes(updatedNodes);
    setEdges(nextState.edges);
  }, [history, nodes, edges, setNodes, setEdges, rebuild]);

  // 同样修改撤销函数
  const undo = useCallback(() => {
    if (history.past.length === 0) return;

    const newPast = [...history.past];
    const lastState = newPast.pop()!;

    setHistory({
      past: newPast,
      future: [{ nodes, edges }, ...history.future],
    });

    // 重建关系
    rebuild(lastState.edges);
    
    // 更新节点，确保每个节点的 data 中包含最新的关系
    const updatedNodes = lastState.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        workflow_id: workflowIdRef.current,
        relations: relations,
        rels2: rels2,
        edgeS2T: edgeS2T
      }
    }));

    setNodes(updatedNodes);
    setEdges(lastState.edges);
  }, [history, nodes, edges, setNodes, setEdges, rebuild]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果焦点在输入框内，不处理快捷键
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // 撤销 (Ctrl+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      
      // 重做 (Ctrl+Y 或 Ctrl+Shift+Z)
      if ((event.ctrlKey || event.metaKey) && 
          (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
      
      // 保存功能 (Ctrl+S 或 Command+S)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止默认保存行为
        handleSave();
      }
      
      // 删除功能 (Delete 键或 Backspace 键)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 检查是否有选中的节点或边
        if (selBody && selBody.id) {
          event.preventDefault(); // 防止其他默认行为
          removeBody(); // 调用已有的删除函数
        }
      }
      
      // 复制功能 (Ctrl+C 或 Command+C)
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        if (selBody && selBody.type === 'node') {
          event.preventDefault();
          // 获取当前选中的节点
          const selectedNode = nodes.find(node => node.id === selBody.id);
          if (selectedNode) {
            // 存储复制的节点
            copiedNodesRef.current = [selectedNode as NodeCus];
            //将节点的data和type信息一起序列化复制到剪贴板
            const nodeDataToCopy = {
              ...selectedNode.data,
              type: selectedNode.type // 确保包含节点类型
            };
            const serializedData = JSON.stringify(nodeDataToCopy);
            navigator.clipboard.writeText(serializedData);
            window.messageApi.success({
              content:'已复制节点',
              key:"success"
            });
          }
        }
      }
      
      // 粘贴功能 (Ctrl+V 或 Command+V)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        //直接使用剪贴板中的内容进行反序化创建新的节点 
        navigator.clipboard.readText().then((serializedData) => {
          const newNodeData = JSON.parse(serializedData);
          // 确保粘贴的节点有正确的类型和标签
          const nodeType = newNodeData.type || newNodeData.label;
          addNode(nodeType,true,newNodeData)
          window.messageApi.success({
              content:'已粘贴节点',
              key:"success"
          });
        }).catch((_) => {
          window.messageApi.error({
            content:'粘贴节点失败',
            key:"error"
          });
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, handleSave, selBody, removeBody, setNodes, undo, redo]);

  const buildS2T = useCallback((params: ConnectionCus) => {
    buildSourceToTarget(params, rels2);
  }, []);

  const buildT2S = useCallback((params: ConnectionCus) => {
    buildTargetToSource(params, relations);
  }, [relations]);

  /**
   * 检查连接是否允许
   * @param params 连接参数
   * @param isManual 是否为手动连接
   * @returns 是否允许连接
   */
  function checkBeforeConnect(params: Connection, isManual: boolean = true): boolean {
    // 检查1: 目标节点的指定句柄是否已有连接
    const targetShips = relations[params.target];
    if (targetShips !== undefined) {
      for (let i = 0; i < targetShips.length; i++) {
        const ship = targetShips[i];
        if (ship.handleTarget === params.targetHandle) {
          // 只在手动连接时显示错误消息
          if (isManual) {
            // if(ship.handleSource==params.sourceHandle&&ship.handleTarget==params.targetHandle){
            //   setEdges(eds=>addEdge(params,eds))
            //   return false
            // }
            window.messageApi.error({
              content:'只能存在一个连线，请删除已有的连线',
              key:"error"
            })
            // let edgeToDelete:Edge[]=[]
            // edges.forEach((edge)=>{
            //   if(edge.target===params.target){
            //     edgeToDelete.push(edge)
            //   }
            // })
            // let newEdges=edges.filter(edge=>!edgeToDelete.includes(edge))
            // newEdges.push(params as Edge)
            // setEdges(newEdges)
            // rebuild(newEdges)
          }
          return false; // 目标句柄已连接
        }
      }
    }
    
    // 检查2: 避免形成循环连接
    // if (wouldCreateCycle(params.source, params.target)) {
    //   // 只在手动连接时显示错误消息
    //   if (isManual) {
    //     window.messageApi.error("不能创建循环连接");
    //   }
    //   return false; // 避免循环连接
    // }
    
    // 检查3: 避免一个节点有多个输入源
    // const allTargetShips = relations[params.target];
    // if (allTargetShips !== undefined && allTargetShips.length > 0) {
    //   // 只在手动连接时显示错误消息
    //   if (isManual) {
    //     window.messageApi.error("节点已有输入源");
    //   }
    //   return false; // 目标节点已有任何输入源
    // }
    
    return true;
  }
  
  /**
   * 检查连接是否会形成循环
   * @param source 源节点ID
   * @param target 目标节点ID
   * @returns 是否会形成循环
   */
  // function wouldCreateCycle(source: string, target: string): boolean {
  //   // 如果源节点和目标节点相同，直接形成循环
  //   if (source === target) return true;
    
  //   // 获取源节点和目标节点的类型
  //   const sourceNode = nodes.find(n => n.id === source);
    
  //   // 如果源节点是循环节点，允许形成循环连接（循环节点本身就是为了处理循环）
  //   if (sourceNode?.type === EnumNodeType.Loop) {
  //     return false;
  //   }
    
  //   // 深度优先搜索，检查从target开始是否能到达source
  //   const visited = new Set<string>();
    
  //   function dfs(currentId: string): boolean {
  //     if (currentId === source) return true;
  //     if (visited.has(currentId)) return false;
      
  //     visited.add(currentId);
      
  //     // 检查当前节点的所有下游节点
  //     const downstreamRelations = rels2[currentId];
  //     if (downstreamRelations) {
  //       for (const relation of downstreamRelations) {
  //         if (dfs(relation.to)) {
  //           return true;
  //         }
  //       }
  //     }
      
  //     return false;
  //   }
    
  //   return dfs(target);
  // }

  const onConnectCore = useCallback((params: Connection) => {
    // 确保只有在鼠标释放后才建立连接
    if (!params.source || !params.target) return;
    buildT2S(params as ConnectionCus)
    buildS2T(params as ConnectionCus)
    // 更新所有节点的 relations 和 rels2
    setNodes(nds => 
      nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          relations: relations,
          rels2: rels2,
          edgeS2T: edgeS2T
        }
      }))
    );
  }, [setNodes]);

  const onConnect = useCallback((params: Connection) => {
    // 手动连接，传入 isManual = true
    if (checkBeforeConnect(params, true)) {
      setEdges(eds => addEdge(params, eds));
      onConnectCore(params);
    }
  }, [checkBeforeConnect, setEdges, onConnectCore]);

  const onEdgesDelete = useCallback((deletedEdges:Edge[]) => {
    
    // 标记是否需要更新关系图
    let relationChanged = false;
    
    deletedEdges.forEach((edge:Edge)=>{
      // 创建完整的 Connection 对象
      // const connectionObj: Connection = {
      //   source: edge.source,
      //   target: edge.target,
      //   sourceHandle: null, // 或提供默认值 "0"
      //   targetHandle: null  // 或提供默认值 "0"
      // };
      // utils.emConnection.emit(`disconnection:${edge.target}`, connectionObj);
      
      // 1. 安全地获取关系数组
      const rel0 = relations[edge.target] || [];
      const rel1 = rels2[edge.source] || [];
      
      // 2. 移除目标节点的上游关系 (relations)
      if (rel0.length > 0) {
        for (let i = rel0.length - 1; i >= 0; i--) {
          const relation = rel0[i];
          if (relation.to === edge.source&&relation.handleTarget===edge.targetHandle) {
            rel0.splice(i, 1);
            relationChanged = true;
            // 取消与该边相关的事件监听
            const key = utils.needKey(relation.to, edge.target, relation.handleTarget);
            utils.emRun.off(key);
          }
        }

        // 如果关系数组为空，可以删除该键
        if (rel0.length === 0) {
          delete relations[edge.target];
        } else {
          relations[edge.target] = rel0;
        }
      }
      // 3. 移除源节点的下游关系 (rels2)
      if (rel1.length > 0) {
        for (let i = rel1.length - 1; i >= 0; i--) {
          const relation = rel1[i];
          if (relation.to === edge.target&&relation.handleTarget===edge.targetHandle) {
            rel1.splice(i, 1);
            relationChanged = true;
          }
        }
        
        // 如果关系数组为空，可以删除该键
        if (rel1.length === 0) {
          delete rels2[edge.source];
        } else {
          rels2[edge.source] = rel1;
        }
      }
      learnFromRels2(edge.source,rel1)
    });
    
    if (relationChanged) {
      // 4. 触发关系变化事件，通知相关组件更新
      
      // 5. 强制更新图结构（如果需要）
      setNodes(nodes => [...nodes]); // 创建新数组触发节点更新
    }
    
  }, []);  // 移除edges依赖，防止不必要的重新创建

  const onNodesDelete=useCallback((deletedNodes:Node[])=>{
    const ids:string[]=[]
    deletedNodes.forEach((node)=>{
      var id=node.id
      ids.push(id)
      let relationTargets=relations[node.id]
      relationTargets?.forEach((relation)=>{
        let targetId=relation.to
        delete rels2[targetId]
      })
      let relTargets=rels2[node.id]
      relTargets?.forEach((relation)=>{
        let targetId=relation.to
        delete relations[targetId]
      })
      delete relations[id]
      delete rels2[id]
      utils.emTrigger.off(id)
      var relation=relations[id]
      if(relation!=undefined){
        relation.forEach((ship)=>{
          var key=utils.needKey(ship.to,id,ship.handleTarget)
          utils.emRun.off(key)
        })
      }
      
      // 如果删除的是最后点击的节点，清除引用
      if (lastClickedNode.current && lastClickedNode.current.id === id) {
        lastClickedNode.current = null;
      }
    })
    let edgeConnected=getConnectedEdges(deletedNodes,edges)
    setEdges((eds) =>(eds.filter(edge => !edgeConnected.includes(edge))))
    
    // 删除完成后更新nextAvailableId
    updateNextAvailableId();
  },[nodes])

  // 添加一个状态来跟踪最近点击的节点
  const lastClickedNode=useRef<Node | null>(null);

  // 修改 onNodeClick 函数，记录最近点击的节点
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelBody({ id: node.id, type: "node", node: node } as Selection);
    
    lastClickedNode.current=node; // 记录最近点击的节点
  }, []);


  // 修改 addNode 函数，使新节点出现在最近点击节点的右侧
  const addNode = useCallback((type: EnumNodeType,manual:boolean=true,data=undefined) => {
    saveToHistory();
    let position;
    if (lastClickedNode.current) {
      position = {
        x: lastClickedNode.current.position.x,
        y: lastClickedNode.current.position.y + 150
      };
    } else {
      position = posRef.current;
    }
    
    let newId = nextAvailableIdRef.current++;
    const newNodeData = data ? {
      ...data,
      workflow_id: workflowIdRef.current
    } : {
      label: type,
      values: {} as Record<number, string>,
      workflow_id: workflowIdRef.current
    }
    const newNode = {
      type: type,
      id: `${newId}`,
      data: newNodeData,
      position: position,
    };
    
    posRef.current = { x: position.x + 10, y: position.y + 10 };
    
    // 保存之前的lastClickedNode引用
    const previousNode = lastClickedNode.current;
    
    // 添加新节点
    setNodes((nds) => nds.concat(newNode as Node));
    
    // 如果存在上一个节点，创建连线
    if (!manual&&previousNode && previousNode.id !== newNode.id) { // 确保不是自己连接自己
      setTimeout(() => {
        // 创建连接参数
        const params = {
          source: previousNode.id,
          target: newNode.id,
          sourceHandle: "0", // 默认句柄
          targetHandle: "0"  // 默认句柄
        };
        
        // 检查连接是否有效，然后添加边并处理关系
        if (checkBeforeConnect(params, false)) {
          // 添加边
          setEdges(eds => addEdge({
            ...params,
            type: 'smoothstep',
            style: { strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#888',
            },
          }, eds));
          
          // 处理关系
          onConnectCore(params);
        }
      }, 0);
    }
    // 更新lastClickedNode为新节点
    lastClickedNode.current = newNode as Node;
  }, [setNodes, onConnectCore, checkBeforeConnect,saveToHistory]);

  /**
   * 获取最近的可连接节点和边
   * @param node 当前拖动的节点
   * @returns 可能的连接边或null
   */
  const getClosestEdge = (node: NodeCus) => {
    const { nodeLookup } = store.getState();
    const internalNode = getInternalNode(node.id);
    
    if (!internalNode) return null;

    // 查找最近的节点
    const closestNode = Array.from(nodeLookup.values()).reduce(
      (res, n) => {
        if (n.id !== internalNode.id) {
          // 计算两个节点之间的距离
          const dx = n.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x;
          const dy = n.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          // 确定连接方向（基于Y坐标）
          const closeNodeIsSource = n.internals.positionAbsolute.y < internalNode.internals.positionAbsolute.y;
          
          // 创建模拟连接参数用于检查
          const connectionParams = {
            source: closeNodeIsSource ? n.id : internalNode.id,
            target: closeNodeIsSource ? internalNode.id : n.id,
            sourceHandle: "0",
            targetHandle: "0"
          };
          
          // 增强判断: 使用checkBeforeConnect来验证连接是否允许
          if (d < res.distance && 
              d < config.connectionThreshold && 
              checkBeforeConnect(connectionParams,false)) {
            res.distance = d;
            res.node = n;
          }
        }
        return res;
      },
      {
        distance: Number.MAX_VALUE,
        node: null as any,
      }
    );

    // 如果没有找到足够近的节点,返回null
    if (!closestNode.node) {
      return null;
    }

    // 确定源节点和目标节点(基于Y坐标)
    const closeNodeIsSource = 
      closestNode.node.internals.positionAbsolute.y < 
      internalNode.internals.positionAbsolute.y;

    // 创建可能的连接边
    return {
      id: closeNodeIsSource
        ? `${closestNode.node.id}-${node.id}`
        : `${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
      sourceHandle: "0", // 默认使用第一个连接点
      targetHandle: "0", // 默认使用第一个连接点
      className: 'temp', // 标记为临时边
      style: { stroke: '#ff0072', strokeWidth: 2, strokeDasharray: '5,5' }, // 虚线样式
    };
  }

  /**
   * 节点拖动时的处理函数
   */
  const onNodeDrag = useCallback(
    (_:any, node:NodeCus) => {
      // 只在用户真正拖动节点时启用自动连接功能
      if (!node.dragging) return;
      
      // 获取可能的最近连接边
      const closeEdge = getClosestEdge(node);

      // 其余逻辑保持不变
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && 
              ne.target === closeEdge.target &&
              ne.sourceHandle === closeEdge.sourceHandle &&
              ne.targetHandle === closeEdge.targetHandle
          )
        ) {
          nextEdges.push(closeEdge);
        }
        return nextEdges;
      });
    },
    [getClosestEdge, setEdges]
  );

  /**
   * 节点拖动停止时的处理函数
   */
  const onNodeDragStop = useCallback(
    (_:any, node:NodeCus) => {
      // 获取可能的最近连接边
      const closeEdge = getClosestEdge(node);
      lastClickedNode.current=node as Node;
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && 
              ne.target === closeEdge.target &&
              ne.sourceHandle === closeEdge.sourceHandle &&
              ne.targetHandle === closeEdge.targetHandle
          ) &&
          checkBeforeConnect({
            source: closeEdge.source,
            target: closeEdge.target,
            sourceHandle: closeEdge.sourceHandle,
            targetHandle: closeEdge.targetHandle
          }, false)
        ) {
          const formalEdge = {
            ...closeEdge,
            className: undefined,
            style: undefined,
          };
          nextEdges.push(formalEdge);
          const params = {
            source: formalEdge.source,
            target: formalEdge.target,
            sourceHandle: formalEdge.sourceHandle,
            targetHandle: formalEdge.targetHandle
          };
          setTimeout(() => {
            onConnectCore(params)
          }, 0);
          return nextEdges;
        }
        return nextEdges;
      });
    },
    [getClosestEdge, setEdges, buildT2S, buildS2T]
  );

  // 修改现有的 onNodeDragStop 函数,合并功能
  const originalOnNodeDragStop = onNodeDragStop;
  
  // 替换原有的 onNodeDragStop 函数
  const combinedOnNodeDragStop = useCallback(
    (event:any, node:NodeCus) => {
      // 先执行原有的网格对齐逻辑
      const updatedNodes = nodes.map((n) => {
        if (n.id === node.id) {
          const position = node.position;
          const x = Math.round(position.x / config.divide) * config.divide;
          const y = Math.round(position.y / config.divide) * config.divide;
          return { ...n, position: { x, y } };
        }
        return n;
      });
      setNodes(updatedNodes);
      
      // 再执行自动连接逻辑
      originalOnNodeDragStop(event, node);
    },
    [nodes, setNodes, originalOnNodeDragStop]
  );

  const onEdgeClick=useCallback((_:any,edge:Edge)=>{
    setSelBody({id:edge.id,type:"edge",edge:edge} as Selection)
  },[])

  function removeBody (){
    switch (selBody.type) {
      case 'edge':
        setEdges((prevEdges)=>prevEdges.filter((edge)=>edge.id!=selBody.id))
        onEdgesDelete([selBody.edge])
        break;
      case 'node':
        setNodes((prevNodes)=>prevNodes.filter((node)=>node.id!=selBody.id))
        onNodesDelete([selBody.node as Node])
        break;
      default:
        break;
    }
  }

  const memoToolBox=useMemo(()=>{
    return <ToolBox countinputtext={countInputtext} countinputimg={countInputimg} count={count} addNode={addNode}></ToolBox>
  },[count,countInputtext,countInputimg])
  const memoDebug=useMemo(()=>{
    if(debug.type=="static"){
      return <ComDrawerStatic content={debug.data} buttonShare={<ComShare plugin={plugin} onClick={localSave} buttonShare={<Button type="primary">获取分享链接</Button>} />}></ComDrawerStatic>
    }else{
      return <ComDrawer content={debug.data} buttonShare={<ComShare plugin={plugin} onClick={localSave} buttonShare={<Button type="primary">获取分享链接</Button>} />}></ComDrawer>
    }
  },[debug,debug.data,plugin])

  // 处理画布背景点击
  const onPaneClick = useCallback(() => {
    // 清除任何选中状态
    setSelBody({} as Selection);
  }, [setSelBody]);

  // 添加一个标记来追踪是否需要保存历史
  const shouldSaveHistory = useRef(false);
  // 添加一个引用来存储拖拽开始时的节点位置
  const dragStartNodes = useRef<NodeCus[]>([]);

  // 修复鼠标事件监听
  useEffect(() => {
    const handleMouseUp = () => {
      if (shouldSaveHistory.current) {
        // 保存拖拽开始时的状态到历史记录
        setHistory(curr => ({
          past: [...curr.past, { nodes: dragStartNodes.current, edges: _.cloneDeep(edges) }],
          future: [],
        }));
        
        // 重置标记
        shouldSaveHistory.current = false;
        dragStartNodes.current = [];
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [edges, setHistory]);

  // 比较当前状态和初始状态的函数
  const checkForChanges = useCallback(() => {
    // 比较节点数量是否变化
    if (nodes.length !== initialStateRef.current.nodes.length) {
      return true;
    }
    // 比较边数量是否变化
    if (edges.length !== initialStateRef.current.edges.length) {
      return true;
    }
    // 比较节点内容
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const initialNode = initialStateRef.current.nodes.find(n => n.id === currentNode.id);
      if (!initialNode) {
        return true;
      }
      // 比较位置
      if (JSON.stringify(currentNode.position) !== JSON.stringify(initialNode.position)) {
        return true;
      }
      // 比较数据
      if (JSON.stringify(currentNode.data.values) !== JSON.stringify(initialNode.data.values)) {
        return true;
      }
    }
    // 比较边内容
    for (let i = 0; i < edges.length; i++) {
      const currentEdge = edges[i];
      const initialEdge = initialStateRef.current.edges.find(e => e.id === currentEdge.id);
      if (!initialEdge) {
        return true;
      }
      // 比较关键边属性
      if (currentEdge.source !== initialEdge.source || 
          currentEdge.target !== initialEdge.target ||
          currentEdge.sourceHandle !== initialEdge.sourceHandle ||
          currentEdge.targetHandle !== initialEdge.targetHandle) {
        return true;
      }
    }
    return false;
  }, [nodes, edges]);

  // 当节点或边变化时检查是否有未保存的更改
  useEffect(() => {
    if (initialStateRef.current.nodes.length > 0 || initialStateRef.current.edges.length > 0) {
      setHasUnsavedChanges(checkForChanges());
    }
  }, [nodes, edges, checkForChanges]);

  // 添加页面刷新/关闭时的提醒
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // 阻止默认行为
        e.preventDefault();
        // 设置返回值以显示确认对话框
        e.returnValue = '';
      }
    };

    // 添加事件监听
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 清理函数
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // 修改节点变化处理函数
  const onNodesChangeWithHistory = useCallback((changes: NodeChange[]) => {
    const hasMeaningfulNodeChange = changes.some(change => change.type !== 'select');

    if (!hasMeaningfulNodeChange) {
      onNodesChange(changes as NodeChange<NodeCus>[]);
      return;
    }

    // 标记为有未保存的更改
    setHasUnsavedChanges(true);
    
    // 检查变化类型
    const dragChange = changes.find(change => change.type === 'position');
    
    if (dragChange) {
      // 如果是拖拽操作开始且还没有保存初始状态
      if (!shouldSaveHistory.current) {
        shouldSaveHistory.current = true;
        // 保存拖拽开始时的节点状态，只保存必要的信息
        dragStartNodes.current = nodes.map(node => ({
          ...node,
          // 避免保存完整的data对象，只保存必要属性
          data: {
            label: node.data.label,
            values: node.data.values,
            // 添加缺少的必需属性
            relations: {},
            rels2: {},
            edgeS2T: {}
          },
          position: {...node.position}
        }));
      }
      // 直接应用变化
      onNodesChange(changes as NodeChange<NodeCus>[]);
    } else {
      // 非拖拽操作(如添加、删除节点等)
      // 先应用变化
      onNodesChange(changes as NodeChange<NodeCus>[]);
      
      // 对于添加节点操作，我们不应该清空future历史
      const addChange = changes.find(change => change.type === 'add');
      if (addChange) {
        setHistory(curr => ({
          past: [...curr.past],
          future: curr.future // 保持future不变
        }));
      } else {
        // 其他操作正常保存历史
        saveToHistory();
      }
    }
  }, [onNodesChange, saveToHistory, nodes]);

  // 修改边变化处理函数，减少不必要的深拷贝
  const onEdgesChangeWithHistory = useCallback((changes: EdgeChange[]) => {
    const hasMeaningfulEdgeChange = changes.some(change => change.type !== 'select');

    if (!hasMeaningfulEdgeChange) {
      onEdgesChange(changes as EdgeChange<Edge>[]);
      return;
    }

    // 标记为有未保存的更改
    setHasUnsavedChanges(true);
    
    // 只保存历史上限制数量的历史记录
    setHistory(curr => {
      const pastHistory = [...curr.past, { 
        // 使用简化版本而不是深拷贝
        nodes: nodes.map(node => ({
          id: node.id,
          position: { ...node.position },
          type: node.type,
          // 只保存必要的数据
          data: {
            label: node.data.label,
            values: node.data.values,
            // 添加缺少的必需属性
            relations: {},
            rels2: {},
            edgeS2T: {}
          }
        })),
        edges: structuredClone(edges) 
      }];
      
      // 限制历史记录数量
      if (pastHistory.length > 20) {
        pastHistory.shift();
      }
      
      return {
        past: pastHistory,
        future: []
      };
    });
    
    // 然后应用变化
    onEdgesChange(changes as EdgeChange<Edge>[]);
  }, [onEdgesChange, nodes, edges]);

  // 监听窗口尺寸变化，检测屏幕方向
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    // 初始检测
    checkOrientation();
    
    // 窗口大小变化时重新检测
    window.addEventListener('resize', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);
  
  // 处理调试窗口尺寸调整
  const handleDebugResize = (deltaPercent:number) => {
    if (isLandscape) {
      // 横屏模式：调整宽度
      setWidthDebug((prevWidth) => {
        const newWidth = prevWidth + deltaPercent;
        // 限制宽度范围 (10% - 50%)
        return Math.max(10, Math.min(50, newWidth));
      });
    } else {
      // 竖屏模式：调整高度
      setHeightDebug((prevHeight) => {
        const newHeight = prevHeight + deltaPercent;
        // 限制高度范围 (10% - 80%)
        return Math.max(10, Math.min(80, newHeight));
      });
    }
  };

  return (
    <div style={{
      width: "100%", 
      height: "100vh",
      display: "flex",
      flexDirection: isLandscape ? "row-reverse" : "column"
    }}>
      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        width: isLandscape ? `${100 - widthDebug}%` : "100%",
        height: isLandscape ? "100%" : `${100 - heightDebug}%`,
        position:"relative"
      }}>
        <div style={{ position:"relative",width: '100%', height:'100%',overflow:'hidden'}}>
          <ComZoneBottom addNode={addNode}></ComZoneBottom>
          <ComBack callback={handleSave}></ComBack>
          <ComTimeToProcess></ComTimeToProcess>
          <ComShare plugin={plugin} onClick={localSave}></ComShare>
          {/* 未保存更改 - 浮动保存按钮 */}
          {hasUnsavedChanges && (
            <Button 
              type="primary" 
              onClick={handleSave}
              loading={saveLoading}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f'
              }}
            >
              点击保存
            </Button>
          )}
          <Flex justify='center' style={{position:"absolute",width:"100%"}}>
            {memoToolBox}
          </Flex>
          
          <PluginProvider plugin={plugin} setPlugin={setPlugin} markUnsavedChanges={markUnsavedChanges}>
            <ReactFlow 
              style={{width:"100%"}} nodeTypes={NodeTypes}
              zoomOnPinch={true}       // 启用双指捏合缩放
              panOnDrag={true}         // 启用手势拖拽
              preventScrolling={true}  // 阻止滚动事件冒泡
              nodes={nodes}
              edges={edges}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              onNodesChange={onNodesChangeWithHistory}
              onEdgesChange={onEdgesChangeWithHistory}
              onConnect={onConnect}
              onEdgesDelete={onEdgesDelete}
              onNodesDelete={onNodesDelete}
              onNodeDrag={(event, node) => {
                // 检查事件源是否为输入框，如果是则不触发拖动
                if (event.target instanceof HTMLInputElement || 
                    event.target instanceof HTMLTextAreaElement) {
                  return;
                }
                onNodeDrag(event, node);
              }}
              onNodeDragStop={(event, node) => {
                // 检查事件源是否为输入框，如果是则不触发拖动停止
                if (event.target instanceof HTMLInputElement || 
                    event.target instanceof HTMLTextAreaElement) {
                  return;
                }
                combinedOnNodeDragStop(event, node as NodeCus);
              }}
              onPaneClick={onPaneClick}
              fitView
              connectionMode={undefined}
              connectOnClick={true}
              defaultEdgeOptions={{ 
                type: 'smoothstep',
                style: { strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#888',
                },
              }}
            >
              <Background size={0} bgColor={colorHex}></Background>
            </ReactFlow>
          </PluginProvider>
          <div className='controlBox' style={{ width: "auto", bottom: 41 }}>
            <ComDebugSwitch />
            <ColorPicker value={plugin.color} onChange={(color)=>{
              setColorHex(color.toHexString())
              plugin.color=color.toHexString()
            }}></ColorPicker>
            <Button onClick={removeBody}>删除</Button>
            <Button onClick={undo}>撤销</Button>
            <Button onClick={redo}>重做</Button>
            <Button onClick={handleSave}>保存</Button>
            <div onClick={()=>{
              localSave()
            }}>
              <PluginProvider plugin={plugin} setPlugin={setPlugin}>
                <PublishDialog
                  plugin={plugin}
                  nodes={nodes as NodeCus[]}
                  edges={edges}
                  nodeType={NodeTypes}
                  colorHex={colorHex}
                  onPublishSuccess={() => {
                    const newCreated=_.cloneDeep(created)
                    newCreated[Packaging.GetIdStrStatic(plugin)].published=true
                    setCreated(newCreated)
                  }}
                />
              </PluginProvider>
            </div>
            <ButtonSetting plugin={plugin} setPlugin={setPlugin}></ButtonSetting>
          </div>
        </div>
      </div>
      {showDebug && (
        <div style={{
          position: "relative",
          width: isLandscape ? `${widthDebug}%` : "100%",
          height: isLandscape ? "100%" : `${heightDebug}%`,
          // 允许拖拽手柄跨越边界（命中区/视觉不被裁切）
          overflow: "visible"
        }}>
          <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
            {memoDebug}
          </div>
          <div style={{
            position: "absolute",
            // 让手柄“跨越分割线”居中：横屏贴右边界；竖屏贴上边界
            top: isLandscape ? 0 : -6,
            left: isLandscape ? 'auto' : 0,
            right: isLandscape ? -6 : 'auto',
            width: isLandscape ? "12px" : "100%",
            height: isLandscape ? "100%" : "12px",
            // 仅需要覆盖调试面板本身即可，避免压过 antd Modal
            zIndex: 2
          }}>
            <ComResizeHandle
              onResize={handleDebugResize}
              direction={isLandscape ? "horizontal" : "vertical"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
function ButtonSetting ({plugin,setPlugin}:{plugin:Packaging,setPlugin:Dispatch<SetStateAction<Packaging>>}) {
  const [open,setOpen]=useState(false)
  return (
    <>
      <Button type="primary" onClick={()=>{setOpen(true)}}>设置</Button>
      <Modal cancelText="取消" okText="确认" footer={null} open={open}
        onOk={()=>{setOpen(false)}}
        onCancel={()=>{
          setOpen(false)
      }}>
        <Flex justify='center' style={{width:"100%"}}>
          <Flex align='center' vertical gap={"small"} style={{width:"90%"}}>
            <Input addonBefore="名称" placeholder='应用名称' maxLength={15} value={plugin.name} onChange={(e)=>{
              var value=e.currentTarget.value
              const newPlug={
                ...plugin,
                name:value
              } as Packaging
              setPlugin(newPlug)
            }}></Input>
            <TextArea placeholder='应用描述' value={plugin.description} onChange={(e)=>{
              var value=e.currentTarget.value
              const newPlug={
                ...plugin,
                description:value
              } as Packaging
              setPlugin(newPlug)
            }}></TextArea>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}

// 提取共用的工具函数到组件外部
function buildSourceToTarget(params: ConnectionCus, rels2Record: Record<string, Relation[]>) {
  const target = params.target;
  const src = params.source;
  let relationship = rels2Record[src];
  const ship: Relation = {
    to: target,
    handleSource: params.sourceHandle,
    handleTarget: params.targetHandle,
    handle: params.sourceHandle
  };
  
  if (relationship === undefined) {
    relationship = [ship];
  } else {
    // 避免重复添加
    if (!relationship.some(r => 
      r.to === ship.to && 
      r.handleSource === ship.handleSource && 
      r.handleTarget === ship.handleTarget
    )) {
      relationship.push(ship);
    }
  }
  learnFromRels2(src,relationship)
  rels2Record[src] = relationship;
}

function learnFromRels2(src:string,relationship:Relation[]){
  if(relationship.length==0||relationship==undefined){
    edgeS2T[src]=[]
    return
  }
  // edgeS2T[src]=[relationship[0]]
  // let handleSource=relationship[0].handleSource
  // for(let i=0;i<relationship.length;i++){
  //   if(relationship[i].handleSource!=handleSource){
  //     edgeS2T[src].push(relationship[i])
  //   }
  // }
  edgeS2T[src]=relationship
}

function buildTargetToSource(params: ConnectionCus, relationsRecord: Record<string, Relation[]>){
  const target = params.target;
  const src = params.source;
  let relationship = relationsRecord[target];
  const ship = {
    handle: params.targetHandle,
    to: src,
    handleTarget: params.targetHandle,
    handleSource: params.sourceHandle
  };
  
  if (relationship === undefined) {
    relationship = [ship];
  } else {
    // 避免重复添加
    if (!relationship.some(r => 
      r.to === ship.to && 
      r.handleTarget === ship.handleTarget && 
      r.handleSource === ship.handleSource
    )) {
      relationship.push(ship);
    }
  }
  relationsRecord[target] = relationship;
}

// 找到终点节点的共用函数
function findEndNode(rels2Record: Record<string, Relation[]>) {
  const keys = Object.keys(rels2Record);
  let target = undefined;
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (key !== undefined) {
      let next = rels2Record[key];
      while (next !== undefined && next.length > 0) {
        let flagUpdate = false;
        for (let j = 0; j < next.length; j++) {
          let relation = next[j];
          if (relation.handleSource === "0") {
            target = relation.to;
            next = rels2Record[target];
            flagUpdate = true;
            if (next === undefined) {
              return target;
            }
          }
        }
        if (!flagUpdate) {
          target = key;
          break;
        }
      }
      return target;
    }
  }
  return target;
}

function PublishDialog({ 
  plugin, 
  nodes, 
  edges, 
  nodeType, 
  colorHex,
  onPublishSuccess
}: { 
  plugin: Packaging, 
  nodes: NodeCus[], 
  edges: Edge[],
  nodeType: any,
  colorHex: string,
  onPublishSuccess?: () => void
}) {
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const { theme } = useTheme();
  
  // 修复：使用正确的路由钩子
  const router = useCustomNavigate();
  
  // 使用useRef存储深拷贝数据，避免频繁深拷贝
  const [pluginCopy,setPluginCopy]=useState<Packaging>(plugin);
  const refPluginCopy=useRef<Packaging>(plugin);
  
  const [nodesCopy,setNodesCopy]=useState<NodeCus[]>([]);
  const refNodesCopy=useRef<NodeCus[]>([]);
  const [edgesCopy,setEdgesCopy]=useState<Edge[] | null>(null);
  const refEdgesCopy=useRef<Edge[]>([]);
  
  // 关系和节点记录
  const nodesRecordRef = useRef<Record<string, NodeCus>>({});
  const relations = useRef<Record<string, Relation[]>>({});
  const rels2 = useRef<Record<string, Relation[]>>({});
  const [disPublish,setDisPublish]=useState(true);
  const [loading,setLoading]=useState(false);
  const pluginRef=useRef<Packaging>(plugin);
  
  // 预览用节点和边，基于深拷贝数据生成
  const previewNodes = useMemo(() => {
    if (!nodesCopy) return [];
    return nodesCopy.map(node => ({...node, draggable: false}));
  }, [nodesCopy]);
  
  const previewEdges = useMemo(() => {
    if (!edgesCopy) return [];
    return edgesCopy.map(edge => ({...edge}));
  }, [edgesCopy]);

  useEffect(()=>{
    refNodesCopy.current=nodesCopy
  },[nodesCopy])
  
  // 显式定义阻止事件冒泡函数
  const stopPropagation = useCallback((e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
  }, []);

  // 打开发布弹窗前进行深拷贝，使用结构化克隆代替lodash深拷贝
  const openPublishModal = useCallback(() => {
    const newPluginCopy = structuredClone(plugin);
    // 显式确保ID一致
    newPluginCopy.id = plugin.id;
    setPluginCopy(newPluginCopy);
    
    // 使用结构化克隆替代lodash的深拷贝
    setNodesCopy(structuredClone(nodes));
    setEdgesCopy(structuredClone(edges));
    refNodesCopy.current = structuredClone(nodes);
    refEdgesCopy.current = structuredClone(edges);
    
    // 重置关系记录
    relations.current = {};
    rels2.current = {};
    nodesRecordRef.current = {};
    // 重建边的关系
    refEdgesCopy.current.forEach((edge) => {
      buildSourceToTarget(edge as ConnectionCus, rels2.current);
      buildTargetToSource(edge as ConnectionCus, relations.current);
    });

    // 构建节点查找表
    refNodesCopy.current.forEach(node => {
      nodesRecordRef.current[node.id] = node;
    });
    saveBeforePublish();
    setPublishModalVisible(true);
  }, [plugin, nodes, edges]);
  
  
  /**
   * 清除浮动节点并更新相关的edges
   * @returns 过滤后的节点和边
   */
  function clearFloat() {
    // 获取所有有关系的节点ID
    const keys0 = Object.keys(relations.current || {});
    const keys1 = Object.keys(rels2.current || {});
    const union = new Set([...keys0, ...keys1]);
    
    // 确保 nodesCopy 不为 null
    if (!refNodesCopy.current) return { nodes: [], edges: [] };
    
    // 过滤掉没有关系的节点，不使用深拷贝
    const filteredNodes = refNodesCopy.current.filter(node => union.has(node.id));
    
    if (filteredNodes.length < refNodesCopy.current.length) {
      window.messageApi.info("自动清除孤立节点");
      
      // 更新节点状态，直接使用过滤后的节点
      setNodesCopy(filteredNodes);
      // 获取有效节点ID集合
      const validNodeIds = new Set(filteredNodes.map(node => node.id));
      // 确保 edgesCopy 不为 null
      if (!refEdgesCopy.current) return { nodes: filteredNodes, edges: [] };
      // 过滤掉指向已删除节点的边
      const filteredEdges = refEdgesCopy.current.filter(edge => 
        validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
      );
      // 更新边状态
      setEdgesCopy(filteredEdges);
      return {
        nodes: filteredNodes,
        edges: filteredEdges
      };
    }
    return {
      nodes: filteredNodes,
      edges: refEdgesCopy.current || []
    };
  }
  
  // 计算输入类型 - 使用nodesCopy
  const calculateTypeInput = useCallback(() => {
    if (!refNodesCopy.current) return "00";
    const RecordInput: Record<string, number[]> = {};
    refNodesCopy.current.forEach((node: NodeCus) => {
      if (node.type === EnumNodeType.In || node.type === EnumNodeType.InImg||node.type==EnumNodeType.DbWriteCloud) {
        let array = RecordInput[node.type];
        if (array === undefined) {
          RecordInput[node.type] = [];
        }
        RecordInput[node.type].push(1);
      }
    });
    
    let countOfImg = 0;
    let countOfText = 0;
    let countOfPasswordCloud = 0;
    
    Object.keys(RecordInput).forEach((key) => {
      const array = RecordInput[key];
      if (key === EnumNodeType.InImg) {
        countOfImg = array.length;
        return;
      }
      if(key==EnumNodeType.DbWriteCloud){
        countOfPasswordCloud = array.length;
        return
      }
      if(key==EnumNodeType.In){
        countOfText = array.length;
        return
      }
    });

    
    return `${countOfText}${countOfImg}${countOfPasswordCloud}`;
  }, [refNodesCopy.current]);
  // 保存逻辑
  const saveBeforePublish = useCallback(() => {
    if (!pluginCopy || refNodesCopy.current.length === 0 || refEdgesCopy.current.length === 0) {
      window.messageApi.error("应用不完整，无法发布");
      return;
    }
    
    // 清除浮动节点并获取更新后的数据
    const { nodes: updatedNodes, edges: updatedEdges } = clearFloat();
    
    if (updatedNodes.length === 0 || updatedEdges.length === 0) {
      window.messageApi.error("应用中没有有效节点或连接，请添加节点并连接后再发布");
      return;
    }
    
    const end = findEndNode(rels2.current);
    if (end === undefined) {
      window.messageApi.error("请添加输出节点后再发布");
      return;
    }

    let nodeTypes: Record<string, string> = {};
    updatedNodes.forEach(node => {
      nodeTypes[node.id] = node.type ?? '';
    });
    
    Branch.reset();
    let tree: string = "";
    if (end !== undefined) {
      let branch = new Branch(
        {id: end}, 
        relations.current, 
        nodeTypes, 
        nodesRecordRef
      );
      let jsonData = branch.attach();
      tree = JSON.stringify(jsonData);
    }
    
    const typeInput = calculateTypeInput();
    
    // 直接修改 pluginCopy
    pluginCopy.tree = tree;
    pluginCopy.typeinput = typeInput;
    
    updatedNodes.forEach(node => {
      node.data.relations ={}
      node.data.rels2 ={}
    });
    // pluginCopy.data = JSON.stringify({
    //   nodes: updatedNodes,
    //   edges: updatedEdges,
    // });
    pluginCopy.data=""
    pluginRef.current = pluginCopy;
    refPluginCopy.current=pluginCopy
    setDisPublish(false);
  }, [pluginCopy, calculateTypeInput]);
  

  // 处理发布 - 不再需要确认弹窗
  const handlePublish = () => {
    setLoading(true)
    
    if (!pluginCopy) {
      window.messageApi.error("应用不完整，无法发布");
      setLoading(false)
      return;
    }
    let temp=_.cloneDeep(plugin)
    temp.tree=refPluginCopy.current.tree
    temp.typeinput=refPluginCopy.current.typeinput
    temp.data=refPluginCopy.current.data
    server.publish(temp)
      .then(res => {
        let data = res.data;
        if (data.success) {
          window.messageApi.success({
            content: "发布成功！",
            key: "publish"
          });
          if (onPublishSuccess) {
            onPublishSuccess();
          }
        } else {
          window.messageApi.error({
            content: data.message || "发布失败，请重试",
            key: "publish"
          });
        }
      })
      .catch(error => {
        window.messageApi.error({
          content: "发布请求出错，请稍后重试",
          key: "publish"
        });
        LogError(error);
      })
      .finally(() => {
        setPublishModalVisible(false);
        setLoading(false)
      });
  };

  return (
    <>
      {/*
        <Button 
          type="default" 
          onClick={openPublishModal}
          style={{width:"100%"}}
        >
          发布
        </Button>
      */}
      {/* 发布预览弹窗 */}
      <Modal
        title="发布应用"
        open={publishModalVisible}
        footer={[
          <Button key="back" onClick={() => setPublishModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handlePublish}
            disabled={disPublish}
            loading={loading}
          >
            发布
          </Button>
        ]}
        onCancel={() => setPublishModalVisible(false)}
        width={800}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto', padding: '20px' } }}
      >
        <Flex gap="small" vertical>
          <div>{plugin?.name}</div>
          <Flex>
            发布前请先阅读
            <div style={{color:"blue",cursor:"pointer"}} onClick={()=>{
              router("/license")
            }}>《应用发布协议》</div>
          </Flex>
          <div 
            style={{ 
              height: '350px', 
              width: '100%',
              border: '1px solid #d9d9d9', 
              borderRadius: '4px',
              background: theme === 'light' ? '#f0f2f5' : '#1f1f1f',
              position: 'relative',
              overflow: 'hidden' // 确保内容不溢出
            }}
          >
            <ReactFlowProvider>
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0
              }}>
                <ReactFlow
                  nodes={previewNodes}
                  edges={previewEdges}
                  nodeTypes={nodeType}
                  fitView
                  zoomOnScroll={true}
                  panOnScroll={false}
                  panOnDrag={true}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  preventScrolling={true}
                  onPaneClick={stopPropagation}
                  proOptions={{ hideAttribution: true }}
                  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                  defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { strokeWidth: 2 },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                    },
                  }}
                >
                  <Background color={colorHex} size={0} />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          </div>
        </Flex>
      </Modal>
    </>
  );
}