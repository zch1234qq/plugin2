import { Handle, Position } from "@xyflow/react";
import Shell from "./shell1";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import utils, { updateResData } from "../../common/utils";
import { NodeData, RecordNodeLabel, Res } from "../../common/types/types";
import './style.css'
import ModalCus from "../modeCus";
import ComNodeInput from "../ComNodeInput";
import store from "../../common/store/store";
import HandleInputText from "../HandleInputText";
import HandleOutputText from "../HandleOutputText";

type Argvs={
  run:(input0: string, input1: string)=>Promise<Res>,
  input0:MutableRefObject<string>,
  input1:MutableRefObject<string>,
  v0:string,
  setV0:any,
  id:string,
  data:NodeData,
  showNode?:boolean
}

export default function NodeCore2({run,input0,input1,v0,setV0,id,data,showNode=true}:Argvs){
  const v0Ref=useRef(v0)
  const [updateFlag,setUpdateFlag]=useState(false)
  const [modeFocus,setModeFocus]=useState(false)
  const input0Ready = useRef(false);
  const input1Ready = useRef(false);
  const lockRef=useRef(false)
  const {relations}=store

  useEffect(()=>{
    var vs0=data.values[0]
    if(vs0==undefined){
      data.values[0]=v0
    }else{
      setV0(data.values[0])
    }
  },[])

  useEffect(()=>{
    data.values[0]=v0
    v0Ref.current=v0
  },[v0])
  
  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run0,
    "1":run1,
  };

  async function run0(input:Res):Promise<Res> {
    await utils.sleep(Math.random()*10) 
    while(lockRef.current){
      await utils.sleep(Math.random()*10+5) 
    }
    lockRef.current=true
    if(input.success){
      input0.current=input.msg
      input0Ready.current = true;
      lockRef.current=false
      return checkAndRun(input)
    } 
    lockRef.current=false
    return {} as Res
  }
  
  async function run1(input:Res) {
    while(lockRef.current){
      await utils.sleep(Math.random()*10+5) 
    }
    lockRef.current=true
    if(input.success){
      input1.current=input.msg
      input1Ready.current = true; 
      lockRef.current=false
      return checkAndRun(input)
    }
    lockRef.current=false
    return {} as Res
  }
  
  const convertLabel=useMemo(()=>{
    return RecordNodeLabel[data.label]
  },[data.label])

  async function checkAndRun(input:Res): Promise<Res> {
    let relation=relations[id]
    if(relation==undefined||relation[1]==undefined){
      clear()
      return updateResData(input,{success: false, msg: `节点${id}${convertLabel}缺少上游`})
    }
    if (input0Ready.current && input1Ready.current) {
      const result = await run(input0.current, input1.current)
      clear()
      return result
    }
    return updateResData(input,{success: true, msg: "等待所有输入就绪",skip:true})
  }
  
  function clear() {
    input0.current=""
    input1.current=""
    input0Ready.current = false;
    input1Ready.current = false;
    lockRef.current=false
  }

  function onDoubleClick(){
    setModeFocus(true)
  }
  function onChangeV0(e:any){
    var value=e.target.value
    data.values[0]=value
    utils.update(value,v0Ref,setV0,setUpdateFlag,updateFlag)
  }

  return(
      <Shell key={id} data={data} showNode={showNode} updateFlag={updateFlag} root={false} 
        id={id} runs={runs} onDoubleClick={onDoubleClick}
      >
      <HandleInputText id="0" />
      <Handle className="handleV" id={"1"} type="target" position={Position.Left}></Handle>
      <HandleOutputText id="0" />
      <ComNodeInput 
        value={v0}
        onChange={(value) => {
          data.values[0] = value;
          utils.update(value, v0Ref, setV0, setUpdateFlag, updateFlag);
        }}
        placeholder="指令"
      />
      <ModalCus value={v0} onChange={onChangeV0} open={modeFocus} setOpen={setModeFocus}/>
    </Shell>
  )
}