/**
 * 跨平台行式存储工具
 * 支持 Tauri 和 Web 环境，包含加密功能
 */
import Storage from './Storage';
import { globalStore } from './store/store';
import storeMemory   from './store/memory';

/**
 * 存储格式接口，用于更结构化地存储行数据
 */
interface LineContainer {
  lines: string[];
  metadata?: {
    version: string;
    lastUpdated: number;
  };
}

// 用于防止并发写入的写入锁
const writeLocks: Record<string, boolean> = {};

// 写入等待队列
const writeQueues: Record<string, Array<() => Promise<void>>> = {};

/**
 * 请求写入锁
 * @param key 存储键
 * @returns 锁请求Promise
 */
function acquireLock(key: string): Promise<void> {
  if (!writeQueues[key]) {
    writeQueues[key] = [];
  }
  
  return new Promise<void>((resolve) => {
    const tryAcquire = async () => {
      if (!writeLocks[key]) {
        writeLocks[key] = true;
        resolve();
        return;
      }
      
      writeQueues[key].push(tryAcquire);
    };
    
    tryAcquire();
  });
}

/**
 * 释放写入锁
 * @param key 存储键
 */
function releaseLock(key: string): void {
  writeLocks[key] = false;
  
  // 处理队列中的下一个写入任务
  if (writeQueues[key] && writeQueues[key].length > 0) {
    const nextAcquire = writeQueues[key].shift();
    if (nextAcquire) {
      nextAcquire();
    }
  }
}

/**
 * 初始化或获取行容器
 * @param key 存储键
 * @returns 行容器对象
 */
async function getLineContainer(key: string): Promise<LineContainer> {
  try {
    const data = await Storage.get(key);
    if (!data) {
      // 返回空容器
      return {
        lines: [],
        metadata: {
          version: '1.0',
          lastUpdated: Date.now()
        }
      };
    }
    
    // 尝试解析为结构化数据
    try {
      const container = JSON.parse(data) as LineContainer;
      // 确保结构完整
      if (!Array.isArray(container.lines)) {
        container.lines = [];
      }
      if (!container.metadata) {
        container.metadata = {
          version: '1.0',
          lastUpdated: Date.now()
        };
      }
      return container;
    } catch (e) {
      // 兼容旧格式：如果不是JSON，假设是旧的换行符分隔格式
      const lines = data.split('\n');
      return {
        lines,
        metadata: {
          version: '1.0',
          lastUpdated: Date.now()
        }
      };
    }
  } catch (error) {
    console.error('获取行容器失败:', error);
    return {
      lines: [],
      metadata: {
        version: '1.0',
        lastUpdated: Date.now()
      }
    };
  }
}

/**
 * 保存行容器
 * @param key 存储键
 * @param container 行容器对象
 * @returns 成功状态的Promise
 */
async function saveLineContainer(key: string, container: LineContainer): Promise<boolean> {
  try {
    // 更新元数据
    if (container.metadata) {
      container.metadata.lastUpdated = Date.now();
    }
    await Storage.set(key, JSON.stringify(container));
    return true;
  } catch (error) {
    console.error('保存行容器失败:', error);
    return false;
  }
}

/**
 * 写入一行数据
 * @param key 存储键
 * @param line 要存储的行数据
 * @returns 成功状态的Promise
 */
export const writeLine = async (key: string, line: string): Promise<boolean> => {
  try {
    // 获取写入锁
    await acquireLock(key);
    try {
      const container = await getLineContainer(key);
      container.lines.push(line);
      storeMemory.addMemoryLine(line);
      return await saveLineContainer(key, container);
    } finally {
      // 释放锁，确保即使发生错误也能释放锁
      releaseLock(key);
    }
  } catch (error) {
    console.error('写入数据失败:', error);
    return false;
  }
};

/**
 * 读取最新一行数据
 * @param key 存储键
 * @returns 最新的一行数据的Promise，如果没有则返回null
 */
export const readLatestLine = async (key: string): Promise<string | null> => {
  try {
    const container = await getLineContainer(key);
    if (container.lines.length === 0) return null;
    
    // 返回最后一行
    return container.lines[container.lines.length - 1] || null;
  } catch (error) {
    console.error('读取数据失败:', error);
    return null;
  }
};

/**
 * 列出所有行
 * @param key 存储键
 * @param limit 限制返回的行数，默认为100
 * @returns 行数组的Promise
 */
export const listLines = async (key: string, limit = 10000): Promise<string[]> => {
  try {
    const container = await getLineContainer(key);
    if (container.lines.length === 0) return [];
    // 返回指定数量的行
    if (limit > 0 && container.lines.length > limit) {
      return container.lines.slice(-limit);
    }
    return container.lines;
  } catch (error) {
    console.error('列出数据失败:', error);
    return [];
  }
};

/**
 * 批量写入多行数据
 * @param key 存储键
 * @param lines 要存储的行数据数组
 * @param append 是否追加到现有数据，默认为true
 * @returns 成功状态的Promise
 */
export const writeLines = async (key: string, lines: string[], append = true): Promise<boolean> => {
  try {
    // 获取写入锁
    await acquireLock(key);
    
    try {
      const container = await getLineContainer(key);
      
      if (append) {
        // 追加模式
        container.lines.push(...lines);
      } else {
        // 覆盖模式
        container.lines = lines;
      }
      
      return await saveLineContainer(key, container);
    } finally {
      // 释放锁
      releaseLock(key);
    }
  } catch (error) {
    console.error('批量写入数据失败:', error);
    return false;
  }
};

/**
 * 清除指定键的所有行
 * @param key 存储键
 * @returns 成功状态的Promise
 */
export const clearLines = async (key: string): Promise<{success:boolean,msg:string}> => {
  try {
    // 获取写入锁
    await acquireLock(key);
    
    try {
      const container = await getLineContainer(key);
      if(container.lines.length === 0){
        return {success:true,msg:`记忆为空`};
      }
      container.lines = [];
      storeMemory.clearMemory();
      let success = await saveLineContainer(key, container);
      return {success,msg:`删除成功`};
    } finally {
      // 释放锁
      releaseLock(key);
    }
  } catch (error) {
    return {success:false,msg:`删除失败: ${error}`};
  }
};

/**
 * 删除最新的一行数据
 * @param key 存储键
 * @returns 成功状态的Promise
 */
export const removeLatestLine = async (key: string): Promise<boolean> => {
  try {
    // 获取写入锁
    await acquireLock(key);
    try {
      const container = await getLineContainer(key);
      if (container.lines.length === 0) {
        // 已经没有数据，视为操作成功
        return true;
      }
      // 移除最后一行
      container.lines.pop();
      storeMemory.removeMemoryLine();
      return await saveLineContainer(key, container);
    } finally {
      // 释放锁
      releaseLock(key);
    }
  } catch (error) {
    console.error('删除最新行数据失败:', error);
    return false;
  }
};

export default {
  writeLine,
  readLatestLine,
  listLines,
  writeLines,
  clearLines,
  removeLatestLine
}; 