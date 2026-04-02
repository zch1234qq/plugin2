import { Flex, Card } from "antd";
import ComBuy from "./ComBuy";
import ComQRError from "./ComQRError";
import { ReactNode } from "react";
// 定义组件的props接口
export interface MemoQRProps {
  debugSuccess: boolean;
  displayContent: string;
  buttonShare: React.ReactNode;
}
/**
 * MemoQR组件 - 用于显示错误状态下的QR码或购买提示
 */
const MemoQR = ({ debugSuccess, displayContent, buttonShare }: MemoQRProps): ReactNode => {
  if (debugSuccess === false && displayContent.length > 0) {
    return (
      <Flex justify="center" align="center" style={{ color: "black", flexDirection: "column", width: "100%" }}>
        <Card className="com-qr-card">
          {displayContent.startsWith("资源点") || displayContent.includes("会员已过期") ? 
            <ComBuy buttonShare={buttonShare} /> : 
            <ComQRError/>
          }
        </Card>
      </Flex>
    );
  }
  return null;
};

export default MemoQR;