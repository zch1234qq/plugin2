import { Button, Dropdown, Flex, Input, Modal, Tooltip, Typography, message, theme as antdTheme } from "antd";
import type { MenuProps } from "antd";
import './globals.css'
import './ComCard.css'
import { Packaging } from "../common/classes";
import { useCustomNavigate } from "../common/hooks/useCustomNavigate";
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Icons from "react-icons/ri"
import server from "../common/service/server";
import config from "../common/config/config";
import _ from "lodash"
import { useAtom } from "jotai";
import { stateCreated, statePlugins } from "../common/store/store";
import { exportWorkflowToFile } from "../common/utils/workflowExport";

export default function ComCard({plugin}:{plugin:Packaging}) {
  const { token } = antdTheme.useToken();
  const navigate=useCustomNavigate()
  const [created,setCreated]=useAtom(stateCreated)
  const [plugins,setPlugins]=useAtom(statePlugins)
  const pluginRef=useRef(plugin)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [renameLoading, setRenameLoading] = useState(false)
  const [descValue, setDescValue] = useState("")
  const { TextArea } = Input

  useEffect(()=>{
    pluginRef.current=plugin
  },[plugin])
  
  useEffect(()=>{
    if(!plugin.name){
      plugin.name=Packaging.GetIdStrStatic(plugin)
      setPlugins({...plugins})
    }
  },[plugin])

  // 用于追踪双击/双触的状态
  const lastTap = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300; // 双击判定时间间隔（毫秒）

  /**
   * 处理双击/双触事件
   */
  const handleClick = useCallback(() => {
    //判断使用UUID还是ID
    let visitId=Packaging.GetIdStrStatic(plugin) 
    if(plugin.isRef){
      visitId=plugin.uuid
    }
    navigate(`/editor?type=edit&id=${visitId}`)
  }, [plugin, navigate])

  /**
   * 处理删除功能
   */
  const performDelete = useCallback(() => {
    if (window.confirm(`确定要删除应用「${plugin.name || plugin.id}」吗？此操作不可撤销。`)) {
      // 使用静态方法获取ID
      let id = Packaging.GetIdStrStatic(plugin);
      server.del(id)
        .then(res => {
          let data=res.data || {}
          if(data.success) {
            message.success('删除成功');
            delete plugins[id]
            setPlugins({...plugins})
            delete created[id]
            setCreated({...created})
          } else {
            message.error(res.data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('删除应用时发生错误:', error);
          message.error('删除失败，请稍后重试');
        });
    }
  }, [plugin, plugins, created, setPlugins, setCreated]);

  const performRun = useCallback(() => {
    // if (plugin.id < 0) {
    //   message.error('当前应用无法运行');
    //   return;
    // }
    const visitId = Packaging.GetIdStrStatic(plugin);
    navigate(`/use?id=${encodeURIComponent(visitId)}`);
  }, [plugin, navigate]);

  /**
   * 复制应用（创建一个副本并保存）
   */
  const performCopy = useCallback(async () => {
    const source = pluginRef.current;
    const baseName = source?.name || Packaging.GetIdStrStatic(source);
    const copyName = `${baseName}-副本`;

    message.open({ key: "copyApp", type: "loading", content: "正在复制应用..." });
    try {
      const res = await server.create(copyName);
      const data: any = res?.data || {};
      if (!data.success || !data.plugin) {
        message.open({ key: "copyApp", type: "error", content: data.message || "复制失败" });
        return;
      }

      const createdPlugin = data.plugin as Packaging;
      const cloned: any = _.cloneDeep(source);

      // 覆盖为新应用的身份信息，避免覆盖原应用
      const newPlugin: any = {
        ...cloned,
        id: createdPlugin.id,
        uuid: createdPlugin.uuid,
        name: copyName,
        isRef: false,
        published: false,
        isCollected: false,
        load: (createdPlugin as any).load ?? cloned.load,
      };

      await server.save(newPlugin);

      const key = Packaging.GetIdStrStatic(newPlugin as Packaging);
      setPlugins({ ...plugins, [key]: newPlugin as Packaging });
      setCreated({ ...created, [key]: newPlugin as Packaging });

      message.open({ key: "copyApp", type: "success", content: "复制成功" });
    } catch (error) {
      console.error("复制应用时发生错误:", error);
      message.open({ key: "copyApp", type: "error", content: "复制失败，请稍后重试" });
    }
  }, [created, plugins, setCreated, setPlugins]);

  /**
   * 导出应用（JSON 文件）
   * - 优先导出本地 plugin（包含 data/tree）
   * - 若本地缺失 data，则尝试 server.use 拉取完整数据
   */
  const performExport = useCallback(async () => {
    try {
      const current = pluginRef.current as Packaging;
      const idStr = Packaging.GetIdStrStatic(current);

      message.open({ key: "exportWorkflow", type: "loading", content: "正在准备导出..." });

      await exportWorkflowToFile(current, {
        idStr,
        fetchFullPlugin: async (id) => {
          const res: any = await server.use(id);
          const data: any = res?.data || {};
          if (data?.success && data?.plugin) return data.plugin as Packaging;
          throw new Error(data?.message || "FETCH_PLUGIN_FAILED");
        },
      });

      message.open({ key: "exportWorkflow", type: "success", content: "已导出应用" });
    } catch (error) {
      console.error("导出应用时发生错误:", error);
      const msg = error instanceof Error && error.message === "EMPTY_WORKFLOW_DATA"
        ? "暂无可导出的应用数据，请先进入编辑并保存"
        : "导出失败，请稍后重试";
      message.open({ key: "exportWorkflow", type: "error", content: msg });
    }
  }, []);

  /**
   * 重命名应用（保存到后端）
   * - 同时写入 plugin.name 与 (plugin as any).rename，兼容后端两种读取方式
   */
  const performRenameOpen = useCallback(() => {
    const current = pluginRef.current;
    const oldName = (current?.name || Packaging.GetIdStrStatic(current) || "").trim();
    const oldDesc = (current?.description || "").trim();
    setRenameValue(oldName);
    setDescValue(oldDesc);
    setRenameOpen(true);
  }, [])

  const performRenameSubmit = useCallback(async () => {
    const current = pluginRef.current;
    const oldName = (current?.name || Packaging.GetIdStrStatic(current) || "").trim();
    const nextName = (renameValue || "").trim();
    const nextDesc = (descValue || "").trim();

    if (!nextName) return;
    if (nextName === oldName && nextDesc === (current?.description || "").trim()) {
      setRenameOpen(false);
      return;
    }

    const idKey = Packaging.GetIdStrStatic(current);

    setRenameLoading(true);
    message.open({ key: "renameApp", type: "loading", content: "正在重命名..." });
    try {
      const res = await server.saveMeta(current.uuid, nextName, nextDesc);
      const data: any = res?.data || {};
      if (!data.success) {
        message.open({ key: "renameApp", type: "error", content: data.message || "重命名失败" });
        return;
      }

      // 更新本地 store，确保列表/卡片即时刷新
      const updated = { ...current, name: nextName, description: nextDesc } as Packaging;
      const nextPlugins = { ...plugins, [idKey]: updated };
      setPlugins(nextPlugins);

      if (created && (created as any)[idKey] !== undefined) {
        const nextCreated = { ...created, [idKey]: updated };
        setCreated(nextCreated);
      }

      message.open({ key: "renameApp", type: "success", content: data.message || "重命名成功" });
      setRenameOpen(false);
    } catch (error) {
      console.error("重命名应用时发生错误:", error);
      message.open({ key: "renameApp", type: "error", content: "重命名失败，请稍后重试" });
    } finally {
      setRenameLoading(false);
    }
  }, [created, descValue, plugins, renameValue, setCreated, setPlugins]);

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    const { key, domEvent } = info;
    domEvent.stopPropagation();
    if (key === "delete") {
      performDelete();
      return;
    }
    if (key === "copy") {
      performCopy();
      return;
    }
    if (key === "export") {
      performExport();
      return;
    }
    if (key === "rename") {
      performRenameOpen();
      return;
    }
    if (key === "run") {
      performRun();
    }
  };

  /**
   * 处理分享功能
   */
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片的点击事件
    let pluginTemp=_.cloneDeep(plugin)
    pluginTemp.adminid=""
    server.shareCreate(72,pluginTemp)
    .then(res=>{
      if(res.data.success){
        let code=res.data.code
        let url=`${config.webUrl}#/table?share=${code}`  
        navigator.clipboard.writeText(url)
        .then(() => {
          message.success('已复制分享链接，粘贴发送给他人吧');
        })
        .catch(() => {
          message.error('复制失败，请手动复制');
        });
      }else{
        message.error(res.data.message);
      }
    })
    .catch((error) => {
      // 检查是否是circuit breaker错误
      if (error instanceof Error && error.message && error.message.includes('circuit breaker')) {
        message.error('服务器繁忙，请稍后重试');
      } else {
        message.error('分享创建失败');
      }
    });
  }, [plugin]);

  /**
   * 处理触摸事件
   * @param e - 触摸事件对象
   */
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // 防止触发其他触摸事件

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;

    if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
      // 双触发生
      handleClick();
    } 
    lastTap.current = currentTime;
  }, [handleClick])

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

  return(
    <Tooltip title={"点击进入应用"}>
      <div 
        id="sd" 
        onClick={handleClick}  // 桌面端双击
        onTouchStart={handleTouch}          // 移动端触摸
        className="com-card card-hover-effect"
        style={cardStyle}
      >
        <Modal
          cancelText="取消"
          okText="确认"
          open={renameOpen}
          confirmLoading={renameLoading}
          title="设置"
          modalRender={(node) => (
            <div
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {node}
            </div>
          )}
          onOk={(e) => {
            e?.stopPropagation?.();
            performRenameSubmit();
          }}
          onCancel={(e) => {
            e?.stopPropagation?.();
            if (renameLoading) return;
            setRenameOpen(false);
          }}
        >
          <div onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <Flex justify="center" style={{ width: "100%" }}>
              <Flex align="center" vertical gap="small" style={{ width: "90%" }}>
                <Input
                  addonBefore="名称"
                  placeholder="应用名称"
                  maxLength={15}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.currentTarget.value)}
                  onPressEnter={() => {
                    if (!renameLoading) performRenameSubmit();
                  }}
                />
                <TextArea
                  placeholder="应用描述"
                  value={descValue}
                  onChange={(e) => setDescValue(e.currentTarget.value)}
                />
              </Flex>
            </Flex>
          </div>
        </Modal>
        <Flex className="com-card-content" justify="center" align="center">
          <div className="com-card-delete-container">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  // {
                  //   key: "run",
                  //   label: "运行",
                  //   icon: <Icons.RiPlayLine size={16} />
                  // },
                  {
                    key: "delete",
                    label: "删除",
                    danger: true,
                    icon: <Icons.RiDeleteBinLine size={16} />
                  },
                  {
                    key: "copy",
                    label: "复制",
                    icon: <Icons.RiFileCopyLine size={16} />
                  },
                  {
                    key: "export",
                    label: "导出",
                    icon: <Icons.RiDownload2Line size={16} />
                  },
                  {
                    key: "rename",
                    label: "重命名",
                    icon: <Icons.RiEdit2Line size={16} />
                  },
                ],
                onClick: handleMenuClick
              }}
            >
              <Tooltip title="更多">
                <Button
                  type="text"
                  className="com-card-more-btn"
                  icon={<Icons.RiMore2Fill size={20} />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Dropdown>
          </div>
          <div className="com-card-actions">
            <Tooltip title="分享">
              <Button 
                type="text"
                className="com-card-share-btn"
                icon={<Icons.RiShareForwardLine size={24} />}
                onClick={handleShare}
              />
            </Tooltip>
          </div>
          {
            plugin.name !== "" &&
            <Typography.Text className="com-card-name" style={{ fontSize: token.fontSizeXL }}>
              {plugin.name}
            </Typography.Text>
          }
          {
            plugin.name === "" &&
            <Typography.Text type="secondary" className="com-card-id" style={{ fontSize: token.fontSizeSM }}>
              id：{plugin.id}
            </Typography.Text>
          }
        </Flex>
      </div>
    </Tooltip>
  )
}