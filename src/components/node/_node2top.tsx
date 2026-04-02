import Shell from "./shell1";
import { useRef, useState } from "react";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import utils, { updateResData } from "../../common/utils";
import store from "../../common/store/store";
import HandleInputImg from "../HandleInputImg";
import HandleInputText from "../HandleInputText";
import HandleOutputImg from "../HandleOutputImg";
import HandleOutputText from "../HandleOutputText";

const left = 25;

type Argvs={
  run:(input0: Res, input1: Res)=>Promise<Res>,
  id:string,
  data:NodeData,
  width?:number,
  children?:React.ReactNode,
  tips?:string[],
  colors?:number[]
}

export default function NodeCore2Top({run,id,data,width=200,children=null,tips=["输入1","输入2","输出"],colors=[0,0,0]}:Argvs){
  const [updateFlag,]=useState(false)
  const input0Ready = useRef(false);
  const input1Ready = useRef(false);
  const input0=useRef<Res>({} as Res)
  const input1=useRef<Res>({} as Res)
  const lockRef = useRef(false);  // 添加锁
  const {relations}=store

  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run0,
    "1":run1,
  };

  async function run0(input:Res):Promise<Res> {
    await utils.sleep(Math.random()*10)
    while(lockRef.current) {
      await utils.sleep(Math.random()*10+2) 
    }
    lockRef.current = true;
    try {
      if(input.success){
        input0.current=input
        input0Ready.current = true;
        return await checkAndRun(input)
      }
      return updateResData(input,{skip:true})
    } finally {
      lockRef.current = false;
    }
  }
  
  async function run1(input:Res):Promise<Res> {
    while(lockRef.current) {
      await utils.sleep(Math.random()*10+2)
    }
    lockRef.current = true;
    
    try {
      if(input.success){
        input1.current=input
        input1Ready.current = true;
        return await checkAndRun(input)
      }
      return updateResData(input,{skip:true})
    } finally {
      lockRef.current = false;
    }
  }

  async function checkAndRun(input:Res): Promise<Res> {
    let relation=relations[id]
    if(relation==undefined||relation[1]==undefined){
      clear()
      return updateResData(input,{ success: false, msg: `缺少上游节点`})
    }
    if (input0Ready.current && input1Ready.current) {
      const result = await run(input0.current, input1.current)
      clear()
      return result
    }
    return updateResData(input,{ success: true, msg: "等待所有输入就绪",skip:true })
  }
  
  
  function clear() {
    input0.current={} as Res
    input1.current={} as Res
    input0Ready.current = false;
    input1Ready.current = false;
    lockRef.current = false;
  }

  return(
      <Shell key={id} data={data} updateFlag={updateFlag} root={false} 
        id={id} runs={runs}
        width={width}
      >
      {colors[0] === 1 ? (
        <HandleInputImg id="0" tip={tips[0]} style={{ left: `${left}%` }} />
      ) : (
        <HandleInputText id="0" tip={tips[0]} style={{ left: `${left}%` }} />
      )}
      {colors[1] === 1 ? (
        <HandleInputImg id="1" tip={tips[1]} style={{ left: `${100 - left}%` }} />
      ) : (
        <HandleInputText id="1" tip={tips[1]} style={{ left: `${100 - left}%` }} />
      )}
      {colors[2] === 1 ? (
        <HandleOutputImg id="0" tip={tips[2]} />
      ) : (
        <HandleOutputText id="0" tip={tips[2]} />
      )}
      {children}
    </Shell>
  )
}