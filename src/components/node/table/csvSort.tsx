import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Input, Tooltip, Checkbox } from "antd";
import utils, { updateResData } from "../../../common/utils";
import NodeCore0 from "../_node0";
import { Position } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import ComNodeInputNumber from "../../ComNodeInputNumber";

/**
 * CSV排序节点组件
 * 用于对CSV表格根据指定列进行顺序排序
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} CSV排序节点组件
 */
export default function CsvSort({id, data}: {id: string, data: NodeData}) {
  const [v0, setV0] = useState<string>(data.values[0] || "1"); // 要排序的列索引，默认为0
  const [v1, setV1] = useState<string>(data.values[1] || "0"); // 排序顺序，默认为升序
  
  const sortColumnRef = useRef(v0);
  const sortOrderRef = useRef(v1);
  
  // 同步状态到引用
  useEffect(() => {
    sortColumnRef.current = v0;
    data.values[0] = v0;
  }, [v0]);
  
  useEffect(() => {
    sortOrderRef.current = v1;
    data.values[1] = v1;
  }, [v1]);
  
  // 初始化数据
  useEffect(() => {
    // 从节点数据中加载保存的值
    if (data.values[0]) {
      const savedColumn = parseInt(data.values[0]);
      if (!isNaN(savedColumn)) {
        setV0(savedColumn.toString());
        sortColumnRef.current = savedColumn.toString();
      }
    }
    if (data.values[1]) {
      setV1(data.values[1]);
      sortOrderRef.current = data.values[1];
    }
  }, [v0,v1]);
  
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
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    result.push(currentValue);
    return result;
  }
  
  /**
   * 将字段数组转换为CSV行
   * @param {string[]} fields - 字段数组
   * @returns {string} CSV行字符串
   */
  function fieldsToCSVLine(fields: string[]): string {
    return fields.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  }
  
  /**
   * 执行CSV排序操作
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
        });
      }
      
      if (typeof csvString !== 'string') {
        return updateResData(input,{
          success: false,
          msg: "输入不是有效的CSV字符串"
        });
      }
      
      // 解析CSV
      const rows = csvString.split('\n').map(line => parseCSVLine(line));
      
      if (rows.length === 0) {
        return updateResData(input,{
          success: false,
          msg: "CSV数据为空"
        });
      }
      
      const columnIndex = parseInt(sortColumnRef.current)-1;

      const order = sortOrderRef.current === '1' ? 'desc' : 'asc';
      
      // 检查列索引是否有效
      const headerRow = rows[0];
      if (columnIndex < 0 || columnIndex >= headerRow.length) {
        return updateResData(input,{
          success: false,
          msg: `无效的列索引: ${columnIndex}。有效范围: 0-${headerRow.length - 1}`
        });
      }
      
      // 对所有行进行排序（不区分表头和数据行）
      const sortedRows = [...rows].sort((a, b) => {
        const aValue = a[columnIndex] || '';
        const bValue = b[columnIndex] || '';
        
        // 尝试数值比较
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return order === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // 字符串比较
        if (order === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
      
      // 使用排序后的行
      const resultRows = sortedRows;
      
      // 转换回CSV字符串
      const resultCSV = resultRows.map(row => fieldsToCSVLine(row)).join('\n');
      
      return updateResData(input,{
        success: true,
        msgtypeRe:"excel",
        msg: resultCSV
      });
    } catch (error) {
      utils.log(`CSV排序处理错误: ${error}`);
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
      // handles={[0, -1]}
      width={100}
      tips={["输入表格","输出表格"]}
    >
      <Flex vertical gap={5}>
        <ComNodeInputNumber
          tooltip="列序号"
          placeholder="列索引(从0开始)"
          value={v0}
          onChange={(value) => {
            setV0(value);
          }}
          min={1}
        />
        <Tooltip title="勾选为降序，取消勾选为升序">
          <Checkbox
            checked={v1 === '1'}
            onChange={(e) => {
              setV1(e.target.checked ? '1' : '0');
            }}
          >
            降序
          </Checkbox>
        </Tooltip>
      </Flex>
    </NodeCore0>
  );
}
