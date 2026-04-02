import { Document, Paragraph, TextRun, HeadingLevel, UnderlineType, Table, TableRow, TableCell, ImageRun } from 'docx';
import { LineRuleType, Packer } from 'docx';
import { asBlob } from 'html-docx-js-typescript';

/**
 * 根据base64数据的开头特征推断图片类型
 * @param base64Data base64数据
 * @returns 图片MIME类型
 */
function inferImageTypeFromBase64(base64Data: string): string {
  if (!base64Data || base64Data.length < 10) return 'png'; // 默认

  try {
    // 解码前几个字节来检查图片签名
    const binaryString = atob(base64Data.substring(0, 20));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 检查常见的图片文件签名
    if (bytes.length >= 4) {
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'jpeg';
      }
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'png';
      }
      // GIF: 47 49 46
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return 'gif';
      }
      // BMP: 42 4D
      if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
        return 'bmp';
      }
      // WebP: 52 49 46 46 (RIFF)
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        return 'webp';
      }
    }
  } catch (error) {
    // 如果解码失败，使用启发式方法
    console.warn('无法解码base64数据来推断类型:', error);
  }

  // 启发式方法：根据base64字符串的特征推断
  if (base64Data.startsWith('/9j/')) {
    return 'jpeg';
  }
  if (base64Data.startsWith('iVBORw')) {
    return 'png';
  }
  if (base64Data.startsWith('R0lGOD')) {
    return 'gif';
  }

  return 'png'; // 默认类型
}

/**
 * 检测字符串中是否包含base64图片
 * @param text 要检查的文本
 * @returns 包含的base64图片数组
 */
export function detectBase64Images(text: string): Array<{base64: string, mimeType: string, data: string}> {
  const images: Array<{base64: string, mimeType: string, data: string}> = [];

  // 1. 先检测完整的data URL格式
  const dataUrlRegex = /data:image\/(png|jpeg|jpg|gif|bmp|webp);base64,([A-Za-z0-9+/=]+)/g;
  let match;
  while ((match = dataUrlRegex.exec(text)) !== null) {
    images.push({
      base64: match[0], // 完整的data URL
      mimeType: match[1], // 图片类型 (png, jpeg, etc.)
      data: match[2] // base64数据部分
    });
  }

  // 2. 检测独立的base64数据（没有data:前缀）
  // 查找看起来像是base64图片数据的字符串
  const standaloneBase64Regex = /(?:^|[^a-zA-Z0-9+/=])([A-Za-z0-9+/=]{20,})(?:[^a-zA-Z0-9+/=]|$)/g;

  while ((match = standaloneBase64Regex.exec(text)) !== null) {
    const potentialBase64 = match[1];

    // 检查是否已经是完整data URL的一部分
    const isAlreadyProcessed = images.some(img => img.data === potentialBase64);
    if (isAlreadyProcessed) continue;

    // 验证base64数据的有效性
    try {
      // 尝试解码来验证是否是有效的base64
      atob(potentialBase64);
      // 推断图片类型
      const mimeType = inferImageTypeFromBase64(potentialBase64);
      // 构造完整的data URL
      const fullDataUrl = `data:image/${mimeType};base64,${potentialBase64}`;

      images.push({
        base64: fullDataUrl,
        mimeType: mimeType,
        data: potentialBase64
      });
    } catch (error) {
      // 不是有效的base64，跳过
      continue;
    }
  }

  return images;
}

/**
 * 将base64字符串转换为Uint8Array buffer
 * @param base64Data base64数据部分（不包含data:image/...前缀）
 * @returns Uint8Array buffer
 */
export function base64ToBuffer(base64Data: string): Uint8Array {
  // 将base64字符串转换为二进制数据
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 获取base64图片的原始尺寸
 * @param base64Data base64图片数据
 * @returns Promise<{width: number, height: number}> 图片尺寸
 */
export async function getImageDimensionsFromBase64(base64Data: string): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = `data:image/${inferImageTypeFromBase64(base64Data)};base64,${base64Data}`;
  });
}

