import { FloatButton } from "antd";
import { useLocation } from "react-router-dom";
import * as Icons from "@ant-design/icons"
import { useCustomNavigate } from '../common/hooks/useCustomNavigate';

export default function ComBar({}){
  const navigate = useCustomNavigate()
  const location = useLocation() // 获取当前路径
  
  const handleBack = () => {
    navigate(-1); // 现在在 Tauri 应用中也可以正常工作
  };
  
  return(
    <div>
      {/* 只在非 /table 路径下显示 home 按钮 */}
      {location.pathname !== '/table' && (
        <FloatButton 
          style={{insetInlineEnd:12}} 
          type="primary" 
          icon={<Icons.HomeFilled style={{color:'white'}}/>} 
          onClick={() => {
            navigate("/table")
          }}
        />
      )}
      <FloatButton 
        style={{insetInlineStart:12}} 
        icon={<Icons.LeftOutlined/>} 
        onClick={handleBack}
      />
    </div>
  )
}