import { useNavigate, NavigateOptions } from 'react-router-dom';
import { useAtom } from 'jotai'; // 以 Jotai 为例，可替换为其他状态管理
import {  tokenState } from './store/store';

// 封装的高阶导航 Hook
export const useAuthNavigate = () => {
  const navigate = useNavigate();
  const [token,_] = useAtom(tokenState); // 获取登录状态
  const authNavigate = (page:string, options?: NavigateOptions) => {
    if (token=="") {
      navigate('/login?next='+page, {
        replace:true,
        state:{
          from:"/"
        }
      });
      return;
    }
    navigate(page, options);
  };
  return authNavigate;
};