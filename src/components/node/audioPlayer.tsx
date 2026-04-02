import Shell from "./shell1";
import { useEffect, useRef, useState } from "react";
import { EnumNodeType, NodeData, Res } from "../../common/types/types";
import { Button, Flex, Upload } from "antd";
import {UploadOutlined } from "@ant-design/icons";
import ComHandleDot from "../ComHandleDot";
import HandleOutputText from "../HandleOutputText";
/**
 * 简单音频播放节点组件
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 音频播放节点组件
 */
export default function AudioPlayer({id, data}: {id: string, data: NodeData}) {
  const [updateFlag, setUpdateFlag] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const audioUrlRef = useRef(audioUrl);
  const [, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("未选择文件");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showNode,setShowNode]=useState(true)
  // const [showNode,setShowNode]=useState(!(data.values[-1]=="1"))

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    if (!audioUrl) {
      const fetchAudio = async () => {
        const res = await fetch("sound.mp3");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      fetchAudio();
    }
  }, []);

  const runs: Record<string, (res: Res) => Promise<Res>> = {
    "0": run
  };

  /**
   * 运行节点，播放音频
   * @param {Res} input - 输入结果
   * @returns {Promise<Res>} 处理结果
   */
  async function run(input: Res): Promise<Res> {
    if (!audioUrlRef.current) {
      window.messageApi.warning("请先选择音频文件");
      return input;
    }
    try {
      if (audioRef.current) {
        setIsPlaying(true);
        // 等待播放完成
        await new Promise((resolve) => {
          audioRef.current!.onended = resolve;
          audioRef.current!.play();
        });
        setIsPlaying(false);
      }
    } catch (error: any) {
      window.messageApi.error(`音频播放失败`);
      setIsPlaying(false);
    }
    return input;
  }

  /**
   * 处理文件上传
   * @param {Object} info - 上传信息
   */
  const handleFileChange = (info: any) => {
    const file = info.file;
    if (file.status === 'done') {
      // 创建文件的URL
      const url = URL.createObjectURL(file.originFileObj);
      setAudioUrl(url);
      setFileName(file.name);
      window.messageApi.success(`${file.name} 上传成功`);
    } else if (file.status === 'error') {
      window.messageApi.error(`${file.name} 上传失败`);
    }
  };

  // 上传组件的属性
  const uploadProps = {
    name: 'file',
    accept: 'audio/*',
    showUploadList: false,
    customRequest: ({ file, onSuccess }: any) => {
      file
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    onChange: handleFileChange,
  };

  useEffect(() => {
    if (data.label === EnumNodeType.AudioPlayer && data.values[0]) {
      setAudioUrl(data.values[0]);
      setFileName(data.values[1] || "已选择音频文件");
    }
  }, [data.label]);

  // 保存节点数据
  useEffect(() => {
    data.values[0] = audioUrl;
    data.values[1] = fileName;
    setUpdateFlag(!updateFlag);
  }, [audioUrl, fileName]);

  // 添加组件卸载时的资源清理
  useEffect(() => {
    // 组件挂载逻辑...
    
    // 返回清理函数
    return () => {
      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // 释放音频资源URL
      if (audioUrlRef.current && audioUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      // 重置状态
      setIsPlaying(false);
      setAudioUrl("");
    };
  }, []); // 空依赖数组确保只在挂载和卸载时执行

  return (
      <Shell
        root={true}
        width={100}
        data={data} updateFlag={updateFlag} id={id} runs={runs}
      >
      <audio
        ref={audioRef}
        src={audioUrl}
        style={{ display: "none" }}
      />
      {showNode&&
        <Flex gap={1}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}></Button>
          </Upload>
        </Flex>
      }
      <ComHandleDot/>
      <HandleOutputText />
    </Shell>
  );
} 