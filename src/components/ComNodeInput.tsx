import { Input, Tooltip, TooltipProps } from "antd";
interface ComNodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onDoubleClick?: () => void;
  disabled?: boolean;
  placement?: TooltipProps['placement'];
}

export default function ComNodeInput({
  value,
  onChange,
  placeholder = "请输入",
  className = "",
  onDoubleClick,
  disabled = false,
  placement = 'top'
}: ComNodeInputProps) {
  return (
    <div 
      className={`nodrag ${className}`}
      style={{
        pointerEvents: 'all'
      }}
      onDoubleClick={onDoubleClick}
    >
      <Tooltip title={"双击=>更大的编辑区域"} placement={placement}>
        <Input.TextArea
          allowClear={true}
          onClear={()=>{
            onChange("")
          }}
          className="nodrag"
          value={value}
          disabled={disabled}
          onInput={(e)=>{
            onChange(e.currentTarget.value)
          }}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 1 }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          style={{
            cursor: 'text',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            width: '100%',
          }}
        />
      </Tooltip>
    </div>
  );
} 