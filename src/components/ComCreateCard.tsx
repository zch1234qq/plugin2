import React, { useCallback, useMemo, useState } from "react";
import type { UploadProps } from "antd";
import { Flex, Modal, Tooltip, Upload, message, theme as antTheme } from "antd";
import {
  CopyOutlined,
  InboxOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

interface ComCreateCardProps {
  onNewCreate: () => void;
  onTemplateCreate: () => void;
  onImport: (file: File) => void | Promise<void>;
}

/**
 * 新建应用卡片组件
 * 用于表格页面的新建应用和从模板创建功能
 */
const ComCreateCard: React.FC<ComCreateCardProps> = ({ onNewCreate, onTemplateCreate, onImport }) => {
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { token } = antTheme.useToken();

  const cardStyle = {
    ["--com-card-bg" as any]: token.colorBgContainer,
    ["--com-card-border" as any]: token.colorBorderSecondary ?? token.colorBorder,
    ["--com-card-text" as any]: token.colorText,
    ["--com-card-text-secondary" as any]: token.colorTextSecondary,
    ["--com-card-shadow" as any]: token.boxShadow,
    ["--com-card-shadow-hover" as any]: token.boxShadowSecondary ?? token.boxShadow,
    ["--com-card-btn-hover" as any]: token.colorFillSecondary,
    ["--com-card-delete-hover" as any]: token.colorErrorBg ?? "rgba(255, 77, 79, 0.1)",
  } as React.CSSProperties;

  const uploadProps = useMemo<UploadProps>(
    () => ({
      accept: ".json,application/json",
      maxCount: 1,
      multiple: false,
      showUploadList: false,
      customRequest: async (options) => {
        const fileObj = options.file as File;
        const name = (fileObj?.name || "").toLowerCase();
        if (!name.endsWith(".json")) {
          message.error("请导入 .json 文件");
          options.onError?.(new Error("INVALID_FILE_TYPE"));
          return;
        }

        setImporting(true);
        try {
          await onImport(fileObj);
          options.onSuccess?.({}, undefined as any);
          setImportOpen(false);
        } catch (err) {
          options.onError?.(err as any);
        } finally {
          setImporting(false);
        }
      },
    }),
    [onImport]
  );

  const openImportModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setImportOpen(true);
  }, []);

  return (
    <div 
      className="com-card com-create-card card-hover-effect"
      id="sd"
      style={cardStyle}
    >
      <Modal
        title="导入"
        open={importOpen}
        confirmLoading={importing}
        footer={null}
        onCancel={() => {
          if (importing) return;
          setImportOpen(false);
        }}
        width={560}
        modalRender={(node) => (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {node}
          </div>
        )}
      >
        <Upload.Dragger {...uploadProps} disabled={importing}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: token.colorPrimary }} />
            </p>
            <p className="ant-upload-text">请将json文件拖拽至此区域</p>
            <p className="ant-upload-hint">也可以点击此区域选择文件</p>
          </div>
        </Upload.Dragger>
      </Modal>
      <Flex className="com-card-content" justify="center" align="center">
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onNewCreate();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <PlusOutlined style={{ fontSize: token.fontSizeXL, color: token.colorPrimary }} />
          <div style={{color: token.colorPrimary, fontWeight: 500, fontSize: token.fontSizeLG  }}>
            新建
          </div>
        </div>
        <div 
          style={{
            width: "1px", 
            height: "50%", 
            backgroundColor: token.colorSplit
          }}
        ></div>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onTemplateCreate();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <CopyOutlined style={{ fontSize: token.fontSizeXL, color: token.colorPrimary }} />
          <div style={{color: token.colorPrimary, fontWeight: 500, fontSize: token.fontSizeLG }}>
            从模板创建
          </div>
        </div>
        <div 
          style={{
            width: "1px", 
            height: "50%", 
            backgroundColor: token.colorSplit
          }}
        ></div>
        <Tooltip title="导入文件进行创建">
          <div
            onClick={openImportModal}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <UploadOutlined style={{ fontSize: token.fontSizeXL, color: token.colorPrimary }} />
            <div style={{ color: token.colorPrimary, fontWeight: 500, fontSize: token.fontSizeLG }}>
              导入
            </div>
          </div>
        </Tooltip>
      </Flex>
    </div>
  );
};

export default ComCreateCard;