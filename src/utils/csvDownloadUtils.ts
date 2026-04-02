import ExcelJS from 'exceljs';

/**
 * CSV下载工具函数
 * 提供CSV文件下载功能，支持中文编码兼容
 */

/**
 * 计算保持原始比例的图片尺寸
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
    height: Math.round(originalHeight * ratio),
  };
}

function guessImageExtensionFromBase64(base64OrDataUri: string): 'jpeg' | 'png' | 'gif' {
  const s = base64OrDataUri.trim();
  if (s.startsWith('data:image/')) {
    const mime = s.slice('data:image/'.length).split(';')[0].toLowerCase();
    if (mime === 'jpg' || mime === 'jpeg') return 'jpeg';
    if (mime === 'png') return 'png';
    if (mime === 'gif') return 'gif';
  }

  // 常见 magic header（base64）
  if (s.startsWith('/9j/')) return 'jpeg'; // JPEG
  if (s.startsWith('iVBORw0KGgo')) return 'png'; // PNG
  if (s.startsWith('R0lGOD')) return 'gif'; // GIF

  // 默认兜底
  return 'png';
}

function ensureDataUri(base64OrDataUri: string, ext: 'jpeg' | 'png' | 'gif'): string {
  const s = base64OrDataUri.trim();
  if (s.startsWith('data:image/')) return s;
  const mime = ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${s}`;
}

function isProbablyImageBase64(base64OrDataUri: string): boolean {
  const s = base64OrDataUri.trim();
  if (!s) return false;
  if (s.startsWith('data:image/')) return true;

  // 仅凭正则判断“像 base64”容易误判，所以这里结合常见图片 magic header
  if (s.startsWith('/9j/')) return true; // jpeg
  if (s.startsWith('iVBORw0KGgo')) return true; // png
  if (s.startsWith('R0lGOD')) return true; // gif

  return false;
}

async function getImageDimensionsFromDataUri(dataUri: string): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error('图片加载失败，无法获取尺寸'));
    img.src = dataUri;
  });
}

function looksLikeBase64(s: string): boolean {
  const t = s.trim();
  // 太短的字符串很可能不是图片（避免误判），图片 base64 通常远大于 100
  if (t.length < 120) return false;
  // 允许换行/空格
  const compact = t.replace(/\s+/g, '');
  // base64 字符集合 + 可选填充
  return /^[A-Za-z0-9+/]+={0,2}$/.test(compact);
}

async function detectImageDataUriAndExt(
  base64OrDataUri: string
): Promise<{ dataUri: string; ext: 'jpeg' | 'png' | 'gif'; width: number; height: number }> {
  const s = base64OrDataUri.trim();

  // 已带前缀：直接用 mime 推断 ext
  if (s.startsWith('data:image/')) {
    const ext = guessImageExtensionFromBase64(s);
    const { width, height } = await getImageDimensionsFromDataUri(s);
    return { dataUri: s, ext, width, height };
  }

  // 纯 base64：先按 magic header 猜一次
  const guessedExt = guessImageExtensionFromBase64(s);
  const guessedUri = ensureDataUri(s, guessedExt);
  try {
    const { width, height } = await getImageDimensionsFromDataUri(guessedUri);
    return { dataUri: guessedUri, ext: guessedExt, width, height };
  } catch {
    // 如果猜错（或不是典型 header），用不同 mime 试探加载，成功则认为是图片
    const candidates: Array<'jpeg' | 'png' | 'gif'> = ['jpeg', 'png', 'gif'];
    for (const ext of candidates) {
      const dataUri = ensureDataUri(s, ext);
      try {
        const { width, height } = await getImageDimensionsFromDataUri(dataUri);
        return { dataUri, ext, width, height };
      } catch {
        // continue
      }
    }
    throw new Error('无法识别图片格式或图片数据无效');
  }
}



/**
 * 下载CSV文件
 * @param csvContent CSV内容字符串
 * @param filename 文件名，默认为"data.csv"
 */
export const downloadCSV = (csvContent: string, filename: string = "data.csv"): void => {
  // 添加BOM标记以确保Excel等程序能正确识别UTF-8编码
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvContent;
  
  // 创建Blob对象
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  
  // 创建下载链接
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象，防止内存泄漏
  URL.revokeObjectURL(url);
};

