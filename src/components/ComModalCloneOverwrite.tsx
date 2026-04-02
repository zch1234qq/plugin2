import { Button, Modal, Select } from "antd";
import { useState } from "react";
import { Packaging } from "../common/classes";

interface ComModalCloneOverwriteProps {
  open: boolean;
  onCancel: () => void;
  onClone: (targetId: string) => void;
  appOptions: Packaging[];
  loading: boolean;
}

export default function ComModalCloneOverwrite({
  open,
  onCancel,
  onClone,
  appOptions,
  loading
}: ComModalCloneOverwriteProps) {
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);

  const handleCloneToExisting = () => {
    if (!selectedPluginId) {
      window.messageApi.warning("请选择一个目标应用");
      return;
    }
    onClone(selectedPluginId);
  };

  return (
    <Modal
      title="选择目标应用"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleCloneToExisting}
          disabled={!selectedPluginId}
        >
          确认克隆
        </Button>
      ]}
      loading={loading}
    >
      <p>您的应用数量已达到上限，请选择一个现有应用进行覆盖：</p>
      <Select
        style={{ width: '100%' }}
        placeholder="选择目标应用"
        onChange={(value) => setSelectedPluginId(value)}
        options={appOptions.map(plugin => ({
          value: Packaging.GetIdStrStatic(plugin),
          label: `${plugin.name}`
        }))}
      />
    </Modal>
  );
}
