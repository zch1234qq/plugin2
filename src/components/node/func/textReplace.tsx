import { useEffect, useState } from "react";
import { Flex, Input, Tooltip } from "antd";
import NodeCore0 from "../_node0";
import { NodeData, Res } from "../../../common/types/types";
import { updateResData } from "../../../common/utils";

/**
 * 文本替换节点
 * 将输入文本中的指定内容替换为目标内容
 */
export default function TextReplace({ id, data }: { id: string; data: NodeData }) {
  const [findText, setFindText] = useState<string>(data.values[0] || "");
  const [replaceText, setReplaceText] = useState<string>(data.values[1] || "");

  // 初始化：如果有存储值则同步到状态
  useEffect(() => {
    if (data.values[0]) setFindText(data.values[0]);
    if (data.values[1]) setReplaceText(data.values[1]);
  }, []);

  // 状态变更同步到 ref 和 data.values 以便保存
  useEffect(() => {
    data.values[0] = findText;
  }, [findText, data.values]);

  useEffect(() => {
    data.values[1] = replaceText;
  }, [replaceText, data.values]);

  // 处理函数
  async function run(input: Res): Promise<Res> {
    if (!input.success) return input;

    const source = input.msg == null ? "" : String(input.msg);
    const needle = data.values[0];
    const replacement = data.values[1];

    // 如果查找字符串为空，直接返回原文
    if (!needle) {
      return updateResData(input, {
        success: true,
        msg: source,
        msgtypeRe: "text",
      });
    }

    // 转义正则特殊字符
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 如果待替换字符串包含多个字符，则逐个字符替换为同一个 replacement
    const regex =
      needle.length <= 1
        ? new RegExp(escapeRegExp(needle), "g")
        : new RegExp(
            `[${Array.from(new Set(needle.split("").map(escapeRegExp))).join("")}]`,
            "g"
          );

    const result = source.replace(regex, replacement);

    return updateResData(input, {
      success: true,
      msg: result,
      msgtypeRe: "text",
    });
  }

  return (
    <NodeCore0
      id={id}
      data={data}
      run0={run}
      width={100}
      tips={["输出文本", "输入文本"]}
    >
      <Flex vertical gap={6}>
        <Tooltip title="待替换文字">
          <Input
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            style={{ fontSize: 12 }}
          />
        </Tooltip>
        <Tooltip title="替换后文字">
          <Input
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            style={{ fontSize: 12 }}
          />
        </Tooltip>
      </Flex>
    </NodeCore0>
  );
}

