import { Tooltip } from "antd";
import * as Icon from '@ant-design/icons';
import config from "../common/config/config";

 export default function ComTipToken(){
  return(
    <div>
    <Tooltip
      title={
        <>
        <div>由免费{config.tokenName}和会员{config.tokenName}组成</div>
        <div>免费{config.tokenName}可通过活动领取</div>
        <div>会员{config.tokenName}通过购买资源包获得</div>
        <div>aditor优先消耗免费{config.tokenName}</div>
      </>
    }
    >
      <Icon.InfoCircleTwoTone style={{
        marginLeft: '8px',
        cursor: 'pointer'
      }}/>
    </Tooltip>
  </div>
  )
}
