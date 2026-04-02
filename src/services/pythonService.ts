// 使用CDN版本的pyodide
declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface PyodideInterface {
  runPython: (code: string) => any;
  loadPackage: (packages: string | string[]) => Promise<void>;
  globals: any;
}

class PythonService {
  private pyodide: PyodideInterface | null = null;
  private pyodideInitialized = false;
  private pyodideLoading = false;
  private static readonly PRELOAD_PACKAGES: string[] = [
    // 'micropip',
    // 'numpy',
    // 'pandas',
    // 'matplotlib',
    // 'scipy',
    // 'scikit-learn',
    // 'pillow',
    // 'sympy',
    // 'networkx',
    // 'lxml',
    // 'pyyaml',
    // 'requests',
    // 'beautifulsoup4',
    // 'sqlalchemy',
    // 'seaborn',
    // 'h5py',
    // 'scikit-image',
    // 'statsmodels'
  ];

  /**
   * 初始化Pyodide（前端Python执行环境）
   */
  async initPyodide(): Promise<void> {
    if (this.pyodideInitialized || this.pyodideLoading) {
      return;
    }
    this.pyodideLoading = true;
    try {
      // 动态加载pyodide
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        //使用本地的pyodide 0.24.1
        script.src = '/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      this.pyodide = await window.loadPyodide({
        indexURL: '/pyodide/v0.24.1/full/',
        // lockFileURL: '/pyodide/v0.24.1/full/pyodide-lock.json',
        packageCacheDir: '/pyodide/v0.24.1/full/',
      });
      // 预加载主流包（按官方方式：loadPackage）。逐个加载，失败不影响整体。
      await this.preloadMainstreamPackages();
      this.pyodideInitialized = true;
    } catch (error) {
      console.error('Pyodide初始化失败:', error);
      throw new Error(`Pyodide初始化失败: ${error}`);
    } finally {
      this.pyodideLoading = false;
    }
  }

  /**
   * 预加载Pyodide常用主流包
   */
  private async preloadMainstreamPackages(): Promise<void> {
    if (!this.pyodide) return;
    for (const pkg of PythonService.PRELOAD_PACKAGES) {
      try {
        await this.pyodide.loadPackage(pkg);
      } catch (error) {
        console.warn('包预加载失败:', pkg, error);
      }
    }
  }

  /**
   * 执行Python代码
   */
  async executePython(code: string): Promise<string> {
    if (!this.pyodideInitialized) {
      await this.initPyodide();
    }

    if (!this.pyodide) {
      throw new Error('Pyodide未初始化');
    }

    try {
      // 捕获输出的Python代码，自动输出最后一行的变量
      const outputCapture = `
import sys
import io
import ast
from contextlib import redirect_stdout, redirect_stderr

# 创建字符串缓冲区来捕获输出
stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()

try:
    with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
        # 先执行所有代码
        exec('''${code.replace(/'/g, "\\'")}''')
        
        # 然后解析代码，找到最后一个表达式
        lines = '''${code.replace(/'/g, "\\'")}'''.split('\\n')
        last_line = None
        for line in reversed(lines):
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('"""') and not line.startswith("'''"):
                try:
                    # 尝试解析为表达式
                    ast.parse(line, mode='eval')
                    last_line = line
                    break
                except:
                    continue
        
        # 如果有最后一个表达式，输出其值
        if last_line:
            try:
                last_value = eval(last_line)
                if last_value is not None:
                    print(last_value)
            except:
                pass
    
    stdout_content = stdout_buffer.getvalue()
    stderr_content = stderr_buffer.getvalue()
    
    if stderr_content:
        result = f"错误:\\n{stderr_content}"
    else:
        result = stdout_content if stdout_content else "执行完成，无输出"
        
except Exception as e:
    raise Exception(f"#执行异常: {str(e)}")
result
`;

      const result = this.pyodide!.runPython(outputCapture);
      return String(result || '执行完成，无返回值');
    } catch (error: any) {
      throw new Error(`Python执行失败: ${error.message}`);
    }
  }

  /**
   * 获取Python环境信息
   */
  async getPythonInfo(): Promise<{ initialized: boolean; version?: string }> {
    if (!this.pyodideInitialized) {
      return { initialized: false };
    }

    try {
      const version = this.pyodide?.runPython('import sys; sys.version');
      return { 
        initialized: true, 
        version: String(version)
      };
    } catch (error) {
      return { initialized: true };
    }
  }

  /**
   * 安装Python包
   */
  async installPackage(packages: string | string[]): Promise<void> {
    if (!this.pyodideInitialized) {
      await this.initPyodide();
    }

    if (!this.pyodide) {
      throw new Error('Pyodide未初始化');
    }

    await this.pyodide!.loadPackage(packages);
  }

  /**
   * 预热Python环境
   */
  async warmup(): Promise<void> {
    try {
      // 异步预热Pyodide
      this.initPyodide().catch(console.error);
    } catch (error) {
      console.warn('Python环境预热失败:', error);
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.pyodideInitialized;
  }

  /**
   * 检查是否正在加载
   */
  isLoading(): boolean {
    return this.pyodideLoading;
  }
}

// 导出单例
export const pythonService = new PythonService();

// 移除自动预热，改为按需加载
// pythonService.warmup();