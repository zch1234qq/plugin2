import _ from "lodash";
import { Packaging } from "./classes";
import { WORKFLOW_EXPORT_SCHEMA } from "./utils/workflowExport";

export {
  WORKFLOW_EXPORT_SCHEMA,
  WORKFLOW_EXPORT_SCHEMA_VERSION,
  sanitizeFilename,
  buildWorkflowExportPayload,
  exportWorkflowToFile,
} from "./utils/workflowExport";

function stripBom(text: string) {
  return (text || "").replace(/^\uFEFF/, "");
}

export type ParsedWorkflowImport = {
  name: string;
  importedPlugin: any;
};

/**
 * 解析导入 JSON（兼容导出包 or 直接插件对象）
 * - raw: 文件内容字符串
 * - fileName: 用于兜底生成 name
 */
export function parseWorkflowImportJson(raw: string, fileName?: string): ParsedWorkflowImport {
  const text = stripBom(raw);
  const parsed: any = JSON.parse(text);
  const imported: any = parsed?.schema === WORKFLOW_EXPORT_SCHEMA ? parsed?.workflow : parsed;

  if (!imported || !imported.data || !String(imported.data).trim()) {
    throw new Error("INVALID_WORKFLOW_FILE");
  }

  const baseNameFromFile = (fileName || "").replace(/\.(plugin2\.)?json$/i, "");
  const name = (imported.name || parsed?.origin?.name || baseNameFromFile || "导入应用").toString().trim();
  return { name, importedPlugin: imported };
}

/**
 * 根据导入的应用创建并保存为新应用（create+save 由调用方注入）
 */
export async function importWorkflowCreateAndSave(
  args: {
    raw: string;
    fileName?: string;
  },
  deps: {
    adminid?: string;
    createPlugin: (name: string) => Promise<Packaging>;
    savePlugin: (plugin: Packaging) => Promise<void>;
  }
): Promise<Packaging> {
  const { name, importedPlugin } = parseWorkflowImportJson(args.raw, args.fileName);

  const createdPlugin = await deps.createPlugin(name);

  const newPlugin: any = {
    ..._.cloneDeep(importedPlugin),
    id: createdPlugin.id,
    uuid: createdPlugin.uuid,
    name,
    adminid: deps.adminid || "",
    isRef: false,
    published: false,
    isCollected: false,
    description: importedPlugin.description || "",
    color: importedPlugin.color || "",
    typeinput: importedPlugin.typeinput || "",
    tree: importedPlugin.tree || "",
    data: importedPlugin.data,
  };

  await deps.savePlugin(newPlugin as Packaging);
  return newPlugin as Packaging;
}

