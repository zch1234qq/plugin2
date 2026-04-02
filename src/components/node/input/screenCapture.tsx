import { useCallback, useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore0 from "../_node0";
import { Button, message } from "antd";
import * as Icons from '@ant-design/icons';
import { updateResData } from "../../../common/utils";

export default function ScreenCapture({id, data}: {id: string, data: NodeData}) {
  const [isRecording, setIsRecording] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // 使用 ref 存储最新状态，避免闭包问题
  const stateRef = useRef({
    isRecording,
    capturedImage,
    stream
  });
  
  // 更新ref中的状态
  useEffect(() => {
    stateRef.current = {
      isRecording,
      capturedImage,
      stream
    };
  }, [isRecording, capturedImage, stream]);

  // 组件挂载时输出日志
  useEffect(() => {
    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
      }
      
      // 清除视频元素的源
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject = null;
      }
      
      // 重置状态
      setIsRecording(false);
      setStream(null);
      setCapturedImage(null);
    };
  }, []); // 空依赖数组确保只在挂载和卸载时执行

  // 监听 videoRef 和 stream 变化
  useEffect(() => {
    // 如果视频元素和流都存在，则连接它们
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // 添加视频元素事件监听
      videoRef.current.onloadedmetadata = () => {
      };
      
      videoRef.current.oncanplay = () => {
      };
    }
  }, [videoRef.current, stream]);

  // 开始预览
  async function startPreview() {
    try {
      // 停止之前的预览
      stopPreview();
      // 请求屏幕共享
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      setStream(newStream);
      
      // 监听流结束事件（用户停止共享）
      newStream.getVideoTracks()[0].onended = () => {
        stopPreview();
      };
      
      setIsRecording(true);
    } catch (error) {
      console.error('开始预览失败:', error);
      window.messageApi.error('获取屏幕预览失败');
      setIsRecording(false);
    }
  }

  // 停止预览
  function stopPreview() {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    setIsRecording(false);
  }

  // 切换预览状态
  const togglePreview = async () => {
    if (isRecording) {
      stopPreview();
    } else {
      await startPreview();
    }
  };

  // 捕获当前帧并返回 base64 图像数据
  const captureCurrentFrame = (): string | null => {
    // 使用 ref 获取最新状态
    const { isRecording, stream } = stateRef.current;
    
    if (!isRecording || !videoRef.current || !stream) {
      return null;
    }
    
    try {
      const video = videoRef.current;
      
      // 如果视频尺寸为0，说明视频可能未完全加载
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        // 如果视频已经有了srcObject但尺寸为0，可能需要等待元数据加载
        if (video.srcObject) {
          // 使用固定尺寸作为备用
          const canvas = document.createElement('canvas');
          canvas.width = 1280;  // 默认宽度
          canvas.height = 720;  // 默认高度
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return null;
          }
          
          // 强制绘制当前视频帧
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          return imageData;
        }
        
        return null;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }
      
      // 绘制当前视频帧到画布
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 转换为高质量图像数据
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      return imageData;
    } catch (error) {
      console.error("捕获过程中发生错误:", error);
      return null;
    }
  };

  // 使用 useCallback 更新 run 函数的引用
  const run = useCallback(async (input: Res): Promise<Res> => {
    const { isRecording, capturedImage, stream } = stateRef.current;
    // 如果正在观察，尝试捕获当前帧
    if (isRecording && stream) {
      try {
        const currentFrame = captureCurrentFrame();
        if (currentFrame) {
          // 保存捕获的图像以便下次使用
          setCapturedImage(currentFrame);
          return updateResData(input,{
            success: true,
            msg: currentFrame
          });
        } else {
          console.error("捕获当前帧失败，但观察状态为开启");
          return updateResData(input,{
            success: false,
            msg: "捕获当前帧失败，请检查屏幕共享状态"
          });
        }
      } catch (error) {
        console.error("捕获帧时发生错误:", error);
        return updateResData(input,{
          success: false,
          msg: "捕获过程中发生错误: " + (error instanceof Error ? error.message : String(error))
        });
      }
    } else {
      return updateResData(input,{
        success: false,
        msg: "请先点击按钮开始观察屏幕"
      });
    }
  }, []); // 依赖数组为空，但我们使用ref获取最新状态

  return (
    <NodeCore0
      root={true} 
      data={data}
      id={id}
      run0={run}
      handles={[1, 0]}
      colors={[1, 0]}
    >
      <div style={{ position: 'absolute',left: 5, top: 5, zIndex: 10, display: 'flex', gap: '4px' }}>
        <Button 
          type={isRecording ? "primary" : "default"}
          icon={isRecording ? <Icons.PoweroffOutlined /> : <Icons.PoweroffOutlined />}
          onClick={togglePreview}
        />
      </div>
      
      <div style={{ 
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '10px',
        left: 0,
        top: 0,
        backgroundColor: '#f5f5f5'
      }}>
        {isRecording ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '5px',
              backgroundColor: 'transparent'
            }}
          />
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="已捕获的屏幕"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '5px'
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px',
            fontSize: '12px',
            color: '#666'
          }}>
            点击开始观察
          </div>
        )}
      </div>
    </NodeCore0>
  );
}