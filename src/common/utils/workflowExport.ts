import _ from "lodash";
import JSZip from "jszip";
import { Packaging } from "../classes";

export const WORKFLOW_EXPORT_SCHEMA = "workflow";
export const WORKFLOW_EXPORT_SCHEMA_VERSION = 1;

export type WorkflowExportPayload = {
  schema: typeof WORKFLOW_EXPORT_SCHEMA;
  version: typeof WORKFLOW_EXPORT_SCHEMA_VERSION;
  time: string;
  origin: {
    id: number;
    uuid: string;
    name: string;
  };
  workflow: {
    name: string;
    description: string;
    color: string;
    typeinput: string;
    tree: string;
    data: string;
    verabs: number;
    version: number;
  };
};

export function sanitizeFilename(name: string, fallback = "workflow") {
  const base = (name || "").trim();
  const cleaned = base.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ");
  return cleaned || fallback;
}

function downloadfilenameJsonFile(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

async function resolveExportSource(
  plugin: Packaging,
  opts?: {
    fetchFullPlugin?: (idStr: string) => Promise<Packaging>;
    idStr?: string;
    allowEmptyData?: boolean;
  }
) {
  let source: Packaging = plugin;
  const hasLocalData = !!(source?.data && String(source.data).trim());
  if (!hasLocalData && opts?.fetchFullPlugin && opts?.idStr) {
    try {
      source = await opts.fetchFullPlugin(opts.idStr);
    } catch (error) {
      if (!opts?.allowEmptyData) throw error;
    }
  }
  if (!source?.data || !String(source.data).trim()) {
    if (opts?.allowEmptyData) return source;
    throw new Error("EMPTY_WORKFLOW_DATA");
  }
  return source;
}

export function buildWorkflowExportPayload(source: Packaging): WorkflowExportPayload {
  const pluginClean: any = _.cloneDeep(source);

  // 清理可能包含账号/环境相关的信息，避免泄露或导入冲突
  pluginClean.adminid = "";
  pluginClean.isRef = false;
  pluginClean.published = false;
  pluginClean.isCollected = false;

  return {
    schema: WORKFLOW_EXPORT_SCHEMA,
    version: WORKFLOW_EXPORT_SCHEMA_VERSION,
    time: new Date().toISOString(),
    origin: {
      id: pluginClean.id,
      uuid: pluginClean.uuid,
      name: pluginClean.name,
    },
    workflow: {
      name: pluginClean.name || "",
      description: pluginClean.description || "",
      color: pluginClean.color || "",
      typeinput: pluginClean.typeinput || "",
      tree: pluginClean.tree || "",
      data: pluginClean.data || "",
      verabs: pluginClean.verabs ?? 1,
      version: pluginClean.version ?? 0,
    },
  };
}

/**
 * 导出应用（JSON 文件）
 * - plugin.data 为空时，可通过 opts.fetchFullPlugin 拉取完整 plugin 后再导出
 */
export async function exportWorkflowToFile(
  plugin: Packaging,
  opts?: {
    fetchFullPlugin?: (idStr: string) => Promise<Packaging>;
    idStr?: string;
  }
): Promise<{ filename: string; payload: WorkflowExportPayload }> {
  const source = await resolveExportSource(plugin, opts);

  const payload = buildWorkflowExportPayload(source);
  const fileBase = sanitizeFilename(payload.workflow.name || opts?.idStr || "");
  const filename = `${fileBase}.json`;
  const json = JSON.stringify(payload, null, 2);

  downloadfilenameJsonFile(filename, json);
  return { filename, payload };
}

export async function exportWorkflowsToZip(
  plugins: Packaging[],
  opts?: {
    fetchFullPlugin?: (idStr: string) => Promise<Packaging>;
    zipName?: string;
  }
): Promise<{ filename: string; exportedCount: number }> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const plugin of plugins) {
    const idStr = Packaging.GetIdStrStatic(plugin);
    const source = await resolveExportSource(plugin, {
      fetchFullPlugin: opts?.fetchFullPlugin,
      idStr,
      allowEmptyData: true,
    });
    const payload = buildWorkflowExportPayload(source);
    const fileBase = sanitizeFilename(payload.workflow.name || idStr || "workflow");
    let filename = `${fileBase}.json`;
    let suffix = 2;
    while (usedNames.has(filename)) {
      filename = `${fileBase}_${suffix}.json`;
      suffix += 1;
    }
    usedNames.add(filename);
    zip.file(filename, JSON.stringify(payload, null, 2));
  }

  const zipNameBase = sanitizeFilename(
    opts?.zipName || `应用压缩包`,
    "workflows"
  );
  const archiveName = `${zipNameBase}.zip`;
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(archiveName, blob);

  return { filename: archiveName, exportedCount: plugins.length };
}
