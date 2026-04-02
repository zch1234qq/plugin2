import { NodeData, Res } from "../../../common/types/types";
import NodeCore2Top from "../_node2top";
import { useRef, useState, useEffect } from "react";
import { Checkbox, Flex, theme as antdTheme } from "antd";
import { parse } from 'papaparse';
import { updateResData } from "../../../common/utils";

/**
 * 表格遍历2.0节点组件
 * 双输入单输出，从上游接收CSV数据和行号
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 表格遍历2.0节点组件
 */
export default function TableIterator2({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  // 复选框状态
  const [v0, setV0] = useState(data.values[0]||'0'); // 0: 全部列, 1: 仅首列
  const [v1, setV1] = useState(data.values[1]||'1'); // 0: 无表头, 1: 包含表头
  const [v2, setV2] = useState(data.values[2]||'0'); // 0: CSV格式, 1: JSON格式
  
  // 引用值用于在异步操作中访问最新状态
  const v0ref = useRef(v0);
  const v1ref = useRef(v1);
  const v2ref = useRef(v2);
  
  // 表格数据引用
  const tableDataRef = useRef<string[][]>([]);

  // 同步状态到ref
  useEffect(() => {
    v0ref.current = v0;
    v1ref.current = v1;
    v2ref.current = v2;
    data.values[0] = v0;
    data.values[1] = v1;
    data.values[2] = v2;
  }, [v0, v1, v2]);

  // 从data加载复选框状态
  useEffect(() => {
    if (data.values[0]) setV0(data.values[0]);
    if (data.values[1]) setV1(data.values[1]);
    if (data.values[2]) setV2(data.values[2]);
  }, [data.values]);

  /**
   * 解析CSV文本为二维数组
   * @param csvText CSV文本内容
   * @returns 解析后的二维数组
   */
  const parseCSVText = (csvText: string): string[][] => {
    try {
      // 检测并移除 BOM 标记
      let processedText = csvText;
      if (processedText.charCodeAt(0) === 0xFEFF) {
        processedText = processedText.slice(1);
      }

      let result: string[][] = [];
      parse(processedText, {
        complete: (results: any) => {
          result = results.data as string[][];
        },
        error: (error: any) => {
          throw error;
        }
      });

      return result;
    } catch (error) {
      console.error('解析CSV文本失败:', error);
      throw error;
    }
  };

  /**
   * 格式化行数据输出
   * @param rowIndex 行索引
   * @returns 格式化后的行数据
   */
  const formatRowOutput = (rowIndex: number): string => {
    if (!tableDataRef.current || tableDataRef.current.length <= rowIndex) {
      return '无效的行索引';
    }
    
    const row = tableDataRef.current[rowIndex];
    
    // 如果只输出首列
    if (v0ref.current === '1') {
      return row[0] || '';
    }
    return row.join(',');
  };

  /**
   * 运行节点处理逻辑
   * @param input0 CSV文本输入
   * @param input1 行索引输入
   * @returns 处理结果
   */
  async function run(input0: Res, input1: Res): Promise<Res> {
    if (!input0.success || !input1.success) {
      return updateResData(input0,{
        success: false,
        msg: "输入数据无效"
      });
    }

    try {
      // 解析CSV文本
      const csvData = parseCSVText(input0.msg);
      if (csvData.length === 0) {
        return updateResData(input0,{
          success: false,
          msg: "CSV数据为空"
        });
      }

      // 过滤空行
      const filteredData = csvData.filter(row => {
        if (row.length === 1 && row[0] === '') return false;
        return !row.every(cell => cell === '');
      });

      tableDataRef.current = filteredData;

      // 解析行索引
      let rowIndex: number;
      if (input1.msg.trim() === "") {
        rowIndex = 1; // 默认返回第一行数据
      } else {
        rowIndex = parseInt(input1.msg.trim(), 10);
        
        if (isNaN(rowIndex)) {
          return updateResData(input0,{
            success: false,
            msg: `无效的行索引: ${input1.msg}`
          });
        }
        
        // 调整索引
        if (rowIndex > 0) {
          rowIndex = rowIndex; // 保持不变
        } else if (rowIndex < 0) {
          rowIndex = filteredData.length + rowIndex;
        }
        
        // 检查索引范围
        if (rowIndex <= 0 || rowIndex >= filteredData.length) {
          return updateResData(input0,{
            success: true,
            continue: true,
            msgtypeRe:"excel",
            msg: ""
          });
        }
      }

      // 格式化输出
      let outputData = '';
      const headerRow = filteredData[0];
      const dataRow = filteredData[rowIndex];

      if (v2ref.current === '1') {
        // JSON格式输出
        const jsonObj: Record<string, string> = {};
        if (v0ref.current === '1') {
          jsonObj[headerRow[0]] = dataRow[0];
        } else {
          headerRow.forEach((header, index) => {
            if (index < dataRow.length) {
              jsonObj[header] = dataRow[index];
            }
          });
        }
        outputData = JSON.stringify(jsonObj, null, 2);
      } else {
        // CSV格式输出
        if (v1ref.current === '1') {
          if (v0ref.current === '1') {
            outputData = headerRow[0] + '\n';
          } else {
            outputData = headerRow.join(',') + '\n';
          }
        }
        
        let formattedRow = formatRowOutput(rowIndex);
        if (v0ref.current === '1') {
          formattedRow = formattedRow.split(',')[0];
        }
        
        outputData += formattedRow;
      }

      return updateResData(input0,{
        success: true,
        msgtypeRe:"excel",
        msg: outputData,
        datas: {
          ...input0.datas,
          ...input1.datas,
        }
      });
    } catch (error) {
      console.error('处理数据错误:', error);
      return updateResData(input0,{
        success: false,
        msg: `处理数据错误: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  return (
    <NodeCore2Top data={data} id={id} run={run} width={100}
      tips={["表格","序号","输出"]}
    >
      <div style={{}}>
        <Flex wrap={true} gap={0} style={{ width: '100%', height: 'auto', backgroundColor: token.colorFillAlter }}>
          <div style={{ 
            fontSize: '12px', 
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span>首列</span>
            <Checkbox
              checked={v0 === '1'}
              onChange={(e) => setV0(e.target.checked ? '1' : '0')}
            />
          </div>
        
          <div style={{ 
            fontSize: '12px', 
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span>表头</span>
            <Checkbox
              checked={v1 === '1'}
              onChange={(e) => setV1(e.target.checked ? '1' : '0')}
            />
          </div>

          {/* <div style={{ 
            fontSize: '12px', 
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Tooltip title="输出AI易于理解的内容">
              <span>AI格式</span>
            </Tooltip>
            <Checkbox
              checked={v2 === '1'}
              onChange={(e) => setV2(e.target.checked ? '1' : '0')}
            />
          </div> */}
        </Flex>
      </div>
    </NodeCore2Top>
  );
} 