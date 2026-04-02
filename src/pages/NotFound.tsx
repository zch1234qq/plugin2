import { Button, Result, Typography } from "antd";
import { useLocation } from "react-router-dom";
import { useCustomNavigate } from "../common/hooks/useCustomNavigate";
import "./globals.css";

const { Text } = Typography;

export default function NotFound() {
  const navigate = useCustomNavigate();
  const location = useLocation();

  return (
    <div style={{ width: "100%", height: "100vh", padding: 24, boxSizing: "border-box" }}>
      <Result
        status="404"
        title="404"
        subTitle={
          <span>
            此页面不存在
          </span>
        }
        extra={[
          <Button key="back" onClick={() => navigate(-1)}>
            返回上一页
          </Button>,
          <Button key="home" type="primary" onClick={() => navigate("/", { replace: true })}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
}
