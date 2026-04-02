import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { EventEmitter } from "./classes";
import { GraphData, HandleWrapRes, Res } from "./types/types";
import { Connection } from "@xyflow/react";
import server from './service/server';
import { globalStore, stateCountToken } from './store/store';
import config from "./config/config";

export const isDevelopment = process.env.NODE_ENV === 'development';
var token=""
var nodesData:Record<string,{}>={}
// Module-level variable to track token refresh state
let _isRefreshingToken = false;
function log(value?: any, ...optionalParams: any[]) {
  value
  optionalParams
  if(isDevelopment){
  }
}


/**
 * 更新 Res 类型数据，保留原有数据并覆盖部分字段
 * 
 * @param {Res} input - 原始输入数据
 * @param {Partial<Res>} updates - 需要更新的部分数据
 * @returns {Res} 更新后的数据
 */
export function updateResData(input: Res, updates: Partial<Res>): Res {
  // 创建新对象而不是修改原对象
  return {
    ...input,  // 保留原有数据
    ...updates,  // 覆盖部分字段
    
    // 特殊处理 datas 对象，进行深度合并而不是替换
    datas: updates.datas 
      ? { ...(input.datas || {}), ...updates.datas }
      : input.datas
  };
} 

/**
 * 拼接 Res.headers（逗号分隔），自动过滤空值，避免出现 "undefined" 等脏数据
 */
export function concatHeaders(...headers: Array<string | undefined | null>): string {
  return headers.filter((h): h is string => !!h).join(",");
}
function sleep(ms:number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function update(value:string,ref:MutableRefObject<string>,setState:Dispatch<SetStateAction<string>>,setUpdateFlag:Dispatch<SetStateAction<boolean>>,updateFlag:boolean){
  setState(value)
  ref.current=value
  setUpdateFlag(!updateFlag)
}
var emRun=new EventEmitter<HandleWrapRes>()
var emEmpty=new EventEmitter<{}>()
var emTrigger=new EventEmitter<{beginId:string,sourceId?:string,loopIteration?:number,fromEnd?:boolean}>()
var emConnection=new EventEmitter<Connection>()
var logined=false
var username=""
var adminid=""

function RemoveOldRelations(data:GraphData){
  data.nodes.forEach(node=>{
    node.data.relations={}
    node.data.rels2={}
  })
}

const needKey=(src:string,target:string,handleTarget:string)=>{
  return "need"+src+"_"+target+"_"+handleTarget
}

function removeThinkTags(text: string): string {
  if (!text) return text;
  text = text.replace(/<think>[\s\S]*?<\/antml:thinking>/g, '');
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  text = text.replace(/\[THINKING\][\s\S]*?\[\/THINKING\]/g, '');
  return text.trim();
}


export interface RetryConfig {
  maxRetries: number;         // 最大重试次数
  initialDelayMs: number;     // 初始延迟时间（毫秒）
  maxDelayMs?: number;        // 最大延迟时间（毫秒）
  exponentialBackoff?: boolean; // 是否使用指数退避策略
  retryableErrors?: string[];  // 可重试的错误消息关键词
  onRetry?: (attempt: number, error: Error) => void; // 重试回调函数
}

/**
 * 刷新token数量
 * @param showtip 是否显示提示信息
 */
export const handleRefreshToken = (showtip = true) => {
  if (_isRefreshingToken) return;
  _isRefreshingToken = true;
  
  server.getToken()
    .then(res => {
      var data = res.data;
      if (data.success) {
        globalStore.set(stateCountToken, data.tokencurrent);
        if (showtip) {
          window.messageApi.success({
            content: `${config.tokenName}数量刷新成功`,
            key: "tokenRefresh"
          });
        }
      } else {
        window.messageApi.error({
          content: data.message || "刷新失败，请稍后重试",
          key: "tokenRefreshError"
        });
      }
    })
    .catch(err => {
      window.messageApi.error({
        content: "刷新失败，请检查网络连接",
        key: "tokenRefreshError"
      });
      console.error("Token刷新出错:", err);
    })
    .finally(() => {
      _isRefreshingToken = false;
    });
};

export default{
  log,
  sleep,
  token,
  update,
  nodesData,
  emRun,
  emEmpty,
  emTrigger,
  emConnection,
  logined,
  username,
  adminid,
  RemoveOldRelations,
  needKey,
  removeThinkTags,
  withRetry,
  handleRefreshToken,
  concatHeaders
}

/**
 * 创建带重试机制的函数封装器
 * @param fn 需要封装的原始函数
 * @param config 重试配置
 * @returns 封装后的函数，保持与原函数相同的接口
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    exponentialBackoff: true
  }
): T {
  return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    const {
      maxRetries,
      initialDelayMs,
      maxDelayMs = 10000,
      exponentialBackoff = true,
      retryableErrors,
      onRetry
    } = config;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 如果不是第一次尝试，记录重试信息
        if (attempt > 0) {
          onRetry?.(attempt, lastError!);
          // 计算延迟时间
          let delayMs = initialDelayMs;
          if (exponentialBackoff) {
            // 指数退避：initialDelayMs * (2^(attempt-1))
            delayMs = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
          }
          
          // 等待延迟时间
          await sleep(delayMs);
        }
        
        // 执行原始函数
        return await fn(...args);
      } catch (error: any) {
        lastError = error;
        
        // 如果是最后一次尝试或错误不应该重试，则抛出异常
        if (attempt >= maxRetries || !shouldRetry(error, retryableErrors)) {
          throw error;
        }
      }
    }
    
    // 理论上不应该到达这里，但为了TypeScript的类型检查
    throw lastError || new Error('重试失败');
  } as T;
}

/**
 * 判断错误是否应该重试
 * @param error 错误对象
 * @param retryableErrors 可重试的错误关键词数组
 * @returns 是否应该重试
 */
function shouldRetry(error: any, retryableErrors?: string[]): boolean {
  // 如果没有指定可重试的错误类型，则默认所有错误都重试
  if (!retryableErrors || retryableErrors.length === 0) {
    return true;
  }
  
  // 检查错误消息是否包含可重试的关键词
  const errorMessage = error?.message || String(error);
  return retryableErrors.some(keyword => 
    errorMessage.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 清空一个对象的所有属性并返回一个新的空对象
 * @param record 要清空的对象
 * @returns 一个新的空对象
 */
export const clearRecord = <K extends string | number | symbol, V>(record: Record<K, V>): Record<K, V> => {
  // 清空原对象
  Object.keys(record).forEach(key => {
    delete record[key as K];
  });
  // 返回一个新的空对象
  const newRecord = {} as Record<K, V>;
  return newRecord;
};
