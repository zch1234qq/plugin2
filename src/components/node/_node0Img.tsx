import { Handle, Position } from "@xyflow/react";
import Shell from "./shell1";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import utils from "../../common/utils";
import HandleOutputText from "../HandleOutputText";

type Argvs={
  root?:boolean,
  handles:number[],
  run0:(input:Res)=>Promise<Res>,
  id:string,
  data:NodeData
}

export default function NodeCore0Img({root=false,run0,id,data}:Argvs){
  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run0
  };
  function onClick(){
    utils.log(id);
  }
  return(
    <Shell key={id} data={data} root={root} 
      id={id} runs={runs} onClick={onClick}
    >
      <Handle className="handleV" id={"0"} type="target" position={Position.Left}></Handle>
      <HandleOutputText />
    </Shell>
  )
}