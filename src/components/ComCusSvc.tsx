import { FloatButton, Popover } from "antd";
import * as Icons from "@ant-design/icons"
import QrSvcDynamic from "./ComQrSvcDynamic";

export default function ComCusSvc(){
  return(
    <Popover content={
      <QrSvcDynamic />
    } placement="topLeft">
      <FloatButton type="primary" icon={<Icons.PhoneFilled style={{ color: 'white', insetInlineEnd: 12, fontSize: 24 }} />} />
    </Popover>
  )
}
