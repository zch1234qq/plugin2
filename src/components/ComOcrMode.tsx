import React, { useState, useEffect } from 'react';
import { Checkbox, Tooltip } from 'antd';

interface ComOcrModeProps {
  value?: string;
  onChange?: (value: string) => void;
}

const ComOcrMode: React.FC<ComOcrModeProps> = ({ value = "", onChange }) => {
  const [checked, setChecked] = useState(value === "1");

  useEffect(() => {
    setChecked(value === "1");
  }, [value]);

  const handleChange = (e: any) => {
    const newValue = e.target.checked ? "1" : "0";
    setChecked(e.target.checked);
    onChange && onChange(newValue);
  };

  return (
    <Tooltip title="OCR模式，开启后提取文字更准确，但是会增加资源点的消耗。关闭后会加快处理速度,但是可能降低准确度。">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox
          checked={checked}
          onChange={handleChange}
        >
          OCR
        </Checkbox>
      </div>
    </Tooltip>
  );
};

export default ComOcrMode;