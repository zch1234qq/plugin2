import { Tooltip, theme as antTheme } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 下拉选择器选项类型
 * @typedef {Object} DropdownOption
 * @property {number|string} value - 选项值
 * @property {string} label - 选项显示文本
 */
export interface DropdownOption {
  value: number | string;
  label: string;
}

/**
 * 自定义下拉选择器组件属性
 * @typedef {Object} ComDropdownProps
 * @property {DropdownOption[]} options - 选项列表
 * @property {number|string} value - 当前选中值
 * @property {(value: number|string) => void} onChange - 值变更回调
 * @property {string} [placeholder] - 占位文本
 * @property {React.CSSProperties} [style] - 容器样式
 * @property {string} [className] - 自定义CSS类名
 * @property {string} [position] - 下拉列表位置 ('top'|'bottom')
 * @property {boolean} [enableWheel] - 是否启用滚轮切换选项
 */
export interface ComDropdownProps {
  options: DropdownOption[];
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  position?: 'top' | 'bottom';
  enableWheel?: boolean;
  title?: string;
}

/**
 * 自定义下拉选择器组件
 * 设计为在ReactFlow环境中正常工作，避免事件冲突
 * 支持鼠标滚轮切换选项
 * @param {ComDropdownProps} props - 组件属性
 * @returns {JSX.Element} 下拉选择器组件
 */
const ComDropdown: React.FC<ComDropdownProps> = ({
  options,
  value,
  title,
  onChange,
  placeholder = '请选择',
  style,
  className,
  position = 'bottom',
  enableWheel = true
}) => {
  const { token } = antTheme.useToken();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hoveredValue, setHoveredValue] = useState<number | string | null>(null);
  
  // 获取当前选中项的标签
  const currentLabel = options.find(option => option.value === value)?.label || placeholder;
  
  // 处理选项点击
  const handleSelect = (e: React.MouseEvent, optionValue: number | string) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(optionValue);
    setIsOpen(false);
  };
  
  // 切换下拉菜单状态
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };
  
  // 处理鼠标滚轮事件
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!enableWheel) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // 获取当前选中值的索引
    const currentIndex = options.findIndex(option => option.value === value);
    if (currentIndex === -1) return;
    
    // 根据滚轮方向确定新的索引
    // 向上滚动 deltaY < 0 => 选择上一个选项
    // 向下滚动 deltaY > 0 => 选择下一个选项
    let newIndex;
    if (e.deltaY < 0) {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(options.length - 1, currentIndex + 1);
    }
    
    // 如果索引变化了，则更新值
    if (newIndex !== currentIndex) {
      onChange(options[newIndex].value);
    }
  };
  
  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // 使用捕获阶段以确保优先处理
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside as EventListener, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside as EventListener, true);
    };
  }, [isOpen]);
  
  // 下拉菜单位置样式
  const dropdownListStyle: React.CSSProperties = {
    position: 'absolute',
    [position === 'top' ? 'bottom' : 'top']: '100%',
    left: '0',
    right: '0',
    background: token.colorBgElevated,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    boxShadow: token.boxShadowSecondary,
    zIndex: 1001,
    maxHeight: '200px',
    overflowY: 'auto'
  };
  const content=useMemo(()=>{
    return (
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span className="com-dropdown-label" style={{ color: token.colorText }}>{currentLabel}</span>
        <span className="com-dropdown-arrow" style={{ marginLeft: '2px', color: token.colorTextSecondary }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>
    )
  },[currentLabel,isOpen,token.colorText,token.colorTextSecondary])
  


  return (
    <div 
    style={{ 
      position: 'absolute', 
      left: '0', 
      right: '0',
      top: '105%',
      zIndex: 1000, 
      background: token.colorBgElevated,
      borderRadius: token.borderRadiusSM,
      boxShadow: token.boxShadowSecondary,
      pointerEvents: 'auto',
      opacity: 1,
      width:'100%'
    }}
  >
    <div 
      ref={dropdownRef}
      className={`com-dropdown ${className || ''}`}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        ...style
      }}
      onWheel={handleWheel}
    >
      {/* 选择器触发按钮 */}
      <div 
        className="com-dropdown-selector"
        style={{
          border: `1px solid ${isOpen ? token.colorPrimary : token.colorBorder}`,
          borderRadius: token.borderRadiusSM,
          padding: '2px 2px',
          // fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: token.colorBgContainer,
        }}
        onClick={toggleDropdown}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title ? (
          <Tooltip title={title} placement="top">
            {content}
          </Tooltip>
        ) : (
          content
        )}
      </div>
      
      {/* 下拉选项列表 */}
      {isOpen && (
        <div
          className="com-dropdown-options"
          style={dropdownListStyle}
        >
          {options.map((option) => (
            (() => {
              const isSelected = value === option.value;
              const isHovered = hoveredValue === option.value;
              const bg = isSelected
                ? token.colorPrimaryBg
                : isHovered
                  ? token.colorFillTertiary
                  : token.colorBgElevated;

              return (
            <div
              key={option.value}
              className={`com-dropdown-option ${value === option.value ? 'com-dropdown-option-selected' : ''}`}
              style={{
                padding: '3px 3px',
                cursor: 'pointer',
                background: bg,
                borderLeft: isSelected ? `2px solid ${token.colorPrimary}` : '2px solid transparent',
                color: token.colorText,
              }}
              onClick={(e) => handleSelect(e, option.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={() => setHoveredValue(option.value)}
              onMouseLeave={() => setHoveredValue(null)}
            >
              {option.label}
            </div>
              );
            })()
          ))}
        </div>
      )}
    </div>
  </div>
  );
};

export default ComDropdown; 