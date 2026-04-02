import { Button, Flex, Form, Input, InputNumber } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCustomNavigate } from "../../common/hooks/useCustomNavigate";
import server from "../../common/service/server";
import { LogError } from "../../common/Http";
import { TypeCaptchaRes } from "../../common/types/types";
import ComBack from "../../components/ComBack";
import CaptchaA from "../../components/CaptchaA/index.tsx";
import './style.css';
import { atomCountdown, stateDebug } from "../../common/store/store";
import { useAtom } from "jotai";

/**
 * @description 重置密码页面组件
 */
export default function PageReset() {
  const [form] = Form.useForm();
  const navigate = useCustomNavigate();
  const [phone, setPhone] = useState("");
  const refPhone = useRef(phone);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(0); // 0: 输入手机号, 1: 输入验证码, 2: 设置新密码
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [disSmsSend, setDisSmsSend] = useState(false); // 是否禁用按钮
  const [countdown, setCountdown] = useAtom(atomCountdown); // 倒计时秒数
  
  // 添加倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && disSmsSend) {
      setDisSmsSend(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, disSmsSend]);

  useEffect(()=>{
    refPhone.current = phone;
  },[phone])

  const toLogin=()=>{
    navigate("/login",{replace:true})
  }

  /**
   * 发送短信验证码
   * @param captchaVerifyParam 验证码参数
   */
  async function smsSend(captchaVerifyParam: string): Promise<TypeCaptchaRes> {
    setCountdown(60)
    setSendingCode(true);
    setDisSmsSend(true);
    let result = false;
    try {
      const res = await server.SendSmsReset(refPhone.current, captchaVerifyParam);
      const data = res.data;
      if (data.success) {
        window.messageApi.success(data.message);
        setStep(1); // 进入输入验证码步骤
        setCountdown(60); // 设置60秒倒计时
      } else {
        window.messageApi.error(data.message);
        setDisSmsSend(false); // 失败时重置按钮状态
      }
      result = data.success_verify_cap;
    } catch (error) {
      LogError(error);
      window.messageApi.error("发送验证码失败，请稍后重试");
      setDisSmsSend(false); // 错误时重置按钮状态
    } finally {
      setSendingCode(false);
    }
    
    return {
      captchaResult: result,
      bizResult: result
    };
  }

  /**
   * 重置密码
   */
  const resetPassword = async () => {
    if(code.length<4){
      window.messageApi.error("验证码长度应等于4");
      return;
    }
    if (password !== confirmPassword) {
      window.messageApi.error("两次输入的密码不一致");
      return;
    }
    
    if (!/^[a-zA-Z0-9]{6,12}$/.test(password)) {
      window.messageApi.error("密码必须为6-12位数字或字母");
      return;
    }
    
    setLoading(true);
    
    try {
      // 这里应该有一个重置密码的API，暂时模拟成功
      const res = await server.changePassword(phone, code, password);
      if (res.data.success) {
        window.messageApi.success("密码重置成功，请使用新密码登录");
        setTimeout(() => {
          toLogin()
        }, 800);
      } else {
        window.messageApi.error(res.data.message || "密码重置失败");
      }
    } catch (error) {
      LogError(error);
      window.messageApi.error("重置密码失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };
  const FormatErr=useMemo(()=>{
    return !password || !confirmPassword || password !== confirmPassword||code.length<4
  },[password,confirmPassword,code])

  return (
    <div className="reset-password-container">
      <ComBack />
      <Flex vertical justify="center" align="center">
        <h2 className="reset-title">重置密码</h2>
        {step === 0 && (
          <Form form={form} layout="vertical" style={{ width: '100%' }}>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input 
                addonBefore="手机" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入注册时的手机号"
              />
            </Form.Item>
            
            <Form.Item>
              <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                <Button onClick={toLogin}>返回登录</Button>
                <CaptchaA callback={smsSend} buttonId="captcha-button-reset">
                  <Button 
                    type="primary" 
                    id="captcha-button-reset"
                    loading={sendingCode}
                    disabled={disSmsSend||countdown>0 || !/^1[3-9]\d{9}$/.test(phone)}
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : "获取验证码"}
                  </Button>
                </CaptchaA>
              </Flex>
            </Form.Item>
          </Form>
        )}
        
        {step === 1 && (
          <Form layout="vertical" style={{ width: '100%' }}>
            <Form.Item
              label="验证码"
              required
            >
              <InputNumber  
                style={{ width: '100%' }} 
                maxLength={4}
                value={code} 
                onChange={(e) => setCode(e?.toString()||"")}
                placeholder="请输入短信验证码"
              />
            </Form.Item>
          </Form>
        )}
        
        {step === 1 && (
          <Form layout="vertical" style={{ width: '100%' }}>
            <Form.Item
              label="新密码"
              name="password"
              rules={[
                { required: true, message: '6-12位数字或字母' },
                { pattern: /^[a-zA-Z0-9]{6,12}$/, message: '6-12位数字或字母' },
              ]}
            >
              <Input.Password security="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6-12位数字或字母"
              />
            </Form.Item>
            
            <Form.Item
              label="确认密码"
              required
              rules={[
                { required: true, message: '请再次输入新密码' },
                { validator: (_, value) => value === password ? Promise.resolve() : Promise.reject('两次输入的密码不一致') }
              ]}
            >
              <Input.Password security="password"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </Form.Item>
            
            <Form.Item>
              <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                <Button onClick={toLogin}>返回登录</Button>
                <Button 
                  type="primary"
                  danger={FormatErr}
                  onClick={resetPassword}
                  loading={loading}
                >
                  重置密码
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        )}
      </Flex>
    </div>
  );
} 