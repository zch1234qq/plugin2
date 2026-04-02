import { Button, Dropdown, Tooltip } from "antd";
import * as Icon from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import type { MenuProps } from "antd";
import { exportCsvToXlsx } from "../../utils/exportToXlsxUtils";
import { getTimeFileName } from "../../utils/timeFileNameUtils";
import { exportToDocxFile, saveTextFile } from "../../utils/downloadFormatUtils.ts";
import {
  DownloadTaskItem,
  stateDownloadManagerVisible,
  stateDownloadPath,
  stateDownloadTasks,
  stateMemoryDownloadFormat,
} from "../../common/store/store.tsx";
import config from "../../common/config/config.tsx";
import { invoke } from "@tauri-apps/api/core";
import { downloadDir, join } from "@tauri-apps/api/path";

type DownloadFormat = "excel" | "csv" | "txt" | "markdown" | "word";

type MemoryDownloadActionsProps = {
  stateMemory: string[];
  headers: string;
  downloadIncludeHeader: boolean;
};

export default function MemoryDownloadActions({
  stateMemory,
  headers,
  downloadIncludeHeader,
}: MemoryDownloadActionsProps) {
  const [downloadFormat, setDownloadFormat] = useAtom(stateMemoryDownloadFormat);
  const [downloadPath] = useAtom(stateDownloadPath);
  const [, setDownloadTasks] = useAtom(stateDownloadTasks);
  const [, setDownloadManagerVisible] = useAtom(stateDownloadManagerVisible);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const downloadPathRef = useRef(downloadPath);
  const defaultPathRef = useRef("");
  const lastSavedPathRef = useRef("");

  useEffect(() => {
    downloadPathRef.current = downloadPath;
  }, [downloadPath]);

  useEffect(() => {
    if (!config.isDesktop) return;
    void downloadDir()
      .then((dir) => {
        defaultPathRef.current = dir;
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const createDownloadTask = useCallback((fileName: string, fileType: string): string | null => {
    if (!config.isDesktop) return null;
    const now = Date.now();
    const taskId = `download_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const task: DownloadTaskItem = {
      id: taskId,
      fileName,
      fileType,
      status: "in_progress",
      progress: 5,
      createdAt: now,
      updatedAt: now,
    };
    setDownloadTasks((prev) => [task, ...prev].slice(0, 200));
    setDownloadManagerVisible(true);
    return taskId;
  }, [setDownloadManagerVisible, setDownloadTasks]);

  const updateDownloadTask = useCallback((taskId: string | null, patch: Partial<DownloadTaskItem>) => {
    if (!taskId) return;
    setDownloadTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, ...patch, updatedAt: Date.now() } : item))
    );
  }, [setDownloadTasks]);

  const saveCustom = useCallback(async (fileName: string, data: Blob | Uint8Array): Promise<void> => {
    const basePath = downloadPathRef.current || defaultPathRef.current || (await downloadDir());
    const pathAbs = await join(basePath, fileName);
    let base64String: string;

    if (data instanceof Blob) {
      const arrayBuffer = await data.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      base64String = btoa(bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), ""));
    } else if (data instanceof Uint8Array) {
      base64String = btoa(data.reduce((acc, byte) => acc + String.fromCharCode(byte), ""));
    } else {
      throw new Error("不支持的数据类型");
    }

    await invoke("save_file_to_path", {
      path: pathAbs,
      content: base64String,
      isBase64: true,
    });
    lastSavedPathRef.current = pathAbs;
  }, []);

  const downloadFormatItems: MenuProps["items"] = useMemo(
    () => [
      { key: "excel", label: "Excel (.xlsx)" },
      { key: "word", label: "Word (.docx)" },
      // { key: "csv表格", label: "CSV (.csv)" },
      { key: "txt", label: "Text (.txt)" },
      // { key: "markdown", label: "Markdown (.md)" },
    ],
    []
  );

  const handleDownloadMemory = async () => {
    let csvContent = stateMemory.join("\n");
    const headerLine = (headers || "").trim();
    if (downloadIncludeHeader && headerLine) {
      const firstLine = (csvContent.split("\n")[0] || "").trim();
      if (!csvContent) {
        csvContent = headerLine;
      } else if (firstLine !== headerLine) {
        csvContent = `${headerLine}\n${csvContent}`;
      }
    }

    const abortController = new AbortController();
    const fileName = getTimeFileName();
    const defaultExtension =
      downloadFormat === "excel" ? "xlsx" : downloadFormat === "word" ? "docx" : downloadFormat === "markdown" ? "md" : downloadFormat;
    lastSavedPathRef.current = "";
    const taskId = createDownloadTask(`${fileName}.${defaultExtension}`, downloadFormat);

    try {
      let outputType: string = defaultExtension;
      updateDownloadTask(taskId, { progress: 20 });
      switch (downloadFormat) {
        case "excel":
          await exportCsvToXlsx({
            csvData: csvContent,
            fileName,
            signal: abortController.signal,
            isDesktop: config.isDesktop,
            saveCustom,
          });
          outputType = "xlsx";
          break;
        case "word":
          outputType = await exportToDocxFile({
            content: csvContent,
            fileName,
            signal: abortController.signal,
            isDesktop: config.isDesktop,
            saveCustom,
          });
          break;
        default:
          await saveTextFile({
            content: csvContent,
            filename: fileName,
            fileType: downloadFormat,
            signal: abortController.signal,
            isDesktop: config.isDesktop,
            saveCustom,
          });
          outputType = downloadFormat === "markdown" ? "md" : downloadFormat;
          break;
      }
      updateDownloadTask(taskId, {
        status: "success",
        progress: 100,
        fileName: `${fileName}.${outputType}`,
        path: lastSavedPathRef.current || undefined,
        error: undefined,
      });
      window.messageApi.success(`文件下载成功 (${outputType})`);
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") {
        updateDownloadTask(taskId, {
          status: "cancelled",
          progress: undefined,
          error: undefined,
        });
        window.messageApi.info("文件下载已取消");
      } else {
        console.error("文件下载失败:", e);
        updateDownloadTask(taskId, {
          status: "error",
          progress: undefined,
          error: err?.message || String(e),
        });
        window.messageApi.error("文件下载失败");
      }
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const startLongPress = () => {
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setMenuOpen(true);
    }, 500);
  };

  const endLongPress = () => {
    clearLongPressTimer();
  };

  const handleButtonClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    void handleDownloadMemory();
  };

  return (
    <Dropdown
      open={menuOpen}
      onOpenChange={setMenuOpen}
      menu={{
        items: downloadFormatItems,
        selectedKeys: [downloadFormat],
        onClick: ({ key }) => {
          setDownloadFormat(key as DownloadFormat);
          setMenuOpen(false);
          window.messageApi.success(`成功切换为${key}`);
        },
      }}
      trigger={[]}
    >
      <Tooltip title={`下载${downloadFormat}\n(长按切换文件类型)`}>
        <Button
          size="middle"
          className="com-drawer-static-icon-button"
          icon={<Icon.ArrowDownOutlined />}
          onMouseDown={startLongPress}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={endLongPress}
          onTouchCancel={endLongPress}
          onBlur={() =>{
            setTimeout(() => {
              setMenuOpen(false);
            }, 100);
          }}
          onClick={handleButtonClick}
        />
      </Tooltip>
    </Dropdown>
  );
}
