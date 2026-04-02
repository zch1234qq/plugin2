import { NodeData, Res } from "../../common/types/types";
import NodeCore2Top from "./_node2top";
import utils, { updateResData } from "../../common/utils";

/**
 * 核对节点组件
 * 比较左侧输入（带表头行）与右侧输入（完整CSV文件）
 * 如果数据不匹配则输出首列字段，否则不输出
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 核对节点组件
 */
export default function CheckData({id, data}: {id: string, data: NodeData}) {
  /**
   * 处理节点运行逻辑
   * @param {Res} input0 - 左侧输入（带表头一行）
   * @param {Res} input1 - 右侧输入（要核对的完整CSV）
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input0: Res, input1: Res): Promise<Res> {
      
    if (!input0.success || !input1.success) {
      return updateResData(input0,{ success: false, msg: "输入数据错误" });
    }
    if(input0.msg.trim()==""){
      return updateResData(input0,{ success: true, msg: "" });
    }

    try {
      // 解析左侧输入（标准行）
      const standardInputLines = input0.msg.trim().split('\n');
      const standardRow = parseCSVLine(standardInputLines[standardInputLines.length - 1]);
      
      if (!standardRow || standardRow.length === 0) {
        return updateResData(input0,{ success: false, msg: "标准行数据格式错误" });
      }
      // 从标准行获取首列值
      const standardFirstCol = standardRow[0];

      // 解析右侧输入（CSV文件）
      const csvLines = input1.msg.trim().split('\n');
      if (csvLines.length < 2) {
        return updateResData(input0,{ success: false, msg: "CSV数据格式错误或数据不足" });
      }

      // 解析CSV表头
      const headers = parseCSVLine(csvLines[0]);
      if (!headers || headers.length === 0) {
        return updateResData(input0,{ success: false, msg: "无法解析CSV表头" });
      }
      if (standardRow.length !== headers.length) {
        return updateResData(input0,{ 
          success: false, 
          msg: `字段数不匹配：标准行有 ${standardRow.length} 个字段，CSV表头有 ${headers.length} 个字段` 
        });
      }

      // 性能优化：使用索引优化大数据搜索
      // 1. 如果数据量超过阈值，先建立首列索引
      const CSV_LARGE_THRESHOLD = 1000; // 设置大数据阈值
      let matchResults: string[] = new Array(standardRow.length).fill("");
      let foundMatchingFirstCol = false;
      if (csvLines.length > CSV_LARGE_THRESHOLD) {
        const firstColIndexMap = new Map<string, number[]>();
        
        // 使用批处理，避免长时间阻塞UI
        const BATCH_SIZE = 5000;
        let processedRows = 1; // 从1开始，跳过表头
        
        while (processedRows < csvLines.length) {
          const endIndex = Math.min(processedRows + BATCH_SIZE, csvLines.length);
          
          // 处理当前批次
          for (let i = processedRows; i < endIndex; i++) {
            const line = csvLines[i];
            if (!line.trim()) continue;
            
            try {
              const firstCell = line.split(',')[0].trim();
              if (firstCell) {
                if (!firstColIndexMap.has(firstCell)) {
                  firstColIndexMap.set(firstCell, []);
                }
                firstColIndexMap.get(firstCell)?.push(i);
              }
            } catch (e) {
              // 忽略错误行
            }
          }
          
          processedRows = endIndex;
          
          // 如果已经找到目标行，可以提前结束
          if (firstColIndexMap.has(standardFirstCol)) {
            break;
          }
        }
        
        // 使用索引查找匹配行
        const matchingRowIndices = firstColIndexMap.get(standardFirstCol) || [];
        if (matchingRowIndices.length > 0) {
          foundMatchingFirstCol = true;
          // 只检查第一个匹配的行
          const rowIndex = matchingRowIndices[0];
          const currentLine = parseCSVLine(csvLines[rowIndex]);
          
          if (currentLine && currentLine.length === headers.length) {
            // 检查每列是否匹配
            for (let j = 1; j < standardRow.length; j++) {
              if (standardRow[j] !== currentLine[j]) {
                matchResults[j] = "不一致";
              }
            }
            matchResults[0] = standardFirstCol;
          }
        }
      } else {
        // 对于小数据量，使用原始遍历方法
        for (let i = 1; i < csvLines.length; i++) {
          const currentLine = parseCSVLine(csvLines[i]);
          if (!currentLine || currentLine.length !== headers.length) {
            continue;
          }
          if (currentLine[0] === standardFirstCol) {
            foundMatchingFirstCol = true;
            // 检查每列是否匹配
            for (let j = 1; j < standardRow.length; j++) {
              if (standardRow[j] !== currentLine[j]) {
                matchResults[j] = "不一致";
              }
            }
            matchResults[0] = standardFirstCol;
            // 只查找第一个匹配首列的行
            break;
          }
        }
      }

      // 如果没有找到匹配首列的行
      if (!foundMatchingFirstCol) {
        return updateResData(input0,{
          success: true,
          msg: standardFirstCol,
        });
      }

      // 构建输出结果
      let hasAnyMismatch = matchResults.some(result => result === "不一致");
      
      // 如果没有不匹配的字段，返回空字符串
      if (!hasAnyMismatch) {
        return updateResData(input0,{
          success: true,
          msg: "",
          datas: input0.datas
        });
      }
      
      // 构建输出
      const outputMsg = matchResults.join(',');
      
      return updateResData(input0,{ 
        success: true, 
        msg: outputMsg,
        datas: input0.datas 
      });
    } catch (error) {
      utils.log(`核对节点处理错误: ${error}`);
      return updateResData(input0,{ success: false, msg: `处理出错: ${error}` });
    }
  }

  /**
   * 解析CSV行，处理引号和逗号
   * @param {string} line - CSV行文本
   * @returns {string[]} 解析后的字段数组
   */
  function parseCSVLine(line: string): string[] {
    if (!line || line.trim() === '') return [];

    // 处理可能存在的BOM和不可见字符
    line = line.replace(/^\ufeff/, '').trim();
    
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // 处理引号
        if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
          // 双引号转义为单引号
          current += '"';
          i++;
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim()); // 添加trim()去除字段前后空格
        current = '';
      } else {
        // 普通字符
        current += char;
      }
    }
    
    // 添加最后一个字段并去除前后空格
    result.push(current.trim());
    // 调试输出
    return result;
  }

  return (
    <NodeCore2Top data={data} id={id} run={run} width={100}/>
  );
} 