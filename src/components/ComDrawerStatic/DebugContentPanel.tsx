import { Flex, Button, Spin, Checkbox, theme as antTheme } from "antd";
import * as Icon from '@ant-design/icons';
import { TypeDebug } from "../../common/types/types.tsx";
import ComMarkdown from "../ComMarkdown.tsx";
import ImageDisplay from "../ImageDisplay.tsx";
import ComCsvTable from '../ComCsvTable.tsx';
import MemoQR from "./MemoQR.tsx";
import { useMemo, useState } from "react";
import { stateGlobalTypeMsg } from "../../common/store/store.tsx";
import { useAtomValue } from "jotai";

// 定义组件的props接口
export interface DebugContentPanelProps {
  debug: TypeDebug;
  displayContent: string;
  handleCopy?: () => void;
  showHeader?: boolean; // 控制是否显示头部区域
  buttonShare?: React.ReactNode; // 自定义分享按钮
}

/**
 * 调试内容面板组件 - 用于显示调试窗口的头部和内容区域
 */
const DebugContentPanel = ({
  debug,
  displayContent,
  handleCopy,
  showHeader = true, // 默认显示头部
  buttonShare, // 自定义分享按钮
}: DebugContentPanelProps) => {
  const [typeMsg,setTypeMsg]=useState("");
  const globalTypeMsg=useAtomValue(stateGlobalTypeMsg);
  const { token: antdToken } = antTheme.useToken();
  // 渲染状态图标的函数
  const renderStatusIcon = () => {
    if (debug.loading) {
      return <Spin />;
    } else if (debug.success === false) {
      return <Icon.CloseCircleFilled size={antdToken.fontSizeLG} style={{ color: "var(--error-color)" }} />;
    } else {
      return <Icon.CheckCircleFilled size={antdToken.fontSizeLG} style={{ color: "var(--success-color)" }} />;
    }
  };

  // 渲染内容的组件
  const Info = useMemo(() => {
    switch (typeMsg||globalTypeMsg) {
      case "img":
        return (
          <ImageDisplay
            src={debug.data}
            containerStyle={{
              display: 'block',
              position: 'relative',
              overflow: 'visible',
              padding: '10px',
              width: 'auto',
              height: 'auto',
              minWidth: 'auto',
              minHeight: 'auto'
            }}
            imageStyle={{
              objectFit: 'contain',
              maxWidth: '100%',
              width: 'auto',
              height: 'auto',
              maxHeight: 'none',
              display: 'block'
            }}
            width='auto'
            height='auto'
          />
        );
      case "text":
        if (displayContent.startsWith("data:image")) {
          return <p>此内容为图片</p>;
        } else {
          return <p>{displayContent}</p>;
        }
      case "excel":
        return <ComCsvTable data={debug.data} />;
      case "md":
        return <ComMarkdown data={displayContent} />;
      default:
        return <p>{displayContent}</p>;
    }
  }, [debug.data, debug.msgtype, displayContent,typeMsg,globalTypeMsg]);

  return (
    <div className="com-drawer-static-panel">
      {showHeader && (
        <Flex
          wrap="wrap"
          gap="small"
          justify='space-between'
          align="center"
          className="com-drawer-static-header"
        >
          <div className="com-drawer-static-header-title" style={{ userSelect: "none" }}>
            调试窗口
          </div>
          <Checkbox className="com-drawer-static-header-control" onChange={(e)=>{
            setTypeMsg(e.target.checked?"excel":"" );
          }}>
            显示为表格
          </Checkbox>
          <Flex gap="small" justify='end' align="center" wrap="wrap" className="com-drawer-static-header-actions">
            {renderStatusIcon()}
            <p>{debug.nodeType}</p>
            {handleCopy && (
              <Button
                icon={<Icon.CopyOutlined />}
                onClick={handleCopy}
                size="middle"
                // type="text"
                // shape="circle"
                className="com-drawer-static-icon-button"
                title="复制内容"
              />
            )}
          </Flex>
        </Flex>
      )}
      <div className="com-drawer-static-content">
        <div 
          className={`com-drawer-static-text ${debug.success === false ? 'com-drawer-static-error-text' : ''} ${debug.msgtype === "img" ? 'com-drawer-static-img-content' : 'com-drawer-static-text-content'}`}>
          {debug.success ? Info : <p>{debug.data}</p>}
          <MemoQR debugSuccess={debug.success||false} displayContent={displayContent} buttonShare={buttonShare} />
        </div>
      </div>
    </div>
  );
};

export default DebugContentPanel;
