import { NodeData, Res } from "../../common/types/types";
import ComNodeInputNumber from "../ComNodeInputNumber";
import NodeCore0 from "./_node0";
import { useRef, useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { message, Upload, Button, Flex, Tooltip } from "antd";
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { updateResData } from "../../common/utils";
import HandleOutputText from "../HandleOutputText";

/**
 * Excel工作表提取节点
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} Excel工作表提取节点组件
 */
export default function ExcelSheetExtractor({id, data}: {id: string, data: NodeData}) {
  const [sheetName, setSheetName] = useState(1);
  const sheetNameRef = useRef(sheetName);
  const [fileName, setFileName] = useState<string>("");
  // const [excelData, setExcelData] = useState<any>(null);
  const excelDataRef = useRef<any>(null);

  useEffect(() => {
    if (data.values[0]) {
      setSheetName(parseInt(data.values[0]));
      sheetNameRef.current = parseInt(data.values[0]);
    }
  }, [data.values]);

  /**
   * 处理Excel文件上传
   * @param file 上传的Excel文件
   */
  const handleFileUpload = async (file: File) => {
    try {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        window.messageApi.error('请上传Excel文件(.xlsx或.xls)');
        return false;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          // setExcelData(workbook);
          excelDataRef.current = workbook;
          setFileName(file.name);
          window.messageApi.success(`成功加载Excel文件: ${workbook.SheetNames.length} 个工作表`);
        } catch (error) {
          console.error('解析Excel文件失败:', error);
          window.messageApi.error('解析Excel文件失败');
        }
      };
      
      reader.readAsArrayBuffer(file);
      return false; // 阻止默认上传行为
    } catch (error) {
      console.error('处理Excel文件失败:', error);
      window.messageApi.error('处理Excel文件失败');
      return false;
    }
  };

  /**
   * 清除Excel数据
   */
  const handleClearExcel = () => {
    // setExcelData(null);
    excelDataRef.current = null;
    setFileName("");
    window.messageApi.success('Excel文件已清除');
  };

  /**
   * 将工作表数据转换为CSV格式
   * @param worksheet 工作表数据
   * @returns CSV格式的字符串
   */
  const worksheetToCSV = (worksheet: XLSX.WorkSheet): string => {
    const csvData: string[][] = [];
    
    // 获取工作表的有效范围
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // 遍历每一行和列
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.w || String(cell.v) : '');
      }
      csvData.push(rowData);
    }
    
    // 将数组转换为CSV字符串
    return csvData.map(row => row.join(',')).join('\n');
  };

  /**
   * 处理节点运行逻辑
   * @param input 输入的Excel文件内容
   * @returns 提取的工作表CSV数据
   */
  async function run(_input: Res): Promise<Res> {
    if (!excelDataRef.current) {
      return updateResData(_input,{
        success: false, 
        msg: "请先上传Excel文件" 
      }); 
    }

    try {
      const workbook = excelDataRef.current;
      const sheetNames = workbook.SheetNames;
      let targetSheet = sheetNameRef.current - 1;

      if (targetSheet < 0 || targetSheet >= sheetNames.length) {
        return updateResData(_input,{
          success: false, 
          msg: `工作表索引 ${targetSheet + 1} 超出范围，总工作表数: ${sheetNames.length}` 
        }); 
      }

      const worksheet = workbook.Sheets[sheetNames[targetSheet]];
      const csvData = worksheetToCSV(worksheet);
      
      return updateResData(_input,{
        success: true,
        msg: csvData
      });
    } catch (error) {
      console.error('处理Excel文件失败:', error);
      return updateResData(_input,{
        success: false,
        msg: `处理Excel文件失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  return (
    <NodeCore0
      root={true}
      handles={[0, 0]}
      run0={run}
      id={id}
      data={data}
      width={100}
    >
      <HandleOutputText tip="输出表格(csv)" />
      <div style={{height: '100%' }}>
        {!fileName ? (
          <Upload.Dragger
            name="file"
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleFileUpload}
            style={{ height: "100%", width: "100%" }}
          >
            <UploadOutlined style={{ fontSize: '24px' }} />
            <div style={{ fontSize: '8px', color: '#888' }}>支持Excel文件</div>
          </Upload.Dragger>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column'}}>
            <Flex justify="space-between" align="center">
              <span style={{ fontSize: '12px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName}
              </span>
              <Button
                shape="circle"
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={handleClearExcel}
              />
            </Flex>
            <Flex justify="space-between" align="center">
              <div style={{width:"100%"}}>
                <ComNodeInputNumber
                  value={sheetName}
                  onChange={(value) => {
                    setSheetName(parseInt(value));
                    sheetNameRef.current = parseInt(value);
                  }}
                  min={1}
                  max={excelDataRef.current?.SheetNames.length || 1}
                />
              </div>
            </Flex>
          </div>
        )}
      </div>
    </NodeCore0>
  );
}