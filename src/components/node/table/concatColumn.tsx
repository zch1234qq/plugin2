import { useEffect, useState } from "react";
import { useRef } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore2Top from "../_node2top";
import { concatHeaders, updateResData } from "../../../common/utils";

type Argvs={
  id:string,
  data:NodeData
}

export default function ConcatColumn({id,data}:Argvs){
  const [v0,setV0] = useState<string>("");
  const [v1,setV1] = useState<string>("0");   
  const v0Ref = useRef(v0);
  const v1Ref = useRef(v1);
  
  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0]);
      v0Ref.current = data.values[0];
    }
    if(data.values[1]){
      setV1(data.values[1]);
      v1Ref.current = data.values[1];
    }
  },[]);

  useEffect(()=>{
    v1Ref.current = v1;
    data.values[1] = v1;
  },[v1]);

  async function run(input0: Res, input1: Res):Promise<Res>{
    let reverse = false;
    if(!input0.msg.includes("\n")){
      reverse = true;
    }
    const inputCsv = input0.msg;
    const inputValue0 = input0.msg;
    const inputValue1 = input1.msg;
    const rows0 = inputCsv.split('\n');
    const rows1 = inputValue1.split('\n');
    const isColumn = inputValue0.includes('\n')&&inputValue1.includes('\n');
    let output = "";
    if(isColumn){
      // 如果是列，直接拼接两个CSV
      const rowCount = Math.max(rows0.length, rows1.length);
      for(let i = 0; i < rowCount; i++){
        const rowValue = rows0[i] || "";
        const valueRowValue = rows1[i] || "";
        output += rowValue + "," + valueRowValue;
        if(i < rowCount - 1) output += '\n';
      }
    } else {
      if(reverse){
        // 如果是字符串，将字符串拼接到每一行
        for(let i = 0; i < rows1.length; i++){
          output += inputValue0+ ","+ rows1[i];
          if(i < rows1.length - 1) output += '\n';
        }
      }else{
        // 如果是字符串，将字符串拼接到每一行
        for(let i = 0; i < rows0.length; i++){
          output += rows0[i] + ","+ inputValue1;  
          if(i < rows0.length - 1) output += '\n';
        }
      }
    }
    var headers = "";
    if(input0.headers&&input1.headers){
      headers = concatHeaders(input0.headers, input1.headers);
    }
    
    return updateResData(input0,{
      success: true,
      msg: output,
      msgtypeRe:"excel",
      datas: input0.datas,
      headers:headers
    });
  }
  return(
    <NodeCore2Top width={100} run={run} id={id} data={data}>
    </NodeCore2Top>
  )
}