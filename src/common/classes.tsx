import "reflect-metadata";
// import { Expose } from 'class-transformer';
import { EnumNodeType, NodeCus, Relation } from "./types/types";
import { MutableRefObject } from "react";
// import utils from "./utils";

export class Packaging{
  id:number=-1
  uuid:string=""
  name:string=""
  description:string=""
  data:string=""
  sharer?:string=""
  tree:string=""
  typeinput:string=""
  adminid:string=""
  version:number=0
  verabs:number=1
  color:string=""
  license:number=0
  isRef:boolean=false
  private: boolean = true
  published:boolean=false
  isCollected:boolean=false

  constructor(id:number,name:string,desc:string){
    this.id=id
    this.name=name
    this.description=desc
  }
  
  static GetIdStrStatic(plugin: Packaging):string{
    if(plugin.id>=0){
      return plugin.id.toString()
    }else{
      return plugin.uuid
    }
  }
  
  load({id,name,desc}:{id:number,name:string,desc:string}):void{
    this.id=id
    this.name=name
    this.description=desc
  }
}

class EventEmitter<T> {
  events:Record<string,((argv:T)=>void)[]>
  constructor() {
    this.events = {};
  }
  on(eventName:string, callback:(argv:T)=>void) {
    this.off(eventName)
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }
  off(eventName: string, callback?: (argv: T) => void) {
    if (this.events[eventName]) {
      if (callback) {
        // 如果提供了回调函数，只移除该特定回调
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
      } else {
        // 如果没有提供回调函数，移除所有该事件的回调
        delete this.events[eventName];
      }
    }
  }
  emit(eventName: string, argv?: T) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        callback(argv as T);
      });
    }
  }
}

type BranchInfo={
  id:string,
  type:string,
  argvs:string[],
  nexts:BranchInfo[],
  isSelfLoop?: boolean,
  isReference?: boolean
}

class Branch{
  // 添加一个静态集合，用于跟踪已访问的节点
  static visitedNodes: Set<string> = new Set();
  
  root:{id:string}
  branch?:Branch
  type:string="prompt"
  relations:Record<string, Relation[]>
  nodeTypes:Record<string,string>
  nodesRef:MutableRefObject<Record<string,NodeCus>>
  static inputSetted=true
  static haveInput=false
  
  constructor(root:{id:string},relations: Record<string, Relation[]>,nodeTypes:Record<string,string>,nodesRef:MutableRefObject<Record<string,NodeCus>>){
    this.nodesRef=nodesRef
    this.root=root
    this.relations=relations
    this.nodeTypes=nodeTypes
    this.type=nodeTypes[root.id]
  }
  
  /**
   * 递归构建节点树，支持循环结构
   * @returns {BranchInfo} 节点树信息
   */
  attach(): BranchInfo {
    // 检查节点是否已被访问过（避免循环结构导致的无限递归）
    if (Branch.visitedNodes.has(this.root.id)) {
      // 对于已访问过的节点，返回一个引用标记而不是递归
      return {
        id: this.root.id,
        argvs: [],
        type: this.nodeTypes[this.root.id],
        nexts: [],
        isReference: true // 标记为引用节点
      } as BranchInfo;
    }
    
    // 将当前节点添加到已访问集合
    Branch.visitedNodes.add(this.root.id);
    
    const relation = this.relations[this.root.id];
    let argvs = Object.values(this.nodesRef.current[this.root.id]?.data?.values || {});
    this.type = this.nodeTypes[this.root.id];
    if(this.type==EnumNodeType.DbWriteCloud){
      argvs[1]="";
    }
    // 特别处理Loop节点类型
    const isLoopNode = this.type === EnumNodeType.Loop;
    
    if (this.type!=EnumNodeType.Out &&(relation === undefined ||
      relation.length === 0||
      this.nodeTypes[relation[0].to]===EnumNodeType.Loop)){
      if (this.type !== EnumNodeType.Data &&
        this.type !== EnumNodeType.InImgGp &&
        this.type !== EnumNodeType.Loop&&
        this.type !== EnumNodeType.In && 
        this.type !== EnumNodeType.InImg) 
      {
        Branch.inputSetted = false;
      }
      
      if (this.type === EnumNodeType.In || 
        this.type === EnumNodeType.InImgGp ||
        this.type === EnumNodeType.Loop ||
        this.type === EnumNodeType.InImg ||
        this.type === EnumNodeType.Data)
      {
        Branch.haveInput = true;
      } else {
        Branch.haveInput = false;
      }
      
      return {
        id: this.root.id,
        argvs: argvs,
        type: this.type,
        nexts: []
      } as BranchInfo;
    } else {
      const nexts = [] as BranchInfo[];
      let types = [] as string[];
      
      relation.forEach((element) => {
        const nextid = element.to;
        
        // 对于Loop节点，检查是否会形成循环
        if (isLoopNode && nextid === this.root.id) {
          // 对于Loop节点的自循环，特殊处理
          nexts.push({
            id: nextid,
            argvs: [],
            type: this.nodeTypes[nextid],
            nexts: [],
            isSelfLoop: true // 标记为自循环
          });
          types.push(this.nodeTypes[nextid]);
        } else {
          // 常规递归处理
          this.branch = new Branch({id: nextid}, this.relations, this.nodeTypes, this.nodesRef);
          types.push(this.branch.type);
          nexts.push(this.branch.attach());
        }
      });
      
      // 特殊处理多输入情况（原代码逻辑保留）
      if (types.length >= 2 && types[0] === EnumNodeType.InImg) {
        var temp = nexts[0];
        nexts[0] = nexts[1];
        nexts[1] = temp;
      }
      
      // 构建并返回当前节点信息
      return {
        id: this.root.id,
        argvs: argvs,
        type: this.type,
        nexts: nexts
      };
    }
  }
  
  /**
   * 重置静态变量
   */
  static reset() {
    Branch.visitedNodes.clear();
    Branch.inputSetted = true;
    Branch.haveInput = false;
  }
}

export {
  EventEmitter,
  Branch
}