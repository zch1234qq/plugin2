import React from 'react';
import { useDeviceId } from '../hooks/useDeviceId';

export const DeviceInfo: React.FC = () => {
  const { deviceId, loading, error } = useDeviceId();

  if (loading) return <div>正在加载设备信息...</div>;
  if (error) return <div>加载设备信息失败: {error.message}</div>;

  return (
    <div>
      <h3>设备信息</h3>
      <p>设备ID: {deviceId}</p>
    </div>
  );
}; 