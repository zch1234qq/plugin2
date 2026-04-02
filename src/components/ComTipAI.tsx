import { Flex, Typography, theme as antTheme } from "antd";
import { useTheme } from "../common/theme/themeContext";
import ComConcat from "./ComConcat";
import { CSSProperties } from "react";

/**
 * AI辅助提示组件 - 显示页面内容由AI辅助生成的提示信息
 * 使用模糊背景效果增强视觉效果
 */
export default function ComTipAI({ style }: { style?: CSSProperties }){
  const { theme } = useTheme();
  const { token } = antTheme.useToken();

  return (
    <Flex 
      justify='space-around' 
      align='center' 
      style={{
        padding: "8px 15px",
        width: "100%",
        height: "auto",
        backgroundColor: theme === 'dark' 
          ? 'rgba(0, 0, 0, 0.6)' 
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${theme === 'dark' ? '#303030' : '#e8e8e8'}`,
        zIndex: 100,
        userSelect: "none",
        ...style // 合并传入的样式
      }}
    >
      <ComConcat content="获取客服帮助(点击跳转)"/>
      <Typography.Text
        type="secondary"
        style={{
          color: theme === 'dark' ? '#aaa' : token.colorTextSecondary,
          fontSize: token.fontSizeLG,
          fontWeight: 400
        }}
      >
        页面内容由AI辅助生成
      </Typography.Text>
    </Flex>
  );
}