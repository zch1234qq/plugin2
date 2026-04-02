import { useEffect, useRef } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Typography, theme as antdTheme } from "antd";
import NodeCore0 from "../_node0";
import utils, { updateResData } from "../../../common/utils";
import HandleInputText from "../../HandleInputText";
import HandleOutputText from "../../HandleOutputText";

/**
 * 表格转置节点组件
 * 用于将CSV表格的行转换为列、列转换为行
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 表格转置节点组件
 */
export default function TransposeTable({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
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
   * 执行表格转置操作
   * @param {Res} input - 输入的CSV数据
   * @returns {Promise<Res>} 处理后的CSV数据
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    try {
      const csvString = input.msg;
      if(csvString == "") {

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
      
      // 计算转置后的行数和列数
      const rowCount = rows.length;
      const colCount = Math.max(...rows.map(row => row.length));
      
      // 创建转置矩阵
      const transposedRows: string[][] = Array(colCount)
        .fill(null)
        .map(() => Array(rowCount).fill(''));
      
      // 执行转置操作
      for (let i = 0; i < rowCount; i++) {
        for (let j = 0; j < rows[i].length; j++) {
          transposedRows[j][i] = rows[i][j];
        }
      }
      
      // 转换回CSV字符串
      const resultCSV = transposedRows.map(row => {
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
      utils.log(`表格转置处理错误: ${error}`);
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
      <Flex vertical gap={5} align="center" justify="center">
        <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>表格转置</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>行 ↔ 列</Typography.Text>
      </Flex>
    </NodeCore0>
  );
} 