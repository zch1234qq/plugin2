import React from 'react';
import { Layout, Avatar, Flex, Typography, theme as antTheme } from 'antd';
import ThemeSwitcher from './ThemeSwitcher';
import { useTheme } from '../common/theme/themeContext';
import { UserOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
  showThemeSwitcher?: boolean;
  showAvatar?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title = '智能助手',
  showThemeSwitcher = true,
  showAvatar = true,
}) => {
  const { theme } = useTheme();
  const { token } = antTheme.useToken();
  
  return (
    <AntHeader 
      style={{ 
        background: theme === 'dark' ? '#1f1f1f' : '#fff',
        padding: '0 16px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
        {title}
      </Typography.Text>
      
      <Flex gap="middle" align="center">
        {showThemeSwitcher && <ThemeSwitcher style="toggle" />}
        
        {showAvatar && (
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: theme === 'dark' ? '#177ddc' : '#1677ff' }} 
          />
        )}
      </Flex>
    </AntHeader>
  );
};

export default Header; 