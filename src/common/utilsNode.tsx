import { EnumNodeType, RecordNodeLabel } from "./types/types";
import utils from "./utils";
// 添加转换函数：将标签名转换为对应的EnumNodeType
function convertLabelToNodeType(label: string){
  // 将输入的label转换为小写
  const lowerLabel = label.toLowerCase();
  
  // 遍历RecordNodeLabel找到对应的枚举值
  for (const [nodeType, nodeLabelName] of Object.entries(RecordNodeLabel)) {
    // 将枚举值对应的标签也转换为小写进行比较
    if (nodeLabelName.toLowerCase() === lowerLabel) {
      utils.log(nodeType);
      return nodeType as EnumNodeType;
    }
  }
  return undefined;
};


export default {
  convertLabelToNodeType
}