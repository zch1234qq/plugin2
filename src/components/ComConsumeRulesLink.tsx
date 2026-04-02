import { Modal, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import { parse } from "papaparse";
import ComTextLink from "./ComTextLink";

type Props = {
  linkText?: string;
  modalWidth?: number;
};

// 计费明细（CSV）——后续若有接口，可直接替换为接口返回的 CSV 字符串
const BILLING_CSV = `消耗类型,消耗规则
按量,"文字AI类节点：\n1.每输入/输出1千字消耗1点。最低仅消耗0.1点。\n2.当输出字数小于等于2000时，封顶消耗1点。\n3.当输出字数大于2000时，按量计费。"
按量,"图片AI类节点：\n1.每280*280像素消耗0.1点，每输入/输出1千字消耗1点。最低仅消耗0.8点。\n2.当输出字数小于等于100时，最多消耗2点。\n3.当输出字数大于100时，按量计费。"
按次,"发票识别每次消耗2.5点，OCR(元素)每次消耗2点。"
`;
export default function ComConsumeRulesLink({
  linkText = "点此查看消耗规则",
  modalWidth = 720,
}: Props) {
  const [modalShow, setModalShow] = useState(false);
  const billingTable = useMemo(() => {
    const results = parse<string[]>(BILLING_CSV, { skipEmptyLines: true });
    const rows = (results.data || []).filter((r) => Array.isArray(r) && r.length > 0);

    const header = (rows[0] || []).map((h) => String(h ?? "").trim()).filter(Boolean);
    const dataRows = rows.slice(1);

    const columns = header.map((title, index) => ({
      title,
      dataIndex: String(index),
      key: String(index),
      render: (value: unknown) => (
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {String(value ?? "")}
        </div>
      ),
      ...(index === 0 ? { width: 120 } : {}),
    }));

    const dataSource = dataRows.map((row, rowIndex) => {
      const record: Record<string, string> = { key: String(rowIndex) };
      header.forEach((_h, colIndex) => {
        record[String(colIndex)] = String(row?.[colIndex] ?? "");
      });
      return record;
    });

    return { columns, dataSource };
  }, []);

  return (
    <>
      <ComTextLink onClick={() => setModalShow(true)}>{linkText}</ComTextLink>

      <Modal
        open={modalShow}
        width={modalWidth}
        footer={null}
        destroyOnClose
        onCancel={() => setModalShow(false)}
      >
        <Typography.Paragraph type="secondary">
          注：仅浅蓝色的节点消耗资源点，其余任何节点均不消耗资源点。
        </Typography.Paragraph>
        <Table
          size="small"
          pagination={false}
          columns={billingTable.columns}
          dataSource={billingTable.dataSource}
          scroll={{ x: true }}
        />
      </Modal>
    </>
  );
}

