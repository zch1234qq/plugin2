import Shell from "./shell1";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import ComHandleDot from "../ComHandleDot";
import HandleInputImg from "../HandleInputImg";
import HandleInputText from "../HandleInputText";
import HandleOutputImg from "../HandleOutputImg";
import HandleOutputText from "../HandleOutputText";

type Argvs={
  root?:boolean,
  handles?:number[],  // [输出数量, 输入数量]
  colors?:number[],
  run0:(input:Res)=>Promise<Res>,
  id:string,
  data:NodeData,
  v0Ref?:React.MutableRefObject<string>,
  width?:number,
  callbackTrigger?:()=>void,
  children?:React.ReactNode,
  showNode?:boolean,
  setShowNode?:React.Dispatch<React.SetStateAction<boolean>>,
  tips?:string[],
  onDoubleClick?:()=>void
}

export default function NodeCore0({root=false,run0,id,data,handles=[1,1],
  colors,children,width=200,callbackTrigger,showNode=true,setShowNode,tips,onDoubleClick
}:Argvs){
  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run0
  };
  function onClick(){
  }
  
  return(
    <Shell key={id} data={data} root={root} width={width}
      id={id} runs={runs} onClick={onClick}
      callbackTrigger={callbackTrigger}
      showNode={showNode} setShowNode={setShowNode}
      onDoubleClick={onDoubleClick}
    >
      {children?<>{children}</>:<></>}
      {
        Array.from({length:handles[1]}).map((_,index:number)=>(
          colors&&colors[1]&&colors[1]==1 ? (
            <HandleInputImg
              key={`target-${index}`}
              id={index.toString()}
              tip={tips?tips[1]:undefined}
            />
          ) : (
            <HandleInputText
              key={`target-${index}`}
              id={index.toString()}
              tip={tips?tips[1]:undefined}
            />
          )
        ))
      }
      {
        Array.from({length:handles[0]}).map((_,index:number)=>(
          colors&&colors[0]&&colors[0]==1 ? (
            <HandleOutputImg
              key={`source-${index}`}
              id={index.toString()}
              tip={tips?tips[0]:undefined}
            />
          ) : (
            <HandleOutputText
              key={`source-${index}`}
              id={index.toString()}
              tip={tips?tips[0]:undefined}
            />
          )
        ))
      }
      {
        handles[1]==0&&
        <ComHandleDot
          key={`source-0`}
          id={`0`}
          tip={tips?tips[1]:undefined}
        />
      }
    </Shell>
  )
}