import axios from "axios";
import config from "../config/config";
import { Packaging } from "../classes";
import { DataCloudRead, DataGeneral, DataGetPublished, DataGpt, DataLog, DataPlanConfig,DataSms,DataUse, ResRun, ResUse, TypePlan, TypePromise, DataActivate, DataGetuserinfo, DataPublish, DataGetToken, DataGetPublishedList, RecordPlugins, DataPresignUrl, DataShareCreate, DataShareVisit, DataInviteCreateLink, DataGetLatestStatus, ReqVatInvoiceOcr, DataVatInvoiceOcr } from "../types/types";
import cache from "../cache";
import { globalStore, router, stateCountResource, stateCountToken, stateHighPerformance, stateLocalLLM, stateStatus, stateUserInfo, tokenState} from "../store/store";
import { normalizeLatestStatusTimestamps } from "../time";
import { requestLocalLLM } from "../llm";

const Url_gptOcr=config.urlplug
const Url_gptSearch=config.urlplug
const Url_gptImg=config.urlplug
const Url_gptPrompt=config.urlplug
const Url_save=config.urlplug
const Url_create=config.urlplug
const Url_login=config.urlplug
const Url_logup=Url_login
const Url_run=config.urlplug
const Url_use=config.urlplug
const Url_read=config.urlplug
const Url_getpublished=config.urlplug
const Url_config=config.urlplug
const Url_getuserinfo=config.urlplug
const Url_smssend=config.urlplug
// const Url_ordercreate=config.local
const Url_ordercreate=config.urlorder
const Url_useActiveCode=config.urlplug
const Url_publish = config.urlplug
const Url_gettoken = config.urlplug
const Url_getpublishedlist = config.urlplug
const Url_updatecollected=config.urlplug
const Url_changepassword=config.urlplug
const Url_getlateststatus=config.urlplug

function cost(token :number){
  globalStore.set(stateCountToken,globalStore.get(stateCountToken)-token)
  globalStore.set(stateCountResource,globalStore.get(stateCountResource)-token/1000)
}

// 保存成功后主动更新本地 status 时间戳，避免下次启动被判定“本地落后”而触发 server.use 拉取
function touchLocalStatus(uuid: string) {
  if (!uuid) return;
  const now = Date.now();
  const current = globalStore.get(stateStatus);
  const counttoken = globalStore.get(stateCountToken) || 0;

  const base: DataGetLatestStatus = normalizeLatestStatusTimestamps(
    (current ?? {
      success: true,
      message: "local",
      counttoken,
      statussave: { items: [], time_update: 0 },
    }) as DataGetLatestStatus
  );

  const items = Array.isArray(base.statussave?.items) ? [...base.statussave.items] : [];
  const idx = items.findIndex((it) => it.uuid === uuid);
  if (idx >= 0) {
    items[idx] = { ...items[idx], time_update: Math.max(items[idx].time_update || 0, now) };
  } else {
    items.push({ uuid, time_update: now });
  }

  globalStore.set(stateStatus, {
    ...base,
    success: true,
    message: base.message || "local",
    counttoken,
    statussave: {
      ...base.statussave,
      items,
      time_update: Math.max(base.statussave?.time_update || 0, now),
    },
  });
}

export const axiosInstance = axios.create({
  // ... existing config ...
});

