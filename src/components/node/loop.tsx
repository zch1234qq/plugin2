import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../common/types/types";
import { Handle, Position } from "@xyflow/react";
import NodeCore0 from "./_node0";
import ComNodeInputNumber from "../ComNodeInputNumber";
import utils, { updateResData } from "../../common/utils";
import {Button, Flex, Tooltip, Modal, InputNumber } from "antd";
import { stateCountToken, globalStore } from "../../common/store/store";
import sound from "../../assets/sound.mp3";
import { playSound } from "../../common/audio";
import HandleOutputText from "../HandleOutputText";
export default function Loop({id, data}: {id: string, data: NodeData}) {
  const [v0, setV0] = useState(data.values[0]||"1000");
  const [v1, _setV1] = useState("0");
  const v1Ref = useRef(v1);
  const refStop=useRef(false)
  const [showNode,]=useState(!(data.values[-1]=="1"))
  const refLastCountToken=useRef(0)
  const [current,setCurrent]=useState(0)
  const [isLoopFinished,setIsLoopFinished]=useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasPlayedFinishedSoundRef = useRef(false)

  useEffect(()=>{
    if(current>Number(data.values[0])){
      setIsLoopFinished(true)
    }
  },[current])

  useEffect(() => {
    if (isLoopFinished && !hasPlayedFinishedSoundRef.current) {
      hasPlayedFinishedSoundRef.current = true
      playSound({ src: sound, audioRef })
      window.messageApi.success("循环已完成")
      return
    }
    if (!isLoopFinished) {
      hasPlayedFinishedSoundRef.current = false
    }
  }, [isLoopFinished])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
    }
  }, [])

  useEffect(()=>{
    data.values[0]=v0
  },[v0])

  useEffect(()=>{
    v1Ref.current=v1
    data.values[1]=v1
  },[v1])
  
  async function run0(input: Res): Promise<Res> {
    // 在函数内部重新获取最新的stateToken值，避免闭包问题
    if(refStop.current){
      refStop.current=false
      return updateResData(input,{success:false,msg:"手动停止"})
    }
    utils.sleep(10)
    const totalLoops = Number(data.values[0]) || 0;
    const currentIteration = Number(data.values[0])+2-input.loopIteration!||0;
    setCurrent(currentIteration)
    var msg=currentIteration.toString()
    if(currentIteration>totalLoops){
      msg="循环已完成"

    }
    let result:Res={
      ...input,
      msg: msg,
      msgtypeRe:"text",
      countLoop:Number(data.values[0])||0,
      continue:false,
      skip:false,
      headers:undefined
    };
    return result;
  }
  function callbackTrigger(){
    refLastCountToken.current=globalStore.get(stateCountToken)
    refStop.current=false
    setIsLoopFinished(false)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const applyV0 = () => {
    data.values[0] = v0
    setIsModalOpen(false)
  }

  return (
    <NodeCore0
      width={100}
      handles={[0, -1]} 
      run0={run0}
      id={id}
      data={data}
      callbackTrigger={callbackTrigger}
      onDoubleClick={openModal}
    >
      <Tooltip title="输入">
        <Handle id="0" className="handleVGen" type="target" position={Position.Left}></Handle>
      </Tooltip>
      <HandleOutputText id="0" tip="输出" />
      <Tooltip title="输出">
        <Handle id="1" className="handleVGen" type="source" position={Position.Right}></Handle>
      </Tooltip>  
      {/* <Progress percent={progress} showInfo={showNode} size="small" status="active" 
        style={{position:"absolute",zIndex:1000,bottom:"105%",left:0,width:"100%"}} /> */}
      <Tooltip title={
        current<=Number(data.values[0])?
        <Flex justify="center" align="end" wrap={false}>
          <span style={{color:"lightgray"}}>正在处理</span>
          <span>{Math.min(current,Number(data.values[0]))}</span>
        </Flex>
        :
        <Flex justify="center" align="end" wrap={false}>
          <span style={{color:"lightgray"}}>循环已完成</span>
        </Flex>
      }>
        <div style={{position:"absolute",zIndex:1000,bottom:"105%",left:0,minWidth:"100%",whiteSpace:"nowrap",textAlign:"center"}}>
          {
            isLoopFinished?
            <ComLoopFinished/>
            :
            <Flex justify="center" align="end" wrap={false}>
              <span style={{color:"lightgray"}}>已完成</span>
              <span>{Math.max(current-1,0)}</span>
            </Flex>
          }
        </div>
      </Tooltip>
      {showNode&&
      <Flex vertical gap={5} className="nodrag">
        <ComNodeInputNumber
          disabled={v1==="1"||true}
          tooltip="多余次数自动跳过，不会浪费资源点。"
          value={v0}
          min={0}
          max={5000}
          onChange={(value:string)=>{
            data.values[0]=value
            setV0(value)
          }}
        />
        <Button 
          style={{width:"100%"}} 
          type="primary" 
          danger 
          size="small" 
          onClick={(e)=>{
            e.stopPropagation()
            refStop.current=true
          }}
        >  
          停止
        </Button>
      </Flex>
      }
      
      {/* 设置v0的Modal */}
      <Modal
        title="设置循环次数"
        open={isModalOpen}
        onOk={applyV0}
        onCancel={closeModal}
        width={400}
        footer={false}
        centered
      >
        <Flex vertical gap="middle" style={{ marginTop: '20px' }}>
          <div>
            <InputNumber
              min={0}
              max={5000}
              value={Number(v0)}
              onChange={(value) => {
                const newValue = value?.toString() || "0"
                setV0(newValue)
              }}
              style={{ width: '100%' }}
              placeholder="上限为5000"
            />
          </div>
        </Flex>
      </Modal>
    </NodeCore0>
  );
} 

function ComLoopFinished() {
  return(
      <Flex justify="center" align="end" wrap={false}>
        <span style={{color:"lightgray"}}>循环已完成</span>
      </Flex>
  )
}