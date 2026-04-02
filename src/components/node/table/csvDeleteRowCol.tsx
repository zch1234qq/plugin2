import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Switch, Tooltip, Typography, theme as antdTheme } from "antd";
import utils, { updateResData } from "../../../common/utils";
import ComNodeInputNumber from "../../ComNodeInputNumber";
import NodeCore0 from "../_node0";
import HandleInputText from "../../HandleInputText";
import HandleOutputText from "../../HandleOutputText";
/**
 * CSV行列删除节点组件
 * 用于删除CSV数据的指定行或列
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} CSV行列删除节点组件
 */
export default function CsvDeleteRowCol({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  const [deleteMode, setDeleteMode] = useState<'row' | 'column'>('row'); // 默认为删除行模式
  const [indexToDelete, setIndexToDelete] = useState<number>(1); // 要删除的行/列索引
  const indexToDeleteRef = useRef(indexToDelete);
  const deleteModeRef = useRef(deleteMode);
  
  // 同步状态到引用
  useEffect(() => {
    indexToDeleteRef.current = indexToDelete;
  }, [indexToDelete]);
  
  useEffect(() => {
    deleteModeRef.current = deleteMode;
  }, [deleteMode]);
  
  // 初始化数据
  useEffect(() => {
    // 从节点数据中加载保存的值
    if (data.values[0]) {
      if (data.values[0] === 'row' || data.values[0] === 'column') {
        setDeleteMode(data.values[0]);
        deleteModeRef.current = data.values[0];
      }
    }
    if (data.values[1]) {
      const savedIndex = parseInt(data.values[1]);
      if (!isNaN(savedIndex) && savedIndex >= 0) {
        setIndexToDelete(savedIndex);
        indexToDeleteRef.current = savedIndex;
      }
    }
  }, [data.values]);
  
  /**
   * 处理删除模式变更
   * @param {boolean} checked - 是否选中列删除模式
   */
  const handleModeChange = (checked: boolean) => {
    const newMode = checked ? 'column' : 'row';
    setDeleteMode(newMode);
    deleteModeRef.current = newMode;
    data.values[0] = newMode;
  };
  
  /**
   * 处理索引变更
   * @param {number} value - 新的索引值
   */
  const handleIndexChange = (value: number) => {
    if (value !== null && value >= 0) {
      setIndexToDelete(value);
      data.values[1] = value.toString();
      indexToDeleteRef.current = value;
    }
  };
  
  /**
   * 执行CSV行/列删除操作
   * @param {Res} input - 输入的CSV数据
   * @returns {Promise<Res>} 处理后的CSV数据
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    try {
      const csvString = input.msg;
      if(csvString==""){
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
      
      const mode = deleteModeRef.current;
      const index = indexToDeleteRef.current-1;
      
      let resultRows: string[][] = [];
      
      if (mode === 'row') {
        // 删除指定行
        if (index >= rows.length) {
          return updateResData(input,{
            success: false,
            msg: `行索引 ${index} 超出范围，CSV只有 ${rows.length} 行`
          });
        }
        
        resultRows = rows.filter((_, rowIndex) => rowIndex !== index);
      } else {
        // 删除指定列
        const maxColumns = Math.max(...rows.map(row => row.length));
        
        if (index >= maxColumns) {
          return updateResData(input,{
            success: false,
            msg: `列索引 ${index} 超出范围，CSV最多有 ${maxColumns} 列`
          });
        }
        
        resultRows = rows.map(row => {
          return row.filter((_, colIndex) => colIndex !== index);
        });
      }
      
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
      utils.log(`CSV行列删除处理错误: ${error}`);
      return updateResData(input,{
        success: false,
        msg: `处理出错: ${error}`
      }); 
    }
  }
  
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
      <Flex vertical gap={5}>
        <Tooltip title={`要删除的${deleteMode === 'column' ? '列' : '行'}索引 (从1开始)`}>
          <Flex align="center">
            <ComNodeInputNumber
              min={1}
              value={indexToDelete}
              onChange={(value: string) => handleIndexChange(parseInt(value))}
            />
          </Flex>
        </Tooltip>
        <Tooltip title="切换删除模式">
          <Flex align="center" justify="space-between">
            <Switch
              checked={deleteMode === 'column'} 
              onChange={(checked: boolean) => handleModeChange(checked)}
            />
            <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
              {deleteMode === 'column' ? '列' : '行'}
            </Typography.Text>
          </Flex>
        </Tooltip>
      </Flex>
    </NodeCore0>
  );
} 