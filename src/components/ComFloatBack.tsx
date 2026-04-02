import { FloatButton } from "antd"
import * as Icon from "@ant-design/icons"
import { useCustomNavigate } from "../common/hooks/useCustomNavigate.tsx"

export function ComFloatBack() {
  const router=useCustomNavigate()
  return(
    <div>
      <FloatButton style={{insetInlineStart:12}} icon={<Icon.LeftOutlined/>} onClick={()=>{
        router(-1)
      }}></FloatButton>
    </div>
  )
}