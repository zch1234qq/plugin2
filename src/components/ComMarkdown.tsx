import React from 'react';
import './ComMarkdown.css';

interface ComMarkdownProps {
  data: string;
  className?: string;
}

/**
 * 富文本渲染组件
 * 用于将包含HTML或Markdown格式的文本渲染为HTML
 * 支持HTML格式表格的正确显示
 */
const ComMarkdown: React.FC<ComMarkdownProps> = ({ data, className = '' }) => {
  // 确保数据不为undefined或null
  const content = data || '';
  
  return (
    <div 
      className={`com-markdown ${className}`} 
      style={{ padding: '10px' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default ComMarkdown;