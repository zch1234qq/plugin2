import { EnumNodeType, NodeData, RecordNodeType, Res } from "../../../common/types/types";
import './style.css'
import NodeCore0 from "../_node0";
import utils, { updateResData } from "../../../common/utils";
import { useAtom } from "jotai";
import { stateDebug, stateHeaders } from "../../../common/store/store";
import lineStorage from "../../../common/lineStorage";
import ComDbActions from "../../ComDbActions";
import config from "../../../common/config/config";
export default function DbRead({id,data}:{id:string,data:NodeData}){
  const [,setDebug]=useAtom(stateDebug)
  const [headers,]=useAtom(stateHeaders)
  
  async function run(input:Res):Promise<Res>{
    utils.log(input);
    // 显示开始读取的状态
    setDebug({
      show: true,
      data: `开始从记忆读取数据...`,
      loading: true,
      msgtype: "text",
      nodeId: id,
      nodeType: RecordNodeType[EnumNodeType.DbRead]
    });
    
    try {
      let keyToUse = config.keyToMemoryGen;
      const result = await lineStorage.readLatestLine(keyToUse);
      // 显示读取成功
      setDebug({
        show: true,
        data: "记忆读取成功",
        loading: false,
        msgtype: "text",
        nodeId: id,
        nodeType: RecordNodeType[EnumNodeType.DbRead]
      });
      // 返回成功结果
      return updateResData(input,{
        success: !!result,
        msg: result || "记忆为空",
        attached: { 
          dbKey: keyToUse
        }
      })
    } catch (error) {
      // 显示错误信息
      setDebug({
        show: true,
        data: `记忆读取失败: ${error}`,
        loading: false,
        msgtype: "text",
        nodeId: id,
        nodeType: RecordNodeType[EnumNodeType.DbRead]
      });
      
      // 返回错误结果
      return updateResData(input,{
        headers:input.headers||headers,
        success: false,
        msg: `记忆读取失败: ${error}`
      })
    }
  }

  return(
    <NodeCore0
    width={100}
      root={true}
      handles={[1,0]} 
      run0={run} 
      id={id} 
      data={data}
      tips={["输出最新的1条记忆","输入"]}
    >
      <ComDbActions 
        id={id} 
        nodeType={RecordNodeType[EnumNodeType.DbRead]} 
        dbKey={config.keyToMemoryGen}
      />
    </NodeCore0>
  )
} 