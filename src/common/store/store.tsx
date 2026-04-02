import {atom, createStore, useAtom} from "jotai";
import { RecordPlugins, TypeUserInfo, ConfigLLM, Relation, TypeDebug, TypeMsg, DataGetLatestStatus } from "../types/types";
import {atomWithStorage} from 'jotai/utils'
import { NavigateFunction } from "react-router-dom";
import Storage from "../Storage";
import { Packaging } from "../classes";
import utils from "../utils";

export let router: NavigateFunction | null = null;
const atomRecordNotice=atom<Record<string,boolean>>()

export const stateRecordNotice=atom(
  (get)=>get(atomRecordNotice)||Storage.getObject("recordNotice"),
  (_,set,v:Record<string,boolean>)=>{
    set(atomRecordNotice,v)
    utils.log(v);
    if(v){
      Storage.setObject("recordNotice",v)
    }else{
      Storage.remove("recordNotice")
    }
  }
)

export const setRouter = (r: NavigateFunction) => {
  router = r;
};

let PrevTypeMsg:TypeMsg="text"
export const setPrevTypeMsg=(v:TypeMsg)=>{
  PrevTypeMsg=v
}
export const getPrevTypeMsg=()=>{
  return PrevTypeMsg
}
export const stateGlobalTypeMsg=atom<TypeMsg>("text")
// export const getGlobalTypeMsg=()=>{
//   return GlobalTypeMsg
// }
export let TableTrigger: Record<string, boolean> = {};

export function clearTableTrigger() {
  TableTrigger={}
}

declare global {
  interface Window {
    __TAURI__?: any;
  }
}
export const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

export const selectedIdState=atom("")
export const currentIndexState=atomWithStorage("currentIndex",-1)
export const triggeringState = atom(false)


//高性能模式
const atomHighPerformance=atom(false)
export const stateHighPerformance=atom(
  (get)=>get(atomHighPerformance),
  (_,set,v:boolean)=>{
    set(atomHighPerformance,v)
    Storage.setItemAsync("highPerformance",v.toString())
  }
)
const atomLocalLLM=atom({local:true,
    apiurl:"http://127.0.0.1:11434",
    text:{apiurl:"http://127.0.0.1:11434",model:"deepseek-r1:1.5b",apiType:"ollama",apikey:""},
    img:{apiurl:"http://127.0.0.1:11434",model:"llama3.2-vision:11b",apiType:"ollama",apikey:""},
    ocr:{apiurl:"http://127.0.0.1:11434",model:"llama3.2-vision:11b",apiType:"ollama",apikey:""},
    search:{apiurl:"http://127.0.0.1:11434",model:"",apiType:"ollama",apikey:""}
  } as ConfigLLM
)

export const stateLocalLLM=atom(
  (get)=>get(atomLocalLLM),
  (_,set,v:ConfigLLM)=>{
    set(atomLocalLLM,v)
    Storage.setItemAsync("localLLM",JSON.stringify(v))
  }
)

const atomCountToken=atom(0)
export const stateCountToken = atom(
  (get) => get(atomCountToken),
  (_, set, v: number) => {
    if(!v){
      v=-1
    }
    set(atomCountToken, v)
    Storage.setItemAsync("countToken", v.toString())
  }
)

const atomStatus=atomWithStorage<DataGetLatestStatus | null>("status", null)
export const stateStatus = atom(
  (get) => get(atomStatus),
  (_, set, v: DataGetLatestStatus | null) => {
    set(atomStatus, v)
    if(v){
      Storage.setObject("status", v)
    }else{
      Storage.remove("status")
    }
  }
)

const atomCountResource=atom(0)
export const stateCountResource=atom(
  (get) => get(atomCountResource),
  (_, set, v: number) => {
    if(!v){
      v=-1
    }
    set(atomCountResource, v)
    Storage.setItemAsync("countResource", v.toString())
  }
)


const atomDownloadPath=atom("")
export const stateDownloadPath = atom(
  (get) => get(atomDownloadPath),
  (_, set, v: string) => {
    set(atomDownloadPath, v)
    Storage.setItemAsync("downloadPath", v)
  }
)

export type DownloadTaskStatus = "in_progress" | "success" | "error" | "cancelled"
export interface DownloadTaskItem {
  id: string
  fileName: string
  fileType: string
  status: DownloadTaskStatus
  progress?: number
  createdAt: number
  updatedAt: number
  path?: string
  error?: string
}

const atomDownloadTasks = atomWithStorage<DownloadTaskItem[]>("downloadTasks", [])
export const stateDownloadTasks = atom(
  (get) => get(atomDownloadTasks),
  (_, set, updater: DownloadTaskItem[] | ((prev: DownloadTaskItem[]) => DownloadTaskItem[])) => {
    if (typeof updater === "function") {
      set(atomDownloadTasks, (updater as (prev: DownloadTaskItem[]) => DownloadTaskItem[]))
      return
    }
    set(atomDownloadTasks, updater)
  }
)

