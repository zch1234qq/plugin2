import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import sizeOf from 'image-size';

/**
 * 计算保持原始比例的图片尺寸
 * @param originalWidth 原始宽度
 * @param originalHeight 原始高度
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 调整后的宽度和高度
 */
function calculateAspectRatioFit(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
}

/**
 * 将包含 base64 图片的 CSV 文件转换为 Excel 文件
 */
async function convertCsvToExcel(csvFilePath: string, excelFilePath: string): Promise<void> {
  try {
    // 读取 CSV 文件
    console.log('正在读取 CSV 文件...');
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // 解析 CSV（简单按逗号分割，假设第一列是文本，第二列是 base64）
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // 创建 Excel 工作簿
    console.log('正在创建 Excel 工作簿...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('数据');
    
    // 设置列宽
    worksheet.columns = [
      { header: '文本内容', key: 'text', width: 40 },
      { header: '图片', key: 'image', width: 60 }
    ];
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;
    
    // 处理每一行数据
    let currentRow = 2; // 从第2行开始（第1行是表头）
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 找到第一个逗号的位置来分割文本和 base64
      const firstCommaIndex = line.indexOf(',');
      if (firstCommaIndex === -1) continue;
      
      const text = line.substring(0, firstCommaIndex);
      const base64Data = line.substring(firstCommaIndex + 1);
      
      console.log(`正在处理第 ${i + 1} 行数据...`);
      
      // 添加文本到单元格
      worksheet.getCell(`A${currentRow}`).value = text;
      worksheet.getCell(`A${currentRow}`).alignment = { 
        vertical: 'middle', 
        horizontal: 'left',
        wrapText: true 
      };
      
      // 处理 base64 图片
      if (base64Data && base64Data.startsWith('/9j/')) {
        try {
          // 移除可能的 data URI 前缀
          let cleanBase64 = base64Data.trim();
          if (cleanBase64.startsWith('data:')) {
            cleanBase64 = cleanBase64.split(',')[1];
          }
          
          // 将 base64 转换为 buffer
          const imageBuffer = Buffer.from(cleanBase64, 'base64');
          
          // 获取图片原始尺寸
          const dimensions = sizeOf(imageBuffer);
          const originalWidth = dimensions.width || 300;
          const originalHeight = dimensions.height || 120;
          
          console.log(`  原始图片尺寸: ${originalWidth}x${originalHeight}`);
          
          // 计算保持原始比例的显示尺寸（最大宽度400，最大高度300）
          const maxDisplayWidth = 400;
          const maxDisplayHeight = 300;
          const displaySize = calculateAspectRatioFit(
            originalWidth,
            originalHeight,
            maxDisplayWidth,
            maxDisplayHeight
          );
          
          console.log(`  显示尺寸: ${displaySize.width}x${displaySize.height}`);
          
          // 添加图片到工作簿
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg',
          });
          
          // 行高与图片高度一致：
          // Excel 行高单位是磅(points)，按 96 DPI 近似换算：1px ≈ 0.75pt
          const rowHeight = +(displaySize.height * 0.75).toFixed(2);
          worksheet.getRow(currentRow).height = rowHeight;
          console.log(`  设置行高(pt): ${rowHeight}，约等于 ${displaySize.height}px`);
          
          // 在单元格中插入图片
          worksheet.addImage(imageId, {
            tl: { col: 1, row: currentRow - 1 }, // top-left 位置 (B列，当前行)
            ext: { width: displaySize.width, height: displaySize.height }, // 按比例缩放的图片尺寸
            editAs: 'oneCell' // 图片随单元格移动
          });
          
          console.log(`✓ 成功添加图片到第 ${currentRow} 行`);
        } catch (error) {
          console.error(`✗ 处理第 ${currentRow} 行图片时出错:`, error);
          worksheet.getCell(`B${currentRow}`).value = '图片解析失败';
        }
      }
      
      currentRow++;
    }
    
    // 保存 Excel 文件
    console.log('正在保存 Excel 文件...');
    await workbook.xlsx.writeFile(excelFilePath);
    
    console.log(`\n✓ 转换完成！`);
    console.log(`输出文件: ${excelFilePath}`);
    console.log(`共处理 ${currentRow - 2} 行数据`);
    
  } catch (error) {
    console.error('转换过程中发生错误:', error);
    throw error;
  }
}

// 主函数
async function main() {
  const csvFilePath = '0下载.csv';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const excelFilePath = `输出结果_${timestamp}.xlsx`;
  
  console.log('='.repeat(50));
  console.log('CSV 转 Excel 工具（支持 base64 图片）');
  console.log('='.repeat(50));
  console.log(`输入文件: ${csvFilePath}`);
  console.log(`输出文件: ${excelFilePath}\n`);
  
  await convertCsvToExcel(csvFilePath, excelFilePath);
}

// 执行主函数
main().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});

