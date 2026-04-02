import { useEffect } from "react"
import { TypeImages } from "../common/types/types"
import imageCompression from 'browser-image-compression';
import utils from "../common/utils";

type Argvs={
  images:TypeImages,
  setImages:Function
}

const base64ToFile = (base64: string, filename: string): File => {
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


const handleCompress = async (originalBase64: string) => {
  const file = base64ToFile(originalBase64, 'image.webp');
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.5,          // 目标体积
    maxWidthOrHeight: 100,// 最大边长
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

export default function ImgCus({images,setImages}:Argvs) {
  // const [sub,setSub]=useState("")
  useEffect(()=>{
    handleCompress(images.pri)
    .then(res=>{
      images.sub=res
      setImages(images)
    })
    .catch(error=>{
      utils.log(error);
    })
  },[])
  return(
    <>
    {/* {
      sub!=""&&
      <img src={sub}></img>
    } */}
    {
      images.pri!=""&&
      <img src={images.pri}></img>
    }
    </>
  )
}