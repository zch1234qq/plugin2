import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

interface DeviceInfo {
  device_id: string;
}

/**
 * 获取设备ID的Hook
 * @returns {{deviceId: string, loading: boolean, error: Error|null}}
 */
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDeviceId() {
      try {
        setLoading(true);
        const deviceInfo = await invoke<DeviceInfo>('get_device_id');
        setDeviceId(deviceInfo.device_id);
      } catch (err) {
        console.error('获取设备ID失败:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchDeviceId();
  }, []);

  return { deviceId, loading, error };
} 