import { Flex, Image, Popover, Typography, theme as antTheme } from 'antd';
import QrGroup from "../assets/qr_group.png";

const ComTip0 = () => {
  const { token } = antTheme.useToken();

  return (
    <Flex
      vertical
      align='center'
      style={{userSelect:"none",width:"100%",color:token.colorTextSecondary,marginBottom:"10px"}}
    >
      <Typography.Text type="secondary">推荐在chrome浏览器中使用本应用</Typography.Text>
      <Typography.Link
        href="https://soft.qq.com/search.html#!keyword=chrome"
        target="_blank"
        style={{fontSize: token.fontSize}}
      >
        前往腾讯软件中心下载chrome
      </Typography.Link>
      <Typography.Text type="secondary">技术支持群，帮你解决一切使用问题</Typography.Text>
      <Popover
        content={
          <Flex vertical align='center' style={{userSelect:"none"}}>
            <Image width={'10rem'} preview={false} src={QrGroup}></Image>
            <Typography.Text type="secondary">全年无休，极速响应</Typography.Text>
          </Flex>
        }
        placement="top"
      >
        <Typography.Link>查看群码</Typography.Link>
      </Popover>
    </Flex>
  );
};

export default ComTip0;
