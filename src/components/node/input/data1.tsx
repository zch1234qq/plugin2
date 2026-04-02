import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import Shell from "../shell1";
import { Checkbox, Flex } from "antd";
import ModalCus from "../../modeCus";
import utils, { updateResData } from "../../../common/utils";
import ComNodeInput from "../../ComNodeInput";
import ComNodeInputNumber from "../../ComNodeInputNumber";
import ComHandleDot from "../../ComHandleDot";
import HandleOutputText from "../../HandleOutputText";
export default function Data1({id,data}:{id:string,data:NodeData}){
  const [v0,setV0Core]=useState("这是你创建的第一个节点!")
  const [v1,setV1]=useState("")
  const refCache=useRef("1")
  const v0Ref=useRef(v0)
  const [updateFlag,setUpdateFlag]=useState(false)
  const [modeFocus,setModeFocus]=useState(false)

  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0])
      v0Ref.current=data.values[0]
    }else{
      data.values[0]=v0
    }
    if(data.values[1]){
      setV1(data.values[1])
    }else{
      data.values[1]="0"
    }
  },[])

  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0])
      v0Ref.current=data.values[0]
    }
    if(data.values[1]){
      setV1(data.values[1])
    }else{
      data.values[1]="0"
    }
  },[data.values[0],data.values[1]])

  const runs:Record<string, (res: Res) => Promise<Res>>={
    "0":run0
  }
  
  function setV0(value:string){
    setV0Core(value)
    v0Ref.current=value
    data.values[0]=value
    setUpdateFlag(!updateFlag)
  }


  async function run0(input:Res):Promise<Res> {
    return updateResData(input,{msg:data.values[0]||"",msgtypeRe:"text"})
  }

  const handleModeChange = (checked: boolean) => {
    let temp=v0
    v0Ref.current=refCache.current
    setV0(refCache.current)
    refCache.current=temp
    setV1(checked?"1":"0")
    data.values[1]=checked?"1":"0"
    setUpdateFlag(!updateFlag)
  };

  function onChangeV0(e:any){
    var value=e.target.value
    data.values[0]=value
    utils.update(value,v0Ref,setV0Core,setUpdateFlag,updateFlag)
  }
  const handleTextChange = (value: string) => {
    setV0(value);
    v0Ref.current = value;
    data.values[0] = value;
  };

  return (
    <div>
      <Shell root={true} id={id} data={data} runs={runs} updateFlag={updateFlag}>
        <ComHandleDot/>
        <HandleOutputText />
        {v1==="1" ? (
          <ComNodeInputNumber
            value={v0}
            onChange={handleTextChange}
            placeholder="请输入数字"
            precision={2}
            onDoubleClick={()=>{
              setModeFocus(true)
            }}
          />
        ) : (
          <ComNodeInput 
            value={v0}
            onChange={handleTextChange}
            placeholder="请输入文字"
            onDoubleClick={()=>{
              setModeFocus(true)
            }}
          />
        )}
        
        <Flex gap="small" justify="end">
          <Checkbox
            checked={v1==="1"}
            onChange={(e) => handleModeChange(e.target.checked)}
          />
          <label>数字</label>
        </Flex>
        <ModalCus value={v0} onChange={onChangeV0} open={modeFocus} setOpen={setModeFocus}/>
      </Shell>
    </div>
  )
}