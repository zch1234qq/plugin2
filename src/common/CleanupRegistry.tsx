// 清理注册中心类，用于统一管理组件卸载时需要清理的资源和任务
class CleanupRegistry {
  // 存储所有注册的事件监听器
  private eventListeners: Array<{ emitter: any; event: string; callback: any }> = [];
  
  // 存储所有注册的音频资源
  private audioResources: Array<HTMLAudioElement> = [];
  
  // 存储所有注册的清理函数
  private cleanupFunctions: Array<() => void> = [];

  // 注册事件监听器
  registerEventListener(emitter: any, event: string, callback: any): void {
    this.eventListeners.push({ emitter, event, callback });
  }

  // 注册音频资源
  registerAudioResource(audio: HTMLAudioElement): void {
    this.audioResources.push(audio);
  }

  // 注册清理函数
  registerCleanupFunction(func: () => void): void {
    this.cleanupFunctions.push(func);
  }

  // 统一清理所有资源
  cleanup(): void {
    // 清理事件监听器
    this.eventListeners.forEach(({ emitter, event, callback }) => {
      if (emitter && typeof emitter.off === 'function') {
        emitter.off(event, callback);
      }
    });
    this.eventListeners = [];

    // 清理音频资源
    this.audioResources.forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
        audio.src = '';
      }
    });
    this.audioResources = [];

    // 执行所有清理函数
    this.cleanupFunctions.forEach(func => {
      try {
        func();
      } catch (error) {
        console.error('Error executing cleanup function:', error);
      }
    });
    this.cleanupFunctions = [];
  }

  // 检查是否有注册的资源
  hasRegisteredResources(): boolean {
    return this.eventListeners.length > 0 || this.audioResources.length > 0 || this.cleanupFunctions.length > 0;
  }

  // 获取当前注册资源的统计信息
  getRegistryStats(): { eventListeners: number; audioResources: number; cleanupFunctions: number } {
    return {
      eventListeners: this.eventListeners.length,
      audioResources: this.audioResources.length,
      cleanupFunctions: this.cleanupFunctions.length
    };
  }
}

export default CleanupRegistry;