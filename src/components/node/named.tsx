import { NodeData, Res } from "../../common/types/types";
import NodeCore2Top from "./_node2top";

/**
 * 命名节点组件
 * 可以给数据流命名的节点
 */
export default function Named({id, data}: {id: string, data: NodeData}) {
  /**
   * 处理输入数据
   * @param {Res} input - 输入结果
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input0: Res, input1: Res): Promise<Res> {
    var result= {
      ...input0,
      datas: {
        ...input0.datas,
        ["name"]: input1.msg // 使用设定的名称作为key
      }
    };
    return result;
  }

  return (
    <NodeCore2Top tips={["文件","文件名","重命名的文件"]} data={data} id={id} run={run} width={100}/>
  );
} 