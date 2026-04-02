import { atom } from "jotai";
import lineStorage from "../lineStorage";
import config from "../config/config";
import { globalStore } from "./store";


export const atomMemory=atom<string[]>([])
export function addMemoryLine(line:string){
  globalStore.set(atomMemory, [...globalStore.get(atomMemory), line]);
}
async function initializeMemory() {
  let lines=await lineStorage.listLines(config.keyToMemoryGen);
  globalStore.set(atomMemory, lines)
}
// await initializeMemory()

async function clearMemory(){
  globalStore.set(atomMemory, []);
}

async function removeMemoryLine(){
  let lines=globalStore.get(atomMemory);
  // 创建一个新的数组引用，而不是直接修改原数组
  let newLines = [...lines];
  newLines.pop();
  globalStore.set(atomMemory, newLines);
}


export default{
  atomMemory,
  addMemoryLine,
  clearMemory,
  removeMemoryLine,
  initializeMemory,
}