import * as pdfjs from 'pdfjs-dist';

// 使用相对路径加载 Worker
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.mjs`;

export default pdfjs; 