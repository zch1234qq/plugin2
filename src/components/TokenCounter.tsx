import React, { useEffect, useState } from 'react';
import { Flex, Button, Typography, theme as antTheme } from 'antd';
import * as Icon from '@ant-design/icons';
import server from '../common/service/server';
import ComTipToken from './ComTipToken';
import config from '../common/config/config';
import './globals.css'
import { useAtom } from 'jotai';
import { stateCountResource, stateCountToken } from '../common/store/store';

export default function TokenCounter() {
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [countToken, setCountToken] = useAtom(stateCountToken);
  const [, setCountResource]=useAtom(stateCountResource)
  const { token } = antTheme.useToken();

  useEffect(() => {
    handleRefreshToken(false)
  }, [])
  /**
   * 刷新token数量
   */
  const handleRefreshToken = (handle=true) => {
    if(refreshingToken) return
    setRefreshingToken(true);
    server.getToken()
      .then(res => {
        var data=res.data
        if (data.success) {
          setCountToken(data.tokencurrent);
          setCountResource(data.tokencurrent/1000)
          if(handle) {
            window.messageApi.success({
              content: "Token数量已刷新",
              key: "tokenRefresh"
            });
          }
        } else {
          window.messageApi.error({
            content: data.message || "刷新失败，请稍后重试",
            key: "tokenRefreshError"
          });
        }
      })
      .catch(err => {
        window.messageApi.error({
          content: "刷新失败，请检查网络连接",
          key: "tokenRefreshError"
        });
        console.error("Token刷新出错:", err);
      })
      .finally(() => {
        setRefreshingToken(false);
      });
  };


  return (
    <Flex justify="space-between" align="center">
      <Flex align="end" gap={4}>
        <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
          剩余{config.tokenName}：
        </Typography.Text>
        <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
          {(countToken/config.tokenRatio).toFixed(1)}
        </Typography.Text>
        <ComTipToken/>
        <Button 
          type="text" 
          icon={<Icon.SyncOutlined spin={refreshingToken} />} 
          onClick={()=>handleRefreshToken(true)}
          loading={refreshingToken}
          size="small"
          style={{ marginLeft: 8 }}
        />
      </Flex>
    </Flex>
  );
};