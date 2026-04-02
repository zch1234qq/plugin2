import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { Tooltip } from "antd";

export default function HandleOutputImg({
  id = "0",
  tip = "输出图片",
}: {
  id?: string;
  tip?: string;
}) {
  return (
    <Tooltip title={tip} placement="bottom">
      <Handle type="source" id={id} position={Position.Bottom} className="handleRed" />
    </Tooltip>
  );
}

