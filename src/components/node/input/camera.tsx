import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import { Flex, Button } from "antd";
import { CameraOutlined, PoweroffOutlined, SwapOutlined } from '@ant-design/icons';
import NodeCore0 from "../_node0";
import Webcam from "react-webcam";
import utils, { updateResData } from "../../../common/utils";
import ComDropdown from "../../ComDropdown";
import config from "../../../common/config/config";
import utilsImg from "../../../common/utilsImg";
import HandleOutputImg from "../../HandleOutputImg";

export default function Camera({id, data}: {id: string, data: NodeData}) {
  const [isActive, setIsActive] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [samplingRatio, setSamplingRatio] = useState<number>(0.8); // 默认设为1.0，不进行抽样
  const samplingRatioRef = useRef(samplingRatio);

  // A4纸比例 - 宽:高 = 1:1.414 (210mm:297mm)
  const A4_RATIO = 210 / 297; // 约0.707
  
  // 设置符合A4比例的分辨率
  const WIDTH = 800; // 设置适中的宽度
  const HEIGHT = Math.round(WIDTH / A4_RATIO); // 约1131

  useEffect(() => {
    samplingRatioRef.current = samplingRatio;
  }, [samplingRatio]);

  useEffect(() => {
    // 尝试获取后置摄像头
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        // 尝试找到后置摄像头
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('环境') ||
          device.label.toLowerCase().includes('后置')
        );
        
        if (backCamera) {
          setSelectedDevice(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          // 如果找不到明确的后置摄像头，使用第一个摄像头
          setSelectedDevice(videoDevices[0].deviceId);
        }
      });
  }, []);

  // 摄像头配置 - 不再强制A4比例，使用设备原生分辨率
  const videoConstraints = {
    deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
    facingMode: "environment", // 强制使用后置摄像头
    width: { ideal: WIDTH },
    height: { ideal: HEIGHT },
    // 在预览时不限制比例，允许相机使用原生比例
    // aspectRatio: showFullView ? undefined : A4_RATIO,
  };

  const captureImage = async (): Promise<string> => {
    if (!webcamRef.current) return '';
    
    // 获取视频元素的实际尺寸
    const video = webcamRef.current.video;
    if (!video) return '';
    
    // 创建canvas以确保正确的宽高比
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // 设置canvas尺寸为A4比例
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    // 计算视频内容在canvas中的位置，以避免拉伸
    let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;
    const videoRatio = video.videoWidth / video.videoHeight;
    
    if (videoRatio > A4_RATIO) {
      // 视频比A4更宽，需要裁剪宽度
      sWidth = Math.round(video.videoHeight * A4_RATIO);
      sx = Math.round((video.videoWidth - sWidth) / 2);
    } else if (videoRatio < A4_RATIO) {
      // 视频比A4更窄，需要裁剪高度
      sHeight = Math.round(video.videoWidth / A4_RATIO);
      sy = Math.round((video.videoHeight - sHeight) / 2);
    }
    
    // 绘制到canvas上，保持A4比例
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    
    // 获取高质量图像
    const screenshot = canvas.toDataURL('image/jpeg', 0.95);
    
    if (!screenshot) return '';
    
    // 只在需要时进行抽样处理
    if (samplingRatioRef.current < 1) {
      try {
        return await utilsImg.processImageWithSampling(screenshot, samplingRatioRef.current);
      } catch (error) {
        console.error("图片压缩失败:", error);
        return screenshot;
      }
    }
    return screenshot;
  };

  async function run(_input: Res): Promise<Res> {
    if(!isActive) {
      setIsActive(true);
      await utils.sleep(1); // 给摄像头一点时间启动
    }

    let input=updateResData(_input,{msgtype:"img",datas:{name:new Date().getTime().toString()}})
    
    const base64Image = await captureImage();
    if (!base64Image) {
      input=updateResData(input,{success:false,msg:"截图失败"})
      return input;
    }
    input=updateResData(input,{success:true,msg:base64Image})
    return input;
  }

  // 添加清理逻辑，确保组件卸载时关闭相机
  useEffect(() => {
    // 组件挂载时的逻辑保持不变
    
    // 组件卸载时的清理函数
    return () => {
      // 关闭摄像头
      if (webcamRef.current && webcamRef.current.video) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
          });
        }
      }
      
      // 重置状态
      setIsActive(false);
    };
  }, []); // 空依赖数组确保只在挂载和卸载时执行

  return (
    <NodeCore0 root={true} data={data} id={id} run0={run} handles={[0,0]}>
      <HandleOutputImg />
      <ComDropdown
        options={config.samplingOptions}
        value={samplingRatio}
        onChange={(value) => {
          setSamplingRatio(Number(value));
        }}
        enableWheel={true}
        placeholder="选择抽样率"
      />
      <Flex gap="2px" vertical style={{ position: 'absolute', zIndex: 1 }}>
        <Button 
          type={isActive ? "primary" : "default"}
          icon={isActive ? <PoweroffOutlined /> : <CameraOutlined />}
          onClick={() => setIsActive(!isActive)}
        />
        {/* <Button
          type={showFullView ? "primary" : "default"}
          icon={showFullView ? <FullscreenOutlined /> : <FullscreenExitOutlined />}
          onClick={() => setShowFullView(!showFullView)}
          title={showFullView ? "完整显示" : "A4比例"}
        /> */}
        {/* 增加一个切换相机的按钮 */}
        <Button 
          type="default"
          icon={<SwapOutlined />}
          onClick={() => setSelectedDevice(selectedDevice === 'environment' ? 'user' : 'environment')}
        />
      </Flex>
      <Flex
        justify="center"
        align="center"
        style={{ 
          top: 0,
          left: 0,
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '10px',
          flexDirection: 'column',
        }}>
        {isActive && (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={videoConstraints}
              screenshotFormat="image/jpeg"
              mirrored={false} // 不镜像后置相机
              style={{
                borderRadius: '5px',
                borderWidth: '1px',
                borderColor: 'lightgray',
                borderStyle: 'solid',
                width: 'auto',
                height: '100%',
                objectFit: 'contain'// 切换显示模式
              }}
            />
          </>
        )}
      </Flex>
    </NodeCore0>
  );
}