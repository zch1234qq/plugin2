import { useEffect, useRef, useState } from "react";
import { Modal, Input } from "antd";
import MonacoEditor from "react-monaco-editor";
import { useAtom } from "jotai";

import NodeCore0 from "./_node0";
import { EnumNodeType, NodeData, RecordNodeType, Res } from "../../common/types/types";
import { stateDebug } from "../../common/store/store";
import { updateResData } from "../../common/utils";
import { javascriptService } from "../../services/javascriptService";
import { getJavaScriptEditorOptions } from "../../utils/monacoConfig";

const DEFAULT_JS_CODE =
  `// 目前仅支持浏览器端执行（非安全沙箱）\n` +
  `// 1. a 是上游传入的数据（会自动尽量转为 number）\n` +
  `// 2. 你可以给 output / result 赋值作为输出\n` +
  `// 3. 或者像 Python 节点一样：最后一行写表达式即可输出\n` +
  `\n` +
  `a`;

export default function JavaScriptExecutor({ id, data }: { id: string; data: NodeData }) {
  const [code, setCode] = useState(data.values[0] || DEFAULT_JS_CODE);
  const codeRef = useRef(code);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setIsExecuting] = useState(false);
  const [, setDebug] = useAtom(stateDebug);

  useEffect(() => {
    if (data.values[0]) {
      setCode(data.values[0]);
      codeRef.current = data.values[0];
    }
  }, [data.values]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    codeRef.current = newCode;
    data.values[0] = newCode;
  };

  const editorOptions = getJavaScriptEditorOptions();

  async function run(input: Res): Promise<Res> {
    if (!input.success) return input;

    try {
      setIsExecuting(true);
      const result = await javascriptService.executeJavaScript(codeRef.current, input);

      setDebug({
        msgtype: "text",
        show: true,
        data: `JavaScript执行结果:\n${result}`,
        loading: false,
        nodeId: id,
        nodeType: RecordNodeType[EnumNodeType.JavaScript] || "JavaScript",
        success: true,
      });

      return updateResData(input, { success: true, msg: result, msgtypeRe: "text" });
    } catch (error: any) {
      const errorMsg = `JavaScript执行失败: ${error?.message || String(error)}`;
      return updateResData(input, { success: false, msg: errorMsg, msgtypeRe: "text" });
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
        tips={["JavaScript输出", "JavaScript输入"]}
      >
        <div
          className="nodrag"
          onDoubleClick={() => setIsModalOpen(true)}
          style={{
            pointerEvents: "all",
            // Shell 节点容器固定 100px 且强制 overflow: visible，
            // 这里需要把输入区限制在节点内部，避免 TextArea 撑破外溢
            height: "calc(100% - 22px)",
            overflow: "hidden",
          }}
        >
          <Input.TextArea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="双击打开完整编辑器"
            autoSize={false}
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 12,
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              overflow: "auto",
              resize: "none",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>

        <Modal
          title="JavaScript代码编辑器"
          open={isModalOpen}
          width={900}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <div style={{ height: "520px", border: "1px solid #d9d9d9", borderRadius: "6px" }}>
            <MonacoEditor
              language="javascript"
              theme="vs"
              value={code}
              options={editorOptions}
              onChange={handleCodeChange}
              height="520px"
              editorDidMount={(editor, monaco) => {
                editor.focus();
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
                  editor.trigger("", "editor.action.triggerSuggest", {});
                });
              }}
            />
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            最后一行写表达式可自动输出；或给 <code>output</code>/<code>result</code> 赋值作为输出。
          </div>
        </Modal>
      </NodeCore0>
    </div>
  );
}

