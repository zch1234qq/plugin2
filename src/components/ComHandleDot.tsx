import { Position } from '@xyflow/react';
import { Handle } from '@xyflow/react';
import { Tooltip } from "antd";


export default function ComHandleDot({id="0",tip="输入"}:{id?:string,tip?:string}) {
  const handle = (
    <Handle id={id} className="handleDot" type="target" position={Position.Top} />
  );
  if(!tip){
    return handle;
  }
  return (
    <Tooltip title={tip}>
      {handle}
    </Tooltip>
  );
}
