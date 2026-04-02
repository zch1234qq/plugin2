import { useEffect, useRef, useState } from "react";
import { Checkbox, Flex, Tooltip, Typography, theme as antdTheme } from "antd";
import { NodeData, Res } from "../../../common/types/types";
import { updateResData } from "../../../common/utils";
import NodeCore0 from "../_node0";
import ComNodeInput from "../../ComNodeInput";

export default function CsvDedup({ id, data }: { id: string; data: NodeData }) {
  const { token } = antdTheme.useToken();
  const [fieldName, setFieldName] = useState<string>(data.values[0] || "");
  const [ignoreCase, setIgnoreCase] = useState<string>(data.values[1] || "1"); // default: ignore case

  const fieldNameRef = useRef(fieldName);
  const ignoreCaseRef = useRef(ignoreCase);

  useEffect(() => {
    if (data.values[0] !== undefined) {
      setFieldName(data.values[0]);
      fieldNameRef.current = data.values[0];
    } else {
      data.values[0] = fieldName;
    }

    if (data.values[1] !== undefined) {
      setIgnoreCase(data.values[1]);
      ignoreCaseRef.current = data.values[1];
    } else {
      data.values[1] = ignoreCase;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fieldNameRef.current = fieldName;
    data.values[0] = fieldName;
  }, [fieldName]);

  useEffect(() => {
    ignoreCaseRef.current = ignoreCase;
    data.values[1] = ignoreCase;
  }, [ignoreCase]);

  function parseCSV(text: string): string[][] {
    if (!text) return [];
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = i < text.length - 1 ? text[i + 1] : "";

      if (char === '"' && inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
        if (char === "\r") i++;
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }

    if (currentField !== "" || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  }

  function fieldsToCSVLine(fields: string[]): string {
    return fields
      .map((cell) => {
        const v = cell ?? "";
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",");
  }

  async function run(input: Res): Promise<Res> {
    if (!input.success) return input;

    const csvText = input.msg;
    if (csvText === "") {
      return updateResData(input, {
        success: true,
        msgtypeRe: "excel",
        msg: "",
      });
    }

    const headerToFind = fieldNameRef.current.trim();
    if (!headerToFind) {
      return updateResData(input, {
        success: false,
        msg: "请设置要去重的字段名(表头)",
      });
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      return updateResData(input, {
        success: false,
        msg: "CSV数据为空",
      });
    }

    const headers = rows[0] || [];
    const ic = ignoreCaseRef.current === "1";
    const normalize = (s: string) => (ic ? s.trim().toLowerCase() : s.trim());

    const columnIndex = headers.findIndex((h) => normalize(h || "") === normalize(headerToFind));
    if (columnIndex === -1) {
      return updateResData(input, {
        success: false,
        msg: `未找到表头 "${headerToFind}"`,
      });
    }

    const seen = new Set<string>();
    const keptRows: string[][] = [];

    for (const row of rows.slice(1)) {
      const key = normalize(row?.[columnIndex] ?? "");
      if (seen.has(key)) continue;
      seen.add(key);
      keptRows.push(row);
    }

    const resultRows = [headers, ...keptRows];
    const resultCSV = resultRows.map((r) => fieldsToCSVLine(r)).join("\n");

    return updateResData(input, {
      success: true,
      msgtypeRe: "excel",
      msg: resultCSV,
    });
  }

  return (
    <NodeCore0 id={id} data={data} run0={run} width={120} tips={["输出表格", "输入表格"]}>
      <Flex vertical gap={6}>
        <Tooltip title="按表头字段去重，重复行会被移除(保留第一条)">
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            字段名
          </Typography.Text>
        </Tooltip>
        <ComNodeInput value={fieldName} onChange={setFieldName} placeholder="输入表头字段名" />
        <Tooltip title="勾选后：字段名匹配与去重值比较都会忽略大小写">
          <Checkbox
            checked={ignoreCase === "1"}
            onChange={(e) => setIgnoreCase(e.target.checked ? "1" : "0")}
            style={{ fontSize: token.fontSizeSM }}
          >
            忽略大小写
          </Checkbox>
        </Tooltip>
      </Flex>
    </NodeCore0>
  );
}

