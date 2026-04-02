import { Res, TypeFileInfos } from "../types/types"

// const ssl="http"
// const domain = "worker0"
// const port=8888
const apiVersion="/v2"
const ssl="https"
const domain = "fenshen.top"
const port=33
const url = `${ssl}://${domain}:${port}`
const web = `${ssl}://${domain}/`
// const local = "http://192.168.0.168:8888"
const local = "http://localhost:8888"
const webLocal = "http://localhost:5173/"
const webRemote="https://aditor.cn/"

// 动态检测是否在 Tauri 桌面环境中
const detectIsDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  // 检测 Tauri 特有的全局对象
  const win = window as any;
  return !!(win.__TAURI__ || win.__TAURI_INTERNALS__ || win.__TAURI_IPC__);
};

const isDesktop = detectIsDesktop();
const connectionThreshold=180
const divide=50
const MESSAGE_KEY = 'nodeMessage';
const ERROR_KEY = 'nodeError';

const keyToMemoryGen = "valueList"
const keyToMemoryCsv = "csv"

// 将环境判断移到函数中
const getUrl4 = () => {
  const isDev = process.env.NODE_ENV === 'development';
  return (true||!isDev) ? url : local;
}

const getWebUrl=()=>{
  const isDev = process.env.NODE_ENV === 'development';
  return (false||!isDev) ? webRemote : webLocal;
}

const url4 = getUrl4();
const webUrl=getWebUrl()
const urlplug = url4 + "/plug" + apiVersion
const urltdengine = urlplug
const urlorder = url4
const version = "1.8.16"
const tokenName="资源点"
const tokenRatio=1000
//人工客服
const customerService0 = "https://work.weixin.qq.com/kfid/kfcfad99b407ee43a20"
//排错小助手
const customerService1 = "https://work.weixin.qq.com/kfid/kfc1a9cb6643bb7068e"
const samplingOptions = [
  { value: 1.0, label: '清晰度 100%' },
  { value: 0.9, label: '清晰度 90%' },
  { value: 0.8, label: '清晰度 80%' },
];

let typeFileInfos:TypeFileInfos={
  img:{ 
    name:"图片",
    size:0,
    url:""
  },
  text:{
    name:"文本",
    size:0,
    url:""
  },
  excel:{
    name:"表格",
    header:[] as string[],
  },
  audio:{
    name:"音频",
    size:0,
    url:""
  },
  latest:{
    name:"最新",
    size:0,
    url:""
  },  
  md:{
    name:"markdown",
    size:0,
    url:""
  }
}

export const DefaultInput:Res={
  success:true,
  msg:"",
  fileInfo:typeFileInfos
}

const Errors={
  pdf:"当前浏览器不兼容PDF。解决方案：请直接在微信中打开aditor官网链接。",
}

export default {
  domain,
  webLocal,
  web,
  version,
  urlplug,
  urlorder,
  local,
  samplingOptions,
  isDesktop,
  keyToMemoryGen,
  keyToMemoryCsv,
  tokenName,
  tokenRatio,
  connectionThreshold,
  divide,
  customerService0,
  customerService1,
  MESSAGE_KEY,
  ERROR_KEY,
  webUrl,
  urltdengine,
  Errors,
}