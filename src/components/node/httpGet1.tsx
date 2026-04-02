import Shell from "./shell1";
import { useState } from "react";
import axios from "axios";
import utils from "../../common/utils";
import { NodeData, Res } from "../../common/types/types";
import './style.css';
import { Select, Input } from 'antd';
import HandleInputText from "../HandleInputText";
import HandleOutputText from "../HandleOutputText";

/**
 * HTTP请求节点组件
 * 支持多种HTTP方法的请求发送
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} HTTP请求节点组件
 */
export default function HttpRequest({id, data}: {id: string, data: NodeData}) {
  const [updateFlag, setUpdateFlag] = useState(false);
  const [method, setMethod] = useState("GET"); // 默认GET方法
  const [requestBody, setRequestBody] = useState(""); // 用于POST/PUT的请求体
  const [headers, setHeaders] = useState("{}"); // 用于自定义请求头

  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0": run
  };

  /**
   * 执行HTTP请求
   * @param {Res} input - 输入结果，URL或包含请求信息的JSON
   * @returns {Promise<Res>} 请求结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    
    let result: Res = {success: true, msg: ""} as Res;
    let url = input.msg;
    let requestConfig = {};
    let bodyToSend = requestBody; // 使用组件状态中的值
    
    try {
      // 尝试解析输入是否为JSON对象，包含更多请求信息
      try {
        const inputObj = JSON.parse(input.msg);
        if (inputObj.url) {
          url = inputObj.url;
          // 使用输入中的其他参数（如果有）
          if (inputObj.body) bodyToSend = JSON.stringify(inputObj.body);
          if (inputObj.method) setMethod(inputObj.method.toUpperCase());
        }
      } catch (e) {
        // 如果不是JSON，就视为纯URL
        url = input.msg;
      }
      
      // 准备请求头
      let headersObj = {};
      try {
        headersObj = JSON.parse(headers);
      } catch (e) {
        console.warn("无效的请求头JSON格式");
      }
      
      // 准备请求配置
      requestConfig = {
        headers: headersObj
      };
      
      // 根据不同方法发送请求
      let response;
      switch (method) {
        case "GET":
          response = await axios.get(url, requestConfig);
          break;
        case "POST":
          let postData;
          try {
            postData = JSON.parse(bodyToSend);
          } catch (e) {
            postData = bodyToSend; // 如果不是有效JSON，使用原始文本
          }
          response = await axios.post(url, postData, requestConfig);
          break;
        case "PUT":
          let putData;
          try {
            putData = JSON.parse(bodyToSend);
          } catch (e) {
            putData = bodyToSend;
          }
          response = await axios.put(url, putData, requestConfig);
          break;
        case "DELETE":
          response = await axios.delete(url, requestConfig);
          break;
        case "PATCH":
          let patchData;
          try {
            patchData = JSON.parse(bodyToSend);
          } catch (e) {
            patchData = bodyToSend;
          }
          response = await axios.patch(url, patchData, requestConfig);
          break;
        default:
          response = await axios.get(url, requestConfig);
      }
      
      result.msg = JSON.stringify(response.data);
      result.success = true;
    } catch (error: any) {
      result.success = false;
      result.msg = error.message || "请求失败";
    }
    
    return result;
  }

  function onClick() {
    utils.log(id);
  }

  return (
    <Shell data={data} updateFlag={updateFlag} id={id} runs={runs} onClick={onClick}>
      <div style={{ padding: "5px" }}>
        <Select 
          value={method}
          onChange={(value) => {
            setMethod(value);
            setUpdateFlag(!updateFlag);
          }}
          style={{ width: '100%', marginBottom: '5px' }}
          options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
            { value: 'PATCH', label: 'PATCH' }
          ]}
        />
        
        {/* 只为需要请求体的方法显示输入框 */}
        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <Input.TextArea 
            placeholder="请求体 (JSON格式)"
            value={requestBody}
            onChange={(e) => {
              setRequestBody(e.target.value);
              setUpdateFlag(!updateFlag);
            }}
            style={{ marginBottom: '5px' }}
            rows={2}
          />
        )}
        
        <Input.TextArea 
          placeholder="请求头 (JSON格式)"
          value={headers}
          onChange={(e) => {
            setHeaders(e.target.value);
            setUpdateFlag(!updateFlag);
          }}
          style={{ marginBottom: '5px' }}
          rows={2}
        />
      </div>
      
      <HandleInputText />
      <HandleOutputText />
    </Shell>
  )
}