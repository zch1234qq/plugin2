import { useRef, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { theme as antdTheme } from 'antd';

/**
 * 可调整大小的拖拽手柄组件
 * @param onResize - 拖拽时调整大小的回调函数，接收百分比变化值
 * @param direction - 拖拽方向，'horizontal'或'vertical'
 */
function ComResizeHandle({ 
  onResize, 
  direction = 'vertical' 
}: { 
  onResize: (deltaPercent: number) => void;
  direction?: 'horizontal' | 'vertical';
}) {
  const { token } = antdTheme.useToken();
  const isDragging = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  // 处理拖拽开始
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 仅处理主按钮（鼠标左键）；触摸/笔无需按钮判断
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    isDragging.current = true;
    startPosition.current = { x: e.clientX, y: e.clientY };
    // 防止文本选择
    document.body.style.userSelect = 'none';
    // 添加全局事件监听
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();
  };
  // 处理拖拽移动
  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;
    // 根据方向计算拖拽距离和百分比变化
    let deltaPercent: number;
    if (direction === 'vertical') {
      // 垂直方向：向上拖动增加高度
      const deltaY = startPosition.current.y - e.clientY;
      deltaPercent = (deltaY / window.innerHeight) * 100;
    } else {
      // 水平方向：向右拖动增加宽度
      const deltaX = e.clientX - startPosition.current.x;
      deltaPercent = (deltaX / window.innerWidth) * 100;
    }
    // 调用回调函数更新尺寸
    onResize(deltaPercent);
    // 更新起始位置
    startPosition.current = { x: e.clientX, y: e.clientY };
  };
  // 处理拖拽结束
  const handlePointerUp = () => {
    isDragging.current = false;
    document.body.style.userSelect = '';
    
    // 移除全局事件监听
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerUp);
  };
  
  // 组件卸载时清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);
  
  // 根据方向设置不同的样式
  const style = direction === 'vertical' 
    ? {
        // 由父容器决定厚度（避免在不同使用场景中出现裁切/错位）
        position: 'absolute',
        inset: 0,
        cursor: 'ns-resize',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        // 尽量置顶（仍受父级 stacking context 影响）
        // zIndex: 2147483647
      } as const
    : {
        // 由父容器决定厚度（避免在不同使用场景中出现裁切/错位）
        position: 'absolute',
        inset: 0,
        cursor: 'ew-resize',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        // 尽量置顶（仍受父级 stacking context 影响）
        // zIndex: 2147483647
      } as const;

  // 业界常见的“握把”样式：中间一段圆角短条（视觉提示，不影响命中区）
  const gripStyle = direction === 'vertical'
    ? ({
        width: '40px',
        height: '4px',
        borderRadius: '999px',
        backgroundColor: token.colorTextQuaternary ?? 'rgba(0, 0, 0, 0.28)',
      } as const)
    : ({
        width: '4px',
        height: '40px',
        borderRadius: '999px',
        backgroundColor: token.colorTextQuaternary ?? 'rgba(0, 0, 0, 0.28)',
      } as const);
  
  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      role="separator"
      aria-orientation={direction === 'vertical' ? 'horizontal' : 'vertical'}
    >
      <div style={gripStyle} />
    </div>
  );
}

export default ComResizeHandle; 