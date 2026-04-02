import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Switch, Tooltip, Input, Typography, theme as antdTheme } from "antd";
import utils, { updateResData } from "../../../common/utils";
import NodeCore0 from "../_node0";
import HandleInputText from "../../HandleInputText";
import HandleOutputText from "../../HandleOutputText";

/**
 * CSV添加序号列节点组件
 * 用于给CSV表格添加一个序号列，可指定列标题和起始序号
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} CSV添加序号列节点组件
 */
export default function CsvAddIndex({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  const [startIndex, setStartIndex] = useState<number>(1); // 起始序号，默认为1
  const [columnTitle, setColumnTitle] = useState<string>("序号"); // 序号列的标题
  const [addToStart, setAddToStart] = useState<boolean>(true); // 是否在开头添加序号列，默认为true
  
  const startIndexRef = useRef(startIndex);
  const columnTitleRef = useRef(columnTitle);
  const addToStartRef = useRef(addToStart);
  
  // 同步状态到引用
  useEffect(() => {
    startIndexRef.current = startIndex;
  }, [startIndex]);
  
  useEffect(() => {
    columnTitleRef.current = columnTitle;
  }, [columnTitle]);
  
  useEffect(() => {
    addToStartRef.current = addToStart;
  }, [addToStart]);
  
  // 初始化数据
  useEffect(() => {
    // 从节点数据中加载保存的值
    if (data.values[0]) {
      const savedStartIndex = parseInt(data.values[0]);
      if (!isNaN(savedStartIndex)) {
        setStartIndex(savedStartIndex);
        startIndexRef.current = savedStartIndex;
      }
    }
    
    if (data.values[1]) {
      setColumnTitle(data.values[1]);
      columnTitleRef.current = data.values[1];
    }
    
    if (data.values[2]) {
      const isAddToStart = data.values[2] === "true";
      setAddToStart(isAddToStart);
      addToStartRef.current = isAddToStart;
    }
  }, [data.values]);
  
  /**
   * 处理起始序号变更
   * @param {string} value - 新的起始序号值
   */
  const handleStartIndexChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      setStartIndex(num);
      data.values[0] = num.toString();
      startIndexRef.current = num;
    }
  };
  
  /**
   * 处理列标题变更
   * @param {string} value - 新的列标题
   */
  const handleColumnTitleChange = (value: string) => {
    setColumnTitle(value);
    data.values[1] = value;
    columnTitleRef.current = value;
  };
  
  /**
   * 处理添加位置变更
   * @param {boolean} checked - 是否在开头添加
   */
  const handlePositionChange = (checked: boolean) => {
    setAddToStart(checked);
    data.values[2] = checked.toString();
    addToStartRef.current = checked;
  };
  
  /**
   * 解析CSV行
   * @param {string} line - CSV行字符串
   * @returns {string[]} 解析后的字段数组
   */
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // 处理双引号转义
          currentValue += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // 遇到分隔符且不在引号内，添加当前值并重置
        result.push(currentValue);
        currentValue = '';
      } else {
        // 普通字符，添加到当前值
        currentValue += char;
      }
    }
    
    // 添加最后一个值
    result.push(currentValue);
    return result;
  }
  
  /**
   * 执行添加序号列的操作
   * @param {Res} input - 输入的CSV数据
   * @returns {Promise<Res>} 处理后的CSV数据
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    try {
      const csvString = input.msg;
      if (csvString === "") {
        return updateResData(input,{
          success: true,
          msgtypeRe:"excel",
          msg: "",
        })
      }
      if (typeof csvString !== 'string') {

        return updateResData(input,{
          success: false,
          msg: "输入不是有效的CSV字符串"
        });
      }
      
      // 解析CSV
      const rows = csvString.split('\n').map(line => 
        parseCSVLine(line)
      );
      
      if (rows.length === 0) {
        return updateResData(input,{
          success: false,
          msg: "CSV数据为空"
        });     
      }
      
      const isAddToStart = addToStartRef.current;
      const title = columnTitleRef.current;
      const start = startIndexRef.current;
      
      // 添加序号列
      const resultRows = rows.map((row, rowIndex) => {
        // 第一行是表头，添加列标题
        const indexValue = rowIndex === 0 ? title : (rowIndex + start - 1).toString();
        
        if (isAddToStart) {
          return [indexValue, ...row];
        } else {
          return [...row, indexValue];
        }
      });
      
      // 转换回CSV字符串
      const resultCSV = resultRows.map(row => {
        return row.map(cell => {
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            // 将单元格中的引号替换为两个引号
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',');
      }).join('\n');
      
      return updateResData(input,{
        success: true,
        msgtypeRe:"excel",
        msg: resultCSV
      });
    } catch (error) {
      utils.log(`CSV添加序号处理错误: ${error}`);
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
      width={120}
    >
      <HandleInputText tip="输入表格(csv)" />
      <HandleOutputText tip="输出表格(csv)" />
      <Flex vertical gap={5}>
        <Tooltip title="序号列标题">
          <Input
            placeholder="序号列标题"
            value={columnTitle}
            onChange={(e) => handleColumnTitleChange(e.target.value)}
            style={{ width: '100%' }}
          />
        </Tooltip>
        <Tooltip title="起始序号">
          <Input
            placeholder="起始序号"
            value={startIndex.toString()}
            onChange={(e) => handleStartIndexChange(e.target.value)}
            style={{ width: '100%' }}
            type="number"
          />
        </Tooltip>
        <Tooltip title="序号列位置">
          <Flex align="center" justify="space-between">
            <Switch
              checked={addToStart} 
              onChange={handlePositionChange}
            />
            <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {addToStart ? '开头添加' : '末尾添加'}
            </Typography.Text>
          </Flex>
        </Tooltip>
      </Flex>
    </NodeCore0>
  );
} 