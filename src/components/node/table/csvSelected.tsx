import { useState, useRef, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import { Flex, Switch, Tooltip, Typography, theme as antdTheme } from "antd";
import utils, { updateResData } from "../../../common/utils";
import ComNodeInputNumber from "../../ComNodeInputNumber";
import NodeCore0 from "../_node0";
import HandleInputText from "../../HandleInputText";
import HandleOutputText from "../../HandleOutputText";

/**
 * CSV行列提取节点组件
 * 用于从CSV数据中提取指定行或列
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} CSV行列提取节点组件
 */
export default function CsvExtractor({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  // 提取模式：'row'表示提取行，'column'表示提取列
  const [v0,setV0] = useState<string>(data.values[0]||'0')
  const [v1,setV1] = useState<string>(data.values[1]||'1')
  const refV0 = useRef(v0)
  const refV1 = useRef(v1)

  // 组件初始化时从data中读取存储的值
  useEffect(() => {
    if (data.values[0]) {
      setV0(data.values[0]);
      refV0.current = data.values[0];
    } 
    if (data.values[1]) {
      setV1(data.values[1]);
      refV1.current = data.values[1];
    }
  }, [data.values]);

  // 当提取模式变化时更新引用和数据
  useEffect(() => {
    data.values[0] = v0;
  }, [v0, data.values]);

  useEffect(()=>{
    data.values[1] = v1;
    refV1.current = v1;
  },[v1])

  /**
   * 处理模式切换
   * @param {boolean} checked - 切换状态
   */
  const handleModeChange = (checked: boolean) => {
    let mode = checked ? '1' : '0';
    setV0(mode);
    refV0.current = mode;
    data.values[0] = mode;
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
   * 执行节点处理
   * @param {Res} input - 输入数据
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    try {
      const csvText = input.msg;
      const csvData = parseCSV(csvText);
      
      if (csvData.length === 0) {
        return updateResData(input,{
          success: true,
          msgtypeRe:"excel",
          msg: '',
        }); 
      }
      let result = '';
      if (refV0.current === '0') {
        // 提取指定行
        const rowIndex = parseInt(refV1.current, 10)-1;
        if (rowIndex >= csvData.length) {
          return updateResData(input,{
            // success: false,
            // msg: `行索引 ${rowIndex} 超出范围，CSV只有 ${csvData.length} 行`
            success: true,
            msgtypeRe:"excel",
            msg: '',
          }); 
        }
        
        result = csvData[rowIndex].join(',');
      } else {
        // 提取指定列
        const colIndex = parseInt(refV1.current, 10)-1;
        const columnValues: string[] = [];
        
        for (const row of csvData) {
          if (colIndex < row.length) {
            columnValues.push(row[colIndex]);
          } else {
            columnValues.push(''); // 对于不存在的列，添加空值
          }
        }
        
        if (columnValues.every(v => v === '')) {
          return updateResData(input,{
            // success: false,
            // msg: `列索引 ${colIndex} 超出范围，CSV中没有该列数据`
            success:true,
            msgtypeRe:"excel",
            msg: '',
          }); 
        }
        
        result = columnValues.join('\n');
      }

      utils.log(`CSV提取 - 模式: ${refV0.current}, 索引: ${refV1.current}, 结果: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
      return updateResData(input,{
        success: true,
        msgtypeRe:"excel",
        msg: result,
        datas: input.datas
      });
    } catch (error) {
      utils.log(`CSV提取节点处理错误: ${error}`);
      return updateResData(input,{
        success: false,
        msg: `处理出错: ${error}`
      });
    }
  }

  return (
    <NodeCore0 width={100} id={id} data={data} run0={run} handles={[1, 1]} colors={[0,0]}>
      <HandleInputText />
      <HandleOutputText />
      <Flex vertical gap="small">
        <ComNodeInputNumber
          value={v1}
          onChange={(value: string) => setV1(value)}
          min={1}
          placeholder={v0 === '1' ? "行序号" : "列序号"}
        />
        <Flex align="center" justify="start" gap="small" style={{width:'100%'}}>
          <Tooltip 
            title={v0 === '1' ? "切换到提取行" : "切换到提取列"}
          >
            <Switch
              checked={v0 === '1'}
              onChange={(checked: boolean) => handleModeChange(checked)}
            />
          </Tooltip>
          <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
            {v0 === '1' ? '列' : '行'}
          </Typography.Text>
        </Flex>
      </Flex>
    </NodeCore0>
  );
}