function getAuthToken(): string {
  // 防止 token 中包含换行/空白导致浏览器拒绝设置 header
  const raw = String(globalStore.get(tokenState) || "");
  return raw.replace(/[\r\n]+/g, "").trim();
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = (config.headers || {}) as any;
      const headersAny: any = config.headers;
      if (typeof headersAny.set === "function") {
        headersAny.set("Authorization", `Bearer ${token}`);
      } else {
        headersAny.Authorization = `Bearer ${token}`;
      }
    } else {
      // token 为空时不发送 Authorization，避免出现 "Bearer \n" 等非法值
      const headersAny: any = config.headers;
      if (headersAny) {
        if (typeof headersAny.delete === "function") {
          headersAny.delete("Authorization");
        } else {
          delete headersAny.Authorization;
        }
      }
    }
    return config;
  },
  (error) => {
    if (error.response.status === 413) {
      throw new Error("图片太大，请压缩后重试")
    }
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if(response.data.success && response.data.total_tokens !== undefined){
      const currentCount = globalStore.get(stateCountToken) || 0;
      globalStore.set(stateCountToken, currentCount -response.data.total_tokens);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      globalStore.set(tokenState, "");
      const token=globalStore.get(tokenState)
      let msg="此功能需要登录"
      if(token){
        msg="登录已过期，请重新登录"
      }
      window.messageApi.error({
        content:msg,
        key:"error"
      });
      setTimeout(() => {
        if (router) {
          router("/login");
        } else {
          window.location.href = "/login";
        }
      }, 1500);
    }
    if (error.response?.status === 413) {
      console.error('请求数据过大:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // 自定义 413 错误
      error.message = '请求数据过大，请尝试压缩后重试';
    }
    return Promise.reject(error);
  }
);

export async function LogError(name:string,phone:string,msg:string){
  return axiosInstance.post(config.urlplug+"/log/error",{
    name:name,
    phone:phone,
    msg:msg,
    timeStr:new Date().toISOString(),
    time:new Date().getTime(),
    data:""
  })
}

