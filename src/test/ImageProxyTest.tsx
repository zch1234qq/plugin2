import React, { useState } from 'react';
import { urlToDataURL } from '../common/utilsImg';

const ImageProxyTest: React.FC = () => {
  const [testUrl, setTestUrl] = useState<string>('https://picsum.photos/id/237/200/300');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const dataUrl = await urlToDataURL(testUrl);
      setResult(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>图片跨域测试</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>测试图片URL：</label>
        <input 
          type="text" 
          value={testUrl} 
          onChange={(e) => setTestUrl(e.target.value)}
          style={{ width: '400px', margin: '0 10px' }}
        />
        <button onClick={handleTest} disabled={loading}>
          {loading ? '测试中...' : '开始测试'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          错误：{error}
        </div>
      )}

      {result && (
        <div>
          <h3>测试结果：</h3>
          <div style={{ marginBottom: '20px' }}>
            <img src={result} alt="测试结果" style={{ maxWidth: '300px' }} />
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            DataURL长度：{result.length} 字符
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3>测试说明：</h3>
        <ul>
          <li>输入一个网络图片URL进行跨域测试</li>
          <li>系统会尝试使用代理和多种方法加载图片</li>
          <li>成功后会显示转换后的图片</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageProxyTest;