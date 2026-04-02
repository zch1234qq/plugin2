import Shell from "../shell1";
import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import {Upload } from "antd";
import { DeleteOutlined, PictureOutlined } from "@ant-design/icons";
import ImageDisplay from "../../ImageDisplay";
import ComDropdown from "../../ComDropdown";
import type { UploadProps } from 'antd';
import config from "../../../common/config/config";
import utilsImg from "../../../common/utilsImg";
import { updateResData } from "../../../common/utils";
import ComHandleDot from "../../ComHandleDot";
import HandleOutputImg from "../../HandleOutputImg";
export default function InImg({id,data}:{id:string,data:NodeData}){
  const [updateFlag,setUpdateFlag]=useState(false)
  const [path,setPath]=useState("")
  const pathRef=useRef(path)
  const [compressedPath, setCompressedPath] = useState<string>("");
  const compressedPathRef = useRef<string>("");
  const [samplingRatio, setSamplingRatio] = useState<number>(1);
  const samplingRatioRef = useRef(samplingRatio);
  const [isUploading, setIsUploading] = useState(false);
  const refFileName=useRef("")

  useEffect(()=>{
    if(data.values[0]){
      setSamplingRatio(Number(data.values[0]));
      samplingRatioRef.current = Number(data.values[0]);
    }
  },[]);

  useEffect(() => {
    samplingRatioRef.current = samplingRatio;
    data.values[0] = samplingRatio.toString();
  }, [samplingRatio]);

  useEffect(() => {
    compressedPathRef.current = compressedPath;
  }, [compressedPath]);

  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run
  };

  async function run(input: Res): Promise<Res> {
    if(!pathRef.current) {
      return updateResData(input, { success: false, msg: "请选择图片" });
    }
    // 更新 input 数据而不是重新创建
    input = updateResData(input, {
      msgtype: "img",
      msgtypeRe:"img",
      datas: {
        name: refFileName.current
      }
    });
    
    const currentRatio = samplingRatioRef.current;
    try {
      if (compressedPathRef.current) {
        if (currentRatio < 1) {
          const processedDataUrl = await utilsImg.processImageWithSampling(compressedPathRef.current, currentRatio);
          // 使用更新后的 input
          return updateResData(input, { 
            msg: processedDataUrl 
          });
        }
        return updateResData(input, { 
          msg: compressedPathRef.current 
        });
      }
      
      try {
        let dataurl = await utilsImg.processImageWithSampling(pathRef.current, 1);
        setCompressedPath(dataurl);
        compressedPathRef.current = dataurl;
        if (currentRatio < 1) {
          dataurl = await utilsImg.processImageWithSampling(dataurl, currentRatio);
          return updateResData(input, { 
            msg: dataurl 
          });
        }
        
        return updateResData(input, { 
          msg: dataurl 
        });
      } catch (compressionError) {
        console.error('图片压缩失败:', compressionError);
        if (currentRatio < 1) {
          try {
            const processedDataUrl = await utilsImg.processImageWithSampling(pathRef.current, currentRatio);
            return updateResData(input, { 
              msg: processedDataUrl 
            });
          } catch (samplingError) {
            console.error('图片抽样处理失败:', samplingError);
          }
        }
        return updateResData(input, { 
          msg: pathRef.current 
        });
      }
    } catch (error) {
      console.error("图片处理失败:", error);
      return updateResData(input, { 
        msg: pathRef.current 
      });
    }
  }
  
  const handleDeleteImage = () => {
    setPath("");
    pathRef.current = "";
    setCompressedPath("");
    compressedPathRef.current = "";
    setUpdateFlag(!updateFlag);
    window.messageApi.success("图片已删除");  
  };
  
  /**
   * 处理图片上传
   */
  const handleFileUpload: UploadProps['beforeUpload'] = async (file) => {
    // 开始上传
    setIsUploading(true);

    try {
      // 读取文件
      const reader = new FileReader();
      reader.onload = async (e) => {
        let _path = e.target!.result!.toString();
        setPath(_path);
        pathRef.current = _path;
        refFileName.current = file.name
        setCompressedPath("");
        compressedPathRef.current = "";
        
        setUpdateFlag(!updateFlag);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("图片上传处理错误:", error);
      window.messageApi.error("图片上传失败");
      setIsUploading(false);
    }
    return false;
  };

  return(
    <Shell data={data} updateFlag={updateFlag} root={true} id={id} runs={runs}>
      <ComHandleDot/>
      <HandleOutputImg />
      <div style={{
        position: "absolute",
        top:0,
        left:0,
        right:0,
        bottom:0,
        width: "100%",
        height: "100%",
      }}>
        <div style={{ 
          width: "100%", 
          height: "100%",
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative"
        }}>
          {path === "" ? (
            <Upload
              name="image"
              showUploadList={false}
              accept="image/*"
              beforeUpload={handleFileUpload}
              disabled={isUploading}
            >
              <PictureOutlined style={{ 
                fontSize: '64px', 
                color: '#1890ff',
                cursor: 'pointer'
              }} />
            </Upload>
          ) : (
            <div style={{ 
              width: 'auto',
              height: '100%',
              position: 'relative',
            }}>
              <ImageDisplay 
                width="100%"
                height="100%"
                src={path}
                alt="上传的图片"
                previewable={true}
              />
              <DeleteOutlined 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage();
                }}
                className="delete-icon"
              />
            </div>
          )}
        </div>
      </div>
      <ComDropdown
        title="降低清晰度可节约资源点，但可能导致图片模糊。"
        options={config.samplingOptions}
        value={samplingRatio}
        onChange={(value) => {
          setSamplingRatio(Number(value));
        }}
        enableWheel={true}
        placeholder="选择清晰度"
      />
    </Shell>
  )
}