import { Tooltip } from "antd"
import { FloatButton } from "antd"
import * as Icon from "@ant-design/icons"
import { useTheme } from "../common/theme/themeContext";

export default function ComDoc({routerSave}:{routerSave:Function}) {
  const {theme}=useTheme()

  return (
    <FloatButton.Group
      style={{
        position: 'fixed',
        right: 12,
        top: 12,
        bottom: 'auto',
        zIndex: 1000
      }}
    >
      <Tooltip title="查看使用文档" placement="left">
        <FloatButton 
          icon={<Icon.QuestionOutlined />}
          onClick={() => routerSave('/doc')}
          type="default"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
          }}
        />
      </Tooltip>
    </FloatButton.Group>      
  );
}

