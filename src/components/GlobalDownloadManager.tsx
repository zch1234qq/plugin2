import { Badge, Button, Drawer, Flex, List, Progress, Space, Tag, Typography } from "antd";
import { DownloadOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { useAtom } from "jotai";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { downloadDir } from "@tauri-apps/api/path";
import config from "../common/config/config";
import {
  DownloadTaskItem,
  stateDownloadPath,
  stateDownloadManagerVisible,
  stateDownloadTasks,
} from "../common/store/store";

const { Text } = Typography;

const statusMeta: Record<
  DownloadTaskItem["status"],
  { color: string; label: string }
> = {
  in_progress: { color: "processing", label: "下载中" },
  success: { color: "success", label: "已完成" },
  error: { color: "error", label: "失败" },
  cancelled: { color: "default", label: "已取消" },
};

export default function GlobalDownloadManager() {
  const [tasks, setTasks] = useAtom(stateDownloadTasks);
  const [visible, setVisible] = useAtom(stateDownloadManagerVisible);
  const [downloadPath] = useAtom(stateDownloadPath);

  if (!config.isDesktop) return null;

  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;

  const clearFinished = () => {
    setTasks((prev) =>
      prev.filter((t) => t.status === "in_progress")
    );
  };

  const buildOpenTargets = (rawPath: string) => {
    const openTargets = [rawPath];
    if (/^[a-zA-Z]:[\\/]/.test(rawPath)) {
      openTargets.push(`file:///${rawPath.replace(/\\/g, "/")}`);
    } else if (rawPath.startsWith("/")) {
      openTargets.push(`file://${rawPath}`);
    }
    return openTargets;
  };

  const openPath = async (rawPath: string, failMsg: string) => {
    try {
      const targets = buildOpenTargets(rawPath);
      for (const target of targets) {
        try {
          await shellOpen(target);
          return;
        } catch {
          // try next path format
        }
      }
      throw new Error("all open targets failed");
    } catch (error) {
      window.messageApi?.error?.(`${failMsg}：${(error as Error)?.message || "未知错误"}`);
    }
  };

  const toFolderPath = (rawPath: string) => {
    const path = rawPath.trim();
    if (!path) return "";
    if (/[/\\]$/.test(path)) return path;
    const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    if (idx < 0) return path;
    if (idx === 0) return path[0];
    return path.slice(0, idx);
  };

  const openDownloadFolder = async () => {
    const configuredFolder = downloadPath?.trim();
    const latestTaskPath = tasks.find((item) => Boolean(item.path))?.path?.trim();
    const fallbackFolder = latestTaskPath ? toFolderPath(latestTaskPath) : "";
    const targetFolder = configuredFolder || fallbackFolder || (await downloadDir());

    if (!targetFolder) {
      window.messageApi?.info?.("暂无可打开的下载目录");
      return;
    }
    await openPath(targetFolder, "打开文件夹失败");
  };

  return (
    <>
      <Badge count={inProgressCount} size="small" offset={[-2, 2]}>
        <Button
          type="primary"
          shape="circle"
          icon={<DownloadOutlined />}
          onClick={() => setVisible(true)}
          style={{
            position: "fixed",
            right: 22,
            bottom: 8,
            zIndex: 2000,
          }}
        />
      </Badge>

      <Drawer
        title="下载管理"
        open={visible}
        onClose={() => setVisible(false)}
        width={460}
        extra={
          <Flex gap="small">
            <Button size="small" onClick={openDownloadFolder}>
              打开文件夹
            </Button>
            <Button size="small" danger onClick={clearFinished}>
              清理已完成
            </Button>
          </Flex>
        }
      >
        <List
          dataSource={tasks}
          locale={{ emptyText: "暂无下载任务" }}
          renderItem={(item) => {
            const meta = statusMeta[item.status];
            return (
              <List.Item
                actions={[
                  item.path ? (
                    <Button
                      key="open-folder"
                      type="link"
                      size="small"
                      icon={<FolderOpenOutlined />}
                      onClick={async () => {
                        const rawPath = item.path?.trim();
                        if (!rawPath) {
                          window.messageApi?.error?.("路径为空，无法打开");
                          return;
                        }
                        await openPath(rawPath, "打开路径失败");
                      }}
                    >
                      打开文件
                    </Button>
                  ) : null,
                ].filter(Boolean)}
              >
                <Flex vertical gap={4} style={{ width: "100%" }}>
                  <Space size={8}>
                    <Text strong>{item.fileName}</Text>
                    <Tag color={meta.color}>{meta.label}</Tag>
                  </Space>
                  {/* <Text type="secondary">类型：{item.fileType}</Text> */}
                  {item.status === "in_progress" ? (
                    <Progress
                      percent={Math.max(1, Math.min(99, item.progress ?? 5))}
                      size="small"
                      status="active"
                      showInfo
                    />
                  ) : null}
                  {item.path ? <Text type="secondary">{item.path}</Text> : null}
                  {item.error ? <Text type="danger">错误：{item.error}</Text> : null}
                </Flex>
              </List.Item>
            );
          }}
        />
      </Drawer>
    </>
  );
}
