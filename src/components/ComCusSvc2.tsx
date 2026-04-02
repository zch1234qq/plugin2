import { FloatButton, Popover } from "antd";
import * as Icons from "@ant-design/icons"
import QrSvcDynamic from "./ComQrSvcDynamic";

export default function ComCusSvc2(){
  return(
    <FloatButton.Group
      style={{
        position: 'fixed',
        right: 12,
        top: 12,
        bottom: 'auto',
        zIndex: 1000
      }}
    >
      <Popover content={<QrSvcDynamic />} placement="bottomLeft">
        <FloatButton 
          type="primary" 
          icon={<Icons.PhoneFilled style={{ color: 'white', fontSize: 24 }} />}
        />
      </Popover>
    </FloatButton.Group>
  )
}
