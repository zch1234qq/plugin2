import { saveAs } from 'file-saver';
import { exportMarkdownToDocx } from './markdownToDocxUtils';

export type SaveCustomFn = (fileName: string, data: Blob | Uint8Array) => Promise<void>;

type SaveOptions = {
  isDesktop?: boolean;
  saveCustom?: SaveCustomFn;
};

type SaveTextFileParams = SaveOptions & {
  content: string;
  filename: string;
  fileType: string;
  signal: AbortSignal;
};

type ExportDocxParams = SaveOptions & {
  content: string;
  fileName: string;
  signal: AbortSignal;
};

type ExportMultiSheetsParams = SaveOptions & {
  sheets: string[];
  fileName: string;
  signal: AbortSignal;
};

function getMimeAndExtension(fileType: string): { mimeType: string; fileExtension: string } {
  switch (fileType) {
    case 'csv':
      return { mimeType: 'text/csv', fileExtension: 'csv' };
    case 'txt':
      return { mimeType: 'text/plain', fileExtension: 'txt' };
    case 'markdown':
      return { mimeType: 'text/markdown', fileExtension: 'md' };
    default:
      return { mimeType: 'text/plain', fileExtension: 'txt' };
  }
}

export function isValidCSV(csvString: string): boolean {
  if (!csvString || csvString.trim() === '') return true;
  const lines = csvString.trim().split('\n');
  return lines.length >= 1;
}

export async function saveBlobWithAbort(
  blob: Blob,
  filename: string,
  signal: AbortSignal,
  options: SaveOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('下载已取消', 'AbortError'));
      return;
    }

    const abortHandler = () => {
      reject(new DOMException('下载已取消', 'AbortError'));
    };
    signal.addEventListener('abort', abortHandler, { once: true });

    const doSave = async () => {
      try {
        if (options.isDesktop && options.saveCustom) {
          try {
            await options.saveCustom(filename, blob);
            resolve();
            return;
          } catch {
            saveAs(blob, filename);
            resolve();
            return;
          }
        }
        saveAs(blob, filename);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    void doSave();
  });
}

export async function saveTextFile({
  content,
  filename,
  fileType,
  signal,
  isDesktop = false,
  saveCustom,
}: SaveTextFileParams): Promise<void> {
  if (signal.aborted) {
    throw new DOMException('下载已取消', 'AbortError');
  }

  const { mimeType, fileExtension } = getMimeAndExtension(fileType);
  const BOM = '\uFEFF';
  const contentWithBOM = fileType === 'csv' ? BOM + content : content;
  const blob = new Blob([contentWithBOM], { type: `${mimeType};charset=utf-8` });

  await saveBlobWithAbort(blob, `${filename}.${fileExtension}`, signal, {
    isDesktop,
    saveCustom,
  });
}

export async function exportToDocxFile({
  content,
  fileName,
  signal,
  isDesktop = false,
  saveCustom,
}: ExportDocxParams): Promise<'docx' | 'txt'> {
  try {
    if (signal.aborted) {
      throw new DOMException('下载已取消', 'AbortError');
    }

    const blob = await exportMarkdownToDocx(content, fileName, signal);
    await saveBlobWithAbort(blob, `${fileName}.docx`, signal, { isDesktop, saveCustom });
    return 'docx';
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }

    if (signal.aborted) {
      throw new DOMException('下载已取消', 'AbortError');
    }

    const fallbackBlob = new Blob([content], { type: 'text/plain' });
    await saveBlobWithAbort(fallbackBlob, `${fileName}.txt`, signal, { isDesktop, saveCustom });
    return 'txt';
  }
}

export async function exportMultiSheetsToXLSX({
  sheets,
  fileName,
  signal,
  isDesktop = false,
  saveCustom,
}: ExportMultiSheetsParams): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  for (let i = 0; i < sheets.length; i++) {
    if (signal.aborted) {
      throw new DOMException('下载已取消', 'AbortError');
    }

    const sheetName = `Sheet${i + 1}`;
    const parsedSheet = XLSX.read(sheets[i], { type: 'string' });
    const firstSheetName = parsedSheet.SheetNames[0];
    const worksheet = parsedSheet.Sheets[firstSheetName];
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  if (isDesktop && saveCustom) {
    try {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      await saveCustom(`${fileName}.xlsx`, new Uint8Array(wbout as any));
      return;
    } catch {
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      return;
    }
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
