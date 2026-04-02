import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { Tooltip } from "antd";
import { CSSProperties } from "react";

export default function HandleInputText({
  id = "0",
  tip = "输入文字",
  style,
}: {
  id?: string;
  tip?: string;
  style?: CSSProperties;
}) {
  return (
    <Tooltip title={tip}>
      <Handle type="target" id={id} position={Position.Top} className="handle" style={style} />
    </Tooltip>
  );
}

