export type SaveCustomFn = (fileName: string, data: Blob | Uint8Array) => Promise<void>;

export type ExportCsvToXlsxParams = {
  /** CSV 格式字符串 */
  csvData: string;
  /** 导出的文件名（不含扩展名） */
  fileName: string;
  /** 中断信号 */
  signal: AbortSignal;
  /** 是否桌面端（Tauri） */
  isDesktop?: boolean;
  /**
   * 桌面端自定义保存函数（Tauri）
   * - 仅当 isDesktop=true 时会使用
   */
  saveCustom?: SaveCustomFn;
  /** 工作表名称，默认 'Sheet1' */
  sheetName?: string;
};

/**
 * 将 CSV 数据导出为 XLSX 文件（支持 AbortSignal）。
 * - 浏览器端：直接触发下载
 * - 桌面端（Tauri）：优先使用 saveCustom 保存，失败时回退浏览器下载
 */
export async function exportCsvToXlsx({
  csvData,
  fileName,
  signal,
  isDesktop = false,
  saveCustom,
  sheetName = 'Sheet1',
}: ExportCsvToXlsxParams): Promise<void> {
  // 检查是否已中止
  if (signal.aborted) {
    throw new DOMException('下载已取消', 'AbortError');
  }

  const XLSX = await import('xlsx');

  // 移除可能存在的BOM标记
  if (csvData.charCodeAt(0) === 0xfeff) {
    csvData = csvData.slice(1);
  }

  // 解析CSV数据，保留空行
  const lines = csvData.split('\n');
  const data: string[][] = [];

  // 处理每行数据
  for (let i = 0; i < lines.length; i++) {
    // 定期检查是否中止
    if (i % 100 === 0 && signal.aborted) {
      throw new DOMException('下载已取消', 'AbortError');
    }

    const line = lines[i];
    // 不再跳过空行，保留所有行包括空行
    const cells = line.split(',');
    data.push(cells);
  }

  // 将数据转换为工作表
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 创建工作簿并添加工作表
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 检查是否在Tauri环境中且有指定下载路径
  if (isDesktop && saveCustom) {
    try {
      // 将工作簿转换为二进制数据
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      // xlsx 在 type:'array' 下返回值在不同环境/类型声明里可能是 number[]/ArrayBufferLike
      await saveCustom(`${fileName}.xlsx`, new Uint8Array(wbout as any));
      return;
    } catch (error) {
      console.error('保存Excel文件到指定路径失败，回退到浏览器下载:', error);
      // 失败时回退到浏览器下载方式
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      return;
    }
  }

  // 在浏览器环境中直接下载
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
