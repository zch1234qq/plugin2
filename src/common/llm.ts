import axios from "axios";
import utils from "./utils";
import { LLMApiType, TypeDetailLLM, TypeRespLLM } from "./types/types";

export type LLMProviderPreset = {
  label: string,
  baseUrl: string,
  needApiKey: boolean,
  description: string,
}

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

const API_TYPES_REQUIRING_KEY: LLMApiType[] = ["deepseek"];

export const LLM_PROVIDER_PRESETS: Record<LLMApiType, LLMProviderPreset> = {
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    needApiKey: true,
    description: "DeepSeek 官方接口（OpenAI 兼容）。",
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    needApiKey: false,
    description: "适用于 OpenAI 官方或兼容 /v1/chat/completions 的自定义服务；API Key 可选填。",
  },
  ollama: {
    label: "Ollama ",
    baseUrl: "http://127.0.0.1:11434",
    needApiKey: false,
    description: "直接连接本机 Ollama，适合用户自有本地大模型。",
  }
};

export const LLM_PROVIDER_KEYS = Object.keys(LLM_PROVIDER_PRESETS) as LLMApiType[];

export function trimLLMBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeLoopbackForOllama(apiType: LLMApiType, baseUrl: string): string {
  if (apiType !== "ollama") {
    return baseUrl;
  }
  return baseUrl.replace(/^(https?:\/\/)localhost(?=[:/]|$)/i, "$1127.0.0.1");
}

export function getLLMApiType(apiType?: LLMApiType): LLMApiType {
  return apiType || "ollama";
}

export function providerNeedsApiKey(apiType?: LLMApiType): boolean {
  return API_TYPES_REQUIRING_KEY.includes(getLLMApiType(apiType));
}

export function providerSupportsApiKey(apiType?: LLMApiType): boolean {
  return getLLMApiType(apiType) !== "ollama";
}

export async function fetchLocalLLMModels(detail: Pick<TypeDetailLLM, "apiType" | "apiurl" | "apikey">): Promise<string[]> {
  const apiType = getLLMApiType(detail.apiType);
  const baseUrl = normalizeLoopbackForOllama(apiType, trimLLMBaseUrl(detail.apiurl || ""));
  const apiKey = (detail.apikey || "").trim();

  if (!baseUrl) {
    throw new Error("请填写 API 地址");
  }
  if (providerNeedsApiKey(apiType) && !apiKey) {
    throw new Error("当前接口类型需要 API Key");
  }

  if (apiType === "ollama") {
    const res = await axios.get(`${baseUrl}/api/tags`);
    return (res.data?.models || []).map((item: any) => item?.name).filter(Boolean);
  }

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await axios.get(`${baseUrl}/models`, { headers });
  return (res.data?.data || []).map((item: any) => item?.id).filter(Boolean);
}

function stripBase64Prefix(value: string): string {
  return value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

function normalizeMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
        return item.text;
      }
      return "";
    })
    .join("");
}

type RequestLocalLLMOptions = {
  prompt: string,
  imageUrl?: string,
  numCtx?: number,
  temperature?: number,
}

export async function requestLocalLLM(
  detail: TypeDetailLLM,
  { prompt, imageUrl, numCtx, temperature = 0.2 }: RequestLocalLLMOptions
): Promise<TypeRespLLM> {
  const apiType = getLLMApiType(detail.apiType);
  const baseUrl = normalizeLoopbackForOllama(apiType, trimLLMBaseUrl(detail.apiurl || ""));
  const model = (detail.model || "").trim();
  const apiKey = (detail.apikey || "").trim();

  if (!baseUrl) {
    throw new Error("请填写 API 地址");
  }
  if (!model) {
    throw new Error("请填写模型名称");
  }
  if (providerNeedsApiKey(apiType) && !apiKey) {
    throw new Error("当前接口类型需要 API Key");
  }

  if (apiType === "ollama") {
    const payload: Record<string, unknown> = {
      model,
      prompt,
      stream: false,
    };
    if (imageUrl) {
      payload.images = [stripBase64Prefix(imageUrl)];
    }
    if (numCtx) {
      payload.num_ctx = numCtx;
    }
    const resLLM: { data: TypeRespLLM } = await axios.post(`${baseUrl}/api/generate`, payload);
    return {
      ...resLLM.data,
      response: utils.removeThinkTags(resLLM.data.response || ""),
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const content: string | ChatContentPart[] = imageUrl
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ]
    : prompt;

  const res = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      temperature,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    },
    { headers }
  );

  const response = normalizeMessageContent(res.data?.choices?.[0]?.message?.content);

  return {
    done: true,
    done_reason: res.data?.choices?.[0]?.finish_reason || "",
    response: utils.removeThinkTags(response),
  };
}
