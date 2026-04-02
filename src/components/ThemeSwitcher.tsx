import React from 'react';
import { useTheme } from '../common/theme/themeContext';
import { Button, Switch, Segmented, Space, Tooltip, Typography } from 'antd';
import { BulbOutlined, BulbFilled, SettingOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * 主题切换组件
 * 可以在界面任何位置使用，提供三种风格：
 * 1. 'toggle': 开关按钮风格
 * 2. 'switch': 开关切换风格
 * 3. 'segmented': 分段控制器风格（替代原radio风格）
 */
interface ThemeSwitcherProps {
  /**
   * 组件风格
   * - 'toggle': 开关按钮风格
   * - 'switch': 开关切换风格
   * - 'segmented': 分段控制器风格
   * @default 'toggle'
   */
  style?: 'toggle' | 'switch' | 'segmented';
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ style = 'toggle' }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  
  // 切换主题模式
  const toggleTheme = () => {
    setThemeMode(theme === 'dark' ? 'light' : 'dark');
  };
  
  // 设置特定的主题模式
  const handleModeChange = (value: any) => {
    setThemeMode(value);
  };

  // 处理switch开关切换
  const handleSwitchChange = (checked: boolean) => {
    setThemeMode(checked ? 'dark' : 'light');
  };
  
  // 开关按钮风格
  if (style === 'toggle') {
    return (
      <Tooltip title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
        <Button
          type="text"
          icon={<BulbFilled style={{color:theme=="dark"?"#fff":"#000"}}/>}
          style={{border:"1px solid #000",borderColor:theme=="dark"?"#fff":"#000",
            backgroundColor:theme=="dark"?"#000":"#fff"}}
          onClick={toggleTheme}
          aria-label="切换主题模式"
        />
      </Tooltip>
    );
  }
  // 开关切换风格
  if (style === 'switch') {
    return (
      <Space align="center">
        <Typography.Text>亮色</Typography.Text>
        <Switch
          checked={theme === 'dark'}
          onChange={handleSwitchChange}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
        />
        <Typography.Text>暗色</Typography.Text>
      </Space>
    );
  }
  
  // 分段控制器风格（替代原radio风格）
  return (
    <div className="theme-switcher">
      <Segmented
        value={themeMode}
        onChange={handleModeChange}
        options={[
          {
            label: '亮色',
            value: 'light',
            icon: <BulbOutlined />
          },
          {
            label: '暗色',
            value: 'dark',
            icon: <BulbFilled />
          }
        ]}
      />
    </div>
  );
};

export default ThemeSwitcher; 