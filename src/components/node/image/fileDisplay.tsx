import { useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore0 from "../_node0";
import ImageDisplay from "../../ImageDisplay";
import HandleInputImg from "../../HandleInputImg";
export default function FileDisplay({ id, data }: { id: string, data: NodeData }) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("unknown");

  // 处理文件内容
  async function run(input: Res): Promise<Res> {
    if (!input.success || !input.msg) {
      setFileContent(null);
      setFileType("unknown");
      return input;
    }

    setFileContent(input.msg);
    // 判断文件类型
    if (input.msg.startsWith('data:image/')) {
      setFileType('image');
    } else {
      setFileType('other');
    }
    return input;
  }

  return (
    <NodeCore0
      run0={run}
      id={id}
      width={120}
      data={data}
      handles={[1, 0]}
      colors={[1, 1]}
    >
      <HandleInputImg tip="输入文件" />
      <div style={{ width: "100%", height: "100%", padding: "5px" }}>
        {fileContent ? (
          <>
            {fileType === 'image' && (
              <ImageDisplay
                src={fileContent}
                alt="文件内容"
                containerStyle={{ padding: "5px" }}
              />
            )}
            {fileType === 'other' && (
              <div style={{ 
                width: "100%", 
                height: "100%", 
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}>
                不支持的文件类型
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            width: "100%", 
            height: "100%", 
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            等待文件输入...
          </div>
        )}
      </div>
    </NodeCore0>
  );
} 