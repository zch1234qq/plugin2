import config from "../config/config"
import { globalStore, stateUserInfo } from "../store/store"
import { DataGpt, DataMqQuery, TypePromise } from "../types/types"
import utils from "../utils"
import server, { axiosInstance, LogError } from "./server"
import { ConvertBase64ToUrl } from "./server"
import utilsSerivice from "./utilsSerivice"
const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))
type PollOptions = {
    intervalMs?: number
    maxIntervalMs?: number 
    backoffFactor?: number
    timeoutMs?: number
}

async function pollMqJson(taskid: string, options: PollOptions = {}): TypePromise<DataGpt> {
    const timeoutMs =120*1000
    const backoffFactor = options.backoffFactor ?? 1.2
    let intervalMs = options.intervalMs ?? 2000
    const maxIntervalMs = options.maxIntervalMs ?? 60000
    const startTime = Date.now()
    let firstCall=true
    while (Date.now() - startTime < timeoutMs) {
        if(firstCall){
            firstCall=false
            await sleep(intervalMs)
        }
        intervalMs = Math.min(Math.floor(intervalMs * backoffFactor), maxIntervalMs)
        const mqStatus = await MqQuery(taskid)
        utils.log("mqStatus",mqStatus);
        if (mqStatus.data.success) {
            try {
                const parsed: DataGpt = JSON.parse(mqStatus.data.data)
                server.cost(parsed.total_tokens)
                return { data: parsed }
            } catch (parseErr: any) {
                LogError("pollMqJson-parse", globalStore.get(stateUserInfo).phone, parseErr?.message || "")
                throw new Error("结果解析失败")
            }
        }else{
            await sleep(intervalMs)
        }
    }
    throw new Error("识别超时，请重试")
}

async function Gptprompt(prompt:string,question:string,sharer?:string):TypePromise<DataGpt> {
    utils.log("mqrbGptprompt",prompt,question,sharer);
    prompt=utilsSerivice.ProcessPromopt(prompt)
    return axiosInstance.post(config.urlplug+"/mqrb/gptprompt",{
        prompt:prompt,
        message:question,
        sharer:sharer
    })
    .then(async res=>{
        utils.log("res",res);
        if(res.data.success){
            //此处使用taskid轮询结果
            let taskid=res.data.message
            utils.log("taskid",taskid);
            // 使用通用轮询函数
            const options: PollOptions = {
                intervalMs: 1000,
            }
            return pollMqJson(taskid,options)
        }else{
            LogError("mqrbGptprompt",globalStore.get(stateUserInfo).phone,JSON.stringify(res))
            return Promise.reject(res.data.message)
        }
    })
    .catch(error=>{
        LogError("mqrbGptprompt",globalStore.get(stateUserInfo).phone,JSON.stringify(error)||"")
        return Promise.reject(error)
    })
}
async function GptOcr(prompt:string,img:string,ques:string,sharer?:string):TypePromise<DataGpt> {
    try {
        let res=await ConvertBase64ToUrl(img)
        if(res.success){
            img=res.url
            utils.log("img",img);
        }
    } catch (error) {
        LogError("gptOcr",globalStore.get(stateUserInfo).phone,JSON.stringify(error)||"")
        utils.log(error);
    }
    return axiosInstance.post(config.urlplug+"/mqrb/gptocr",{
        prompt:prompt,
        img:img,
        message:ques,
        sharer:sharer
    })
    .then(async res=>{
        utils.log("res",res);
        if(res.data.success){
            let taskid=res.data.message
            utils.log("taskid",taskid);
            return pollMqJson(taskid)
        }else{
            LogError("mqrbGptOcr",globalStore.get(stateUserInfo).phone,JSON.stringify(res))
            return Promise.reject(res.data.message)
        }
    })
    .catch(error=>{
        LogError("mqrbGptOcr",globalStore.get(stateUserInfo).phone,JSON.stringify(error)||"")
        return Promise.reject(error)
    })
}
async function GptImg(prompt:string,img:string,ques:string,sharer?:string):TypePromise<DataGpt> {
    prompt=utilsSerivice.ProcessPromopt(prompt)
    try {
        // Convert base64 image to URL if needed
        if((!img.startsWith("http://")&&!img.startsWith("https://"))){
            let res=await ConvertBase64ToUrl(img)
            if(res.success){
                img=res.url
                utils.log("img",img);
            }
        }
    } catch (error:any) {
        LogError("mqrbGptImg",globalStore.get(stateUserInfo).phone,JSON.stringify(error)||"")
        utils.log(error.reponse);
    }
    return axiosInstance.post(config.urlplug+"/mqrb/gptimg",{
        sharer:sharer,
        prompt:prompt,
        img:img,
        q:ques
    })
    .then(async res=>{
        utils.log("res",res);
        if(res.data.success){
            let taskid=res.data.message
            utils.log("taskid",taskid);
            return pollMqJson(taskid)
        }else{
            LogError("mqrbGptImg",globalStore.get(stateUserInfo).phone,JSON.stringify(res))
            return Promise.reject(res.data.message)
        }
    })
    .catch(error=>{
        utils.log(error.response);
        LogError("mqrbGptImg",globalStore.get(stateUserInfo).phone,JSON.stringify(error)||"")
        return Promise.reject(error)
    })
}
async function MqQuery(taskid:string):TypePromise<DataMqQuery> {
    utils.log("MqQuery",taskid);
    return axiosInstance.post(config.urlplug+"/mqrb/query",{
        taskid:taskid
    })
    .then((res)=>{
        utils.log("res",res);
        const data:DataMqQuery = res.data
        utils.log("data",data);
        return {
            data:data
        }
    })
    .catch(error=>{
        LogError("MqQuery",globalStore.get(stateUserInfo).phone,error.message||"")
        return Promise.reject(error)
    })
}

async function GptSearch(prompt:string,question:string,sharer?:string):TypePromise<DataGpt> {
    utils.log("mqrbGptSearch",prompt,question);
    prompt=utilsSerivice.ProcessPromopt(prompt)
    return axiosInstance.post(config.urlplug+"/mqrb/gptsearch",{
        prompt:prompt,
        q:question,
        sharer:sharer
    })
    .then(async res=>{
        utils.log("res",res);
        if(res.data.success){
            //此处使用taskid轮询结果
            let taskid=res.data.message
            utils.log("taskid",taskid);
            // 使用通用轮询函数
            const options: PollOptions = {
                intervalMs: 1000,
            }
            return pollMqJson(taskid,options)
        }else{
            LogError("mqrbGptSearch",globalStore.get(stateUserInfo).phone,JSON.stringify(res))
            return Promise.reject(res.data.message)
        }
    })
    .catch(error=>{
        LogError("mqrbGptSearch",globalStore.get(stateUserInfo).phone,JSON.stringify(error)||"")
        return Promise.reject(error)
    })
}

export default { 
    Gptprompt, 
    GptOcr, 
    GptImg,
    GptSearch,
    pollMqJson
}
export type { PollOptions }