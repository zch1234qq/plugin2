import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css';
import { Upload, Button, Checkbox, Flex, theme as antdTheme } from "antd";
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import NodeCore0 from "../_node0";
import * as XLSX from 'xlsx';
import { parse } from 'papaparse';
import { updateResData } from "../../../common/utils";

/**
 * 表格遍历节点组件
 * 允许上传CSV/Excel文件，根据输入的序号输出对应的行
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 表格遍历节点组件
 */
export default function TableIterator({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  // 只保存复选框状态
  const [v0, setV0] = useState<string>("0");
  const v0ref = useRef<string>(v0);
  const [v1, setV1] = useState<string>("1");
  const v1ref = useRef<string>(v1);
  // const [v2, setV2] = useState('1'); // 0: CSV格式, 1: JSON格式
  // const v2ref = useRef(v2);
  
  // 其他状态不保存到节点数据中
  const [,setTableData] = useState<string[][]>([]);
  const tableDataRef = useRef<string[][]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [, setRowCount] = useState<number>(0);

  // 只初始化复选框状态
  useEffect(() => {
    if (data.values[0]) {
      setV0(data.values[0]);
      v0ref.current = data.values[0];
    } else {
      data.values[0] = v0;
    }
    if (data.values[1]) {
      setV1(data.values[1]);
      v1ref.current = data.values[1];
    } else {
      data.values[1] = v1;
    }
    // if (data.values[2]) {
    //   setV2(data.values[2]);
    //   v2ref.current = data.values[2];
    // }
  }, []);
  
  // 只更新复选框状态到节点数据
  useEffect(() => {
    v0ref.current = v0;
    data.values[0] = v0;
  }, [v0]);

  useEffect(() => {
    v1ref.current = v1;
    data.values[1] = v1;
  }, [v1]);

  // useEffect(() => {
  //   v2ref.current = v2;
  // }, [v2]);

  /**
   * 读取CSV文件
   * @param file CSV文件
   */
  const readCSVFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          
          // 尝试检测编码并处理
          let processedText = csvText;
          
          // 检测并移除 BOM 标记
          if (processedText.charCodeAt(0) === 0xFEFF) {
            processedText = processedText.slice(1);
          }
          
          // 使用 PapaParse 解析 CSV，指定编码处理选项
          parse(processedText, {
            complete: (results: any) => {
              const parsedData = results.data as string[][];
              
              // 检查是否有乱码，如果有则尝试其他编码
              if (detectGarbledText(parsedData)) {
                // 重新读取文件，尝试使用GBK编码
                const gbkReader = new FileReader();
                gbkReader.onload = () => {
                  try {
                    // 注意：浏览器环境中直接处理GBK比较困难
                    // 这里使用一个变通方法，通过TextDecoder尝试解码
                    // 实际项目中可能需要引入专门的编码转换库
                    const arrayBuffer = gbkReader.result as ArrayBuffer;
                    
                    // 尝试使用TextDecoder解码（注意：并非所有浏览器都支持GBK）
                    let decodedText;
                    try {
                      const decoder = new TextDecoder('gbk');
                      decodedText = decoder.decode(arrayBuffer);
                    } catch (e) {
                      // 如果浏览器不支持GBK解码，给出提示
                      window.messageApi.warning('浏览器不支持GBK编码，请尝试将CSV文件保存为UTF-8编码');
                      decodedText = new TextDecoder('utf-8').decode(arrayBuffer);
                    }
                    
                    parse(decodedText, {
                      complete: (gbkResults: any) => {
                        resolve(gbkResults.data as string[][]);
                      },
                      error: (error: any) => {
                        reject(error);
                      }
                    });
                  } catch (error) {
                    reject(error);
                  }
                };
                
                gbkReader.onerror = () => {
                  reject(new Error('读取文件失败'));
                };
                
                gbkReader.readAsArrayBuffer(file);
              } else {
                // 如果没有检测到乱码，直接使用解析结果
                resolve(parsedData);
              }
            },
            error: (error: any) => {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      // 首先尝试UTF-8编码
      reader.readAsText(file, 'UTF-8');
    });
  };
  
  /**
   * 检测文本是否包含乱码
   * @param data 解析后的数据
   * @returns 是否包含乱码
   */
  const detectGarbledText = (data: string[][]): boolean => {
    // 简单的乱码检测：检查是否包含常见的乱码字符组合
    const garbledPatterns: RegExp[] = [/�/g, /\uFFFD/g, /[\u0080-\u009F]/g];
    
    for (const row of data) {
      for (const cell of row) {
        for (const pattern of garbledPatterns) {
          if (pattern.test(cell)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };
  
  /**
   * 读取Excel文件
   * @param file Excel文件
   */
  const readExcelFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 获取第一个工作表
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // 转换为二维数组
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // 确保所有值都是字符串
          const stringData = jsonData.map(row => 
            (row as any[]).map(cell => cell?.toString() || '')
          );
          
          resolve(stringData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };
  
  /**
   * 处理文件上传
   * @param file 上传的文件
   */
  const handleFileUpload = async (file: File) => {
    try {
      let data: string[][];
      // 根据文件类型选择不同的解析方法
      if (file.name.endsWith('.csv')) {
        data = await readCSVFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await readExcelFile(file);
      } else {
        window.messageApi.error('不支持的文件格式，请上传CSV或Excel文件');
        return false;
      }
      
      if (data.length === 0) {
        window.messageApi.error('表格为空');
        return false;
      }
      
      // 过滤掉空行（最后一行如果只有一个空字符串元素）
      data = data.filter(row => {
        // 检查行是否只包含一个空字符串元素
        if (row.length === 1 && row[0] === '') {
          return false;
        }
        // 检查行是否全部为空字符串
        const allEmpty = row.every(cell => cell === '');
        return !allEmpty;
      });
      
      // 更新状态（但不保存到节点数据）
      setTableData(data);
      tableDataRef.current = data;
      setFileName(file.name);
      setRowCount(data.length - 1); // 减去表头行
      
      window.messageApi.success(`成功加载表格: ${data.length - 1} 行数据`);
      return false; // 阻止默认上传行为
    } catch (error) {
      console.error('处理表格文件失败:', error);
      window.messageApi.error('处理表格文件失败');
      return false;
    }
  };
  
  /**
   * 将表格行转换为输出格式
   * @param rowIndex 行索引（0为表头）
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
   * @param input 输入结果（应包含行索引）
   * @returns 输出结果
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    // 检查是否有表格数据
    if (!tableDataRef.current || tableDataRef.current.length === 0) {
      return updateResData(input,{
        success: false,
        msg: "请先上传表格文件"
      });
    }
    
    try {
      // 尝试将输入解析为行索引
      let rowIndex: number;
      if (input.msg.trim() === "") {
        // 如果输入为空，默认返回表头
        rowIndex = 1;
      } else {
        rowIndex = parseInt(input.msg.trim(), 10);
        
        // 验证行索引是否有效
        if (isNaN(rowIndex)) {
          return updateResData(input,{
            success: false,
            msg: `无效的行索引: ${input.msg}`
          });
        }
        
        // 调整索引（用户输入1表示第一行数据，而非表头）
        if (rowIndex > 0) {
          rowIndex = rowIndex; // 保持不变
        } else if (rowIndex < 0) {
          // 负数索引表示从末尾开始计数
          rowIndex = tableDataRef.current.length + rowIndex;
        } 
        // 检查索引范围
        if (rowIndex <= 0 || rowIndex >= tableDataRef.current.length) {
          return updateResData(input,{
            success: true,
            continue: true,
            msgtypeRe:"excel",
            msg:""
          });
        }
      }
      
      // 格式化输出
      let outputData = '';
      // 如果需要包含表头(v1 === '1')，则添加表头行
      const headerRow = tableDataRef.current[0];
      // const dataRow = tableDataRef.current[rowIndex];
      {
        // CSV格式输出（原有逻辑）
        if (v1ref.current === '1' && tableDataRef.current.length > 0) {
          if (v0ref.current === '1') {
            // 如果只输出首列，则只添加表头的首列
            outputData = headerRow[0] + '\n';
          } else {
            // 否则添加完整表头行
            outputData = headerRow.join(',') + '\n';
          }
        }
        
        // 添加数据行
        let formattedRow = formatRowOutput(rowIndex);
        if (v0ref.current === '1') {
          formattedRow = formattedRow.split(',')[0];
        }
        
        outputData += formattedRow;
      }
      return updateResData(input,{
        success: true,
        msgtypeRe:"excel",
        msg: outputData,
        datas: {
          ...input.datas,
        }
      });
    } catch (error) {
      console.error('处理行数据错误:', error);
      return updateResData(input,{
        success: false,
        msg: `处理行数据错误: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  /**
   * 清除表格数据
   */
  const handleClearTable = () => {
    setTableData([]);
    tableDataRef.current = [];
    setFileName("");
    setRowCount(0);
    window.messageApi.success('表格数据已清除');
  };
  
  return (
    <NodeCore0 
      handles={[1, 0]} 
      colors={[0, 0]}
      run0={run} 
      id={id} 
      data={data}
      width={100}
      root={true}
    >
      <div style={{ padding: '0', height: '100%'}}>
        {!fileName ? (
          <Upload.Dragger
            name="file"
            accept=".csv,.xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleFileUpload}
            style={{ height:"100%", width:"100%"}}
          >
            <UploadOutlined style={{ fontSize: '24px'}} />
            <div style={{ fontSize: '8px', color: token.colorTextSecondary }}>支持CSV, Excel</div>
          </Upload.Dragger>
        ) : (
          // 已上传文件信息界面
          <div style={{ display: 'flex', flexDirection: 'column'}}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center'}}>
                {/* <FileExcelOutlined style={{ color: '#52c41a' }} /> */}
                <span style={{ fontSize: '12px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName}
                </span>
              </div>
              <Button 
                shape="circle"
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
                onClick={handleClearTable}
              />
            </div>
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
            </Flex>
          </div>
        )}
      </div>
    </NodeCore0>
  );
} 