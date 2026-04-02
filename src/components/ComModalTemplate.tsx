import { Modal, Input, Flex, Tooltip } from "antd";
import { useState, useEffect, useCallback } from "react";
import * as Icon from '@ant-design/icons';
import server from "../common/service/server";
import { Packaging } from "../common/classes";
import { LogError } from "../common/Http";

interface ComModalTemplateProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (plugin: Packaging) => void;
}

export default function ComModalTemplate({ open, onCancel, onConfirm }: ComModalTemplateProps) {
  const [publishedPlugins, setPublishedPlugins] = useState<Packaging[]>([]);
  const [searchId, setSearchId] = useState<string>('');
  const [filteredPlugins, setFilteredPlugins] = useState<Packaging[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      server.getPublishedList()
        .then(res => {
          if (res.data.success) {
            const plugins = res.data.plugins || [];
            setPublishedPlugins(plugins);
          } else {
            window.messageApi.error({
              content: res.data.message || "获取已发布应用失败",
              key: "error"
            });
          }
        })
        .catch(error => {
          LogError(error);
          window.messageApi.error({
            content: "获取已发布应用出错",
            key: "error"
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  const handleSearch = (value: string) => {
    setSearchId(value);
    
    if (!value.trim()) {
      setFilteredPlugins([]);
      setDropdownVisible(false);
      return;
    }
    
    const filtered = publishedPlugins.filter(plugin => 
      plugin.id.toString().includes(value.trim())
    );
    setFilteredPlugins(filtered);
    setDropdownVisible(true);
  };

  const selectPlugin = useCallback((plugin: Packaging) => {
    onConfirm(plugin);
    setSearchId(plugin.id.toString());
    setDropdownVisible(false);
  }, [onConfirm]);

  // 每个列表项的点击处理函数
  const handleItemClick = useCallback((plugin: Packaging) => {
    selectPlugin(plugin);
  }, [selectPlugin]);

  // 生成列表项
  const renderDropdownItems = () => {
    return filteredPlugins.map((plugin, index) => (
      <div
        key={`plugin-item-${index}-${plugin.id}`}
        onClick={() => handleItemClick(plugin)}
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          borderBottom: index < filteredPlugins.length - 1 ? "1px solid #f0f0f0" : "none"
        }}
      >
        <Flex gap={"small"} justify="space-between" align="end" style={{pointerEvents: "none"}}>
          <Tooltip title={plugin.description||"描述为空"} mouseEnterDelay={0.5}>
            <div style={{height:"100%",pointerEvents: "auto",color:"gray"}}>{plugin.id}</div>
          </Tooltip>
          <div 
            style={{ 
              maxWidth: '200px', 
              height:"100%",
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              pointerEvents: "auto",
              color:plugin.name==""?"gray":"black",
            }} 
          >
            {plugin.name? plugin.name : "名称为空"}
          </div>
        </Flex>
      </div>
    ));
  };

  return (
    <Modal
      title="从模板创建"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={520}
    >
      <div style={{ maxWidth: "500px", position: "relative" }}>
        <Flex gap={"small"} vertical justify="space-between" align="center">
          <Input
            placeholder="搜索ID"
            value={searchId}
            prefix={<Icon.SearchOutlined style={{color: '#1677ff'}} />}
            suffix={
              searchId ?
                <Icon.CloseCircleFilled 
                  style={{color: 'rgba(0,0,0,.45)', cursor: 'pointer'}} 
                  onClick={() => {
                    setSearchId('');
                    setFilteredPlugins([]);
                    setDropdownVisible(false);
                  }} 
                /> : null
            }
            onBlur={() => {
              // 延迟关闭下拉菜单，确保点击事件可以触发
              setTimeout(() => setDropdownVisible(false), 200);
            }}
            onChange={(e) => handleSearch(e.target.value)}
            onClick={() => {
              setFilteredPlugins(publishedPlugins);
              setDropdownVisible(true);
            }}
            style={{ 
              width: '100%',
              boxShadow: '0 2px 6px rgba(24, 144, 255, 0.2)'
            }}
          />
        </Flex>
        
        {dropdownVisible && filteredPlugins.length > 0 && (
          <div 
            style={{ 
              position: "absolute", 
              width: "100%", 
              maxHeight: "300px", 
              overflowY: "auto", 
              background: "#fff", 
              border: "1px solid #d9d9d9", 
              zIndex: 1000,
              marginTop: "4px"
            }}
          >
            {renderDropdownItems()}
          </div>
        )}
        
        {dropdownVisible && filteredPlugins.length === 0 && !loading && (
          <div style={{ 
            position: "absolute", 
            width: "100%", 
            background: "#fff", 
            border: "1px solid #d9d9d9", 
            zIndex: 1000,
            marginTop: "4px",
            padding: "8px 12px",
            textAlign: "center",
            color: "#999"
          }}>
            暂无应用
          </div>
        )}
      </div>
    </Modal>
  );
}