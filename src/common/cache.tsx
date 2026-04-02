import time from "./time"
import utils from "./utils"

function removeAll() {
  localStorage.clear()
}

function get(key:string):string {
  let result=localStorage.getItem(key)
  if(result==null){
    return ""
  }else{
    return result
  }
}
function set(key:string,value:string) {
  localStorage.setItem(key,value)
}
function setObj(key:string,obj:{}) {
  let body={
    data:obj,
    createTime:time.Now()
  }
  localStorage.setItem(key,JSON.stringify(body))
}
function getObj(key:string,freshTime:number=5) {
  let result=localStorage.getItem(key)
  if(result==null){
    return null
  }
  let obj=JSON.parse(result)
  let isExpired=time.isExpired(obj.createTime,freshTime)
  if(isExpired){
    localStorage.removeItem(key)
    return null
  }else{
    utils.log("命中缓存");
    return obj.data
  }
}
export default {
  removeAll,
  get,
  set,
  getObj,
  setObj,
}