/**
 * 判断内容是否为Markdown格式
 * @param content 要检查的内容
 * @returns 是否为Markdown格式
 */
export function isMarkdownContent(content: string): boolean {
  // 检查常见的Markdown标记
  const markdownPatterns = [
    /^#+\s.+/m,                    // 标题
    /\*\*.*\*\*/,                  // 粗体
    /\*.*\*/,                      // 斜体
    /^\s*[-*+]\s.+/m,              // 无序列表
    /^\s*\d+\.\s.+/m,              // 有序列表
    /\[.+\]\(.+\)/,                // 链接
    /`[^`]+`/,                     // 行内代码
    /```[\s\S]*?```/,              // 代码块
    /^\s*>\s.+/m,                  // 引用
    /\|(.+\|)+/                    // 表格
  ];
  
  // 如果匹配任何一个Markdown模式，则认为是Markdown格式
  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * 将Markdown内容转换为Word文档元素
 * @param content Markdown内容
 * @returns Word文档元素数组
 */
export function convertMarkdownToDocxElements(content: string): Paragraph[] {
  // 按行分割内容
  const lines = content.split('\n');
  const elements: Paragraph[] = [];
  
  // 处理列表状态
  let inList = false;
  let listItems: Array<{text: string, level: number}> = [];
  let listType = ''; // 'ordered' 或 'unordered'
  
  // 处理代码块状态
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  
  // 处理表格状态
  let inTable = false;
  let tableRows: string[][] = [];
  let htmlTableContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 处理代码块
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // 结束代码块
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeBlockContent.join('\n'),
                font: 'Courier New',
                size: 20,
              })
            ],
            spacing: { before: 200, after: 200 },
            shading: { type: 'solid', color: 'F5F5F5' }
          })
        );
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        // 开始代码块
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // 处理HTML表格（参考demo/index.ts的实现）
    if (line.includes('<table>')) {
      inTable = true;
      htmlTableContent = line;
      continue;
    } else if (line.includes('</table>')) {
      htmlTableContent += line;
      // 结束表格并添加到文档
      try {
        // 解析HTML表格并转换为docx表格
        const table = parseHtmlTableToDocx(htmlTableContent);
        elements.push(table);
      } catch (e) {
        console.error("HTML表格解析失败:", e);
        // 降级为普通文本
        elements.push(new Paragraph({ text: htmlTableContent }));
      }
      inTable = false;
      htmlTableContent = '';
      continue;
    } else if (inTable) {
      htmlTableContent += line;
      continue;
    }
    
    // 处理Markdown表格行（保持原有功能作为备选）
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      
      // 忽略分隔行 (|----|-----|)
      if (!/^\s*\|[-:\s|]*\|\s*$/.test(line)) {
        const cells = line.trim().split('|')
          .filter(cell => cell.trim() !== '') // 过滤空单元格
          .map(cell => cell.trim());
        
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // 结束表格并添加到文档
      if (tableRows.length > 0) {
        try {
          const table = createTable(tableRows);
          elements.push(table);
        } catch (e) {
          console.error("表格创建失败:", e);
          // 降级为普通文本
          tableRows.forEach(row => {
            elements.push(new Paragraph({ text: row.join(' | ') }));
          });
        }
      }
      inTable = false;
      tableRows = [];
    }
    
    // 处理标题
    if (/^#+\s/.test(line)) {
      const headingMatch = line.match(/^#+/) || ["#"];
      const headingLevel = headingMatch[0].length;
      const headingText = line.replace(/^#+\s+/, '');
      
      elements.push(
        new Paragraph({
          text: headingText,
          heading: getHeadingLevel(headingLevel),
          spacing: { before: 300, after: 200 }
        })
      );
      continue;
    }
    
    // 处理列表项
    const listMatch = line.match(/^(\s*)(-|\*|\+|\d+\.)\s(.+)$/);
    if (listMatch) {
      const indentLevel = listMatch[1].length;
      const listMarker = listMatch[2];
      const itemContent = listMatch[3];
      
      const isOrderedList = /^\d+\./.test(listMarker);
      const currentListType = isOrderedList ? 'ordered' : 'unordered';
      
      // 如果列表类型变了或者不在列表中，结束之前的列表
      if (inList && listType !== currentListType) {
        // 处理前一个列表
        elements.push(...createList(listItems, listType));
        listItems = [];
      }
      
      listItems.push({ text: itemContent, level: indentLevel });
      inList = true;
      listType = currentListType;
    } else if (inList && line.trim() === '') {
      // 空行结束列表
      elements.push(...createList(listItems, listType));
      listItems = [];
      inList = false;
    } else if (inList) {
      // 继续当前列表项的内容
      const lastItem = listItems[listItems.length - 1];
      lastItem.text += ' ' + line.trim();
    } else if (line.trim() !== '') {
      // 处理普通段落（带格式）
      elements.push(createFormattedParagraph(line));
    } else {
      // 空行处理
      elements.push(new Paragraph({ spacing: { before: 100, after: 100 } }));
    }
  }
  
  // 处理最后的列表项
  if (inList && listItems.length > 0) {
    elements.push(...createList(listItems, listType));
  }
  
  // 处理最后的表格
  if (inTable && tableRows.length > 0) {
    try {
      const table = createTable(tableRows);
      elements.push(table);
    } catch (e) {
      console.error("表格创建失败:", e);
      // 降级为普通文本
      tableRows.forEach(row => {
        elements.push(new Paragraph({ text: row.join(' | ') }));
      });
    }
  }
  
  return elements;
}

/**
 * 创建格式化的段落
 * @param text 要格式化的文本
 * @returns 格式化的段落
 */
export function createFormattedParagraph(text: string): Paragraph {
  const children: TextRun[] = [];
  let remainingText = text;
  
  // 处理粗体
  while (remainingText.includes('**')) {
    const boldStartIndex = remainingText.indexOf('**');
    
    // 添加前面的普通文本
    if (boldStartIndex > 0) {
      children.push(new TextRun({ text: remainingText.substring(0, boldStartIndex) }));
    }
    
    // 查找结束标记
    const boldTextStart = boldStartIndex + 2;
    const boldEndIndex = remainingText.indexOf('**', boldTextStart);
    
    if (boldEndIndex === -1) {
      // 没有找到结束标记，添加剩余部分为普通文本
      children.push(new TextRun({ text: remainingText.substring(boldStartIndex) }));
      remainingText = '';
      break;
    }
    
    // 添加粗体文本
    const boldText = remainingText.substring(boldTextStart, boldEndIndex);
    children.push(new TextRun({ text: boldText, bold: true }));
    
    // 更新剩余文本
    remainingText = remainingText.substring(boldEndIndex + 2);
  }
  
  // 处理斜体
  let tempText = remainingText;
  remainingText = '';
  
  while (tempText.includes('*')) {
    const italicStartIndex = tempText.indexOf('*');
    
    // 添加前面的普通文本
    if (italicStartIndex > 0) {
      children.push(new TextRun({ text: tempText.substring(0, italicStartIndex) }));
    }
    
    // 查找结束标记
    const italicTextStart = italicStartIndex + 1;
    const italicEndIndex = tempText.indexOf('*', italicTextStart);
    
    if (italicEndIndex === -1) {
      // 没有找到结束标记，添加剩余部分为普通文本
      children.push(new TextRun({ text: tempText.substring(italicStartIndex) }));
      tempText = '';
      break;
    }
    
    // 添加斜体文本
    const italicText = tempText.substring(italicTextStart, italicEndIndex);
    children.push(new TextRun({ text: italicText, italics: true }));
    
    // 更新剩余文本
    tempText = tempText.substring(italicEndIndex + 1);
  }
  
  // 处理链接
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  let lastIndex = 0;
  let processedText = tempText;
  
  while ((linkMatch = linkRegex.exec(processedText)) !== null) {
    // 添加链接前的文本
    if (linkMatch.index > lastIndex) {
      children.push(new TextRun({ text: processedText.substring(lastIndex, linkMatch.index) }));
    }
    
    // 添加链接文本
    children.push(
      new TextRun({
        text: linkMatch[1],
        color: '0000FF',
        underline: {
          type: UnderlineType.SINGLE
        }
      })
    );
    
    lastIndex = linkMatch.index + linkMatch[0].length;
  }
  
  // 添加剩余文本
  if (lastIndex < processedText.length) {
    children.push(new TextRun({ text: processedText.substring(lastIndex) }));
  }
  
  // 如果没有处理任何格式，添加整个文本作为普通文本
  if (children.length === 0 && text.trim() !== '') {
    children.push(new TextRun({ text }));
  }
  
  return new Paragraph({
    children,
    spacing: {
      before: 200,
      after: 200,
      line: 276,
      lineRule: LineRuleType.EXACT
    }
  });
}

/**
 * 获取Word标题级别
 * @param level Markdown标题级别
 * @returns Word标题级别
 */
export function getHeadingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
  switch (level) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    case 4: return HeadingLevel.HEADING_4;
    case 5: return HeadingLevel.HEADING_5;
    default: return HeadingLevel.HEADING_6;
  }
}

/**
 * 创建列表
 * @param items 列表项
 * @param type 列表类型
 * @returns 段落数组
 */
export function createList(items: { text: string, level: number }[], type: string): Paragraph[] {
  return items.map((item, index) => {
    const prefix = type === 'ordered' ? `${index + 1}. ` : '• ';
    return new Paragraph({
      text: `${prefix}${item.text}`,
      indent: { left: item.level * 240 + 360 },
      spacing: { before: 120, after: 120 }
    });
  });
}

/**
 * 创建表格
 * @param rows 表格行数据
 * @returns 表格段落
 */
export function createTable(rows: string[][]): Paragraph {
  // 创建表格
  const table = new Table({
    width: {
      size: 100,
      type: 'pct'
    },
    rows: rows.map((row, rowIndex) => 
      new TableRow({
        children: row.map((cell) => 
          new TableCell({
            children: [new Paragraph({ text: cell })],
            shading: {
              fill: rowIndex === 0 ? 'EEEEEE' : 'FFFFFF' // 表头使用灰色背景
            }
          })
        )
      })
    )
  });
  
  // 将表格包装在段落中返回
  return new Paragraph({
    children: [table],
    spacing: { before: 200, after: 200 }
  });
}

/**
 * 解析HTML表格并转换为docx表格
 * @param htmlTable HTML表格内容
 * @returns 表格段落
 */
export function parseHtmlTableToDocx(htmlTableContent: string): Paragraph {
  // 创建一个临时DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlTableContent;
  
  const tableElement = tempDiv.querySelector('table');
  if (!tableElement) {
    throw new Error('无效的HTML表格');
  }
  
  // 提取表格行和单元格
  const rows = Array.from(tableElement.querySelectorAll('tr'));
  const tableData: string[][] = [];
  
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td, th'));
    const rowData = cells.map(cell => cell.textContent?.trim() || '');
    tableData.push(rowData);
  });
  
  // 使用现有的createTable函数创建表格
  return createTable(tableData);
}

/**
 * 将Markdown转换为Word文档并输出为Blob
 * @param content - Markdown文本内容
 * @param fileName - 文件名（不含扩展名）
 * @param signal - 中断信号
 * @returns Promise<Blob> - 返回docx文件的Blob对象
 */
export async function exportMarkdownToDocx(content: string, fileName: string, signal: AbortSignal): Promise<Blob> {
  // 检查是否已中止
  if (signal.aborted) {
    throw new DOMException('下载已取消', 'AbortError');
  }

  try {
    // 使用docx库直接生成文档，这样可以更好地处理图片
    const lines = content.split('\n');
    const sections: any[] = [];

    for (const line of lines) {
      // 检查是否已中止
      if (signal.aborted) {
        throw new DOMException('下载已取消', 'AbortError');
      }

      // 检测并处理base64图片
      const base64Images = detectBase64Images(line);

      if (base64Images.length > 0) {
        // 如果这一行包含base64图片，处理每个图片
        for (const imageInfo of base64Images) {
          try {
            // 将base64转换为buffer
            const imageBuffer = base64ToBuffer(imageInfo.data);

            // 获取图片原始尺寸
            const dimensions = await getImageDimensionsFromBase64(imageInfo.data);
            const originalWidth = dimensions.width;
            const originalHeight = dimensions.height;

            // 计算适合Word文档的尺寸，保持纵横比
            const maxWidth = 500; // 最大宽度500px
            let displayWidth = originalWidth;
            let displayHeight = originalHeight;

            // 如果图片过宽，按比例缩放
            if (originalWidth > maxWidth) {
              const scale = maxWidth / originalWidth;
              displayWidth = maxWidth;
              displayHeight = Math.round(originalHeight * scale);
            }

            // 如果图片过高，进一步缩小（Word页面宽度考虑）
            const maxHeight = 400;
            if (displayHeight > maxHeight) {
              const scale = maxHeight / displayHeight;
              displayHeight = maxHeight;
              displayWidth = Math.round(displayWidth * scale);
            }

            // 创建图片段落
            const imageParagraph = new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: displayWidth,
                    height: displayHeight,
                  },
                }),
              ],
              spacing: { before: 200, after: 200 },
            });
            sections.push(imageParagraph);
          } catch (imageError) {
            console.error('处理base64图片失败:', imageError);
            // 如果图片处理失败，作为普通文本处理
            const textParagraph = new Paragraph({
              text: imageInfo.base64,
              spacing: { before: 200, after: 200 },
            });
            sections.push(textParagraph);
          }
        }
      } else if (line.startsWith('# ')) {
        // 标题
        const titleText = line.substring(2);
        sections.push(
          new Paragraph({
            text: titleText,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 },
          })
        );
      } else if (line.includes('<table>') || line.includes('</table>')) {
        // HTML表格（暂时作为普通文本处理）
        sections.push(
          new Paragraph({
            text: line,
            spacing: { before: 200, after: 200 },
          })
        );
      } else if (line.trim() !== '') {
        // 普通文本行
        sections.push(
          new Paragraph({
            text: line,
            spacing: { before: 200, after: 200 },
          })
        );
      } else {
        // 空行
        sections.push(new Paragraph({ spacing: { before: 100, after: 100 } }));
      }
    }

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });

    // 生成并返回blob
    return await Packer.toBlob(doc);
  } catch (error) {
    console.error('使用docx库生成Word文档失败:', error);

    // 如果docx库失败，回退到HTML转Word的方式（但不会处理base64图片）
    console.warn('回退到HTML转Word模式，base64图片将作为文本显示');

    // 构建HTML内容
    let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${fileName}</title>
    <style>
        body {
            font-family: "SimSun", "宋体", serif;
            font-size: 12pt;
            margin: 20px;
        }
        h1 {
            text-align: center;
            font-size: 18pt;
            margin: 20px 0;
        }
        p {
            margin: 10px 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        td {
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
        }
        th {
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
            background-color: #EEEEEE;
        }
    </style>
</head>
<body>`;

    const lines = content.split('\n');
    // 处理每一行内容
    for (const line of lines) {
        if (line.startsWith('# ')) {
            // 公司名称（标题）
            const companyName = line.substring(2);
            htmlContent += `<h1>${companyName}</h1>`;
        } else if (line.includes('<table>')) {
            // 直接添加表格HTML
            htmlContent += line;
        } else if (line.includes('</table>')) {
            // 继续添加表格HTML结束标签
            htmlContent += line;
        } else if (line.trim() !== '') {
            // 普通文本行
            htmlContent += `<p>${line}</p>`;
        }
    }

    // 完成HTML内容
    htmlContent += `</body>
</html>`;

    // 将HTML转换为Word文档
    const blob = await asBlob(htmlContent);
    return blob;
  }
} 