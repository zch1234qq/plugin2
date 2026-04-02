import { Tag, Popover, Flex, Typography, theme as antTheme } from 'antd';
import { useEffect, useMemo } from "react";
import { useAtom } from 'jotai';
import { stateCountToken } from '../common/store/store';
import { handleRefreshToken } from '../common/utils';
import ComConsumeRulesLink from './ComConsumeRulesLink';

const ComTimeToProcess = ({ }) => {
  const [countToken]=useAtom(stateCountToken)
  const { token: antdToken } = antTheme.useToken();
  const count=useMemo(()=>{
    let valuestr=(countToken/1000).toFixed(1)
    if(valuestr=="0.0"||valuestr=="-0.0"){
      valuestr="0"
    }
    return valuestr
  },[countToken])
  //当组件初次加载时，刷新token数量
  useEffect(()=>{
    handleRefreshToken(false)
  },[])

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, zIndex: 1000,userSelect:'none' }}>
      <Popover
        content={
          <Flex style={{userSelect:"none"}} vertical align="center">
            <Typography.Text
              onClick={()=>{
                handleRefreshToken(true)
              }}
              style={{fontSize: antdToken.fontSize}}
            >
              点击刷新资源点余量
            </Typography.Text>
            <ComConsumeRulesLink />
          </Flex>
        }
      >
        <Tag color="processing"
         style={{ padding: '0 8px', background: 'rgba(240, 242, 245, 0.8)',cursor:"pointer" }}
         onClick={()=>handleRefreshToken(true)}
         >
          <Typography.Text style={{fontSize: antdToken.fontSize}}>
            {count}
          </Typography.Text>
        </Tag>
      </Popover>
    </div>
  );
};

export default ComTimeToProcess;
