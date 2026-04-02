import React, { createContext, useContext, ReactNode } from 'react';
import type { Packaging } from './classes';

// 创建Plugin上下文
interface PluginContextType {
  plugin: Packaging;
  setPlugin: React.Dispatch<React.SetStateAction<Packaging>>;
  markUnsavedChanges: () => void;
}

const defaultPlugin: Packaging = {
  id: -1,
  uuid: "",
  name: "",
  description: "",
  data: "",
  sharer: "",
  tree: "",
  typeinput: "",
  adminid: "",
  version: 0,
  verabs: 1,
  color: "",
  license: 0,
  isRef: false,
  private: true,
  published: false,
  isCollected: false
} as Packaging;
const defaultContext: PluginContextType = {
  plugin: defaultPlugin,
  setPlugin: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('setPlugin called without PluginProvider');
    }
  },
  markUnsavedChanges: () => {
    // no-op fallback for non-editor usage
  }
};

// 创建上下文，提供默认值避免未包裹时报错
const PluginContext = createContext<PluginContextType>(defaultContext);

// 创建Provider组件
interface PluginProviderProps {
  children: ReactNode;
  plugin: Packaging;
  setPlugin: React.Dispatch<React.SetStateAction<Packaging>>;
  markUnsavedChanges?: () => void;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({
  children,
  plugin,
  setPlugin,
  markUnsavedChanges,
}) => {
  return (
    <PluginContext.Provider
      value={{
        plugin,
        setPlugin,
        markUnsavedChanges: markUnsavedChanges ?? defaultContext.markUnsavedChanges,
      }}
    >
      {children}
    </PluginContext.Provider>
  );
};

// 创建自定义Hook，用于在组件中访问Plugin上下文
export const usePlugin = () => {
  return useContext(PluginContext);
};

export default PluginContext;
