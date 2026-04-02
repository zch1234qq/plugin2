import Shell from "./shell1";
import { NodeData, Res } from "../../common/types/types";
import './style.css'
import utils from "../../common/utils";
import HandleInputText from "../HandleInputText";

export default function Out({id,data}:{id:string,data:NodeData}){

  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run
  };

  async function run(input:Res):Promise<Res>{
    return input
  }

  function onClick(){
    utils.log(id);
  }

  return(
    <Shell width={100} data={data} id={id} runs={runs} onClick={onClick}>
      <HandleInputText />
    </Shell>
  )
}