import aiShellService from "../../../common/service/aiShellService.ts";
import { NodeData, Res } from "../../../common/types/types.tsx";
import { updateResData } from "../../../common/utils.tsx";
import NodeCore0 from "../_node0.tsx";

export default function Search({id,data}:{id:string,data:NodeData}){
  // const [,setDebug] = useAtom(stateDebug);
  // const convertLabel = RecordNodeLabel[EnumNodeType.Search];
  async function run0(input:Res):Promise<Res> {
    var result:Res={
      ...input,
      success:false,msg:""
    } as Res
    await aiShellService.GptSearch("",input.msg,data.sharer)
    .then(res=>{
      var resultData=res.data
      result.success=resultData.success
      result.msg=resultData.msg
      if(!resultData.success){
        result.msg=resultData.message
        if(resultData.code==0){
          throw new Error(resultData.message)
        }
      }
    })
    .catch(res=>{
      result.msg=res.message
      result.success=false
    })
    if(!result.success){
      throw new Error(result.msg)
    }
    return updateResData(result,{msgtypeRe:"text",headers:""})
  }

  return (
    <div>
      <NodeCore0
        handles={[1,1]}
        colors={[0,0]}
        run0={run0}
        id={id}
        data={data}
      ></NodeCore0>
    </div>
  )
}