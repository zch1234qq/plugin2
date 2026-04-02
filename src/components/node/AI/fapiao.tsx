import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import NodeCore0 from "../_node0";
import { updateResData } from "../../../common/utils";
import utilsImg from "../../../common/utilsImg";
import { Checkbox, Space } from "antd";
import server from "../../../common/service/server";

const CSV_COLUMNS = [
  "invoice_type",
  "title",
  "invoice_code",
  "invoice_number",
  "machine_code",
  "check_code",
  "issue_date",
  "buyer_name",
  "buyer_tax_id",
  "seller_name",
  "seller_tax_id",
  "amount_excl_tax",
  "tax_amount",
  "amount_incl_tax",
  "currency",
  "remarks",
  "item_row",
  "item_name",
  "item_spec",
  "item_unit",
  "item_qty",
  "item_unit_price",
  "item_amount",
  "item_tax_rate",
  "item_tax",
];

// 与 CSV_COLUMNS 一一对应的中文表头（顺序必须完全一致）
const CSV_COLUMNS_CN = [
  "发票类型",
  "标题",
  "发票代码",
  "发票号码",
  "机器编号",
  "校验码",
  "开票日期",
  "购买方名称",
  "购买方税号",
  "销售方名称",
  "销售方税号",
  "总金额(不含税)",
  "总税额",
  "价税合计",
  "币种",
  "备注",
  "明细行号",
  "货物/服务名称",
  "规格型号",
  "单位",
  "数量",
  "单价",
  "金额(明细)",
  "税率",
  "税额(明细)",
];

// 需要移除的列索引：发票类型(0)、标题(1)、发票代码(2)、机器编号(4)、校验码(5)
// 注意：保留发票号码(3)，避免上游字段干扰下游处理
const CSV_REMOVE_INDICES = new Set([0, 1, 2, 4, 5]);
function filterColumns<T>(arr: T[]): T[] {
  return arr.filter((_, index) => !CSV_REMOVE_INDICES.has(index));
}
const CSV_HEADER = filterColumns(CSV_COLUMNS_CN).join(",");

