import { Card, Typography, Divider, Row, Col, Layout, Menu, Drawer, Button, theme as antTheme } from 'antd';
import { useState } from 'react';
import LoadingCus from "../../components/loadingCus";
import { EnumNodeType, RecordNodeLabel, RecordNodeColor, RecordNodeTextColor, RecordNodeTextColorDark, RecordNodeColorDark } from '../../common/types/types';
import { useTheme } from '../../common/theme/themeContext';
import { MenuOutlined } from '@ant-design/icons';
import ComBack from '../../components/ComBack';
const { Title, Paragraph, Text } = Typography;
const { Content, Sider } = Layout;

// 文档内容配置
const docContents = {
  nodes: {
    key: 'nodes',
    title: '节点说明',
    content: () => <NodesDoc />
  },
  dataflow: {
    key: 'dataflow', 
    title: '数据流',
    content: () => <DataFlowDoc />
  },
  bestpractice: {
    key: 'bestpractice',
    title: '最佳实践',
    content: () => <BestPracticeDoc />
  },
  quickstart: {
    key: 'quickstart',
    title: '快速开始',
    content: () => <QuickStartDoc />
  }
};

export default function Doc() {
  const [selectedKey, setSelectedKey] = useState('nodes');
  const [isMobileDrawerVisible, setIsMobileDrawerVisible] = useState(false);
  const { theme } = useTheme();
  const { token } = antTheme.useToken();
  
  // 检测是否为移动设备
  const isMobile = window.innerWidth <= 768;

  const menuItems = Object.values(docContents).map(item => ({
    key: item.key,
    label: item.title
  }));

  // 移动端抽屉菜单
  const MobileMenu = () => (
    <Drawer
      placement="left"
      open={isMobileDrawerVisible}
      onClose={() => setIsMobileDrawerVisible(false)}
      width={250}
      styles={{ body: { padding: 0 } }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onSelect={({key}) => {
          setSelectedKey(key);
          setIsMobileDrawerVisible(false);
        }}
      />
    </Drawer>
  );

  return (
    <LoadingCus isLoading={false}>
      <ComBack/>
      <Layout style={{ 
        height: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* 移动端显示抽屉菜单按钮 */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1000
          }}>
            <Button
              icon={<MenuOutlined />}
              onClick={() => setIsMobileDrawerVisible(true)}
            />
          </div>
        )}

        {/* PC端显示侧边栏，移动端隐藏 */}
        {!isMobile && (
          <Sider 
            width={200} 
            theme={theme === 'dark' ? 'dark' : 'light'} 
            style={{
              height: '100%',
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              overflow: 'auto',
              flex: '0 0 200px'
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              style={{ height: '100%', borderRight: 'none' }}
              items={menuItems}
              onSelect={({key}) => setSelectedKey(key)}
            />
          </Sider>
        )}

        {/* 移动端抽屉菜单 */}
        {isMobile && <MobileMenu />}

        <Layout style={{ 
          height: '100%', 
          overflow: 'hidden',
          flex: '1 1 auto'
        }}>
          <Content style={{ 
            padding: isMobile ? '60px 12px 12px' : '24px',
            height: '100%',
            overflow: 'auto',
            backgroundColor: token.colorBgContainer,
            minWidth: 0,
            width: '100%'
          }}>
            <div style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '1200px',
              margin: '0 auto',
              padding: isMobile ? '0 8px' : '0 24px',
              boxSizing: 'border-box'
            }}>
              {docContents[selectedKey as keyof typeof docContents].content()}
            </div>
          </Content>
        </Layout>
      </Layout>
    </LoadingCus>
  );
}

