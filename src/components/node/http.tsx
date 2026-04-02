import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { NodeData, Res } from "../../common/types/types";
import './style.css';
import NodeCore1 from "./_node1";

export default function Http({id, data}: {id: string, data: NodeData}) {
  const [updateFlag, setUpdateFlag] = useState(false);
  const [method, setMethod] = useState("GET"); // 默认GET方法
  const [requestBody, setRequestBody] = useState(""); // 用于POST/PUT的请求体
  const requestBodyRef = useRef(requestBody);
  const [isOpen, setIsOpen] = useState(false); // 控制下拉菜单状态
  const selectRef = useRef<HTMLDivElement>(null);
  
  // 为Select创建一个容器，确保它在ReactFlow之外渲染
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
    let bodyToSend = requestBodyRef.current; // 使用ref中的值
    
    try {
      // 尝试解析输入是否为JSON对象
      try {
        const inputObj = JSON.parse(input.msg);
        if (inputObj.url) {
          url = inputObj.url;
          if (inputObj.body) bodyToSend = JSON.stringify(inputObj.body);
          if (inputObj.method) setMethod(inputObj.method.toUpperCase());
        }
      } catch (e) {
        // 如果不是JSON，就视为纯URL
        url = input.msg;
      }
      
      let response;
      switch (method) {
        case "GET":
          response = await axios.get(url);
          break;
        case "POST":
          let postData;
          try {
            postData = JSON.parse(bodyToSend);
          } catch (e) {
            postData = bodyToSend; // 如果不是有效JSON，使用原始文本
          }
          response = await axios.post(url, postData);
          break;
        case "PUT":
          let putData;
          try {
            putData = JSON.parse(bodyToSend);
          } catch (e) {
            putData = bodyToSend;
          }
          response = await axios.put(url, putData);
          break;
        case "DELETE":
          response = await axios.delete(url);
          break;
        case "PATCH":
          let patchData;
          try {
            patchData = JSON.parse(bodyToSend);
          } catch (e) {
            patchData = bodyToSend;
          }
          response = await axios.patch(url, patchData);
          break;
        default:
          response = await axios.get(url);
      }
      
      result.msg = JSON.stringify(response.data);
      result.msgtypeRe="text"
      result.success = true;
    } catch (error: any) {
      result.success = false;
      result.msg = error.message || "请求失败";
    }
    
    return result;
  }

  // 自定义方法点击处理函数
  const handleMethodSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // 选择方法处理函数
  const selectMethod = (value: string) => {
    setMethod(value);
    setIsOpen(false);
    setUpdateFlag(!updateFlag);
  };

  return (
    <NodeCore1
      placeholder="请输入JSON数据"
      data={data}
      handles={[1,1]}
      colors={[0,0]}
      tips={["输出响应", "输入地址"]}
      run0={run}
      id={id}
      v0={requestBody}
      setV0={setRequestBody}
      v0Ref={requestBodyRef}
    >
      {/* 使用更高的 z-index 并阻止所有事件冒泡 */}
      <div 
        ref={selectRef}
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ 
          width: '100%', 
          marginBottom: '5px', 
          position: 'relative', 
          zIndex: 1000 
        }}
      >
        {/* 替换Select组件为自定义下拉菜单 */}
        <div 
          className="custom-select" 
          onClick={handleMethodSelect}
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '2px',
            padding: '4px 11px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{method}</span>
          <span 
            style={{
              transition: 'transform 0.3s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              fontSize: '12px',
              color: '#999'
            }}
          >
            ▼
          </span>
        </div>
        
        {isOpen && (
          <div 
            className="custom-select-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              zIndex: 2000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(option => (
              <div 
                key={option}
                className="custom-select-option"
                onClick={(e) => {
                  e.stopPropagation();
                  selectMethod(option);
                }}
                style={{
                  padding: '5px 12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  backgroundColor: method === option ? '#f5f5f5' : 'transparent'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = method === option ? '#f5f5f5' : 'transparent';
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeCore1>
  )
}