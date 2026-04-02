import { Tooltip, Typography, theme as antTheme } from "antd";
import config from "../common/config/config";

export default function ComConcat({content}:{content:string}){
  const { token } = antTheme.useToken();

  return(
    <Tooltip placement="top" title="点击跳转">
      <Typography.Link
        href={config.customerService0}
        target="_blank"
        rel="noopener noreferrer"
        style={{fontSize: token.fontSizeLG}}
      >
        {content}
      </Typography.Link>
    </Tooltip>
  )
}