// 节点说明文档组件
function NodesDoc() {
  const { theme } = useTheme();
  
  const nodeGroups = {
    input: [
      { type: EnumNodeType.In, desc: "文本输入节点，用于输入文字内容" },
      { type: EnumNodeType.InImg, desc: "单图片输入节点，支持图片上传和抽样压缩" },
      { type: EnumNodeType.InImgGp, desc: "图片组节点，支持多图片批量上传，支持PDF转图片" },
      { type: EnumNodeType.InFile, desc: "文件输入节点，用于上传文件" },
      { type: EnumNodeType.Data, desc: "数据节点，用于存储常量数据" },
      { type: EnumNodeType.DbRead, desc: "读取记忆节点，从记忆读取最新一条信息" },
      { type: EnumNodeType.DbList, desc: "记忆列表节点，从记忆读取所有信息" }
    ],
    ai: [
      { type: EnumNodeType.Prompt, desc: "AI文本节点，使用大模型处理文本" },
      { type: EnumNodeType.PromptImg, desc: "AI图像节点，使用大模型处理图像" }, 
      { type: EnumNodeType.OCR, desc: "OCR节点，识别图片中的文字" },
      { type: EnumNodeType.Search, desc: "搜索节点，提供联网搜索能力" }
    ],
    function: [
      { type: EnumNodeType.Display, desc: "显示节点，用于预览图片" },
      { type: EnumNodeType.Http, desc: "HTTP请求节点，发送HTTP请求" },
      { type: EnumNodeType.Loop, desc: "循环节点，重复执行指定次数" },
      { type: EnumNodeType.Concat, desc: "拼接节点，连接多个输入" },
      { type: EnumNodeType.Python, desc: "Python节点，在前端执行Python代码" },
      { type: EnumNodeType.JavaScript, desc: "JavaScript节点，在前端执行JavaScript代码" }
    ],
    other: [
      { type: EnumNodeType.Download, desc: "下载节点，下载处理结果" },
      { type: EnumNodeType.Wait, desc: "等待节点，延迟执行" },
      { type: EnumNodeType.DbWrite, desc: "写入记忆节点，将数据存入记忆" },
      { type: EnumNodeType.Out, desc: "输出节点，输出最终结果" }
    ]
  };

  // 创建卡片样式的函数
  const getCardStyle = (nodeType: EnumNodeType) => ({
    height: '100%',
    backgroundColor: theme === 'dark' ? RecordNodeColorDark[nodeType] : RecordNodeColor[nodeType],
    borderColor: 'transparent',
  });

  // 创建标题样式的函数
  const getTitleStyle = (nodeType: EnumNodeType) => ({
    color: theme === 'dark' ? RecordNodeTextColorDark[nodeType] : RecordNodeTextColor[nodeType],
    fontWeight: 'bold',
  });

  // 创建内容样式的函数
  const getContentStyle = (nodeType: EnumNodeType) => ({
    color: theme === 'dark' ? RecordNodeTextColorDark[nodeType] : RecordNodeTextColor[nodeType],
  });

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      width: '100%',
      minWidth: 0
    }}>
      <Title level={2} style={{ fontSize: isMobile ? '20px' : '24px' }}>
        节点使用说明
      </Title>
      <Paragraph>
        系统提供多种类型的节点，通过组合这些节点可以构建复杂的数据处理流程。
      </Paragraph>
      
      <Divider orientation="left">输入类节点</Divider>
      <Row gutter={[8, 8]} style={{ width: '100%' }}>
        {nodeGroups.input.map(node => (
          <Col xs={24} sm={24} md={12} lg={8} key={node.type}>
            <Card 
              title={
                <div style={{
                  ...getTitleStyle(node.type),
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  {RecordNodeLabel[node.type]}
                </div>
              }
              size={isMobile ? "small" : "default"}
              style={{
                ...getCardStyle(node.type),
                margin: isMobile ? '4px 0' : '8px 0',
                width: '100%'
              }}
              styles={{
                body: {
                  ...getContentStyle(node.type),
                  padding: isMobile ? '8px' : '16px'
                }
              }}
            >
              <Text style={{
                ...getContentStyle(node.type),
                fontSize: isMobile ? '12px' : '14px'
              }}>
                {node.desc}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider orientation="left">AI处理类节点</Divider>
      <Row gutter={[8, 8]} style={{ width: '100%' }}>
        {nodeGroups.ai.map(node => (
          <Col xs={24} sm={24} md={12} lg={8} key={node.type}>
            <Card 
              title={
                <div style={{
                  ...getTitleStyle(node.type),
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  {RecordNodeLabel[node.type]}
                </div>
              }
              size={isMobile ? "small" : "default"}
              style={{
                ...getCardStyle(node.type),
                margin: isMobile ? '4px 0' : '8px 0',
                width: '100%'
              }}
              styles={{
                body: {
                  ...getContentStyle(node.type),
                  padding: isMobile ? '8px' : '16px'
                }
              }}
            >
              <Text style={{
                ...getContentStyle(node.type),
                fontSize: isMobile ? '12px' : '14px'
              }}>
                {node.desc}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider orientation="left">功能类节点</Divider>
      <Row gutter={[8, 8]} style={{ width: '100%' }}>
        {nodeGroups.function.map(node => (
          <Col xs={24} sm={24} md={12} lg={8} key={node.type}>
            <Card 
              title={
                <div style={{
                  ...getTitleStyle(node.type),
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  {RecordNodeLabel[node.type]}
                </div>
              }
              size={isMobile ? "small" : "default"}
              style={{
                ...getCardStyle(node.type),
                margin: isMobile ? '4px 0' : '8px 0',
                width: '100%'
              }}
              styles={{
                body: {
                  ...getContentStyle(node.type),
                  padding: isMobile ? '8px' : '16px'
                }
              }}
            >
              <Text style={{
                ...getContentStyle(node.type),
                fontSize: isMobile ? '12px' : '14px'
              }}>
                {node.desc}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider orientation="left">其他节点</Divider>
      <Row gutter={[8, 8]} style={{ width: '100%' }}>
        {nodeGroups.other.map(node => (
          <Col xs={24} sm={24} md={12} lg={8} key={node.type}>
            <Card 
              title={
                <div style={{
                  ...getTitleStyle(node.type),
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  {RecordNodeLabel[node.type]}
                </div>
              }
              size={isMobile ? "small" : "default"}
              style={{
                ...getCardStyle(node.type),
                margin: isMobile ? '4px 0' : '8px 0',
                width: '100%'
              }}
              styles={{
                body: {
                  ...getContentStyle(node.type),
                  padding: isMobile ? '8px' : '16px'
                }
              }}
            >
              <Text style={{
                ...getContentStyle(node.type),
                fontSize: isMobile ? '12px' : '14px'
              }}>
                {node.desc}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />
      
      <Title level={3}>使用技巧</Title>
      <Paragraph>
        <ul>
          <li>节点之间通过连线传递数据,确保输入输出类型匹配</li>
          <li>图片节点支持抽样压缩功能,可以降低处理成本</li>
          <li>使用循环节点可以批量处理多个输入</li>
          <li>记忆相关节点可以保存和读取历史数据</li>
        </ul>
      </Paragraph>
    </div>
  );
}

// 数据流文档组件
function DataFlowDoc() {
  const isMobile = window.innerWidth <= 768;
  
  return (
    <div style={{ 
      width: '100%',
      minWidth: 0
    }}>
      <Title level={2} style={{ fontSize: isMobile ? '20px' : '24px' }}>
        数据流说明
      </Title>
      <Paragraph>
        节点之间的数据传递遵循以下规则：
      </Paragraph>
      
      <Title level={3}>数据类型</Title>
      <Paragraph>
        <ul>
          <li>文本数据：字符串形式，用于文字处理</li>
          <li>图像数据：Base64或URL形式，用于图片处理</li>
          <li>文件数据：二进制形式，用于文件处理</li>
          <li>JSON数据：结构化数据，用于复杂数据传递</li>
        </ul>
      </Paragraph>

      <Title level={3}>连接规则</Title>
      <Paragraph>
        <ul>
          <li>输入节点必须连接到处理节点或输出节点</li>
          <li>确保连接的节点间数据类型匹配</li>
          <li>避免形成循环连接</li>
        </ul>
      </Paragraph>
    </div>
  );
}

// 最佳实践文档组件
function BestPracticeDoc() {
  const isMobile = window.innerWidth <= 768;
  
  return (
    <div style={{ 
      width: '100%',
      minWidth: 0
    }}>
      <Title level={2} style={{ fontSize: isMobile ? '20px' : '24px' }}>
        最佳实践
      </Title>
      
      <Title level={3}>流程设计</Title>
      <Paragraph>
        <ul>
          <li>将复杂任务拆分为多个简单步骤</li>
          <li>使用数据节点存储中间结果</li>
          <li>合理使用循环节点处理批量数据</li>
        </ul>
      </Paragraph>

      <Title level={3}>性能优化</Title>
      <Paragraph>
        <ul>
          <li>图片节点使用适当的抽样率降低处理成本</li>
          <li>避免不必要的数据转换</li>
          <li>合理使用缓存机制</li>
        </ul>
      </Paragraph>
    </div>
  );
}

// 快速开始文档组件
function QuickStartDoc() {
  const isMobile = window.innerWidth <= 768;
  
  return (
    <div style={{ 
      width: '100%',
      minWidth: 0
    }}>
      <Title level={2} style={{ fontSize: isMobile ? '20px' : '24px' }}>
        快速开始
      </Title>
      <Title level={3}>基础流程</Title>
      <Paragraph>
        1. 创建新应用
        2. 添加输入节点
        3. 添加处理节点
        4. 添加输出节点
        5. 连接节点
        6. 测试运行
      </Paragraph>

      <Divider />

      <Title level={3}>常用案例</Title>
      
      {/* 数据抓取案例 */}
      <Title level={4}>1. 批量数据抓取与存储</Title>
      <Paragraph>
        使用 HTTP 节点和循环节点实现批量数据抓取和保存。
      </Paragraph>
      <Card title="实现步骤" style={{ marginBottom: 16 }}>
        <ol>
          <li>添加【数据】节点：输入URL列表（每行一个URL）</li>
          <li>添加【循环】节点：连接到数据节点，设置合适的间隔</li>
          <li>添加【HTTP】节点：连接到循环节点，设置请求方法</li>
          <li>添加【写记忆】节点：保存抓取的数据，设置标签便于查询</li>
          <li>添加【输出】节点：查看处理结果</li>
        </ol>
        <Text type="secondary">
          提示：可以在HTTP节点中设置请求头和超时时间，合理设置循环间隔避免请求过于频繁。
        </Text>
      </Card>

      {/* 智能监控案例 */}
      <Title level={4}>2. 智能视频监控系统</Title>
      <Paragraph>
        结合HTTP、循环和AI节点实现智能监控功能。
      </Paragraph>
      <Card title="实现步骤" style={{ marginBottom: 16 }}>
        <ol>
          <li>添加【HTTP】节点：配置网络相机API，获取实时图像URL</li>
          <li>添加【循环】节点：设置适当的间隔时间（如1秒）</li>
          <li>添加【显示器】节点：通过URL实时显示监控画面</li>
          <li>添加【AI图片】节点：对监控画面进行分析</li>
          <li>添加【条件】节点：根据AI分析结果判断是否需要报警</li>
          <li>添加【写记忆】节点：记录异常事件和图像URL</li>
        </ol>
        <Text type="secondary">
          提示：显示器节点可以直接展示网络相机的实时图像，配合写记忆节点可以保存关键时刻的图像URL。
        </Text>
      </Card>

      {/* PDF批处理案例 */}
      <Title level={4}>3. PDF文档批量OCR处理</Title>
      <Paragraph>
        使用图片组、循环和OCR节点实现PDF文档的批量文字识别。
      </Paragraph>
      <Card title="实现步骤" style={{ marginBottom: 16 }}>
        <ol>
          <li>添加【图片组】节点：上传PDF文件，自动转换为图片序列</li>
          <li>添加【循环】节点：连接到图片组节点</li>
          <li>添加【显示器】节点：预览当前处理的图片页面</li>
          <li>添加【OCR】节点：识别每页图片中的文字</li>
          <li>添加【拼接】节点：合并所有页面的识别结果</li>
          <li>添加【写记忆】节点：保存处理结果</li>
          <li>添加【下载】节点：导出识别文本</li>
        </ol>
        <Text type="secondary">
          提示：使用显示器节点可以实时预览PDF转换后的图片质量，便于调整图片组节点的抽样率参数。
        </Text>
      </Card>

      <Divider />

      <Title level={3}>进阶技巧</Title>
      <Card title="优化建议">
        <ul>
          <li>
            <Text strong>错误处理：</Text>
            <Text>在关键节点后添加条件判断，处理可能的异常情况</Text>
          </li>
          <li>
            <Text strong>性能优化：</Text>
            <Text>合理设置循环间隔和图片抽样率，避免资源占用过高</Text>
          </li>
          <li>
            <Text strong>数据持久化：</Text>
            <Text>定期使用写记忆节点保存中间结果，防止数据丢失</Text>
          </li>
          <li>
            <Text strong>模块化设计：</Text>
            <Text>将常用的节点组合保存为模板，方便复用</Text>
          </li>
        </ul>
      </Card>

      <Divider />

      <Title level={3}>常见问题</Title>
      <Card>
        <ul>
          <li>
            <Text strong>Q: 显示器节点无法显示图片？</Text>
            <br />
            <Text>A: 检查输入的URL是否有效，或确认记忆中存储的图片路径是否正确</Text>
          </li>
          <li>
            <Text strong>Q: 循环节点执行太快/太慢？</Text>
            <br />
            <Text>A: 使用等待节点控制执行间隔，或调整循环节点的批处理设置</Text>
          </li>
          <li>
            <Text strong>Q: 如何保存处理过程中的图片？</Text>
            <br />
            <Text>A: 使用写记忆节点保存图片URL或路径，后续可通过显示器节点查看</Text>
          </li>
        </ul>
      </Card>
    </div>
  );
}