async function gptOcr(prompt:string,img:string,ques:string):TypePromise<DataGpt>{
  let localLLM=globalStore.get(stateLocalLLM)
  if(localLLM.local){
    try {
      let dataLLM=await requestLocalLLM(localLLM.ocr,{
        prompt:prompt+ques,
        imageUrl:img
      })
      return {
        data:{
          success:dataLLM.done,
          message:dataLLM.done_reason,
          msg:dataLLM.response,
          total_tokens:0
        }
      }
    } catch (error:any) {
      LogError("gptOcr",globalStore.get(stateUserInfo).phone,error.message)
      throw new Error("请正确接入本地OCR大模型")
    }
  }
  try {
    let res=await ConvertBase64ToUrl(img)
    if(res.success){
      img=res.url
    }
  } catch (error:any) {
    LogError("gptOcr",globalStore.get(stateUserInfo).phone,error.message||"")
  }
  const data={
    prompt:prompt,
    img:img,
    q:ques
  }
  return axiosInstance.post(Url_gptOcr+"/gptocr",data)
  .then(res=>{
    if(res.data.success){
      cost(res.data.total_tokens)
    }else{
      LogError("gptOcr",globalStore.get(stateUserInfo).phone,res.data.msg||"")
    }
    return res
  })
  .catch(error=>{
    LogError("gptOcr",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
async function gptSearch(prompt:string,ques:string):TypePromise<DataGpt>{
  let localLLM=globalStore.get(stateLocalLLM)
  if(localLLM.local){
    try {
      let dataLLM=await requestLocalLLM(localLLM.search,{
        prompt:prompt+ques
      })
      return {
        data:{
          success:dataLLM.done,
          message:dataLLM.done_reason,
          msg:dataLLM.response,
          total_tokens:0
        }
      }
    } catch (error:any) {
      LogError("gptSearch",globalStore.get(stateUserInfo).phone,error.message||"")
      throw new Error("请正确接入本地搜索大模型")
    }
  }
  const data={
    prompt:prompt,
    q:ques
  }
  return axiosInstance.post(Url_gptSearch+"/gptsearch",data)
  .then(res=>{
    if(res.data.success){
      cost(res.data.total_tokens)
    }else{
      LogError("gptSearch",globalStore.get(stateUserInfo).phone,res.data.msg||"")
    }
    return res
  })
  .catch(error=>{
    LogError("gptSearch",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
async function gptImg(prompt:string,img:string,ques:string):TypePromise<DataGpt>{
  let localLLM=globalStore.get(stateLocalLLM)
  if(localLLM.local){
    try {
      let dataLLM=await requestLocalLLM(localLLM.img,{
        prompt:prompt+ques,
        imageUrl:img,
        numCtx:1024
      })
      return {
        data:{
          success:dataLLM.done,
          message:dataLLM.done_reason,  
          msg:dataLLM.response,
          total_tokens:0
        }
      }
    } catch (error:any) {
      LogError("gptImg",globalStore.get(stateUserInfo).phone,error.message||"")
      throw new Error("请正确接入本地视觉大模型")
    }
  }
  let highPerformance=globalStore.get(stateHighPerformance)
  try {
    if((!img.startsWith("http://")&&!img.startsWith("https://"))){
      let res=await ConvertBase64ToUrl(img)
      if(res.success){
        img=res.url
      }
    }
  } catch (error:any) {
    LogError("convertBase64ToUrl",globalStore.get(stateUserInfo).phone,error.message||"")
  }
  const data={
    prompt:prompt,
    img:img,
    q:ques
  }
  let url=Url_gptImg+"/gptimg2"
  if(highPerformance){
    url=Url_gptImg+"/gpthighimg"
  }
  return axiosInstance.post(url,data)
  .then(res=>{
    if(res.data.success){
      cost(res.data.total_tokens)
    }else{
      LogError("gptImg",globalStore.get(stateUserInfo).phone,res.data.msg||"")
    }
    return res
  })
  .catch(error=>{
    LogError("gptImg",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

export async function ConvertBase64ToUrl(img:string):Promise<{success:boolean,url:string}>{
  if (img && img.startsWith('data:')) {
    const base64Data = img.split(',')[1];
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let filename = `${year}${month}${day}${Math.random().toString(36).substring(2, 10)}.${blob.type.split("/")[1]}`;
    let res = await presignUrl(filename);
    if(res.data.success){
      const signedUrl = res.data.data.url;
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers:{
          "Content-Type":"image/jpeg"
        }
      });
      if (!response.ok) {
        return {success:false,url:"上传失败"}
      }
      try {
        let resGet = await presignUrlForGet(filename)
        if(resGet.data.success){
          let url = resGet.data.data.url;
          if(url && url.includes('\\x5Cu0026')) {
            url = url.replace(/\\x5Cu0026/g, '&');
          }
          return {success:true,url:url}
        } else {
          return {success:false,url:""}
        }
      } catch (error:any) {
        LogError("presignUrlForGet",globalStore.get(stateUserInfo).phone,error.message||"")
        console.error("presignUrlForGet错误详情:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
          }
        });
        return {success:false,url:"获取预签名URL失败"}
      }
    }
    return {success:false, url:""};
  }else{
    return {success:false,url:""}
  }
}

/**
 * 后端增值税发票识别（/ocr/vat_invoice）
 * - 支持传入 base64 dataURL 或 http(s) 图片 URL
 * - 若为 base64，会先上传并转换为可访问 URL
 */
export async function ocrVatInvoice(req: ReqVatInvoiceOcr): TypePromise<DataVatInvoiceOcr> {
  let imgUrl = req?.img
  try {
    if (imgUrl && imgUrl.startsWith("data:")) {
      const converted = await ConvertBase64ToUrl(imgUrl)
      if (converted.success) {
        imgUrl = converted.url
      }
    }
  } catch (error: any) {
    LogError("ocrVatInvoice-ConvertBase64ToUrl", globalStore.get(stateUserInfo).phone, error?.message || "")
  }

  const payload: ReqVatInvoiceOcr = {
    ...req,
    img: imgUrl,
  }

  return axiosInstance.post(config.urlplug + "/ocr/vat_invoice", payload, getConfig())
    .then((res) => res)
    .catch((error) => {
      LogError("ocrVatInvoice", globalStore.get(stateUserInfo).phone, error?.message || "")
      return Promise.reject(error)
    })
}

async function gptPrompt(prompt:string,question:string):TypePromise<DataGpt> {
  let localLLM=globalStore.get(stateLocalLLM)
  if(localLLM.local){
    try {
      let dataLLM=await requestLocalLLM(localLLM.text,{
        prompt:prompt+question
      })
      return {
        data:{
          success:dataLLM.done,
          message:dataLLM.done_reason,
          msg:dataLLM.response,
          total_tokens:0
        }
      }
    } catch (error:any) {
      LogError("gptPrompt",globalStore.get(stateUserInfo).phone,error.message||"")
      throw new Error("请正确接入本地文字大模型")
    }
  }
  const data={
    prompt:prompt,
    message:question
  }
  let highPerformance=globalStore.get(stateHighPerformance)
  let url=Url_gptPrompt+"/gptprompt"
  if(highPerformance){
    url=Url_gptPrompt+"/gpthighprompt"
  }
  return axiosInstance.post(url,data)
  .then(res=>{
    if(res.data.success){
      cost(res.data.total_tokens)
    }else{
      LogError("gptPrompt",globalStore.get(stateUserInfo).phone,res.data.msg||"")
    }
    return res
  })
  .catch(error=>{
    LogError("gptPrompt",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

async function save(plugin:Packaging):TypePromise<DataGeneral> {
  ProcessPlugin(plugin)
  return axiosInstance.post(Url_save+"/save",{plugin:plugin},getConfig())
    .then((res) => {
      if (res?.data?.success) {
        touchLocalStatus(plugin.uuid || Packaging.GetIdStrStatic(plugin));
      }
      return res;
    })
}

/**
 * 轻量更新应用基础信息（与编辑器保存大 JSON 解耦）
 * - 仅需传 name/description（uuid 用于定位应用）
 * - 后端按需更新对应字段
 */
async function saveMeta(
  uuid: string,
  name?: string,
  description?: string
): TypePromise<DataGeneral> {
  const clean: any = {
    ...(uuid ? { uuid } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
  };

  return axiosInstance.post(Url_save + "/savename", clean, getConfig()).then((res) => {
    if (res?.data?.success && uuid) {
      touchLocalStatus(uuid);
    }
    return res;
  });
}

async function create(name?:string):TypePromise<DataUse> {
  return axiosInstance.post(Url_create+"/create",{
    name:name
  },getConfig())
}

async function login(phone:string,secret:string):TypePromise<DataLog> {
  return axiosInstance.post(Url_login+"/login",{
    phone:phone,
    secret:secret
  })
  .then((res:{data:DataLog})=>{
    if(res.data.success){
      globalStore.set(stateCountToken,res.data.token_count)
    }
    return res
  })
  .catch(error=>{
    LogError("login",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

async function logup(phone:string,secret:string,code:string,invitecode:string):TypePromise<DataLog> {
  return axiosInstance.post(Url_logup+"/logup",{
    phone:phone,
    secret:secret,
    code:code,
    invitecode:invitecode,
    // activation_code:activeCode
  })
  .then((res:{data:DataLog})=>{
    if(res.data.success){
      globalStore.set(stateCountToken,res.data.token_count)
    }
    return res
  })
}

async function getUserInfo():TypePromise<DataGetuserinfo> {
  let api="/getuserinfo"
  let result=cache.getObj(api,10)
  if(result!=null){
    return result
  }
  return new Promise((resolve,reject)=>{
    axiosInstance.post(Url_getuserinfo+api,{
      adminid:""
    },getConfig())
    .then(res=>{
      if(res.data.success){
        cache.setObj(api,res)
      }
      resolve(res)
    })
    .catch(error=>{
      LogError("getUserInfo",globalStore.get(stateUserInfo).phone,error.message||"")
      reject(error)
    })
  })
}

async function getLatestStatus():TypePromise<DataGetLatestStatus> {
  let api="/getlateststatus"
  let result=cache.getObj(api,5)
  if(result!=null){
    return result
  }
  return new Promise((resolve,reject)=>{
    axiosInstance.post(Url_getlateststatus+api,{},getConfig())
    .then(res=>{
      // 兼容后端/旧数据：time_update 可能是秒级时间戳（10位），统一转换成毫秒
      if (res?.data?.statussave) {
        res.data = normalizeLatestStatusTimestamps(res.data as DataGetLatestStatus);
      }
      if(res.data.success){
        cache.setObj(api,res)
      }
      resolve(res)
    })
    .catch(error=>{
      LogError("getLatestStatus",globalStore.get(stateUserInfo).phone,error.message||"")
      reject(error)
    })
  })
}

async function use(id:string):Promise<ResUse> {
  let api="/use"
  let key=cacheKeyUse(id)
  let result=cache.getObj(key,10)
  if(result!=null){
    return result
  }
  return new Promise((resolve,reject)=>{
    axiosInstance.post(Url_use+api,{
      id:id
    },getConfig())
    .then(res=>{
      if(res.data.plugin.license==undefined){
        res.data.plugin.license=0
      }
      if(res.data.success){
        cache.setObj(key,res)
      }
      resolve(res)
    })
    .catch(error=>{
      reject(error)
    })
  })
}
async function read(id:string):Promise<ResUse> {
  let api="/read"
  let key=cacheKeyUse(id)
  let result=cache.getObj(key,5)
  if(result!=null){
    return result
  }
  return new Promise((resolve,reject)=>{
    axiosInstance.post(Url_read+api,{
      id:id
    })
    .then(res=>{
      if(res.data.plugin.license==undefined){
        res.data.plugin.license=0
      }
      if(res.data.success){
        cache.setObj(key,res)
      }
      resolve(res)
    })
    .catch(error=>{
      reject(error)
    })
  })
}

async function getPublished(id:number,version:number):TypePromise<DataGetPublished> {
  let api="/getpublished"
  return axiosInstance.get(Url_getpublished+api, {
    params: {
      id:id,
      version:version
    },
    ...getConfig()
  })
  .then(res=>{
    if(res.data.success){
      cache.setObj(api,res)
    }
    return res
  })
  .catch(error=>{
    LogError("getPublished",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

async function run(id:string,text:string,img:string,password:string):Promise<ResRun> {
  let api="/run"
  let key=cacheKeyRun(id,text)
  let result=cache.getObj(key,3)
  if(result!=null){
    return result
  }
  return new Promise((resolve,reject)=>{
    axiosInstance.post(Url_run+api,{
      id:id,
      text:text,
      img:img,
      password:password
    },getConfig())
    .then(res=>{
      if(res.data.success){
        cache.setObj(key,res)
      }
      resolve(res)
    })
    .catch(error=>{
      reject(error)
    })
  })
}
async function pullPlanConfig():TypePromise<DataPlanConfig> {
  let api="/planconfig"
  return axiosInstance.get(Url_config+api,)
}

enum EnumApi {
  RUN="run",
  USE="use",
  LOGIN="login",
  LOGUP="logup",
  GETUSERINFO="getuserinfo",
  SAVE="save",
  CREATE="create"
}

function cacheKeyGetuserinfo(id:number){
  return EnumApi.GETUSERINFO+id
}
function cacheKeyUse(id:string){
  return EnumApi.USE+id
}
function cacheKeyRun(id:string,text:string){
  return EnumApi.RUN+id+text
}

function orderCreate(mode:number,planSelected:TypePlan){
  let api="/order/create"
  let data={
    mode:mode,
    plan:planSelected,
    mode_return:4,
  }
  return axiosInstance.post(Url_ordercreate+api,data,getConfig())
}

function SendSms(phone:string,captchaVerifyParam:string):TypePromise<DataSms>{
  let api="/smssend"
  let data={
    phone:phone,
    params:captchaVerifyParam
  }
  return axiosInstance.post(Url_smssend+api,data,getConfig())
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("SendSms",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })

}
function SendSmsReset(phone:string,captchaVerifyParam:string):TypePromise<DataSms>{
  let api="/smsreset"
  let data={
    phone:phone,
    params:captchaVerifyParam
  }
  return axiosInstance.post(Url_smssend+api,data)
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("SendSmsReset",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
function changePassword(phone:string,code:string,password:string):TypePromise<DataSms>{
  let api="/changepassword"
  let data={
    phone:phone,
    code:code,
    newpassword:password
  }
  return axiosInstance.post(Url_changepassword+api,data)
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("changePassword",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
/**
 * 使用激活码API
 * @param {string} activationCode - 用户输入的激活码
 * @returns {Promise<DataActivate>} - 返回激活结果
 */
async function activate(activationCode: string): TypePromise<DataActivate> {
  return axiosInstance.post(Url_useActiveCode + "/activate", {
    code: activationCode
  })
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("activate",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

/**
 * 发布应用接口
 * @param {number} id - 要发布的应用ID
 * @returns {TypePromise<DataPublish>} - 返回发布结果
 */
async function publish(plugin:Packaging): TypePromise<DataPublish> {
  ProcessPlugin(plugin)
  return axiosInstance.post(Url_publish + "/publish", {
    plugin:plugin
  }, getConfig())
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("publish",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
function ProcessPlugin(plugin:Packaging){
  if(plugin.name==""){
    plugin.name=Packaging.GetIdStrStatic(plugin)
  }
  if(!plugin.private){
    plugin.private=true
  }
  if(!plugin.verabs){
    plugin.verabs=1
  }
}
function getConfig(){
  const token = getAuthToken();
  return {
    headers:{
      "Content-Type":"application/json",
      ...(token ? { "Authorization":"Bearer "+token } : {}),
    }
  }
}
function getToken():TypePromise<DataGetToken>{
  let api="/gettoken"
  return axiosInstance.post(Url_gettoken+api,{})
}
async function getPublishedList(): TypePromise<DataGetPublishedList> {
  return axiosInstance.get(Url_getpublishedlist + "/getpublishplugins", getConfig())
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("getPublishedList",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

async function updateCollected(collected:RecordPlugins):TypePromise<DataGeneral>{
  return axiosInstance.post(Url_updatecollected+"/updatecollected",{
    collected:collected
  })
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("updateCollected",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}

function presignUrl(object:string):TypePromise<DataPresignUrl>{
  return axiosInstance.post(config.urlplug+"/presignurl",{
    object:object,
  })
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("presignUrl",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
function presignUrlForGet(object:string):TypePromise<DataPresignUrl>{
  return axiosInstance.post(config.urlplug+"/presignurlforget",{
    object:object,
  })
  .then(res=>{
    return res
  })
  .catch(error=>{
    LogError("presignUrlForGet",globalStore.get(stateUserInfo).phone,error.message||"")
    return Promise.reject(error)
  })
}
async function shareCreate( expire: number=168, plug:Packaging): TypePromise<DataShareCreate> {
  let userInfo=globalStore.get(stateUserInfo)
  plug.sharer=userInfo.adminid
  let plugjson=JSON.stringify(plug)
  // 添加重试机制
  const maxRetries = 3;
  let retryCount = 0;
  const attemptRequest = async (): Promise<any> => {
    try {
      return await axiosInstance.post(config.urlplug+"/share/create", {
        plugid: Packaging.GetIdStrStatic(plug),
        expire: expire,
        plugjson: plugjson
      }, getConfig());
    } catch (error: unknown) {
      retryCount++;
      
      // 如果是circuit breaker错误，等待后重试
      if (error instanceof Error && error.message && error.message.includes('circuit breaker') && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 递增延迟
        return attemptRequest();
      }
      LogError("shareCreate", globalStore.get(stateUserInfo).phone, error instanceof Error ? error.message : "");
      return Promise.reject(error);
    }
  };
  
  return attemptRequest();
}

async function shareVisit(code: string): TypePromise<DataShareVisit> {
  // 添加重试机制
  const maxRetries = 3;
  let retryCount = 0;
  
  const attemptRequest = async (): Promise<any> => {
    try {
      return await axiosInstance.post(config.urlplug+"/share/visit", {
        code: code
      });
    } catch (error: unknown) {
      retryCount++;
      
      // 如果是circuit breaker错误，等待后重试
      if (error instanceof Error && error.message && error.message.includes('circuit breaker') && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 递增延迟
        return attemptRequest();
      }
      // 其他错误或达到最大重试次数
      LogError("shareVisit", globalStore.get(stateUserInfo).phone, error instanceof Error ? error.message : "");
      return Promise.reject(error);
    }
  };
  return attemptRequest();
}

async function InviteCreateLink():TypePromise<DataInviteCreateLink>{
  return axiosInstance.post(config.urlplug+"/invite/create")
}

/**
 * 删除插件
 * @param {string} uuid - 要删除的插件UUID
 * @returns {TypePromise<DataGeneral>} - 返回删除结果
 */
async function del(uuid: string): TypePromise<DataGeneral> {
  return axiosInstance.post(config.urlplug + "/delete", {
    uuid: uuid
  }, getConfig())
  .then(res => {
    return res
  })
  .catch(error => {
    LogError("del", globalStore.get(stateUserInfo).phone, error.message || "")
    return Promise.reject(error)
  })
}

/**
 * 写入数据到云端数据库
 * @param {string} deviceId - 设备ID
 * @param {string} value - 要写入的值
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {TypePromise<DataGeneral>} - 返回写入结果
 */
async function cloudWrite(deviceId: number, value: string, username: string, password: string): TypePromise<DataGeneral> {
  return axiosInstance.post(config.urltdengine + "/sensor/write", {
    device_id: deviceId,
    value: value,
    username: username,
    password: password
  }, getConfig())
  .then(res => {
    return res
  })
  .catch(error => {
    LogError("cloudWrite", globalStore.get(stateUserInfo).phone, error.message || "")
    return Promise.reject(error)
  })
}

/**
 * 从云端数据库读取数据
 * @param {number} deviceId - 设备ID
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {TypePromise<DataGeneral>} - 返回读取结果
 */
async function cloudRead(deviceId: number, username: string, password: string): TypePromise<DataCloudRead> {
  return axiosInstance.post(config.urltdengine + "/sensor/read", {
    device_id: deviceId,
    username: username,
    password: password
  })
  .then(res => {
    return res
  })
  .catch(error => {
    LogError("cloudRead", globalStore.get(stateUserInfo).phone, error.message || "")
    return Promise.reject(error)
  })
}

/**
 * 清空云端记忆
 * 由于后端路由可能存在多个命名，这里做兼容性尝试（仅在 404 时尝试下一个）。
 */
async function cloudClear(): TypePromise<DataGeneral> {
  return await axiosInstance.post(config.urltdengine + "/sensor/clear", {})
}


// 将对象声明和导出分开
export default {
  InviteCreateLink,
  cost,
  presignUrl,
  presignUrlForGet,
  gptOcr,
  gptSearch,
  gptImg,
  gptPrompt,
  ocrVatInvoice,
  create,
  save,
  saveMeta,
  login,
  logup,
  getUserInfo,
  getLatestStatus,
  use,
  read,
  run,
  cacheKeyRun,
  cacheKeyUse,
  cacheKeyGetuserinfo,
  pullPlanConfig,
  orderCreate,
  SendSms,
  SendSmsReset,
  getPublished,
  getPublishedList,
  activate,
  publish,
  getToken,
  updateCollected,
  changePassword,
  shareCreate,
  shareVisit,
  del,
  cloudWrite,
  cloudRead,
  cloudClear
}