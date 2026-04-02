import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Switch, Tooltip, Typography, theme as antdTheme } from "antd";
import utils, { updateResData } from "../../../common/utils";
import NodeCore0 from "../_node0";
import HandleInputText from "../../HandleInputText";
import HandleOutputText from "../../HandleOutputText";

/**
 * CSV-JSON转换节点组件
 * 用于在CSV和JSON格式之间相互转换
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} CSV-JSON转换节点组件
 */
export default function CsvJsonConverter({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  const [convertMode, setConvertMode] = useState<'csv2json' | 'json2csv'>('csv2json'); // 默认为CSV转JSON模式
  const convertModeRef = useRef(convertMode);
  
  // 同步状态到引用
  useEffect(() => {
    convertModeRef.current = convertMode;
  }, [convertMode]);
  
  // 初始化数据
  useEffect(() => {
    // 从节点数据中加载保存的值
    if (data.values[0]) {
      if (data.values[0] === 'csv2json' || data.values[0] === 'json2csv') {
        setConvertMode(data.values[0]);
        convertModeRef.current = data.values[0];
      }
    }
  }, [data.values]);
  
  /**
   * 处理转换模式变更
   * @param {boolean} checked - 是否选中JSON转CSV模式
   */
  const handleModeChange = (checked: boolean) => {
    const newMode = checked ? 'json2csv' : 'csv2json';
    setConvertMode(newMode);
    convertModeRef.current = newMode;
    data.values[0] = newMode;
  };
  
  /**
   * 解析CSV文本为二维数组
   * @param {string} text - CSV文本内容
   * @returns {string[][]} 解析后的CSV数据数组
   */
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = i < text.length - 1 ? text[i + 1] : '';
      if (char === '"' && (inQuotes && nextChar === '"')) {
        // 处理双引号转义
        currentField += '"';
        i++; // 跳过下一个引号
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        if (char === '\r') i++; // 跳过\r\n中的\n
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    // 处理最后一个字段和行
    if (currentField !== '' || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }
    return rows;
  };

  /**
   * 将CSV数组转换为JSON
   * @param {string[][]} csvData - CSV数据数组
   * @returns {Object[]} 转换后的JSON对象数组
   */
  const csvToJson = (csvData: string[][]): any[] => {
    if (csvData.length < 2) return [];
    
    const headers = csvData[0];
    const result: any[] = [];
    
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      const obj: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        if (j < row.length) {
          obj[headers[j]] = row[j];
        } else {
          obj[headers[j]] = "";
        }
      }
      
      result.push(obj);
    }
    
    return result;
  };

  /**
   * 将JSON对象数组转换为CSV
   * @param {Object[]} jsonData - JSON对象数组
   * @returns {string} 转换后的CSV字符串
   */
  const jsonToCsv = (jsonData: any[]): string => {
    if (!Array.isArray(jsonData) || jsonData.length === 0) return '';
    
    // 收集所有可能的列头
    const headers = new Set<string>();
    jsonData.forEach(item => {
      Object.keys(item).forEach(key => headers.add(key));
    });
    const headerArr = Array.from(headers);
    
    // 创建CSV行
    const csvRows: string[] = [];
    csvRows.push(headerArr.map(header => escapeCSV(header)).join(','));
    
    jsonData.forEach(item => {
      const values = headerArr.map(header => {
        const value = item[header] !== undefined ? item[header] : '';
        return escapeCSV(String(value));
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  /**
   * 转义CSV字段
   * @param {string} value - 字段值
   * @returns {string} 转义后的字段值
   */
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  /**
   * 执行格式转换操作
   * @param {Res} input - 输入数据
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    
    try {
      const inputText = input.msg;
      if (typeof inputText !== 'string') {
        return updateResData(input,{
          success: false,
          msg: "输入不是有效的字符串"
        });
      }
      
      const mode = convertModeRef.current;
      let result: string;
      if (mode === 'csv2json') {
        // CSV转JSON
        if(inputText==""){
          return updateResData(input,{
            success: true,
            msgtypeRe:"excel",
            msg: "[{}]",
            datas: input.datas
          })
        }
        try {
          const csvData = parseCSV(inputText);
          if (csvData.length === 0) {
            return updateResData(input,{
              success: false,
              msg: "CSV数据为空或格式不正确"
            });
          }
          
          const jsonResult = csvToJson(csvData);
          result = JSON.stringify(jsonResult, null, 2);
        } catch (err) {
          return updateResData(input,{
            success: false,
            msg: `CSV解析错误: ${err}`
          });
        }
      } else {
        // JSON转CSV
        try {
          const jsonData = JSON.parse(inputText);
          if (!Array.isArray(jsonData)) {
            // 尝试包装非数组JSON为数组
            const wrappedJson = [jsonData];
            result = jsonToCsv(wrappedJson);
          } else {
            result = jsonToCsv(jsonData);
          }
          
          if (!result) {
            return updateResData(input,{
              success: false,
              msg: "JSON数据为空或格式不正确"
            });
          }
        } catch (err) {
          return updateResData(input,{
            success: false,
            msg: `JSON解析错误: ${err}`
          });
        }
      }
      
      utils.log(`格式转换 - 模式: ${mode}, 成功`);
      return updateResData(input,{
        success: true,
        msgtypeRe:"excel",
        msg: result,
        datas: input.datas
      });
    } catch (error) {
      utils.log(`格式转换处理错误: ${error}`);
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
      <HandleInputText tip={convertMode === 'csv2json' ? "输入CSV数据" : "输入JSON数据"} />
      <HandleOutputText tip={convertMode === 'csv2json' ? "输出JSON数据" : "输出CSV数据"} />
      <Tooltip title={`点击切换至${convertMode === 'csv2json' ? '表格' : 'AI'}格式`}>
        <Flex vertical align="center" gap={5}>
          <Switch
            checked={convertMode === 'json2csv'}
            onChange={(checked: boolean) => handleModeChange(checked)}
          />
          <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
            {convertMode === 'csv2json' ? 'AI' : '表格'}格式
          </Typography.Text>
        </Flex>
      </Tooltip>
    </NodeCore0>
  );
} 