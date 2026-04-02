import { FloatButton } from "antd"
import { useCustomNavigate } from "../common/hooks/useCustomNavigate";
import { LeftOutlined } from "@ant-design/icons";
import { CSSProperties, useState } from "react";

export default function ComBack({callback}:{callback?:()=>void}){
  const navigate = useCustomNavigate();
  const [isHover, setIsHover] = useState(false);

  const handleBack = () => {
    callback?.()
    // 检查是否有历史记录可以返回
    if (window.history.length <= 1) {
      navigate("/"); // 如果没有历史记录，跳转到首页
    } else {
      navigate(-1); // 否则返回上一页
    }
  };
  
  const buttonStyle: CSSProperties = {
    insetInlineStart: 12,
    zIndex: 10000,
    opacity: isHover ? 0.11 : 1,
    transition:'opacity 0.3s'
  };
  
  return (
    <FloatButton
      style={buttonStyle}
      icon={<LeftOutlined />}
      onClick={handleBack}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    />
  );
}