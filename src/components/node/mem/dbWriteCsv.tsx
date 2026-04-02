import { NodeData, Res } from "../../../common/types/types";
import './style.css'
import utils, { updateResData } from "../../../common/utils";
import { useAtom } from "jotai";
import { stateDebug } from "../../../common/store/store";
import lineStorage from "../../../common/lineStorage";
import NodeCore0 from "../_node0";
import ComDbActions from "../../ComDbActions";
import config from "../../../common/config/config";

/**
 * 记忆CSV写入节点组件
 * 将CSV数据作为整体存储到记忆中，不拆分为多行
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 记忆CSV写入节点组件
 */
export default function DbWriteCsv({id, data}: {id: string, data: NodeData}) {
  const [, setDebug] = useAtom(stateDebug);

  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }

    try {
      const csvData = input.msg;
      await lineStorage.writeLine(config.keyToMemoryCsv, csvData);
      utils.log(`记忆CSV写入节点 成功存储CSV数据`);
      setDebug((prev) => {
        return {
          ...prev,
          data: csvData
        }
      });
      return updateResData(input,{
        success: true,
        msg: csvData,
        datas: {
          ...input.datas
        }
      });
    } catch (error) {
      utils.log(`记忆CSV写入节点 处理出错: ${error}`);
      return updateResData(input,{
        success: false,
        msg: `处理出错: ${error}`
      }); 
    }
  }

  return (
    <NodeCore0 
      root={false} 
      handles={[1, 1]} 
      run0={run} 
      id={id} 
      data={data}
      width={100}
    >
      <ComDbActions 
        id={id} 
        nodeType="记忆CSV写入" 
        dbKey="csv"
      />
    </NodeCore0>
  );
}
