import { Clear } from "./store/store";
import time from "./time";
import utils from "./utils";
import { load, Store } from "@tauri-apps/plugin-store";
import CryptoJS from 'crypto-js';

declare global {
  interface Window {
    __TAURI__?: any;
  }
}
export const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
let store: Store | null = null;
async function initializeStore() {
  if (isTauri) {
    store = await load("store.json", { autoSave: false });
  }
}
// let keyCached=new Set<string>()

// 添加加密密钥（建议使用环境变量或更安全的方式存储）
const ENCRYPTION_KEY = 'your-secret-key-2024';  // 请更改为自己的密钥
// 仅当值带此前缀时才会尝试解密，避免对明文误解密导致 Malformed UTF-8
const ENCRYPTION_PREFIX = "ENC:";

function isLikelyLegacyCiphertext(value: string) {
  // CryptoJS.AES.encrypt(...).toString() 默认输出 base64（OpenSSL salted 形式常见以 U2FsdGVkX1 开头）
  // 这里做“尽量不误判明文”的轻量判断：长度较长且只包含 base64 常见字符。
  if (value.length < 24) return false;
  if (value.startsWith(ENCRYPTION_PREFIX)) return true;
  // 常见 salted 前缀（"Salted__" 的 base64）
  if (value.startsWith("U2FsdGVkX1")) return true;
  // base64-ish
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

/**
 * 加密数据
 * @param data - 要加密的数据
 * @returns 加密后的字符串
 */
function encrypt(data: string): string {
  try {
    // 加前缀，读取时可准确判断是否需要解密
    return ENCRYPTION_PREFIX + CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

/**
 * 解密数据
 * @param encryptedData - 加密的数据
 * @returns 解密后的字符串
 */
function decrypt(encryptedData: string): string {
  try {
    // 未标记为加密的数据直接返回，避免对明文误解密
    let payload = encryptedData;
    const hasPrefix = encryptedData.startsWith(ENCRYPTION_PREFIX);
    if (hasPrefix) {
      payload = encryptedData.slice(ENCRYPTION_PREFIX.length);
    } else if (!isLikelyLegacyCiphertext(encryptedData)) {
      return encryptedData;
    }

    const bytes = CryptoJS.AES.decrypt(payload, ENCRYPTION_KEY);
    // 这里是 Malformed UTF-8 的主要来源：用错误 key/明文去解密后再转 Utf8 会抛异常
    // 失败时当作“不是可解密数据”，直接返回原始字符串（不刷 error）。
    let decrypted = "";
    try {
      decrypted = bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return encryptedData;
    }
    return decrypted || encryptedData;
  } catch (error) {
    // 解密失败通常是：值为明文/密钥变化/数据损坏；这里避免刷屏
    // 如需排查可临时改成 console.warn(error)
    return encryptedData;
  }
}

// 在 Tauri 下，plugin-store 在 autoSave=false 时需要显式 save() 才会真正落盘。
// 这里做一个简单的批量落盘：同一事件循环内多次 set/delete 只触发一次 save。
let saveScheduled = false;
async function scheduleStoreSave() {
  if (!isTauri) return;
  if (!store) return;
  if (saveScheduled) return;
  saveScheduled = true;
  // 合并同一轮内的多次写入
  setTimeout(async () => {
    try {
      await store?.save();
    } finally {
      saveScheduled = false;
    }
  }, 0);
}

// 修改 setItemAsync 函数，添加加密
async function setItemAsync(key: string, value: string) {
  // const encryptedValue = encrypt(value);
  const encryptedValue = (value);
  if (isTauri) {
    if (!store) {
      await initializeStore();
    }
    await store?.set(key, encryptedValue);
    await scheduleStoreSave();
  } else {
    localStorage.setItem(key, encryptedValue);
  }
}

// 修改 getItemAsync 函数，添加解密
async function getItemAsync(key: string): Promise<string|undefined> {
  let encryptedValue: string | undefined;
  
  if(isTauri){
    // 关键：首次调用时 store 可能还没 load 完，不能直接返回 undefined
    if (!store) {
      await initializeStore();
    }
    encryptedValue = await store?.get<string>(key);
  }else{
    encryptedValue = localStorage.getItem(key) ?? undefined;
  }

  if (encryptedValue) {
    let result=decrypt(encryptedValue);
    return result;
  }
  return undefined;
}

async function deleteItemAsync(key:string) {
  if(isTauri){
    if (!store) {
      await initializeStore();
    }
    await store?.delete(key);
    await scheduleStoreSave();
  }else{
    localStorage.removeItem(key)
  }
}

async function  init(){
  utils.log("#Storage init")
  initializeStore().catch(error=>console.error(error));
  // keyCached=await getSetFromSecureStore("keycached")
  // if(keyCached){
  //   utils.log(keyCached.keys())
  // }
}
init()

// async function keyCachedAdd(key:string) {
  // keyCached.add(key)
  // saveSetToSecureStore("keycached",keyCached)
// }

// async function saveSetToSecureStore(key:string, set:Set<string>) {
//   if (!(set instanceof Set)) {
//     throw new Error('Provided data is not a Set.');
//   }
//   const serializedData = JSON.stringify([...set]);
//   await setItemAsync(key, serializedData);
// }

// async function getSetFromSecureStore(key:string) {
//   const serializedData = await getItemAsync(key);
//   if (!serializedData) {
//     return new Set<string>();
//   }
//   const parsedData = JSON.parse(serializedData);
//   return new Set<string>(parsedData);
// }

function getToken() {
  return get("token")
}

function set(key:string,value:string){
  setItemAsync(key,value)
  // keyCachedAdd(key)
}

function setObject(key: string, obj: any) {
  const jsonStr = JSON.stringify(obj);
  setItemAsync(key, jsonStr);
  // keyCachedAdd(key);
}

function setObjectExpire(key: string, obj: any) {
  const objectExpire = {
    createTime: time.Now(),
    data: obj
  };
  const jsonStr = JSON.stringify(objectExpire);
  setItemAsync(key, jsonStr);
  // keyCachedAdd(key);
}

function setObjectExpireBlock(key:string,obj:any) {
  var objectExpire={
    createTime:time.Now(),
    data:obj
  }
  utils.log(objectExpire);
  var jsonStr=JSON.stringify(objectExpire)
  setItemAsync(key,jsonStr)
  // keyCachedAdd(key)
}

// 修改 getObject 函数
async function getObject(key: string) {
  const jsonStr = await getItemAsync(key);
  if(key=="protocols"){
    utils.log("get protocols");
    utils.log(jsonStr);
  }
  if(jsonStr != null && jsonStr != ""){
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing decrypted data:', error);
      return undefined;
    }
  }
  return undefined;
}

async function getObjectExpire(key:string,second=3600) {
  const jsonStr=await getItemAsync(key)
  utils.log(typeof jsonStr);
  if(jsonStr==""||jsonStr==null||(typeof jsonStr)!="string"){
    return undefined
  }
  try {
    const obj:{createTime:number,data:any}=JSON.parse(jsonStr)
    utils.log(obj.data);
    if(time.isExpired(obj.createTime,second)){
      return undefined
    }else{
      return obj.data
    }
  } catch (error) {
    return undefined
  }
}

async function get(key:string){
  const result=await getItemAsync(key)
  if(result!=null){
    return result
  }else{
    return ""
  }
}

function remove(key:string) {
  deleteItemAsync(key)
}

/**
 * 清除所有存储数据
 * @returns Promise 表示清除操作的完成
 */
async function clearAll() {
  try {
    localStorage.clear()
    // 清除 Tauri 存储
    if(isTauri && store){
      await store.clear();
      await scheduleStoreSave();
      return true
    }
    
    // 清除浏览器存储
    localStorage.clear();
    sessionStorage.clear();
    
    // 清除 cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // 最后调用全局状态清除
    Clear();
    
    return true;
  } catch (error) {
    console.error("Error clearing storage:", error);
    return false;
  }
}

export default {
  set,
  get,
  remove,
  setObjectExpire,
  getObjectExpire,
  getToken,
  clearAll,
  setObject,
  getObject,
  setObjectExpireBlock,
  getItemAsync,
  setItemAsync,
  encrypt,    // 如果需要在其他地方使用加密功能
  decrypt,    // 如果需要在其他地方使用解密功能
}