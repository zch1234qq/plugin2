import imageCompression from "browser-image-compression";
import Compressor from 'compressorjs'

const base64ToFile = (base64: string, filename: string): File => {
  if (!base64) {
    return new File([], '');
  }
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
export const handleCompress = async (originalBase64: string): Promise<string> => {
  // return new Promise<string>((resolve, _) => {
  //   resolve(originalBase64);
  // });
  if(originalBase64==""|| originalBase64==undefined||originalBase64==null){
    return new Promise<string>((resolve, _) => {
      resolve("");
    });
  }
  const file = base64ToFile(originalBase64, 'image.webp');
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.6,          // 目标体积
    maxWidthOrHeight: 500,// 最大边长
    useWebWorker: true,    // 启用多线程
    fileType: 'image/webp' // 输出格式
  });
  return new Promise<string>((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result?.toString()!);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('压缩失败:', err);
      reject(err);
    }
  });
};

export const handleCompress2 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 1,
        maxWidth: 400,
        success(compressedFile) {
          try {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result?.toString()!);
            };
            reader.readAsDataURL(compressedFile);
          } catch (err) {
            console.error('压缩失败:', err);
            reject(err);
          }
        },
        error(err) {
          reject(err);
        },
        // 性能优化配置
        convertSize: 1_000_000, // 超过1MB转WebP
        // threads: navigator.hardwareConcurrency || 4 // 多线程
      });
    });
};
/**
 * 处理图片并进行抽样（保持原始宽高比）
 * @param dataUrl 图片的base64数据
 * @param samplingRatio 抽样率，值为0-1，1表示不抽样
 * @returns 处理后的图片base64数据
 */
export async function processImageWithSampling(input: string | File, samplingRatio: number): Promise<string> {
  // 如果是文件类型，先转换为 dataURL
  const dataUrl = typeof input === 'string' ? input : await fileToDataURL(input);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }
        const originalWidth = img.width;
        const originalHeight = img.height;
        const aspectRatio = originalWidth / originalHeight;
        
        // 计算抽样后的尺寸（保持宽高比）
        let targetWidth=500, targetHeight=500;
        let primativeSize=originalWidth*originalHeight
        let maxSize=1200
        //1600token限制=40*40*28*28像素面积
        let maxTimes=Math.sqrt(primativeSize/(40*40*28*28))
        maxSize=Math.max(originalWidth,originalHeight)/maxTimes
        let topSize=1500
        if(samplingRatio>1){
          topSize=10000
        }
        //2500token限制=50*50*28*28像素面积
        let topTimes=Math.sqrt(primativeSize/(50*50*28*28))
        topSize=Math.max(originalWidth,originalHeight)/topTimes
        let horizontal=originalWidth>originalHeight
        if (samplingRatio < 1) {
          if(horizontal){
            // 抽样处理
            targetWidth = Math.min(Math.round(originalWidth * samplingRatio), maxSize);
            targetHeight = Math.round(targetWidth / aspectRatio);
          }else{
            // 抽样处理
            targetHeight = Math.min(Math.round(originalHeight * samplingRatio), maxSize);
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        } else if (samplingRatio==1) {
          if(horizontal){
            targetWidth = Math.min(Math.round(originalWidth), topSize);
            targetHeight = Math.round(targetWidth / aspectRatio);
          }
          else{
            targetHeight = Math.min(Math.round(originalHeight), topSize);
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }else if (samplingRatio>1) {
          if(horizontal){
            targetWidth = Math.min(Math.round(originalWidth), 5000);
            targetHeight = Math.round(targetWidth / aspectRatio);
          }
          else{
            targetHeight = Math.min(Math.round(originalHeight), 5000);
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }
        
        // 设置canvas尺寸
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // 绘制图像（保持宽高比）
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // 获取压缩后的图像数据
        const quality = samplingRatio < 1 ? 0.85 : 0.92; // 根据抽样率调整质量
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedDataUrl);
      } catch (error) {
        console.error('图像处理失败:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('图像加载失败:', error);
      reject(error);
    };
    
    img.src = dataUrl;
  });
}

// 辅助函数：将 File 转换为 DataURL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 辅助函数：将网络图片转换为 DataURL
export async function urlToDataURL(imageUrl: string): Promise<string> {
  // 暂时禁用代理，因为实际代理配置可能不存在
  const useProxy = false;
  let proxyImageUrl = imageUrl;
  
  if (useProxy && imageUrl.startsWith('http')) {
    // 如果是网络图片，尝试使用代理
    // 这里需要根据实际情况配置代理路径
    // 示例：将图片URL转换为代理请求
    const proxyPath = '/api/image-proxy';
    proxyImageUrl = `${proxyPath}?url=${encodeURIComponent(imageUrl)}`;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 处理跨域图片
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }
        
        // 设置canvas尺寸为图片尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0);
        
        // 转换为dataURL（使用JPEG格式，质量0.9）
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataURL);
        } catch (canvasError) {
          console.error('Canvas转换失败，可能是跨域限制:', canvasError);
          // 如果canvas转换失败，尝试使用fetch API
          fallbackToFetch(imageUrl, resolve, reject);
        }
      } catch (error) {
        console.error('网络图片转换失败:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('网络图片加载失败:', error);
      console.error('原始图片URL:', imageUrl);
      console.error('代理图片URL:', proxyImageUrl);
      console.error('可能的跨域问题，请检查服务器CORS配置');
      
      // 如果使用代理失败，尝试直接使用原始URL
      if (useProxy && proxyImageUrl !== imageUrl) {
        loadImageWithOriginalUrl(imageUrl, resolve, reject);
      } else {
        reject(new Error(`网络图片加载失败: ${error instanceof Event ? 'Event error' : error.message}`));
      }
    };
    
    img.src = proxyImageUrl;
  });
}

// 备用方案：使用fetch API获取图片数据
async function fallbackToFetch(imageUrl: string, resolve: (dataURL: string) => void, reject: (error: Error) => void) {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`);
    }
    
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Blob转换失败'));
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Fetch备用方案失败:', error);
    reject(new Error(`Fetch备用方案失败: ${error instanceof Error ? error.message : '未知错误'}`));
  }
}

// 使用原始URL重新加载图片
function loadImageWithOriginalUrl(imageUrl: string, resolve: (dataURL: string) => void, reject: (error: Error) => void) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建canvas上下文');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataURL);
    } catch (error) {
      reject(new Error(`原始URL加载失败: ${error instanceof Error ? error.message : '未知错误'}`));
    }
  };
  
  img.onerror = (error) => {
    reject(new Error(`原始URL加载失败: ${error instanceof Event ? 'Event error' : '未知错误'}`));
  };
  
  img.src = imageUrl;
}

export async function processHttpImageWithSampling(input: string | File, samplingRatio: number): Promise<string> {
  if(typeof input === 'string' && input.startsWith('http')){
    //将网络图片转为  dataurl图片
    const dataUrl = await urlToDataURL(input);
    
    //调整图片尺寸
    return await processImageWithSampling(dataUrl, samplingRatio);
  }else{
    //如果是本地图片，直接调整图片尺寸
    return await processImageWithSampling(input, samplingRatio);
  }
}

export default {
  handleCompress,
  handleCompress2,
  processImageWithSampling,
  processHttpImageWithSampling,
  urlToDataURL
}