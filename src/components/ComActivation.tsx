import { Button, Flex, Input } from "antd";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { stateCountToken, stateUserInfo } from "../common/store/store";
import server from "../common/service/server";
import _ from "lodash";

interface ComActivationProps {
  className?: string;
}

export default function ComActivation({ className }: ComActivationProps) {
  const [, setCountToken] = useAtom(stateCountToken);
  const [userinfo, setUserinfo] = useAtom(stateUserInfo);
  const [activationCode, setActivationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * 处理倒计时逻辑
   */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  /**
   * 提交激活码
   */
  const handleActivation = () => {
    if (!activationCode.trim()) {
      window.messageApi.error({
        content: "请输入激活码",
        key: "activationError"
      });
      return;
    }

    setLoading(true);
    server.activate(activationCode.trim())
      .then(res => {
        let data = res.data;
        if (data.success) {
          setCountToken(data.tokencurrent);
          let newUserinfo = _.cloneDeep({ ...userinfo,tokenfree:0, plan: {...userinfo.plan, counttoken:data.tokencurrent} });
          setUserinfo(newUserinfo);
          window.messageApi.success({
            content: "激活码使用成功",
            duration: 2
          });
          setActivationCode("");
          setCountdown(60); // 设置60秒倒计时
        } else {
          window.messageApi.error({
            content: data.message || "激活失败，请检查激活码",
            key: data.message
          });
        }
      })
      .catch(err => {
        window.messageApi.error({
          content: "激活失败，请稍后重试",
          key: "activationError"
        });
        console.error("激活码验证出错:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <Flex gap={0} className={`activation-container ${className || ''}`} style={{width:"100%"}}>
      <Input
        placeholder="购买后输入激活码"
        value={activationCode}
        onChange={(e) => setActivationCode(e.target.value)}
        className="activation-input"
        size="large"
      />
      <Button
        type="primary"
        loading={loading}
        disabled={countdown > 0}
        onClick={handleActivation}
        className="activation-button"
        size="large"
      >
        {countdown > 0 ? `${countdown}秒后重试` : '使用激活码'}
      </Button>
    </Flex>
  );
} 