const atomDownloadManagerVisible = atom(false)
export const stateDownloadManagerVisible = atom(
  (get) => get(atomDownloadManagerVisible),
  (_, set, visible: boolean) => set(atomDownloadManagerVisible, visible)
)

// 下载导出：是否在 CSV/XLSX 中包含表头（持久化）
export const stateDownloadIncludeHeader = atomWithStorage<boolean>(
  "downloadIncludeHeader",
  false
)

// 记忆面板下载格式：持久化保存用户上次选择
export const stateMemoryDownloadFormat = atomWithStorage<
  "excel" | "csv" | "txt" | "markdown" | "word"
>("memoryDownloadFormat", "excel")

// 首页内网模式开关：持久化保存用户选择
export const stateIntranetMode = atomWithStorage<boolean>("intranetMode", false)

export const stateDebug = atom<TypeDebug>({
  show: false,
  data: "",
  loading: false,
  nodeId: "",
  nodeType: "",
  msgtype: "text",
  success: true
});

export const atomCountdown=atomWithStorage("countdown",0)

const created = atom({} as RecordPlugins)
export const stateCreated = atom(
  (get) => get(created),
  (_, set, v: RecordPlugins) => {
    set(created, v)
    Storage.setObject("created", v)
  }
)

const collected=atom({} as RecordPlugins)
export const stateCollected = atom(
  (get) => get(collected),
  (_, set, v: RecordPlugins) => {
    set(collected, v)
    Storage.setObject("collected", v)
  }
)
const plugins=atom({} as RecordPlugins)
export const statePlugins = atom(
  (get) => get(plugins),
  (_, set, v: RecordPlugins) => {
    set(plugins, v)
    Storage.setObject("plugins", v)
  }
)

const packaging=atom({id:-1,name:"",description:""} as Packaging)
export const statePackaging = atom(
  (get) => get(packaging),
  (_, set, v: Packaging) => {
    set(packaging, v)
    Storage.setObject("packaging", v)
  }
)

const token=atom("")
export const tokenState = atom(
  (get) => get(token),
  (_,set, newStr:string) => {
    set(token,newStr)
    if(newStr==""){
      Storage.remove("token")
    }else{
      Storage.setItemAsync("token", newStr)
    }
  }
)

const user=atom({} as TypeUserInfo)
export const stateUserInfo=atom(
  (get)=>get(user),
  (_,set, v:TypeUserInfo) => {
    set(user,v)
    Storage.setObject("userinfo",v)
  }
)

const agreeAtom = atom("0")
export const agreeState = atom<string, [string], void>(
  (get) => get(agreeAtom),
  (_, set, newStr) => {
    // 直接存储原始字符串（不经过 JSON 处理）
    localStorage.setItem('agree', newStr)
    set(agreeAtom, newStr)
  }
)

export const isMobileState=atom(false)
export const phoneState=atom("")
export const passwordState=atom("")
export const showCheckPayState=atom(false)

// 云端记忆：持久化保存密码（用于 DbWriteCloud / DbReadCloud）
export const stateCloudMemPassword = atomWithStorage<string>("cloudMemPassword", "")

// 应用使用页鉴权：按应用 ID 持久化保存密码
export const stateJitaiAuthPassword = atomWithStorage<Record<string, string>>(
  "jitaiAuthPassword",
  {}
)

// 最近一次生成/输出的表头（headers），用于跨节点复用与持久化
// 例如：DbWrite 勾选“文件名溯源”后，会把“文件名,”插入到 headers 最前面，并写入此处
export const stateHeaders = atomWithStorage<string>("lastOutputHeaders", "")

// 添加主题状态，默认跟随系统
const atomThemeMode=atom<'light' | 'dark' | 'system'>('system')
export const stateThemeMode = atom(
  (get) => get(atomThemeMode),
  (_, set, v: 'light' | 'dark' | 'system') => {
    set(atomThemeMode, v)
    Storage.setItemAsync("themeMode", v)
  }
)

const getSystemPrefersDark = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const atomSystemPrefersDark = atom<boolean>(getSystemPrefersDark());
export const stateSystemPrefersDark = atom(
  (get) => get(atomSystemPrefersDark),
  (_, set, v: boolean) => {
    set(atomSystemPrefersDark, v);
  }
);

// 添加计算后的实际主题状态（考虑系统设置）
export const actualThemeState = atom((get) => {
  const themeMode = get(stateThemeMode)
  
  if (themeMode === 'system') {
    // 跟随系统设置
    return get(stateSystemPrefersDark) ? 'dark' : 'light'
  }
  
  return themeMode
})

