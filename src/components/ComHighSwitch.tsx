import { Flex, Switch } from 'antd';
import { useAtom } from 'jotai';
import { stateHighPerformance } from '../common/store/store';
import { useEffect, useState } from 'react';
import config from '../common/config/config';

/**
 * 高性能开关组件
 * @returns 高性能开关UI组件
 */
export default function ComHighSwitch() {
  const [highPerformance, setHighPerformance] = useAtom(stateHighPerformance);
  const [oldState, setOldState] = useState(highPerformance)

  useEffect(()=>{
    if(oldState!=highPerformance){
      if(highPerformance){
        window.messageApi.success(`已进入高性能模式，${config.tokenName}的消耗将会增加`)
      }else{
        window.messageApi.info(`已进入省电模式，${config.tokenName}的消耗将会减少`)
      }
      setOldState(highPerformance)
    }
  },[highPerformance])

  return (
    <Flex align="center" style={{backgroundColor: '#ffffff'}}>
      <span style={{marginRight: '8px'}}>性能</span>
      <Switch
        checked={highPerformance}
        onChange={()=>{
          setHighPerformance(!highPerformance)
        }}
        size="small"
      />
    </Flex>
  );
} 