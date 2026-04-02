import React, { Dispatch, useRef } from 'react';
import { Button } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { SetStateAction } from 'jotai';
import utils from '../common/utils';

export default function InputCus({setImage,setFile,size}:
  {
    setImage:Dispatch<SetStateAction<string>>,
    setFile:Dispatch<SetStateAction<File>>,
    size?:"small"|"middle"|"large"
  }){
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<any>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if(event.target.files!=undefined){
      var file=event.target.files[0]
      if (file) {
        setFile(file)
        const reader = new FileReader(); // 创建 FileReader 对象
        reader.onload = (e) => {
          let base64=e.target!.result?.toString()!;
          setImage(base64);
          utils.log(base64);
        };
        reader.readAsDataURL(file); // 将文件读取为 Data URL（Base64）
      }
    }
    const antdFile = {
      uid: Date.now().toString(),
      name: files[0].name,
      status: 'done' as const,
      originFileObj: files[0],
    };
    uploadRef.current?.onChange({
      file: antdFile,
      fileList: [antdFile],
    });
  };
  // 触发相册模式
  const selectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };
  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* <Upload
        ref={uploadRef}
        showUploadList={false}
        customRequest={({ onSuccess }) => onSuccess?.('ok')} // 禁用默认上传
      >
        <div style={{ display: 'flex'}}> */}
          <Button size={size}
            icon={<CameraOutlined />}
            onClick={selectFile}
          >
          </Button>
        {/* </div>
      </Upload> */}
    </div>
  );
};