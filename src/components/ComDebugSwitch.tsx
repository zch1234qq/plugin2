import { Flex, Switch, Tooltip, Typography, theme as antTheme } from 'antd';
import { useAtom } from 'jotai';
import { showDebugState } from '../common/store/store';

/**
 * 调试开关组件
 * @returns 调试开关UI组件
 */
export default function ComDebugSwitch() {
  const [showDebug, setShowDebug] = useAtom(showDebugState);
  const { token } = antTheme.useToken();

  return (
    <Flex
      align="center"
      gap={8}
      style={{
        backgroundColor: token.colorBgContainer,
        color: token.colorText,
        padding: "4px 8px",
        borderRadius: token.borderRadiusSM,
        border: `1px solid ${token.colorBorderSecondary}`,
        userSelect: "none",
      }}
    >
      <Tooltip title={showDebug ? "关闭调试面板" : "打开调试面板"}>
        <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          调试
        </Typography.Text>
      </Tooltip>
      <Switch checked={showDebug} onChange={setShowDebug} size="small" />
    </Flex>
  );
} 