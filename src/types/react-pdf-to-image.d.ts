declare module 'react-pdf-to-image' {
  export class PDFToImage {
    static convert(pdfData: string): Promise<string[]>;
  }
}