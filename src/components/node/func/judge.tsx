import { useEffect, useRef, useState } from "react";
import { Res, NodeData } from "../../../common/types/types";
import NodeCore2Top from "../_node2top";
import { Button, Dropdown, Flex, Input } from "antd";
import { updateResData } from "../../../common/utils";
import ComNodeInput from "../../ComNodeInput";

/**
 * Judge node - evaluates left input (value) against right input (criteria)
 * Returns an object with the judgment result
 */
export default function Judge({ id, data }: { id: string, data: NodeData }) {
  const [v0,setV0] = useState<string>("eq");
  const [v1,setV1] = useState<string>("");
  const v0Ref = useRef(v0);
  const v1Ref = useRef(v1);
  const items = [
    { key: "eq", label: "=" },
    { key: "neq", label: "≠" },
    { key: "gt", label: ">" },
    { key: "lt", label: "<" },
    { key: "gte", label: "≥" },
    { key: "lte", label: "≤" },
  ];
  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0]);
    }
    if(data.values[1]){
      setV1(data.values[1]);
    }
  },[])


  useEffect(() => {
    v1Ref.current = v1;
    data.values[1]=v1;
  }, [v1]);

  useEffect(()=>{
    v0Ref.current = v0;
    data.values[0]=v0;
  },[v0])
  
  async function run(input0: Res, input1: Res): Promise<Res> {
    try {
      let result=false
             //主动进行类型转换
       let valueToJudge;
       let targetValue;
       
       // 尝试转换为数字
       const numValue = Number(input0.msg);
       const numTarget = Number(v1Ref.current);
       
       // 如果转换成功且不是NaN，则使用数字类型
       if (!isNaN(numValue) && !isNaN(numTarget)) {
         valueToJudge = numValue;
         targetValue = numTarget;
       } else {
         // 转换失败则使用原始字符串
         valueToJudge = String(input0.msg);
         targetValue = String(v1Ref.current);
       }
      switch(v0Ref.current) {
        case "eq":
          result = valueToJudge === targetValue;
          break;
        case "neq":
          result = valueToJudge !== targetValue;
          break;
        case "gt":
          result = valueToJudge > targetValue;
          break;
        case "lt":
          result = valueToJudge < targetValue;
          break;
        case "gte":
          result = valueToJudge >= targetValue;
          break;
        case "lte":
          result = valueToJudge <= targetValue;
          break;
        default:
          result = false;
      }
      if(result) {
        return updateResData(input0, {
          success: true,
          msg: input1.msg,
          fromNodeId:id
        })
      }
      return updateResData(input0, {
        continue: true,
        msg: "",
        fromNodeId:id
      })
    } catch (error) {
      return updateResData(input0, {
        success: false,
        msg: `判断出错: ${error}`
      })
    }
  }

  function handleClick(e: any) {
    setV0(e.key);
  }

  return (
    <NodeCore2Top
      run={run}
      id={id}
      data={data}
      width={200}
    >
      <Flex gap={5} align="center" style={{}}>
        <Dropdown
          menu={{
            items:items ,
            onClick:handleClick
          }}
          trigger={['click']}
        >
          <Button type="primary" style={{width: '50%',textAlign:'center'}}>{items.find(item => item.key === v0)?.label || "条件"}</Button>
        </Dropdown>
        <div style={{width: '50%'}}>
          <ComNodeInput
            value={v1}
            onChange={(value) => {
              setV1(value);
            }}
          />
        </div>
      </Flex>
    </NodeCore2Top>
  );
}