/**
 * 下载Excel文件
 * @param csvContent CSV内容字符串
 * @param filename 文件名，默认为"data.xlsx"
 */
export const downloadExcel = (csvContent: string, filename: string = "data.xlsx"): void => {
  // 兼容旧调用点：外部仍可当作 void 调用，但内部异步生成 xlsx
  void (async () => {
    try {
      // 移除可能存在的BOM标记
      if (csvContent && csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
      }

      // 解析CSV数据，保留空行
      const lines = (csvContent ?? '').split('\n');

      // 找到第一行非空行确定列数（简单按逗号分割）
      const firstNonEmptyLine = lines.find(line => line.trim()) || '';
      const columnCount = firstNonEmptyLine.split(',').length;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('数据');

      // 动态设置列宽（不设置表头）
      const columns = [];
      for (let i = 0; i < columnCount; i++) {
        columns.push({ width: i === columnCount - 1 ? 60 : 40 }); // 最后一列宽60，其他列宽40
      }
      worksheet.columns = columns;

      let currentRow = 1; // 从第一行开始，不预留表头行
      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i] ?? '';
        const line = rawLine.replace(/\r$/, ''); // 兼容 CRLF

        // 保留空行：插入空行并继续
        if (!line.trim()) {
          if (columnCount > 0) {
            const firstColLetter = 'A';
            worksheet.getCell(`${firstColLetter}${currentRow}`).value = '';
          }
          worksheet.getRow(currentRow).height = 18;
          currentRow++;
          continue;
        }

        // 解析CSV行：简单按逗号分割（假设CSV格式正确）
        const cells = line.split(',');
        const lastCellIndex = cells.length - 1;
        const lastCellValue = cells[lastCellIndex]?.trim() || '';

        // 写入前面的列（文本内容）
        for (let col = 0; col < lastCellIndex; col++) {
          const colLetter = String.fromCharCode(65 + col); // A, B, C...
          worksheet.getCell(`${colLetter}${currentRow}`).value = cells[col]?.trim() || '';
          worksheet.getCell(`${colLetter}${currentRow}`).alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
        }

        // 处理最后一列：检查是否为图片
        if (lastCellValue && (isProbablyImageBase64(lastCellValue) || looksLikeBase64(lastCellValue))) {
          try {
            const detected = await detectImageDataUriAndExt(lastCellValue);
            const dataUri = detected.dataUri;
            const ext = detected.ext;
            const originalWidth = detected.width;
            const originalHeight = detected.height;

            const maxDisplayWidth = 400;
            const maxDisplayHeight = 300;
            const displaySize = calculateAspectRatioFit(
              originalWidth || 300,
              originalHeight || 120,
              maxDisplayWidth,
              maxDisplayHeight
            );

            const imageId = workbook.addImage({
              base64: dataUri,
              extension: ext,
            });

            // 图片尺寸：直接按比例缩放到适合单元格的大小
            const targetRowHeightPt = 120; // 目标行高（磅），增加一倍
            const targetImageHeightPx = targetRowHeightPt / 0.75; // 对应像素高度
            const scale = Math.min(0.4, targetImageHeightPx / displaySize.height);
            const finalImageWidth = Math.max(1, Math.floor(displaySize.width * scale));
            const finalImageHeight = Math.max(1, Math.floor(displaySize.height * scale));

            // 设置行高
            worksheet.getRow(currentRow).height = targetRowHeightPt;

            worksheet.addImage(imageId, {
              tl: { col: lastCellIndex, row: currentRow - 1 },
              ext: { width: finalImageWidth, height: finalImageHeight },
              editAs: 'oneCell',
            });
          } catch (e) {
            console.error(`插入第 ${currentRow} 行图片失败:`, e);
            window.messageApi.error(e);
            const lastColLetter = String.fromCharCode(65 + lastCellIndex);
            worksheet.getCell(`${lastColLetter}${currentRow}`).value = '图片解析失败';
          }
        } else {
          // 最后一列不是图片：按普通文本写入最后一列
          const lastColLetter = String.fromCharCode(65 + lastCellIndex);
          worksheet.getCell(`${lastColLetter}${currentRow}`).value = lastCellValue;
          worksheet.getCell(`${lastColLetter}${currentRow}`).alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
        }

        currentRow++;
      }

      // 生成并下载 xlsx（浏览器环境）
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载Excel文件失败:', error);
      window.messageApi.error(error);
    }
  })();
};