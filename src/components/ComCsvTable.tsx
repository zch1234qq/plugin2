import React, { useMemo } from 'react';
import { Table, theme as antTheme } from 'antd';

interface CsvTableProps {
  data: string;
}

const CsvTable: React.FC<CsvTableProps> = ({ data }) => {
  const { token } = antTheme.useToken();

  // 解析 CSV 数据（简单逗号分割；不处理引号/转义）
  const parsed = useMemo(() => {
    const csvText = (data || "").trim();
    if (!csvText) return { headers: [], dataSource: [] };
    const rows = csvText.split(/\r?\n/);
    if (rows.length === 0) return { headers: [], dataSource: [] };
    //计算最大列数
    const maxCol = Math.max(0, ...rows.map((row) => row.split(',').length));
    const headers = Array.from({ length: maxCol }, (_, index) => ({
      title: "", // 直接将表头置空
      dataIndex: `col${index}`,
      key: `col${index}`,
      ellipsis: true,
    }));
    
    const dataSource = rows.map((row, rowIndex) => {
      const cells = row.split(',');
      const rowData: Record<string, string> = { key: `row${rowIndex}` };
      
      cells.forEach((cell, cellIndex) => {
        rowData[`col${cellIndex}`] = cell.trim();
      });
      
      return rowData;
    });
    return { headers, dataSource };
  }, [data]);

  return (
    <div
      style={{
        width: '100%',
        height: "100%",
        overflowY: "auto",
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Table 
        columns={parsed.headers} 
        dataSource={parsed.dataSource} 
        pagination={false} 
        size="small"
        bordered
        tableLayout="fixed"
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default CsvTable;