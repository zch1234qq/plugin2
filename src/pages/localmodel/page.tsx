import { Button, Card, Flex, Form, Input, Select, Switch, Tabs, Tag, Typography } from 'antd';
import { useState, useEffect, useRef } from 'react';
import LoadingCus from "../../components/loadingCus";
import ComBack from "../../components/ComBack";
import './style.css';
import { useAtom } from 'jotai';
import { stateLocalLLM } from '../../common/store/store';
import { ConfigLLM, LLMApiType } from '../../common/types/types';
import { fetchLocalLLMModels, LLM_PROVIDER_KEYS, LLM_PROVIDER_PRESETS, providerNeedsApiKey, providerSupportsApiKey } from '../../common/llm';
import { theme as antTheme } from 'antd';

type ModelType = 'text' | 'vision' | 'ocr' | 'search';

type LocalModelFormValues = {
  enabled: boolean;
  apiType: LLMApiType;
  baseUrl: string;
  apiKey?: string;
  modelName: string;
  visionModelName: string;
  ocrModelName: string;
  searchModelName: string;
};

const MODEL_FIELD_MAP: Record<ModelType, 'modelName' | 'visionModelName' | 'ocrModelName' | 'searchModelName'> = {
  text: 'modelName',
  vision: 'visionModelName',
  ocr: 'ocrModelName',
  search: 'searchModelName'
};

/**
 * 本地模型配置页面组件
 */