export const routerAuth = (path: string) => {
  // 直接从 store 获取 token
  const token = globalStore.get(tokenState);
  
  if (token) {
    router?.(path);
  } else {
    router?.(`/login?next=${path}`, { 
      replace: true,
      state: { from: window.location.pathname }
    });
  }
};

export const globalStore=createStore()
stateCreated.onMount = () => {
  const unsub = globalStore.sub(stateCreated, () => {
  });
  
  return unsub;
};

// 在文件顶部添加接口定义
interface AppConfigs {
  version: string;
  messages: Message[];
  lastReadMessageId: number;
  settings: {
    theme: string;
    fontSize: number;
    autoSave: boolean;
    language: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// 消息接口
interface Message {
  id: number;
  title: string;
  content: string;
  date: string;
  read: boolean;
  type: 'system' | 'update' | 'notice';
}

// 定义默认配置
const defaultConfigs: AppConfigs = {
  version: '1.0.0',
  messages: [],
  lastReadMessageId: 0,
  settings: {
    theme: 'light',
    fontSize: 14,
    autoSave: true,
    language: 'zh-CN'
  }
};

// 使用 atomWithStorage 创建持久化的配置存储
const configsAtom = atomWithStorage<AppConfigs>('app_configs', defaultConfigs);

// 导出配置状态
export const stateConfigs = atom(
  (get) => get(configsAtom),
  (get, set, update: Partial<AppConfigs> | ((prev: AppConfigs) => AppConfigs)) => {
    if (typeof update === 'function') {
      set(configsAtom, (prev) => update(prev));
    } else {
      set(configsAtom, (prev) => ({ ...prev, ...update }));
    }
    // 可选：将更新后的配置同步到其他存储
    Storage.setObject('app_configs', get(configsAtom));
  }
);

// 便捷的配置访问器
export const useAppConfig = (key: keyof AppConfigs) => {
  const [configs] = useAtom(stateConfigs);
  return configs[key];
};

// 添加用于控制是否显示调试面板的状态
const showDebugAtom = atom(true)
export const showDebugState = atom(
  (get) => {
    return get(showDebugAtom)
  },
  (_, set, value: boolean) => {
    set(showDebugAtom, value)
    Storage.setItemAsync("showDebug", value.toString())
  }
)

export const widthDebugState = atomWithStorage("widthDebug",25)

export const heightDebugState = atomWithStorage("heightDebug",30)

// 屏幕方向状态
export const stateScreenOrientation = atom<'landscape' | 'portrait'>((_get): 'landscape' | 'portrait' => {
  // 初始化时根据窗口尺寸设置默认方向
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }
  return 'portrait'; // 默认值
});

// 同步时间戳状态
export const lastSyncTimestampState = atomWithStorage("lastSyncTimestamp", 0)

const initDownloadPath=async()=>{
  const downloadPath=await Storage.getItemAsync("downloadPath")
  if(!downloadPath){
    globalStore.set(stateDownloadPath,"")
  }
}

const normalizeLocalLLMConfig = (value: ConfigLLM): ConfigLLM => {
  const normalizeApiType = (apiType: unknown) => {
    if (apiType === "ollama" || apiType === "openai" || apiType === "deepseek") {
      return apiType
    }
    if (apiType === "openai-compatible" || apiType === "qwen" || apiType === "moonshot") {
      return "openai"
    }
    return "ollama"
  }

  const normalizeDetail = (detail: any, fallbackModel: string) => ({
    ...detail,
    apiurl: detail?.apiurl || "http://127.0.0.1:11434",
    model: detail?.model ?? fallbackModel,
    apiType: normalizeApiType(detail?.apiType),
    apikey: detail?.apikey || "",
  })

  return {
    ...value,
    apiurl: value?.apiurl || "http://127.0.0.1:11434",
    local: Boolean(value?.local),
    text: normalizeDetail(value?.text, "deepseek-r1:1.5b"),
    img: normalizeDetail(value?.img, "llama3.2-vision:11b"),
    ocr: normalizeDetail(value?.ocr, "llama3.2-vision:11b"),
    search: normalizeDetail(value?.search, ""),
  }
}

export async function Init() {
  await initDownloadPath()
  
  let localLLMString=await Storage.getItemAsync("localLLM")
  let localLLMValue:ConfigLLM
  if(!localLLMString){
    localLLMValue=normalizeLocalLLMConfig({local:true,
      apiurl:"http://127.0.0.1:11434",
      text:{done:false,done_reason:"",response:"",apikey:"",apiType:"ollama",apiurl:"http://127.0.0.1:11434",model:"deepseek-r1:1.5b"},
      img:{done:false,done_reason:"",response:"",apikey:"",apiType:"ollama",apiurl:"http://127.0.0.1:11434",model:"llama3.2-vision:11b"},
      ocr:{done:false,done_reason:"",response:"",apikey:"",apiType:"ollama",apiurl:"http://127.0.0.1:11434",model:"llama3.2-vision:11b"},
      search:{done:false,done_reason:"",response:"",apikey:"",apiType:"ollama",apiurl:"http://127.0.0.1:11434",model:""}
    } as ConfigLLM)
  } else {
    localLLMValue=normalizeLocalLLMConfig(JSON.parse(localLLMString) as ConfigLLM)
  }
  globalStore.set(stateLocalLLM,localLLMValue)

  let tokenValue=await Storage.getItemAsync("token")
  if(!tokenValue){
    tokenValue=""
  }
  globalStore.set(tokenState,tokenValue)
  let userValue=await Storage.getObject("userinfo")
  if(!userValue){
    userValue={} as TypeUserInfo
  }
  globalStore.set(stateUserInfo,userValue)

  let createdValue = await Storage.getObject("created")
  if(!createdValue){
    createdValue={} as RecordPlugins
  }
  globalStore.set(stateCreated, createdValue)


  let countTokenValue=await Storage.getItemAsync("countToken")
  if(!countTokenValue){
    countTokenValue="0"
  }
  globalStore.set(stateCountToken,parseInt(countTokenValue))

  let statusValue=await Storage.getObject("status")
  if(statusValue){
    globalStore.set(stateStatus, statusValue as DataGetLatestStatus)
  }
  let packagingValue=await Storage.getObject("packaging")
  if(!packagingValue){
    packagingValue={id:-1,name:"",description:""} as Packaging
  } else {
    packagingValue=packagingValue as Packaging
  }
  globalStore.set(statePackaging,packagingValue)
  let pluginsValue=await Storage.getObject("plugins")
  if(!pluginsValue){
    pluginsValue={} as RecordPlugins
  } else {
    pluginsValue=pluginsValue as RecordPlugins
  }
  globalStore.set(statePlugins,pluginsValue)
  
  // 加载配置
  let configsValue = await Storage.getObject('app_configs');
  if (!configsValue) {
    configsValue = defaultConfigs;
  } else {
    // 确保新增配置项存在
    configsValue = { ...defaultConfigs, ...configsValue };
  }
  globalStore.set(stateConfigs, configsValue);
  // 加载是否显示调试面板的状态
  const showDebugValue = await Storage.getItemAsync("showDebug");
  if (showDebugValue) {
    globalStore.set(showDebugState, showDebugValue === "true");
  }else{
    globalStore.set(showDebugState, true);
  }
  let collectedValue=await Storage.getObject("collected")
  if(!collectedValue){
    collectedValue={} as RecordPlugins
  } else {
    collectedValue=collectedValue as RecordPlugins
  }
  globalStore.set(stateCollected,collectedValue)
}

// // 初始化函数，从本地存储加载 STS token 信息
// async function initStsToken() {
//   try {
//     const storedStsToken = await Storage.getObject("sts_token") as DataGetOssStsToken | null;
//     const storedExpiration = await Storage.getItemAsync("sts_expiration");
    
//     if (storedStsToken && storedExpiration) {
//       // 检查是否已过期
//       const now = new Date();
//       const expirationDate = new Date(storedExpiration);
      
//       if (now < expirationDate) {
//         globalStore.set(stsTokenAtom, storedStsToken);
//         globalStore.set(stsExpirationAtom, storedExpiration);
//       } else {
//       }
//     }
//   } catch (error) {
//     console.error("Failed to load STS token from storage:", error);
//   }
// }
export function Clear(){
  globalStore.set(stateUserInfo,{} as TypeUserInfo)
  globalStore.set(stateCreated,{} as RecordPlugins)
  globalStore.set(statePlugins,{} as RecordPlugins)
  globalStore.set(statePackaging,{id:-1,name:"",description:""} as Packaging)
  globalStore.set(stateCountToken,0)
  globalStore.set(stateDebug,{} as TypeDebug)
  globalStore.set(tokenState,"")
  globalStore.set(stateStatus, null);
  globalStore.set(stateConfigs, defaultConfigs);
}
interface HistoryItem {
  pathname: string;
  search: string;
}
export const stateHistory = atom<HistoryItem[]>([]); 

let rels2:Record<string,Relation[]>={} as Record<string,Relation[]>
let relations:Record<string,Relation[]>={} as Record<string,Relation[]>
let edgeS2T:Record<string,Relation[]>={} as Record<string,Relation[]>






export default {
  rels2,
  relations,
  edgeS2T
}

Init()