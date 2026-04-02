import { Button, Card, Col, Flex, Row, Typography } from 'antd';
import { WindowsFilled} from '@ant-design/icons';
const { Title, Text } = Typography;
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';
import ComBack from '../../components/ComBack';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import config from '../../common/config/config';
const baseUrl = 'https://store.aditor.cn/downloads';
export default function Download() {
    const [, setVersion] = useState('v1.0.0');

    useEffect(() => {
      getVersion().then(ver => {
        setVersion(`v${ver}`);
      });
    }, []);
    const downloads = [
        // {
        //     platform: 'macOS',
        //     icon: <AppleFilled style={{ fontSize: '48px' }} />,
        //     description: 'macOS 10.15+',
        //     downloadUrl: `${baseUrl}/aditor_mac.dmg`,
        // },
        {
            platform: 'Windows',
            icon: <WindowsFilled style={{ fontSize: '48px' }} />,
            description: 'Windows 10/11 64位',
            downloadUrl: `${baseUrl}/aditor_win.zip`,
        },
        // {
        //     platform: 'Linux',
        //     icon: <LinuxOutlined style={{ fontSize: '48px' }} />,
        //     description: 'Ubuntu 20.04+',
        //     downloadUrl: `${baseUrl}/aditor_linux.deb`,
        // }
    ];

    return (
      <Flex justify='center'
          align='center'
          style={{
              width: '100%',
              height: '100%',
              background: '#f5f5f5',
              minHeight: '100vh',
              overflow: 'auto',
          }}
      >
        <ComBack/>
        <Flex vertical justify='center' style={{ 
            padding: '40px', 
            width: '80%',
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh',
            background: '#f5f5f5',
            overflow: 'auto',
        }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
                下载客户端
            </Title>
            
            <Row gutter={[24, 24]} justify="center">
                {downloads.map((item, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                        <Card 
                            hoverable
                            style={{ 
                                textAlign: 'center',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                {item.icon}
                                <Title level={3} style={{ marginTop: '16px' }}>
                                    {item.platform}
                                </Title>
                                <Text type="secondary">
                                    {item.description}
                                </Text>
                            </div>
                            <Button 
                                type="primary" 
                                size="large"
                                href={config.isDesktop ? undefined : item.downloadUrl}
                                onClick={async (e) => {
                                  if (!config.isDesktop) return;
                                  e.preventDefault();
                                  try {
                                    await shellOpen(item.downloadUrl);
                                  } catch {
                                    // ignore; UI层不需要把系统错误暴露给用户
                                  }
                                }}
                                style={{ width: '80%', margin: '16px auto' }}
                            >
                                下载
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Flex>
      </Flex>
    );
}