import Shell from "./shell1";
import {  MutableRefObject, useEffect, useState } from "react";
import utils from "../../common/utils";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import ModalCus from "../modeCus";
import ComNodeInput from "../ComNodeInput";
import ComNodeInputNumber from "../ComNodeInputNumber";
import ComHandleDot from "../ComHandleDot";
import HandleInputImg from "../HandleInputImg";
import HandleInputText from "../HandleInputText";
import HandleOutputImg from "../HandleOutputImg";
import HandleOutputText from "../HandleOutputText";

type Argvs={
  root?:boolean,
  handles:number[],
  colors?:number[],
  tips?:string[],
  run0:(input:Res)=>Promise<Res>,
  v0:string,
  setV0:any,
  v0Ref:MutableRefObject<string>,
  placeholder?:string,
  id:string,
  data:NodeData,
  width?:number,
  typeNumber?:boolean,
  children?:React.ReactNode,
  showNode?:boolean,
  setShowNode?:React.Dispatch<React.SetStateAction<boolean>>
}

export default function NodeCore1({root=false,handles=[1,1],colors=[0,0],tips,run0,v0,setV0,v0Ref,placeholder="请输入指令",id,data,children,width=200,typeNumber=false,showNode=true,setShowNode}:Argvs){
  const [updateFlag,setUpdateFlag]=useState(false)
  const [modeFocus,setModeFocus]=useState(false)
  
  useEffect(()=>{
    var vs0=data.values[0]
    if(vs0==undefined){
      data.values[0]=v0
    }else{
      setV0(vs0)
      v0Ref.current=vs0
    }
  },[])

  useEffect(()=>{
    data.values[0]=v0
    v0Ref.current=v0
  },[v0])

  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run0
  };

  function onClick(){
    utils.log(id);
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
    <Shell key={id} data={data} updateFlag={updateFlag} root={root} width={width}
      id={id} runs={runs} onClick={onClick} onDoubleClick={onDoubleClick}
    >
      {children?<>{children}</>:<></>}
      {
        Array.from({length:handles[0]}).map((_,index:number)=>{
          return colors&&colors[0]&&colors[0]==1 ? (
            <HandleOutputImg key={index} id={index.toString()} tip={tips?tips[0]:undefined} />
          ) : (
            <HandleOutputText key={index} id={index.toString()} tip={tips?tips[0]:undefined} />
          )
        })
      }
      {
        handles[1]>0&&
        Array.from({length:handles[1]}).map((_,index:number)=>{
          return colors&&colors[1]&&colors[1]==1 ? (
            <HandleInputImg key={index} id={index.toString()} tip={tips?tips[1]:undefined} />
          ) : (
            <HandleInputText key={index} id={index.toString()} tip={tips?tips[1]:undefined} />
          )
        })
      }
      {
        handles[1]==0&&
        <ComHandleDot tip={tips?tips[1]:undefined}></ComHandleDot>
      }
      {showNode&&
      (
        typeNumber?
        <ComNodeInputNumber 
          value={v0}
          onChange={(value) => {
            setV0(value);
            v0Ref.current = value;
          }}
          placeholder={placeholder}
        />
        :
        <>
          <ComNodeInput 
            value={v0}
            onChange={(value) => {
              setV0(value);
              v0Ref.current = value;
            }}
            placeholder={placeholder}
          />
          <ModalCus placeholder={placeholder} value={v0} onChange={onChangeV0} open={modeFocus} setOpen={setModeFocus}/>
        </>
      )}
    </Shell>
  )
}