export default function LocalModel() {
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadModelsErrorDetail, setLoadModelsErrorDetail] = useState<string>("");
  const [models, setModels] = useState<string[]>([]);
  const [localLLM, setLocalLLM] = useAtom(stateLocalLLM);
  const [form] = Form.useForm();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingFormRef = useRef(false);
  const localEnabledInitializedRef = useRef(false);
  const isMobile = window.innerWidth <= 768;
  const selectedApiType = (Form.useWatch("apiType", form) || localLLM.text.apiType || "ollama") as LLMApiType;
  const watchedTextModel = Form.useWatch("modelName", form);
  const watchedVisionModel = Form.useWatch("visionModelName", form);
  const watchedOcrModel = Form.useWatch("ocrModelName", form);
  const watchedSearchModel = Form.useWatch("searchModelName", form);
  const needApiKey = providerNeedsApiKey(selectedApiType);
  const showApiKey = providerSupportsApiKey(selectedApiType);
  const selectedModelMap: Record<ModelType, string | undefined> = {
    text: watchedTextModel,
    vision: watchedVisionModel,
    ocr: watchedOcrModel,
    search: watchedSearchModel
  };

  useEffect(() => {
    syncingFormRef.current = true;
    form.setFieldsValue({
      enabled: localLLM.local,
      apiType: selectedApiType,
      baseUrl: localLLM.text.apiurl || LLM_PROVIDER_PRESETS.ollama.baseUrl,
      apiKey: localLLM.text.apikey || "",
      modelName: localLLM.text.model || "llama3",
      visionModelName: localLLM.img.model || "llama3.2-vision",
      ocrModelName: localLLM.ocr.model || "llama3",
      searchModelName: localLLM.search.model || "llama3",
    });
    setLoading(false);

    const timer = window.setTimeout(() => {
      syncingFormRef.current = false;
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, localLLM, selectedApiType]);

  useEffect(() => {
    if (!localEnabledInitializedRef.current) {
      localEnabledInitializedRef.current = true;
      return;
    }

    if (localLLM.local) {
      window.messageApi.success("已启用本地AI");
    } else {
      window.messageApi.info("已停用本地AI");
    }
  }, [localLLM.local]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const scheduleAutoSave = (values: LocalModelFormValues) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(values);
    }, 400);
  };

  const handleApiTypeChange = (next: LLMApiType) => {
    const preset = LLM_PROVIDER_PRESETS[next];
    setModels([]);
    form.setFieldsValue({
      apiType: next,
      baseUrl: preset.baseUrl,
      apiKey: providerSupportsApiKey(next) ? form.getFieldValue("apiKey") : ""
    });
  };

  const loadModels = async () => {
    setLoadingModels(true);
    setLoadModelsErrorDetail("");
    try {
      const formValues = await form.validateFields(needApiKey ? ['apiType', 'baseUrl', 'apiKey'] : ['apiType', 'baseUrl']) as LocalModelFormValues;
      const apiType = formValues.apiType || "ollama";
      const items = await fetchLocalLLMModels({
        apiType,
        apiurl: (formValues.baseUrl || LLM_PROVIDER_PRESETS[apiType].baseUrl).trim(),
        apikey: (formValues.apiKey || "").trim()
      });
      setModels(items);
      setLoadModelsErrorDetail("");
      window.messageApi.success(`已读取 ${items.length} 个模型`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误';
      const detail = error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack || ""}`.trim()
        : JSON.stringify(error, null, 2) || String(error);
      setLoadModelsErrorDetail(detail);
      console.error('[localmodel] 读取模型失败', {
        error,
        name: error instanceof Error ? error.name : undefined,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      window.messageApi.error(`读取模型失败: ${msg}`);
    } finally {
      setLoadingModels(false);
    }
  };
  const showModelList = () => {
    return (
      <Button onClick={loadModels} loading={loadingModels}>
        显示模型列表
      </Button>
    );
  };

  const renderModelSuggestions = (modelType: ModelType) => {
    if (models.length === 0) {
      return null;
    }

    const fieldName = MODEL_FIELD_MAP[modelType];
    const selectedModel = selectedModelMap[modelType];

    return (
      <div style={{ marginBottom: 16 }}>
        {/* <Typography.Text type="secondary">可用模型</Typography.Text> */}
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {models.map((item) => (
            <Tag
              key={`${modelType}-${item}`}
              color={item === selectedModel ? 'green' : 'default'}
              onClick={() => {
                form.setFieldsValue({ [fieldName]: item });
                scheduleAutoSave({
                  ...(form.getFieldsValue(true) as LocalModelFormValues),
                  [fieldName]: item
                } as LocalModelFormValues);
              }}
              style={{ cursor: 'pointer' }}
            >
              {item}
            </Tag>
          ))}
        </div>
      </div>
    );
  };

  const handleSave = (values: LocalModelFormValues) => {
    try {
      const apiType = values.apiType || "ollama";
      const apiUrl = (values.baseUrl || LLM_PROVIDER_PRESETS[apiType].baseUrl).trim();
      const apiKey = (values.apiKey || "").trim();

      const buildConfig = (detail: typeof localLLM.text, model: string) => ({
        ...detail,
        apiurl: apiUrl,
        model,
        apiType,
        apikey: apiKey
      });

      const newConfig: ConfigLLM = {
        ...localLLM,
        local: values.enabled,
        apiurl: apiUrl,
        text: buildConfig(localLLM.text, values.modelName),
        img: buildConfig(localLLM.img, values.visionModelName),
        ocr: buildConfig(localLLM.ocr, values.ocrModelName),
        search: buildConfig(localLLM.search, values.searchModelName)
      };

      setLocalLLM(newConfig);
    } catch (error) {
      console.error('保存配置失败:', error);
      window.messageApi.error(error instanceof Error ? error.message : '保存失败，请重试');
    }
  };

  // Tabs的项定义
  const tabItems = [
    {
      key: '1',
      label: '文字',
      children: (
        <>
          <Form.Item
            name="modelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="输入模型名称" />
          </Form.Item>
          {renderModelSuggestions('text')}
          {showModelList()}
        </>
      )
    },
    {
      key: '2',
      label: '图片',
      children: (
        <>
          <Form.Item
            name="visionModelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入视觉模型名称' }]}
          >
            <Input placeholder="输入支持图像的模型名称" />
          </Form.Item>
          {renderModelSuggestions('vision')}
          {showModelList()}
        </>
      )
    },
    {
      key: '3',
      label: 'OCR',
      children: (
        <>
          <Form.Item
            name="ocrModelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入OCR模型名称' }]}
          >
            <Input placeholder="输入支持OCR的模型名称" />
          </Form.Item>
          {renderModelSuggestions('ocr')}
          {showModelList()}
        </>
      )
    },
    // {
    //   key: '4',
    //   label: '搜索模型',
    //   children: (
    //     <>
    //       <Form.Item
    //         name="searchModelName"
    //         label="搜索模型名称"
    //         rules={[{ required: true, message: '请输入搜索模型名称' }]}
    //       >
    //         <Input placeholder="输入支持搜索的模型名称" />
    //       </Form.Item>
    //       {renderModelSuggestions('search')}
    //       {/* <Form.Item>
    //         <Button 
    //           type="default"
    //           onClick={() => testModelConnection('search')}
    //           loading={searchTesting}
    //           disabled={saving}
    //         >
    //           测试连接
    //         </Button>
    //       </Form.Item> */}
    //     </>
    //   )
    // }
  ];

  return (
    <LoadingCus isLoading={loading}>
      <ComBack />
      <div style={{ 
        padding: isMobile ? '16px' : '24px', 
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        boxSizing:"border-box",
        userSelect:"none"
      }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={(_, allValues) => {
            if (syncingFormRef.current) {
              return;
            }
            scheduleAutoSave(allValues as LocalModelFormValues);
          }}
          requiredMark={false}
          className="local-model-form"
        >
          <Card 
            className="config-card"
            style={{ marginBottom: '24px' }}
          >
            <Form.Item
              name="enabled"
              // label="使用本地AI"
              valuePropName="checked"
            >
              <Flex align="center" gap={8} justify="space-between">
                <Switch title={localLLM.local?"点击停用本地AI":"点击启用本地AI"}  checked={localLLM.local} onChange={(checked)=>{
                  setLocalLLM({...localLLM,local:checked})
                }} />
                <Typography.Text type="secondary" style={{ fontSize: antTheme.useToken().token.fontSizeSM }}>为了满足用户的内网使用和低成本使用这两种需求，我们推出了aditor电脑版，支持连接本地AI(当前为公测版本，暂时支持连接外部AI)。</Typography.Text>
              </Flex>
            </Form.Item>
            <Form.Item
              name="apiType"
              label="类型"
              rules={[{ required: true, message: '请选择API接口类型' }]}
            >
              <Select disabled onChange={handleApiTypeChange}>
                {LLM_PROVIDER_KEYS.map((key) => (
                  <Select.Option key={key} value={key}>
                    {LLM_PROVIDER_PRESETS[key].label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="baseUrl"
              label="地址"
              rules={[{ required: true, message: '请输入API地址' }]}
            >
              <Input
                placeholder="请输入完整 Base URL"
                disabled
              />
            </Form.Item>
            {showApiKey && (
              <Form.Item
                name="apiKey"
                label="API Key"
                rules={needApiKey ? [{ required: true, message: '请输入API Key' }] : []}
              >
                <Input.Password placeholder="请输入 API Key" />
              </Form.Item>
            )}
            <Tabs defaultActiveKey="1" items={tabItems} />
            {loadModelsErrorDetail && (
              <div style={{ marginTop: 12 }}>
                <Typography.Text type="danger">读取模型错误详情</Typography.Text>
                <Input.TextArea
                  value={loadModelsErrorDetail}
                  readOnly
                  autoSize={{ minRows: 4, maxRows: 10 }}
                  style={{ marginTop: 8, fontFamily: "Consolas, monospace" }}
                />
              </div>
            )}
          </Card>
        </Form>
        
      </div>
    </LoadingCus>
  );
} 