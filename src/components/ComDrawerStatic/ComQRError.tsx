import { Flex } from "antd";
import { ComConnectSvc0 } from "../ComConnectSvc0/index.tsx";

/**
 * ComQRError组件 - 显示错误状态下的客服连接
 */
const ComQRError = () => {
  return (
    <Flex vertical justify="center" align="center" className="com-qr-error">
      <p style={{color:"gray"}}>*客服可帮你解决一切识别难题，选对节点，任何复杂图片都可识别。</p>
      <ComConnectSvc0 content="点此联系人工客服" color="blue" underline fontsize={16} />
    </Flex>
  );
};

export default ComQRError;