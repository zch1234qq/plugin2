import { useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Space, Tag, Typography } from "antd";
import { useAtomValue } from "jotai";
import ComBack from "../../components/ComBack";
import { stateLocalLLM } from "../../common/store/store";
import {
  MainContainer,
  ChatContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

type ProviderKey =
  | "ollama"
  | "openai"
  | "deepseek";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ProviderPreset = {
  label: string;
  baseUrl: string;
  showApiKey: boolean;
  needApiKey: boolean;
  description: string;
};

const PROVIDER_PRESETS: Record<ProviderKey, ProviderPreset> = {
  ollama: {
    label: "Ollama (本地模型)",
    baseUrl: "http://127.0.0.1:11434",
    showApiKey: false,
    needApiKey: false,
    description: "直接连接本机 Ollama，适合用户自有本地大模型。",
  },
  openai: {
    label: "OpenAI / 兼容接口",
    baseUrl: "https://api.openai.com/v1",
    showApiKey: true,
    needApiKey: false,
    description: "适用于 OpenAI 官方或兼容 /v1/chat/completions 的自定义服务；API Key 可选填。",
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    showApiKey: true,
    needApiKey: true,
    description: "DeepSeek 官方接口（OpenAI 兼容）。",
  },
};

function trimSlash(v: string): string {
  return v.endsWith("/") ? v.slice(0, -1) : v;
}

async function requestOllamaChat(baseUrl: string, model: string, messages: ChatMessage[]): Promise<string> {
  const endpoint = `${trimSlash(baseUrl)}/api/chat`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama 请求失败: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data?.message?.content || "";
}

async function requestOpenAICompatibleChat(
  baseUrl: string,
  model: string,
  apiKey: string,
  temperature: number,
  messages: ChatMessage[]
): Promise<string> {
  const endpoint = `${trimSlash(baseUrl)}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI 兼容请求失败: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

type ChatScopeDirection = "incoming" | "outgoing";

export default function ModelHubPage() {
  const localLLM = useAtomValue(stateLocalLLM);
  const [provider, setProvider] = useState<ProviderKey>("ollama");
  const [baseUrl, setBaseUrl] = useState(localLLM?.text?.apiurl || PROVIDER_PRESETS.ollama.baseUrl);
  const [model, setModel] = useState(localLLM?.text?.model || "deepseek-r1:1.5b");
  const [apiKey, setApiKey] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [models, setModels] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "多模型聊天中心已就绪。你可以先选 Ollama，然后直接测试本地模型。",
    },
  ]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [sending, setSending] = useState(false);

  const activePreset = useMemo(() => PROVIDER_PRESETS[provider], [provider]);

  const onProviderChange = (next: ProviderKey) => {
    setProvider(next);
    setBaseUrl(PROVIDER_PRESETS[next].baseUrl);
    setModels([]);
  };

  const loadModels = async () => {
    if (!baseUrl) {
      window.messageApi.warning("请先填写 Base URL");
      return;
    }
    setLoadingModels(true);
    try {
      if (provider === "ollama") {
        const res = await fetch(`${trimSlash(baseUrl)}/api/tags`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const items = (data?.models || []).map((item: any) => item?.name).filter(Boolean);
        setModels(items);
        window.messageApi.success(`已读取 ${items.length} 个本地模型`);
      } else {
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers.Authorization = `Bearer ${apiKey}`;
        }
        const res = await fetch(`${trimSlash(baseUrl)}/models`, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const items = (data?.data || []).map((item: any) => item?.id).filter(Boolean);
        setModels(items);
        window.messageApi.success(`已读取 ${items.length} 个模型`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      window.messageApi.error(`读取模型失败: ${msg}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const send = async (text: string) => {
    const userText = text.trim();
    if (!userText) return;
    if (!baseUrl.trim()) {
      window.messageApi.warning("请填写 Base URL");
      return;
    }
    if (!model.trim()) {
      window.messageApi.warning("请填写模型名称");
      return;
    }
    if (activePreset.needApiKey && !apiKey.trim()) {
      window.messageApi.warning("当前模型源需要 API Key");
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);
    setSending(true);
    try {
      let answer = "";
      if (provider === "ollama") {
        answer = await requestOllamaChat(baseUrl, model, nextMessages);
      } else {
        const tempNum = Number.parseFloat(temperature);
        answer = await requestOpenAICompatibleChat(
          baseUrl,
          model,
          apiKey,
          Number.isNaN(tempNum) ? 0.7 : tempNum,
          nextMessages
        );
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer || "模型返回为空，请检查模型是否正常加载。",
        },
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `请求失败：${msg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const chatModels = useMemo(
    () =>
      messages.map((msg) => ({
        direction: (msg.role === "user" ? "outgoing" : "incoming") as ChatScopeDirection,
        sender: msg.role === "user" ? "你" : "助手",
        message: msg.content,
      })),
    [messages]
  );

  return (
    <div style={{ height: "100%", overflow: "auto", boxSizing: "border-box", padding: 24 }}>
      <ComBack />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          多模型聊天中心
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
          当前仅保留 Ollama、本地 DeepSeek 和 OpenAI 兼容接口。
        </Typography.Paragraph>

        <Card style={{ marginBottom: 16 }}>
          <Form layout="vertical">
            <Form.Item label="模型提供方">
              <Select value={provider} onChange={onProviderChange}>
                {(Object.keys(PROVIDER_PRESETS) as ProviderKey[]).map((key) => (
                  <Select.Option key={key} value={key}>
                    {PROVIDER_PRESETS[key].label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Base URL" tooltip="例如 Ollama: http://127.0.0.1:11434；OpenAI 协议: https://xxx.com/v1">
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="请输入模型服务地址" />
            </Form.Item>

            <Form.Item label="模型名称" tooltip="例如 deepseek-r1:1.5b / deepseek-chat / gpt-4o-mini">
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="请输入模型 ID" />
            </Form.Item>

            {activePreset.showApiKey && (
              <Form.Item label="API Key">
                <Input.Password
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入 API Key"
                />
              </Form.Item>
            )}

            {provider !== "ollama" && (
              <Form.Item label="Temperature">
                <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              </Form.Item>
            )}

            <Space wrap>
              <Button onClick={loadModels} loading={loadingModels}>
                拉取模型列表
              </Button>
              <Tag color="blue">{activePreset.label}</Tag>
            </Space>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {activePreset.description}
            </Typography.Paragraph>
          </Form>
        </Card>

        {models.length > 0 && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Typography.Text strong>可用模型</Typography.Text>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {models.map((item) => (
                <Tag key={item} color={item === model ? "green" : "default"} onClick={() => setModel(item)}>
                  {item}
                </Tag>
              ))}
            </div>
          </Card>
        )}

        <Card bodyStyle={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 540 }}>
            <MainContainer>
              <ChatContainer>
                <MessageList
                  typingIndicator={sending ? <TypingIndicator content="模型生成中..." /> : undefined}
                >
                  {chatModels.map((item, idx) => (
                    <Message
                      key={`${item.sender}-${idx}`}
                      model={{
                        message: item.message,
                        sentTime: "now",
                        sender: item.sender,
                        direction: item.direction,
                        position: "single",
                      }}
                    />
                  ))}
                </MessageList>
                <MessageInput
                  attachButton={false}
                  disabled={sending}
                  placeholder="输入问题后回车发送"
                  onSend={(innerHtml: string) => {
                    void send(innerHtml);
                  }}
                />
              </ChatContainer>
            </MainContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
