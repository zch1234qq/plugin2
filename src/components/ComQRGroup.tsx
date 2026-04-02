import { Flex} from "antd"
import ComQrSvcDynamic from "./ComQrSvcDynamic"
export default function ComQRGroup() {
    return(
      <Flex vertical justify="center" align="center">
        <ComQrSvcDynamic></ComQrSvcDynamic>
    </Flex>
  )
}