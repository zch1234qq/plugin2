import { Flex, Button, Divider, Image, Drawer, Popover } from "antd";
import { useState } from "react";
import ComModalinvite from "../ComModalinvite";
import ImgCodeXcx from '../../assets/code_xcx.png';
import QrGroup from "../../assets/qr_group.png" 
import PageBuy from "../../pages/plansplit_/page"

interface ComBuyProps {
  buttonShare?: React.ReactNode;
}

const ComBuy = ({buttonShare}: ComBuyProps) => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  return (
    <Flex style={{ color: "gray" }} vertical justify="center" align="center">
      <Flex vertical align="center">
        <p className="com-p">*进群，发送口令"我要资源点"，每天可得50资源点</p>
        <Popover
          content={
            <Image width={'10rem'} preview={false} src={QrGroup}></Image>
          }
          placement="top"
        >
          <p style={{color:"blue",cursor:"pointer",textDecoration:"underline"}}>查看群码</p>
        </Popover>
      </Flex>
      <Divider className="custom-divider"  />
      <Flex vertical align="center">
        <p className="com-p">*进入小程序，每天可得50资源点</p>
        <Popover
          content={
            <Image width={'10rem'} preview={false} src={ImgCodeXcx}></Image>
          }
          placement="top"
        >
          <p style={{color:"blue",cursor:"pointer",textDecoration:"underline"}}>查看小程序码</p>
        </Popover>
      </Flex>
      <Divider className="custom-divider" />
      <p className="com-p">*分享应用给好友，好友运行本应用时，你可立即获得消耗量的<span style={{color:"red",fontWeight:"bold"}}>30%</span>作为奖励。</p>
      {buttonShare}
      <Divider className="custom-divider" />
      <Flex vertical align="center">
        <p className="com-p">*资源点永不过期</p>
        <Button type="primary" onClick={() => {
          setDrawerVisible(true);
        }}>点击购买</Button>
      </Flex>
      <ComModalinvite open={inviteModalVisible} onCancel={() => { setInviteModalVisible(false); }} />
      
      {/* 使用Drawer包裹plan页面 */}
      <Drawer
        title="选择资源包"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width="80%"
        size="large"
        style={{
          overflow: "hidden"
        }}
      >
        {/* <iframe
          src={`${window.location.origin}/#/plan`}
          width="100%"
          height="95%"
          style={{ border: 'none', overflow: "hidden" }}
          title="购买资源点"
        /> */}
        <PageBuy callBack={() => { setDrawerVisible(false); }} />
      </Drawer>
    </Flex>
  );
};

export default ComBuy;