import { Image, Modal } from "antd";
import { CSSProperties, useEffect, useState } from "react";

/**
 * 图片显示组件属性
 */
interface ImageDisplayProps {
  /** 图片URL或Base64数据 */
  src: string;
  /** 图片加载失败时的替代文本 */
  alt?: string;
  /** 容器样式 */
  containerStyle?: CSSProperties;
  /** 图片样式 */
  imageStyle?: CSSProperties;
  /** 宽度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  /** 是否允许预览 */
  previewable?: boolean;
  /** 是否使用内部modal */
  onClick?: () => void;
}

/**
 * 通用图片显示组件
 * 支持点击图片预览、自定义样式和错误处理
 */
export default function ImageDisplay({
  src,
  alt = "图片",
  containerStyle,
  imageStyle,
  width = "100%",
  height = "auto",
  previewable = true,
  onClick
}: ImageDisplayProps) {
  const [error, setError] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(()=>{
    setError(false)
  },[src])

  // 默认容器样式
  const defaultContainerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    height: "100%",
    ...containerStyle
  };

  // 默认图片样式
  const defaultImageStyle: CSSProperties = {
    objectFit: "contain",
    maxWidth: "100%",
    maxHeight: "100%",
    width: "100%",
    height: "100%",
    cursor: previewable ? "pointer" : "default",
    ...imageStyle
  };

  // 处理图片加载错误
  const handleError = () => {
    console.error("图片加载失败:", src);
    setError(true);
  };

  // 打开预览
  const handlePreview = () => {
    if(onClick){
      onClick()
    }else{
      if (previewable) {
        setPreviewVisible(true);
      }
    }
  };

  // 关闭预览
  const handleCancel = () => {
    setPreviewVisible(false);
  };

  return (
    <div className="image-display-container" style={defaultContainerStyle}>
      {error ? (
        <div className="image-error">图片加载失败</div>
      ) : (
        <>
          <Image
            src={src}
            alt={alt}
            style={defaultImageStyle}
            preview={false}
            width={width}
            height={height}
            onError={handleError}
            onClick={previewable ? handlePreview : undefined}
          />
          
          {/* 预览模态框 */}
          <Modal
            open={previewVisible}
            footer={null}
            onCancel={handleCancel}
            width="auto"
            centered
            styles={{ 
              body: { padding: 0, backgroundColor: "transparent" }
            }}
            style={{ maxWidth: "90vw" }}
          >
            <img 
              src={src} 
              alt={alt} 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "80vh",
                margin: "0 auto",
                display: "block"
              }} 
            />
          </Modal>
        </>
      )}
    </div>
  );
} 