function parseMaybeJson(text: unknown) {
  if (typeof text !== "string") return null;
  const s = text.trim().replace(/```(?:json|csv)?\s*/gi, "").replace(/```\s*$/g, "").trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  // 按 RFC4180 处理：包含逗号/换行/双引号则整体用双引号包裹，内部双引号转义为两个双引号
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeDateCN(dateStr: unknown) {
  if (typeof dateStr !== "string") return "";
  // 例：2025年12月09日 → 2025-12-09
  const m = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (!m) return dateStr;
  const y = m[1];
  const mo = String(Number(m[2])).padStart(2, "0");
  const d = String(Number(m[3])).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function normalizeRemarks(value: unknown) {
  // 下游有些地方按英文逗号 split，不支持 RFC4180 引号；这里直接替换，避免破坏 CSV 结构
  const s = value === null || value === undefined ? "" : String(value);
  return s.replaceAll(",", "，");
}

function buildRowMap(arr: any[]) {
  const map = new Map<string, any>();
  for (const it of Array.isArray(arr) ? arr : []) {
    const row = String(it?.row ?? "");
    if (!row) continue;
    map.set(row, it?.word ?? "");
  }
  return map;
}

function normalizeVatInvoiceWordsResult(words: any) {
  const invoice_type = words?.InvoiceType || words?.InvoiceTypeOrg || words?.InvoiceTag || "";
  const invoice_number = words?.InvoiceNum || words?.InvoiceNumConfirm || "";
  const invoice_code = words?.InvoiceCode || "";
  const machine_code = words?.MachineCode || "";
  const check_code = words?.CheckCode || "";
  const issue_date = normalizeDateCN(words?.InvoiceDate || "");

  const buyer_name = words?.PurchaserName || "";
  const buyer_tax_id = words?.PurchaserRegisterNum || "";
  const seller_name = words?.SellerName || "";
  const seller_tax_id = words?.SellerRegisterNum || "";

  const amount_excl_tax = words?.TotalAmount || "";
  const tax_amount = words?.TotalTax || "";
  const amount_incl_tax = words?.AmountInFiguers || (amount_excl_tax && tax_amount ? String(Number(amount_excl_tax) + Number(tax_amount)) : "");

  const remarks = normalizeRemarks(words?.Remarks || "");

  // 明细行整合（按 row 对齐）
  const nameMap = buildRowMap(words?.CommodityName);
  const amountMap = buildRowMap(words?.CommodityAmount);
  const qtyMap = buildRowMap(words?.CommodityNum);
  const unitMap = buildRowMap(words?.CommodityUnit);
  const priceMap = buildRowMap(words?.CommodityPrice);
  const taxRateMap = buildRowMap(words?.CommodityTaxRate);
  const taxMap = buildRowMap(words?.CommodityTax);
  const specMap = buildRowMap(words?.CommodityType);

  const rows = Array.from(
    new Set([
      ...nameMap.keys(),
      ...amountMap.keys(),
      ...qtyMap.keys(),
      ...unitMap.keys(),
      ...priceMap.keys(),
      ...taxRateMap.keys(),
      ...taxMap.keys(),
      ...specMap.keys(),
    ])
  ).sort((a, b) => Number(a) - Number(b));

  const items = rows.map((r) => ({
    row: r,
    name: nameMap.get(r) ?? "",
    spec: specMap.get(r) ?? "",
    unit: unitMap.get(r) ?? "",
    qty: qtyMap.get(r) ?? "",
    unit_price: priceMap.get(r) ?? "",
    amount: amountMap.get(r) ?? "",
    tax_rate: taxRateMap.get(r) ?? "",
    tax: taxMap.get(r) ?? "",
  }));

  return {
    invoice_type,
    title: "发票",
    invoice_code,
    invoice_number,
    machine_code,
    check_code,
    issue_date,
    buyer_name,
    buyer_tax_id,
    seller_name,
    seller_tax_id,
    amount_excl_tax,
    tax_amount,
    amount_incl_tax,
    currency: "CNY",
    remarks,
    items,
    raw_text_hint: "",
  };
}

function normalizeVatInvoiceOcrPayload(payload: any) {
  const p = payload?.words_result ? payload : payload?.data?.words_result ? payload.data : payload;
  if (p?.words_result) return [normalizeVatInvoiceWordsResult(p.words_result)];
  // 如果已经是我们期望的结构（对象/数组），就原样返回（尽量不破坏兼容性）
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function toInvoiceCsvMultiLine(data: any, includeItems: boolean) {
  const invoices: any[] = Array.isArray(data) ? data : data ? [data] : [];
  const lines: string[] = [CSV_HEADER];

  for (const inv of invoices) {
    const baseColsAll = [
      inv?.invoice_type ?? "",
      inv?.title ?? "",
      inv?.invoice_code ?? "",
      inv?.invoice_number ?? "",
      inv?.machine_code ?? "",
      inv?.check_code ?? "",
      inv?.issue_date ?? "",
      inv?.buyer_name ?? "",
      inv?.buyer_tax_id ?? "",
      inv?.seller_name ?? "",
      inv?.seller_tax_id ?? "",
      inv?.amount_excl_tax ?? "",
      inv?.tax_amount ?? "",
      inv?.amount_incl_tax ?? "",
      inv?.currency ?? "CNY",
      normalizeRemarks(inv?.remarks ?? ""),
    ];
    const baseCols = filterColumns(baseColsAll);

    const items: any[] = Array.isArray(inv?.items) ? inv.items : [];
    if (includeItems && items.length > 0) {
      for (const item of items) {
        const cols = [
          ...baseCols,
          item?.row ?? "",
          item?.name ?? "",
          item?.spec ?? "",
          item?.unit ?? "",
          item?.qty ?? "",
          item?.unit_price ?? "",
          item?.amount ?? "",
          item?.tax_rate ?? "",
          item?.tax ?? "",
        ].map(csvEscape);
        lines.push(cols.join(","));
      }
    } else {
      const cols = [
        ...baseCols,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ].map(csvEscape);
      lines.push(cols.join(","));
    }
  }

  return lines.join("\n");
}

export default function Fapiao({ id, data }: { id: string; data: NodeData }) {
  const [includeHeader, setIncludeHeader] = useState<string>(data.values[0] ?? "0");

  useEffect(() => {
    data.values[0] = includeHeader;
  }, [includeHeader]);

  async function run0(input: Res): Promise<Res> {
    if (!input.success) return input;
    if (!input.msg.startsWith("data:image") && !input.msg.startsWith("http")) {
      return updateResData(input, { success: false, msg: "输入必须是图片" });
    }

    if (input.msg.startsWith("http")) {
      try {
        input.msg = await utilsImg.processHttpImageWithSampling(input.msg, 0.9);
      } catch (error) {
        console.error("网络图片处理失败:", error);
      }
    }

    const wantItems = true;

    try {
      const resp = await server.ocrVatInvoice({
        img: input.msg,
        seal_tag: true,
        sharer: data.sharer,
      });

      const d = resp.data;
      if (!d.success) {
        input.success = false;
        input.msg = d.message || "识别失败";
        return input;
      }

      // 后端可能返回 msg(JSON字符串) 或 data(对象)
      const rawPayload = d.data ?? d.msg ?? d.message;
      const parsed = parseMaybeJson(rawPayload);
      const normalized = normalizeVatInvoiceOcrPayload(parsed ?? rawPayload);
      const payload = normalized;

      input.success = true;
      input.msg = toInvoiceCsvMultiLine(payload, wantItems);
      if(data.values[0]==="1"){
        //移除首行
        input.msg=input.msg.split("\n").slice(1).join("\n");
      }
      input.headers = CSV_HEADER;
      input.msgtypeRe = "excel";
      return input;
    } catch (error) {
      throw error;
    }
  }

  return (
    <NodeCore0
      root={false}
      handles={[1, 1]}
      colors={[0, 1]} // 输入红色（图片），输出默认
      run0={run0}
      id={id}
      data={data}
      tips={["输出识别结果", "输入发票图片"]}
    >
      <Space direction="vertical" style={{ width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={includeHeader === "1"}
          onChange={(e) => setIncludeHeader(e.target.checked ? "1" : "0")}
          onClick={(e) => e.stopPropagation()}
        >
          不输出表头
        </Checkbox>
      </Space>
    </NodeCore0>
  );
}

