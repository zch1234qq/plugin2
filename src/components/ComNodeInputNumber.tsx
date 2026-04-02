import { InputNumber, Tooltip } from "antd";

/**
 * 节点数字输入组件
 * @param value - 数值
 * @param onChange - 值变化回调函数
 * @param placeholder - 占位符文本
 * @param className - 额外CSS类名
 * @param min - 最小值
 * @param max - 最大值
 * @param precision - 精度 (小数位数)
 */
interface ComNodeInputNumberProps {
  value: number | string;
  tooltip?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  precision?: number;
  disabled?: boolean;
  onDoubleClick?: () => void;
}

export default function ComNodeInputNumber({
  value,
  onChange,
  placeholder = "请输入数字",
  className = "",
  min,
  max,
  tooltip,
  disabled=false,
  onDoubleClick=()=>{},
  }: ComNodeInputNumberProps) {
  return (
    <div 
      className={`nodrag ${className}`}
      style={{
        pointerEvents: 'all',
        width: '100%',
      }}
      onDoubleClick={(e)=>{
        e.stopPropagation();
        e.preventDefault();
        onDoubleClick();
      }}
    >
      <Tooltip title={tooltip}>
        <InputNumber
          disabled={disabled}
          min={min}
          max={max}
          
          className="nodrag"
          value={typeof value === 'string' ? parseFloat(value) : value}
          onChange={(value) => onChange(value?.toString() || "0")}
          placeholder={placeholder}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          style={{
            cursor:disabled?'not-allowed':'text',
            userSelect:disabled?'none':'text',
            WebkitUserSelect:disabled?'none':'text',
            width: '100%',
          }}
        />
      </Tooltip>
    </div>
  );
}