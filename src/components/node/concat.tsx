import { useEffect, useState } from "react";
import { useRef } from "react";
import { NodeData, Res } from "../../common/types/types";
import NodeCore2Top from "./_node2top";
import { Checkbox, Flex, Tooltip } from "antd";
import ComNodeInput from "../ComNodeInput";
import { concatHeaders, updateResData } from "../../common/utils";

type Argvs={
  id:string,
  data:NodeData
}

export default function Concat({id,data}:Argvs){
  const [v0,setV0] = useState<string>("");
  const [v1,setV1] = useState<string>("0");   
  const [v2,setV2] = useState<string>("0");
  const v0Ref = useRef(v0);
  const v1Ref = useRef(v1);
  const v2Ref = useRef(v2);
  
  useEffect(()=>{
    if(data.values[0]){
      setV0(data.values[0]);
      v0Ref.current = data.values[0];
    }
    if(data.values[1]){
      setV1(data.values[1]);
      v1Ref.current = data.values[1];
    }
    if(data.values[2]){
      setV2(data.values[2]);
      v2Ref.current = data.values[2];
    }
  },[]);

  useEffect(()=>{
    if(v1=="1"){
      setV2("0");
    }
    v1Ref.current = v1;
    data.values[1] = v1;
  },[v1]);

  useEffect(()=>{
    if(v2=="1"){
      setV1("0");
    }
    v2Ref.current = v2;
    data.values[2] = v2;
  },[v2]);

  function onValueChange(value:string){
    setV0(value);
    v0Ref.current = value;
    data.values[0] = value;
  }
  function onValueChange1(value:string){
    setV1(value);
  }
  function onValueChange2(value:string){
    setV2(value);
  }

  async function run(input0: Res, input1: Res):Promise<Res>{
    //如果input1.msg为base64的图片,我们就移除它的前缀
    if(input0.msg.startsWith("data:image")){
      input0.msg = input0.msg.split(",")[1];
    }
    if(input1.msg.startsWith("data:image")){
      input1.msg = input1.msg.split(",")[1];
    }
    let output = "";
    output= input0.msg;
    if(v1Ref.current=="1"){
      output+=","
    }else if(v2Ref.current=="1"){
      output+="\n"
    }else{
      output+=v0Ref.current
    }
    output += input1.msg;
    if(v1Ref.current=="1"||v2Ref.current=="1"){
      input0.msgtypeRe = "excel";
    }
    var headers = "";
    if(input0.headers&&input1.headers){
      headers = concatHeaders(input0.headers, input1.headers);
    }
    return updateResData(input0,{
      success: true,
       msg: output,
       datas:input0.datas,
       headers:headers
    });
  }
  
  return(
    <NodeCore2Top run={run} id={id} data={data}>
      <ComNodeInput
        value={v0}
        onChange={onValueChange}
        disabled={v1=="1"||v2=="1"}
      />
      <Flex style={{width:"100%"}} justify="space-between">
        <Tooltip title="水平拼接输入的两个数据">
          <Flex style={{width:"50%"}}>
            <Checkbox
              checked={v1=="1"}
              onChange={(e)=>{
                onValueChange1(e.target.checked ? "1" : "0");
              }}
            />
            <p style={{color:"#fff"}}>左右</p>
          </Flex>
        </Tooltip>
        <Tooltip title="垂直拼接输入的两个数据">
          <Flex style={{width:"50%"}}>
            <Checkbox
              checked={v2=="1"}
          onChange={(e)=>{
            onValueChange2(e.target.checked ? "1" : "0");
          }}
            />
            <p style={{color:"#fff"}}>上下</p>
          </Flex>
        </Tooltip>
      </Flex>
    </NodeCore2Top>
  )
}