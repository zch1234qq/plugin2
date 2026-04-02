import { Button, Flex, Image, Typography, theme as antTheme } from 'antd'
import './globals.css'
import { tokenState } from '../common/store/store';
import { useAtom } from 'jotai';
import { useState, useCallback, memo } from 'react';
import { useEffect } from 'react';
import ComCusSvc from '../components/ComCusSvc';
import Storage from '../common/Storage';
import { useTheme } from '../common/theme/themeContext';
import { useCustomNavigate } from '../common/hooks/useCustomNavigate';
import config from '../common/config/config';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ComAccountId from '../components/ComAccountId';
import { ComConnectSvc0 } from '../components/ComConnectSvc0';
// import ComTip0 from '../components/ComTip0';
import ComTip1 from '../components/ComTip1';
import ImgXCX from '../assets/xcx.jpg' 

const Footer = memo(() => {
  const { token } = antTheme.useToken();

  return (
    <footer style={{ width: "100%",position:"fixed",bottom:0 }}>
      <Flex justify='space-between' style={{ width: "100%", padding: "0 8px" }}>
        {/* <Typography.Text type="secondary">辽公备21110202001008</Typography.Text> */}
        <Typography.Text type="secondary" style={{userSelect:"none"}}>v{config.version}</Typography.Text>
        {/* <Typography.Link
          href="https://beian.miit.gov.cn/"
          target="_blank"
          style={{ color: token.colorTextSecondary }}
        >
          辽ICP备2024038272号-5
        </Typography.Link> */}
      </Flex>
    </footer>
  );
});

const Left = memo(() => {
  const router = useCustomNavigate();
  const [token, setToken] = useAtom(tokenState);
  const { token: antdToken } = antTheme.useToken();
  const handleLogout = useCallback(() => {
    setToken("")
    Storage.clearAll()
    window.messageApi.success("退出成功")
  }, [setToken]);
  
  const handleLogin = useCallback(() => {
    router("/login");
  }, [router]);
  
  return (
    <Flex gap="small">
      {token === "" ? (
        <div className='headeritem' style={{color: antdToken.colorText, fontSize: antdToken.fontSizeXL}} onClick={handleLogin}>注册/登录</div>
      ) : (
        <div className='headeritem' style={{color: antdToken.colorText, fontSize: antdToken.fontSizeXL}} onClick={handleLogout}>退出登录</div>
      )}
    </Flex>
  );
});

// 右侧导航组件
const Right = memo(() => {
  return (
    <Flex gap='small'>
      <HeaderItem type="local" title="资源点" to="/plan" />
      <HeaderItem type="link" title="视频" to="https://space.bilibili.com/678279553/lists/6050347?type=season" />
      <HeaderItem type="local" title="文档" to="/doc" />
      {/* <HeaderItem title="下载" to="/download" /> */}
    </Flex>
  );
});
const FloatingQRButton = memo(() => (
  <ComCusSvc/>
));
const SecurityImage = memo(() => (
  <div style={{
    position: 'fixed',
    left: '10px',
    bottom: '20px', // 恢复到底部位置
    zIndex: 10,
    width: '200px', // 进一步减小尺寸
    maxWidth: '29%',
    height: 'auto',
    opacity: 0.85,
    // pointerEvents: 'none' // 确保不拦截点击
  }}>
    <Image 
      src={ImgXCX} 
      alt="网络安全" 
      preview={false}
      style={{
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        objectFit: 'cover',
        // pointerEvents: 'none'
      }}
    />
  </div>
));

