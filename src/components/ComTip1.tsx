import { Flex, Typography, theme as antTheme } from 'antd';

const ComTip1 = () => {
  const { token } = antTheme.useToken();
  return (
    <Flex vertical align='center' style={{width:"100%",marginBottom:"10px"}}>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG }}>订单、过磅单、化验单、发货单、发票、超市购物小票、</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG }}>证照、合同、电表、水表、出入库单等</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG }}>复杂图片均可识别</Typography.Text>
      {/* <div>并提供技术支持，让任何人都能轻松使用</div> */}
    </Flex>
  );
};

export default ComTip1;
