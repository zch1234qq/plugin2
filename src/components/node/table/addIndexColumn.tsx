import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Switch, Tooltip, InputNumber } from "antd";
import utils, { updateResData } from "../../../common/utils";
import NodeCore0 from "../_node0";
import HandleInputText from "../../HandleInputText";
import HandleOutputText from "../../HandleOutputText";

/**
 * 表格添加序号列节点组件
 * 用于给表格数据添加序号列，可配置起始值和插入位置
 */
export default function AddIndexColumn({id, data}: {id: string, data: NodeData}) {
  // 配置状态
  const [startValue, setStartValue] = useState<number>(1); // 序号起始值
  const [insertAtBeginning, setInsertAtBeginning] = useState<boolean>(true); // 是否在首列插入

  // 使用 ref 在异步操作中保持最新状态
  const startValueRef = useRef(startValue);
  const insertAtBeginningRef = useRef(insertAtBeginning);

  // 同步状态到引用
  useEffect(() => {
    startValueRef.current = startValue;
  }, [startValue]);

  useEffect(() => {
    insertAtBeginningRef.current = insertAtBeginning;
  }, [insertAtBeginning]);

  // 从节点数据初始化配置
  useEffect(() => {
    // 加载起始值
    if (data.values[0]) {
      const parsedValue = parseInt(data.values[0]);
      if (!isNaN(parsedValue)) {
        setStartValue(parsedValue);
        startValueRef.current = parsedValue;
      }
    }
    
    // 加载插入位置
    if (data.values[2]) {
      const insertFirst = data.values[2] === "true";
      setInsertAtBeginning(insertFirst);
      insertAtBeginningRef.current = insertFirst;
    }
  }, [data.values]);

  // 更新起始值
  const handleStartValueChange = (value: number | null) => {
    if (value !== null) {
      setStartValue(value);
      data.values[0] = value.toString();
      startValueRef.current = value;
    }
  };

  // 更新插入位置
  const handlePositionChange = (checked: boolean) => {
    setInsertAtBeginning(checked);
    data.values[2] = checked.toString();
    insertAtBeginningRef.current = checked;
  };

  /**
   * 解析CSV字符串为二维数组
   */
  function parseCSV(csvText: string): string[][] {
    if (!csvText || typeof csvText !== 'string') {
      return [];
    }

    const lines = csvText.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row: string[] = [];
      let field = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            // 双引号转义
            field += '"';
            i++;
          } else {
            // 切换引号状态
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // 字段分隔符
          row.push(field);
          field = '';
        } else {
          field += char;
        }
      }
      
      // 添加最后一个字段
      row.push(field);
      result.push(row);
    }
    
    return result;
  }

  /**
   * 将二维数组转换回CSV格式
   */
  function arrayToCSV(data: (string | number)[][]): string {
    return data.map(row => {
      return row.map(cell => {
        // 确保cell是字符串类型
        const cellStr = String(cell);
        
        // 检查是否需要引号
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          // 转义引号
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
    }).join('\n');
  }

  /**
   * 处理输入数据
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success || !input.msg) {
      return input;
    }

    try {
      // 解析CSV
      const tableData = parseCSV(input.msg);
      if (tableData.length === 0) {
        return updateResData(input,{
          success: false,
          msg: "输入表格为空或格式不正确"
        });
      }

      // 配置信息
      const start = startValueRef.current;
      const insertFirst = insertAtBeginningRef.current;
      
      // 添加序号列
      const result: (string | number)[][] = tableData.map((row, rowIndex) => {
        // 所有行都直接使用序号，包括表头行
        const indexValue = (start + rowIndex).toString();
        
        if (insertFirst) {
          // 在开头插入序号列
          return [indexValue, ...row];
        } else {
          // 在末尾插入序号列
          return [...row, indexValue];
        }
      });
      
      // 转换回CSV字符串
      const resultCSV = arrayToCSV(result);
      return updateResData(input,{
        success: true,
        msgtypeRe:"excel",
        msg: resultCSV
      });
    } catch (error) {
      utils.log(`表格添加序号列处理错误: ${error}`);
      return updateResData(input,{
        success: false,
        msg: `处理出错: ${error}`
      });
    }
  }

  return (
    <NodeCore0
      data={data} 
      id={id} 
      run0={run} 
      handles={[0, -1]}
      width={100}
    >
      <HandleInputText tip="输入表格(csv)" />
      <HandleOutputText tip="输出表格(csv)" />
    </NodeCore0>
  );
} 