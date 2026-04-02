import { NodeData, Res } from "../../common/types/types";
import './style.css'
import { useRef, useState } from "react";
import NodeCore1 from "./_node1";
import { Flex, Progress } from "antd";

export default function Wait({id,data}:{id:string,data:NodeData}){
  const [v0,setV0]=useState("1")
  const v0Ref=useRef(v0)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [showNode,setShowNode]=useState(!(data.values[-1]=="1"))
  
  async function sleep(seconds:number){
    const totalMs = seconds * 1000;
    const startTime = Date.now();
    const endTime = startTime + totalMs;
    setTotalSeconds(seconds);
    const updateInterval = seconds < 1 ? 20 : 100; // 毫秒
    
    while(Date.now() < endTime) {
      const elapsedMs = Date.now() - startTime;
      const remainingMs = endTime - Date.now();
      
      // 计算进度百分比
      const progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
      setProgress(progressPercent);
      
      // 更新倒计时显示 - 对于小于1秒的情况显示小数
      if (seconds < 1) {
        const remainingSec = remainingMs / 1000;
        setCountdown(parseFloat(remainingSec.toFixed(1)));
      } else {
        setCountdown(Math.ceil(remainingMs / 1000));
      }
      
      await new Promise(resolve => setTimeout(resolve, updateInterval));
    }
    
    // 确保最后显示100%完成
    setProgress(100);
    await new Promise(resolve => setTimeout(resolve, 100)); // 短暂显示完成状态
    
    setCountdown(null);
    setProgress(0);
    return true;
  }

  async function run(input:Res):Promise<Res>{
    await sleep(Number(v0Ref.current))
    return input
  }

  // 格式化倒计时显示
  const formatCountdown = () => {
    if (countdown === null) return '';
    
    // 对于小于1秒的情况，显示一位小数
    if (totalSeconds < 1) {
      return `${countdown.toFixed(1)}s`;
    }
    
    // 对于大于等于1秒的情况，显示整数
    return `${Math.ceil(countdown)}s`;
  };

  return(
    <NodeCore1 
      root={true}
      width={100}
      v0Ref={v0Ref} 
      handles={[1,0]} 
      colors={[0,0]}
      tips={["输出结果", "输入文本"]}
      run0={run} 
      v0={v0} 
      setV0={setV0} 
      id={id} 
      data={data}
      placeholder="请输入等待秒数"
      typeNumber={true}
    >
      {showNode&&
      countdown !== null && (
        <Flex vertical style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          justifyContent: 'flex-end',
          alignItems: 'center',
          left: 0,
          top: 0,
        }}>
          <Progress 
            type="circle" 
            percent={progress} 
            size={60}
            format={() => formatCountdown()}
            strokeWidth={10}
            style={{
              zIndex: 20000,
            }}
          />
        </Flex>
      )}
    </NodeCore1>
  )
}