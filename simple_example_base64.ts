import { Document, Packer, Paragraph, ImageRun, HeadingLevel } from 'docx';
import * as fs from 'fs';

// 核心代码：读取图片文件，转为base64，插入Word文档并保存 (base64方式)
async function createWordWithBase64Image() {
  try {
    // 1. 读取图片文件并转为base64
    const imagePath = '1.png';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log(`图片已转为base64，长度: ${base64Image.length} 字符`);

    // 2. 创建Word文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Base64图片插入Word文档",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,  // docx库需要buffer格式
                transformation: {
                  width: 400,
                  height: 300,
                },
              }),
            ],
          }),
          new Paragraph({
            text: `Base64数据长度: ${base64Image.length} 字符`,
          }),
        ],
      }],
    });

    // 3. 保存Word文档
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync('output_base64.docx', buffer);

    console.log('Word文档已生成：output_base64.docx');
  } catch (error) {
    console.error('生成Word文档时出错:', error);
  }
}

// 如果直接运行此文件，则执行
if (require.main === module) {
  createWordWithBase64Image();
}
