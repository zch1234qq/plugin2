// file-converter.ts
import { getDocument, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { read, utils, WorkBook } from 'xlsx';
import JSZip from 'jszip';
import { detect } from 'chardet';

type FileToTextOptions = {
  /** 是否包含PDF中的格式元数据 */
  preserveFormatting?: boolean;
  /** Excel工作表索引 (默认: 0) */
  sheetIndex?: number;
};
/**
 * 将文件转换为纯文本的核心函数
 * @param file 用户上传的File对象
 * @param options 转换配置选项
 * @returns Promise解析后的文本内容
 */
export async function fileToText(
  file: File,
  options: FileToTextOptions = {}
): Promise<string> {
  const ext = getFileExtension(file.name);
  
  switch (ext.toLowerCase()) {
    case 'pdf':
      return parsePDF(await file.arrayBuffer(), options.preserveFormatting);
    
    case 'docx':
    case 'doc':
      return parseWord(await file.arrayBuffer());
    
    case 'xlsx':
    case 'xls':
      return parseExcel(await file.arrayBuffer(), options.sheetIndex);
    
    case 'odt':
      return parseODF(await file.arrayBuffer());
    
    case 'txt':
    case 'csv':
      return decodeText(file);
    
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}
async function parsePDF(
  buffer: ArrayBuffer,
  _preserveFormatting = false
): Promise<string> {
  const pdf: PDFDocumentProxy = await getDocument(buffer).promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page: PDFPageProxy = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    let pageText = '';
    let lastY: number | null = null;

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const textItem = item as { str: string; transform: number[]; hasEOL: boolean };
      const currentY = textItem.transform[5];

      if (lastY !== null && Math.abs(currentY - lastY) > 2) {
        pageText += '\n';
      }
      pageText += textItem.str;
      if (textItem.hasEOL) {
        pageText += '\n';
      }
      lastY = currentY;
    }

    pageTexts.push(pageText.trim());
  }

  return pageTexts.join('\n\n');
}
async function parseWord(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}
// Excel解析
function parseExcel(buffer: ArrayBuffer, sheetIndex = 0): string {
  const wb: WorkBook = read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[sheetIndex];
  if (!sheetName) {
    throw new Error(`Sheet index ${sheetIndex} not found`);
  }
  return utils.sheet_to_csv(wb.Sheets[sheetName]);
}

async function parseODF(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xmlFile = zip.file('content.xml');
  
  if (!xmlFile) {
    throw new Error('Invalid ODT file: content.xml missing');
  }
  
  const xml = await xmlFile.async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const textNode = doc.querySelector('office\\:text, text');
  
  return textNode?.textContent?.trim() || '';
}

export const decodeText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  const encoding = detect(uint8Array);
  const normalizedEncoding = normalizeChineseEncoding(encoding||"utf-8");
  return new TextDecoder(normalizedEncoding).decode(uint8Array);
};

const normalizeChineseEncoding = (encoding: string): string => {
  const chineseEncodings: Record<string, string> = {
    'GB-2312': 'gb18030',
    'GBK': 'gb18030',
    'Big5': 'big5'
  };
  return chineseEncodings[encoding] || encoding;
};