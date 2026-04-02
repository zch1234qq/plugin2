import axios from 'axios';

import { createStore } from 'jotai';
import { tokenState } from './store/store';
import utils from './utils';

const instance = axios.create({
  baseURL: 'http://117.50.85.92:81/gateway/session',
  timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    try {
      const store=createStore();
      let token =store.get(tokenState);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; // 通常使用 Bearer Token
      }
      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => {
    // 统一处理错误
    if (error.response) {
      // 服务端返回了错误响应（状态码非 2xx）
      const { status, data } = error.response;
      console.error('[HTTP 错误] 状态码:', status);
      console.error('[服务端错误码]:', data.code);
      console.error('[错误消息]:', data.message);
    } else if (error.request) {
      // 请求已发出，但没有收到响应（如网络错误）
      console.error('[网络错误]:', error.message);
    } else {
      // 其他错误（如配置错误）
      console.error('[请求错误]:', error.message);
    }

    // 将错误继续抛出，以便后续处理（如组件中的 catch）
    return Promise.reject(error);
  }

);

// 添加响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response) {
      // 服务器返回了错误状态码（4xx 或 5xx）
      console.error('响应错误:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('请求错误:', error.request);
    } else {
      // 其他错误
      console.error('错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export function LogError(error:any) {
  try {
    if (error.response) {
      utils.log('错误状态码:', error.response.status);
      utils.log('错误响应数据:', error.response.data);
      utils.log('错误响应头:', error.response.headers);
    } else if (error.request) {
        utils.log('未收到响应，请求信息:', error.request);
    } else {
        utils.log('请求配置错误:', error.message);
    }
    // if (error && typeof error.toJSON === 'function') {
    //     utils.log('完整错误对象:', error.toJSON());
    // } else {
    //     utils.log('完整错误对象:', error);
    // }
  } catch (error) {
    utils.log(error);
  }
}