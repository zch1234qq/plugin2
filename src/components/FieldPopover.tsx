import { Popover, Typography, theme as antTheme } from "antd";
import { CSSProperties } from "react";

type FieldPopoverProps = {
  field: string;
  placement?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "focus" | "click" | "contextMenu";
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
};

export default function FieldPopover({
  field,
  placement = "top",
  trigger = "hover",
  mouseEnterDelay = 0.2,
  mouseLeaveDelay = 0.1,
}: FieldPopoverProps) {
  const { token } = antTheme.useToken();
  const textStyle: CSSProperties = {
    flex: 1,
    fontSize: token.fontSizeSM*0.75,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minWidth: 0
  };

  return (
    <Popover content={
      <div>
        <div>{field}</div>
        <Typography.Text type="secondary">(双击修改)</Typography.Text>
      </div>
    } 
    placement={placement}
    trigger={trigger}
    mouseEnterDelay={mouseEnterDelay}
    mouseLeaveDelay={mouseLeaveDelay}>
      <span style={textStyle}>{field}</span>
    </Popover>
  );
}
