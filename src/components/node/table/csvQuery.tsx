import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore2Top from "../_node2top";
import ComNodeInput from "../../ComNodeInput";
import { updateResData } from "../../../common/utils";

/**
 * CSV查询节点组件
 * 用于根据指定表头查询CSV数据
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} CSV查询节点组件
 */
export default function CsvQuery({id, data}: {id: string, data: NodeData}) {
  const [headerName, setHeaderName] = useState("");
  const headerNameRef = useRef(headerName);

  // 同步状态到ref
  useEffect(() => {
    headerNameRef.current = headerName;
  }, [headerName]);

  // 初始化从data加载值
  useEffect(() => {
    if (data.values[0]) {
      setHeaderName(data.values[0]);
    } else {
      data.values[0] = headerName;
    }
  }, [data.values, headerName]);

  /**
   * 解析CSV字符串为二维数组
   * @param {string} csvString - CSV字符串
   * @returns {string[][]} 解析后的二维数组
   */
  const parseCSV = (csvString: string): string[][] => {
    if (!csvString) return [];
    
    // 将CSV拆分为行，保留空行
    const lines = csvString.split('\n');
    
    // 解析每一行
    return lines.map(line => {
      const result: string[] = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // 添加最后一个值
      result.push(currentValue);
      return result;
    });
  };

  /**
   * 执行CSV查询
   * @param {Res} input0 - CSV数据输入
   * @param {Res} input1 - 查询值输入
   * @returns {Promise<Res>} 查询结果
   */
  async function run(input0: Res, input1: Res): Promise<Res> {
    // 检查输入是否有效
    if (!input0.success || !input1.success) {
      return updateResData(input0,{ 
        success: false, 
        msg: "输入数据无效" 
      }); 
    }

    const csvData = input0.msg;
    const queryValue = input1.msg.trim();
    const header = headerNameRef.current.trim();

    if (!header) {
      return updateResData(input0,{
        success: false,
        msg: "请设置要查询的表头"
      }); 
    }

    try {
      // 解析CSV数据
      const parsedData = parseCSV(csvData);
      
      if (parsedData.length < 2) {
        return updateResData(input0,{
          success: false,
          msg: "CSV数据格式不正确或数据不足"
        }); 
      }

      // 获取表头行
      const headers = parsedData[0];
      
      // 查找要查询的列索引
      const columnIndex = headers.findIndex(
        h => h.trim().toLowerCase() === header.toLowerCase()
      );
      
      if (columnIndex === -1) {
        return updateResData(input0,{
          success: false,
          msg: `未找到表头 "${header}"`
        }); 
      }

      // 在数据中查找匹配的行
      const matchingRows = parsedData.slice(1).filter(row => 
        row[columnIndex]?.trim().toLowerCase() === queryValue.toLowerCase()
      );

      if (matchingRows.length === 0) {
        return updateResData(input0,{
          // success: false,
          // msg: `未找到 ${header}="${queryValue}" 的数据`
          ...input0,
          success: true,
          msgtypeRe:"excel",
          msg: "",
          datas: input0.datas
        }); 
      }

      // 将匹配的行转换为CSV格式
      const resultCsv = [headers, ...matchingRows]
        .map(row => row.join(","))
        .join("\n");

      return updateResData(input0,{
        success: true,
        msg: resultCsv,
        msgtypeRe:"excel",
        datas: input0.datas
      }); 
    } catch (error) {
      console.error("CSV查询错误:", error);
      return updateResData(input0,{
        success: false,
        msg: `查询过程中发生错误: ${error}`
      });
    }
  }

  /**
   * 处理表头输入变更
   * @param {string} value - 新的表头值
   */
  const handleHeaderChange = (value: string) => {
    setHeaderName(value);
    data.values[0] = value;
  };

  return (
    <div>
      <NodeCore2Top 
        run={run} 
        id={id} 
        data={data}
        width={100}
      >
        <ComNodeInput
          value={headerName}
          onChange={handleHeaderChange}
          placeholder="输入要查询的表头"
        />
      </NodeCore2Top>
    </div>
  );
}