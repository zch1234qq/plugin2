import { useRef, useState, useEffect } from "react";
import { EnumNodeType, NodeData, RecordNodeType, Res } from "../../common/types/types";
import NodeCore0 from "./_node0";
import { pythonService } from "../../services/pythonService";
import { Modal} from "antd";
import { useAtom } from "jotai";
import { stateDebug } from "../../common/store/store";
import MonacoEditor from "react-monaco-editor";
import ComNodeInput from "../ComNodeInput";
import { initializePythonLanguageSupport, configureBasicPythonSupport, getPythonEditorOptions } from "../../utils/monacoConfig";
import { updateResData } from "../../common/utils";

export default function PythonExecutor({id, data}: {id: string, data: NodeData}) {
  const [code, setCode] = useState(data.values[0] || '#目前仅支持基础的package，未来将支持更多的package，如numpy、pandas等\n#1.a就是上游传入的数据\n#2.在代码底部添加变量名，就可以简洁地向下游输出结果\na')
  const codeRef = useRef(code)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setIsExecuting] = useState(false);
  const [, setDebug] = useAtom(stateDebug);

  // 初始化代码编辑器和Python语言支持
  useEffect(() => {
    // 初始化Python语言支持
    const initPythonSupport = async () => {
      try {
        const wrapper = await initializePythonLanguageSupport();
        if (!wrapper) {
          // 如果 monaco-python 初始化失败，使用基础配置
          configureBasicPythonSupport();
        }
      } catch (error) {
        console.warn('Python语言支持初始化失败:', error);
        // 使用基础配置作为备用方案
        configureBasicPythonSupport();
      }
    };
    
    initPythonSupport();
    
    if (data.values[0]) {
      setCode(data.values[0])
      codeRef.current = data.values[0]
    }
  }, [data.values])

  const handleDoubleClick = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    data.values[0] = codeRef.current;
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    codeRef.current = newCode;
    data.values[0] = newCode;
  };

  // 使用增强的Python编辑器选项
  const editorOptions = getPythonEditorOptions();

  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }

    try {
      setIsExecuting(true);
      // 准备Python代码，注入输入数据
      const inputScript = `
# 设置输入变量
class VarsHelper:
    def __init__(self, input_data):
        self._data = {"input": input_data}

    def get(self, key, default=""):
        return self._data.get(key, default)
try:
    a = float("${input.msg}")
    if a.is_integer():
        a = int(a)
except:
    a = str("${input.msg}")
`;
      // 拼接用户代码
      const fullCode = inputScript + "\n" + codeRef.current;
      // 执行代码
      const result = await pythonService.executePython(fullCode);
      
      // 显示调试信息
      setDebug({
        msgtype: "text",
        show: true,
        data: `Python执行结果:\n${result}`,
        loading: false,
        nodeId: id,
        nodeType: RecordNodeType[EnumNodeType.Python] || 'Python',
        success: true
      });
      
      return updateResData(input,{success: true,msg: result,msgtypeRe:"text"}); 
    } catch (error: any) {
      const errorMsg = `Python执行失败: ${error.message}`;
      return updateResData(input,{success: false,msg: errorMsg,msgtypeRe:"text"});
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div>
      <NodeCore0
        root={false} 
        handles={[1, 1]} 
        run0={run} 
        id={id} 
        data={data}
        width={200}
        tips={["Python输出", "Python输入"]}
      >
        <ComNodeInput
          value={code}
          onChange={handleCodeChange}
          onDoubleClick={handleDoubleClick}
        />
        <Modal
          title="Python代码编辑器"
          open={isModalOpen}
          width={800}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
        >
          <div style={{ height: '500px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
            <MonacoEditor
              language="python"
              theme="vs"
              value={code}
              options={editorOptions}
              onChange={handleCodeChange}
              height="500px"
              editorDidMount={(editor, monaco) => {
                // 编辑器挂载完成后，设置焦点
                editor.focus();
                // 可选：添加自定义命令或快捷键
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
                  editor.trigger('', 'editor.action.triggerSuggest', {});
                });
              }}
            />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            在代码底部添加变量名，就可以简洁地向下游输出结果
          </div>
        </Modal>
      </NodeCore0>
    </div>
  )
}