export default function Home() {
  const router = useCustomNavigate();
  const [loadingToUse, setLoadingToUse] = useState(false);
  const { theme } = useTheme();
  const { token: antdToken } = antTheme.useToken();
  const [token] = useAtom(tokenState);

  const navigateWithFallback = useCallback((targetPath: string) => {
    // 直接使用 React Router 的导航，让它自己处理 hash 更新
    // 这样不会产生额外的历史记录条目
    try {
      router(targetPath);
    } catch (err) {
      console.warn("[nav] router failed", err);
      // 如果 React Router 导航失败，尝试直接设置 hash 作为兜底方案
      const expectedHash = "#" + (targetPath.startsWith("/") ? targetPath : `/${targetPath}`);
      window.location.hash = expectedHash;
    }
  }, [router]);
  
  // 使用 useCallback 优化事件处理函数
  const handleUseClick = useCallback(() => {
    setLoadingToUse(true);
    
    const targetPath = token ? "/table" : "/login?next=/table";
    navigateWithFallback(targetPath);
  }, [token, navigateWithFallback]);

  const handleEnterToUse = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter" || e.defaultPrevented || e.isComposing || e.repeat) return;
    if (loadingToUse) return;

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "textarea" || tag === "input" || target?.isContentEditable) return;

    e.preventDefault();
    handleUseClick();
  }, [handleUseClick, loadingToUse]);

  useEffect(() => {
    window.addEventListener("keydown", handleEnterToUse);
    return () => window.removeEventListener("keydown", handleEnterToUse);
  }, [handleEnterToUse]);
  
  return (
    <Flex justify='center' align='center' style={{ width: "100%",height: "100vh",
      backgroundColor:theme=="dark"?"#141414":"#fff" }} vertical>
      <Header/>
      {/* <FloatingQRButton /> */}
      {/* <SecurityImage /> */}
      <Flex justify='space-between' align='center' vertical style={{width:"100%",height:"65%"}} gap="middle">
        <Title/>
        {/* <ComTip0 /> */}
        <ComTip1 />
        <Flex gap="small" align='center' vertical>
          <Button 
            loading={loadingToUse} 
            onClick={handleUseClick}
            size='large' 
            type='primary'
            style={{
              width: '100%',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            立即使用
          </Button>
          <ComConnectSvc0
            content="人工客服"
            color={antdToken.colorTextSecondary}
            fontsize={antdToken.fontSizeLG}
            underline={false}
          ></ComConnectSvc0>
        </Flex>
      </Flex>
      <Footer />
    </Flex>
  );
}

function HeaderItem({type="local",title,to}:{type:string,title:string,to:string}){
  const {theme}=useTheme()
  const { token } = antTheme.useToken();
  const navigate=useCustomNavigate()
  return(
    <div 
        className='headeritem' 
        onClick={() =>{
          if(type==="local"){
            navigate(to)
          }else{
            window.open(to, "_blank")
          }
        }} 
        style={{
          color: theme === "dark" ? "#fff" : "#000",
          cursor: 'pointer',  // 添加鼠标指针样式
          fontSize: token.fontSizeXL,
        }}
      >
        {title}
      </div>
  )
}



function Header(){
  const {theme}=useTheme()
  return(
    <Flex 
      justify='space-between' 
      align='center' 
      gap="middle" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: "100%", 
        backgroundColor: theme === 'dark' ? 'gray' : 'lightgray',
        padding: '0 5px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{position:"absolute",top:"100%",left:0,zIndex:1000}}>
        <ComAccountId/>
      </div>
      <Left />
      <Right />
      <div style={{backgroundColor:"#000",position:"absolute",top:"100%",right:0,zIndex:1000}}>
        <ThemeSwitcher></ThemeSwitcher>
      </div>
    </Flex>
  )
}
// 提取标题组件
function Title(){
  const { theme } = useTheme();
  const { token } = antTheme.useToken();
  return (
    <Flex className="ding" justify='center' style={{ flexWrap: "wrap", fontFamily: "DingTalk" }} align='end'>
      <Flex vertical style={{width:"100%",alignItems:"center",userSelect:"none"}}>
        <Typography.Text
          // level={5}
          style={{
            width:"100%",
            margin: 0,
            textAlign:"center",
            color:theme=="dark"?"#fff":"#000",
            fontFamily: "DingTalk",
            fontSize: `clamp(${token.fontSizeLG * 2}px, 5vw, ${token.fontSizeLG * 3}px)`,
          }}
        >
          智能提取图片信息，就用
          <span style={{ color: token.colorError }}>aditor</span>
        </Typography.Text>
      </Flex>
    </Flex>
  );
}