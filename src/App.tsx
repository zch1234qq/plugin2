import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import "./App.css"
import { useAtom } from "jotai";
import { globalStore, isMobileState, setRouter, stateCountToken, stateStatus, stateCreated, statePlugins, tokenState, stateLocalLLM } from "./common/store/store";
import { isMobile } from "./device";
import { DataGetLatestStatus } from "./common/types/types";
// import { useAuthNavigate } from "./common/authNavigate";
import { ReactFlowProvider } from '@xyflow/react';
import './common/theme/theme.css';
import { useCustomNavigate } from "./common/hooks/useCustomNavigate";
import PlanSplit from "./pages/plansplit_/page";
import server from "./common/service/server";
import { normalizeLatestStatusTimestamps, toEpochMs } from "./common/time";
import GlobalDownloadManager from "./components/GlobalDownloadManager";

// 使用 React.lazy 懒加载所有页面组件
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const TableNew = lazy(() => import("./pages/TableNew"));
const Editor = lazy(() => import("./pages/Editor"));
const Use = lazy(() => import("./pages/use/page"));
const Service = lazy(() => import("./pages/service/page"));
const Privacy = lazy(() => import("./pages/privacy/page"));
const Setting = lazy(() => import("./pages/setting/page"));
const Doc = lazy(() => import("./pages/doc/page"));
const License = lazy(() => import("./pages/license/page"));
const ResetPassword = lazy(() => import("./pages/reset/page"));
const ModelHub = lazy(() => import("./pages/modelhub/page"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LocalModel = lazy(() => import("./pages/localmodel/page"));
// const Download = lazy(() => import("./pages/download/page"));

// 加载指示器组件
const LoadingFallback = () => <div className="loading-spinner"></div>;

function App() {
  const [localLLM] = useAtom(stateLocalLLM);
  useEffect(() => {
    let cancelled = false;

    const syncByLatestStatus = async () => {
      const localStatus = globalStore.get(stateStatus);

      try {
        const res = await server.getLatestStatus();
        if (cancelled) return;

        // 兼容后端/旧数据：time_update 可能是秒级时间戳（10位），统一转换成毫秒
        const serverStatus: DataGetLatestStatus = normalizeLatestStatusTimestamps(res.data as DataGetLatestStatus);

        if (!serverStatus.success) {
          return;
        }

        // token 数量直接使用 getLatestStatus 返回结果
        globalStore.set(stateCountToken, serverStatus.counttoken);

        const localOuterTimeUpdate = toEpochMs(localStatus?.statussave?.time_update || 0);
        const serverOuterTimeUpdate = toEpochMs(serverStatus.statussave?.time_update || 0);

        // 先用最外层 time_update 判断是否需要更新
        if (serverOuterTimeUpdate <= localOuterTimeUpdate && localStatus) {
          // 即便无需更新，也可刷新本地 status（保持一致）
          globalStore.set(stateStatus, serverStatus);
          return;
        }
        // 构建本地 item 时间戳映射，用于逐项对照
        const localItemTimeMap = new Map<string, number>(
          (localStatus?.statussave?.items || []).map((it) => [it.uuid, toEpochMs(it.time_update)])
        );

        const changedItems = (serverStatus.statussave?.items || []).filter((it) => {
          const localTime = localItemTimeMap.get(it.uuid) || 0;
          return toEpochMs(it.time_update) > localTime;
        });

        if (changedItems.length === 0) {
          globalStore.set(stateStatus, serverStatus);
          return;
        }

        const currentCreated = globalStore.get(stateCreated);
        const currentPlugins = globalStore.get(statePlugins);

        let createdNext = currentCreated;
        let pluginsNext = currentPlugins;

        let createdTouched = false;
        let pluginsTouched = false;

        const syncTasks = changedItems.map(async (item) => {
          try {
            const useRes = await server.read(item.uuid);
            if (!useRes.data.success) return;
            const plugin = useRes.data.plugin;
            const localCreatedPlugin = currentCreated?.[item.uuid];
            const localPluginsPlugin = currentPlugins?.[item.uuid];

            const mergePreserveSharer = (localP: any, remoteP: any) => {
              if (!localP) return remoteP;
              if (!remoteP) return localP;
              const remoteSharer = remoteP?.sharer;
              const localSharer = localP?.sharer;
              const shouldPreserveSharer =
                (remoteSharer === undefined || remoteSharer === null || remoteSharer === "") &&
                (localSharer !== undefined && localSharer !== null && localSharer !== "");
              return {
                ...localP,
                ...remoteP,
                ...(shouldPreserveSharer ? { sharer: localSharer } : {}),
              };
            };

            // 如果本地已存在对应 uuid，则更新；同时也写入 plugins 缓存，便于后续复用
            if (currentCreated?.[item.uuid]) {
              if (!createdTouched) {
                createdNext = { ...currentCreated };
                createdTouched = true;
              }
              createdNext[item.uuid] = mergePreserveSharer(localCreatedPlugin, plugin);
            }

            if (!pluginsTouched) {
              pluginsNext = { ...currentPlugins };
              pluginsTouched = true;
            }
            pluginsNext[item.uuid] = mergePreserveSharer(localPluginsPlugin, plugin);
          } catch (_e) {
            // 忽略单项同步失败，继续处理其他项
          }
        });

        await Promise.allSettled(syncTasks);
        if (cancelled) return;

        if (createdTouched) {
          globalStore.set(stateCreated, createdNext);
        }
        if (pluginsTouched) {
          globalStore.set(statePlugins, pluginsNext);
        }

        // 同步完成后再写回最新 status（避免先覆盖导致无法对照）
        globalStore.set(stateStatus, serverStatus);
      } catch (err: any) {
        window.messageApi.error({
          content: err.message,
          key: "error"
        })
      }
    };

    // 如果已经登录的话，我们就拉取信息
    if (globalStore.get(tokenState)) {
      syncByLatestStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [])

  return (
    <ReactFlowProvider>
      <Router>
        <AppContent />
      </Router>
    </ReactFlowProvider>
  );
}

function AppContent() {
  const [,setIsMobile]=useAtom(isMobileState)
  const router=useCustomNavigate()

  useEffect(()=>{
    setIsMobile(isMobile())
    setRouter(router)
  }, []) // 添加空依赖数组，避免不必要的重复执行
  
  // 在首页加载完成后，预加载其他常用页面
  useEffect(() => {
    const preloadRoutes = () => {
      // 预加载最常用的几个页面
      import("./pages/Home");
      import("./pages/Editor");
    };
    
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadRoutes);
    } else {
      setTimeout(preloadRoutes, 2000);
    }
  }, []);

  // 立即加载字体文件，不再延迟
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = './assets/DingTalkJinBuTi-Regular.css'; // 指向子集化后的字体CSS
    document.head.appendChild(fontLink);
  }, []);

  return (
    <>
      <div style={{height:"100%"}}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/table" element={<TableNew/>}/>
            <Route path="/tablenew" element={<TableNew/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/editor" element={<Editor/>}/>
            {/* <Route path="/editorref" element={<EditorRef/>}/> */}
            <Route path="/use" element={<Use/>}/>
            <Route path="/doc" element={<Doc/>}/>
            <Route path="/service" element={<Service/>}/>
            <Route path="/privacy" element={<Privacy/>}/>
            <Route path="/setting" element={<Setting/>}/>
            <Route path="/modelhub" element={<ModelHub/>}/>
            <Route path="/localmodel" element={<LocalModel/>}/>
            <Route path="/license" element={<License/>}/>
            <Route path="/plan" element={<PlanSplit/>}/>
            <Route path="/reset" element={<ResetPassword/>}/>
            {/* <Route path="/download" element={<Download/>}/>
            <Route path="/localmodel" element={<LocalModel/>}/> */}
            <Route path="*" element={<NotFound/>} />
          </Routes>
        </Suspense>
      </div>
      <GlobalDownloadManager />
    </>
  );
}
export default App;
