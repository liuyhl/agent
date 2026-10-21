import { extractJson, validateSpec, type ValidationResult } from '../schema/validate';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface GenerateResult {
  validation: ValidationResult;
  rawText: string;
}

const STORAGE_KEY = 'prototype-agent-llm-config';
export const DEFAULT_BASE_URL = 'https://api.siliconflow.cn/v1';
export const DEFAULT_MODEL = 'Qwen/Qwen3-32B';

export function loadLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LlmConfig>;
      return {
        baseUrl: parsed.baseUrl || DEFAULT_BASE_URL,
        apiKey: parsed.apiKey || 'sk-hqawbmhngxbhvhzkpugabkngdegqgbtrvtrcskzgudirlush',
        model: normalizeModelName(parsed.model),
      };
    }
  } catch {
    /* ignore */
  }
  return {
    baseUrl: DEFAULT_BASE_URL,
    apiKey: 'sk-hqawbmhngxbhvhzkpugabkngdegqgbtrvtrcskzgudirlush',
    model: DEFAULT_MODEL,
  };
}

export function saveLlmConfig(config: LlmConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...config,
      model: normalizeModelName(config.model),
    }),
  );
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function normalizeModelName(model?: string): string {
  const m = (model || '').trim();
  if (!m || m === 'gpt-4o-mini' || m === 'gpt-4o') return DEFAULT_MODEL;
  return m;
}

function isSiliconFlow(baseUrl: string): boolean {
  return /api\.siliconflow\.(cn|com)/i.test(baseUrl);
}

/** 开发态走 Vite 代理，避免浏览器 CORS 导致 Failed to fetch */
function resolveChatCompletionsUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl || DEFAULT_BASE_URL);
  if (import.meta.env.DEV && isSiliconFlow(normalized)) {
    return '/siliconflow-api/v1/chat/completions';
  }
  return `${normalized}/chat/completions`;
}

function stripThinking(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();
}

function pickMessageContent(data: {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
}): string {
  const msg = data.choices?.[0]?.message;
  if (!msg) return '';
  const content = typeof msg.content === 'string' ? stripThinking(msg.content) : '';
  if (content) return content;
  const reasoning =
    typeof msg.reasoning_content === 'string' ? stripThinking(msg.reasoning_content) : '';
  return reasoning;
}

function buildRequestBody(description: string, model: string, withJsonMode: boolean) {
  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: 4096,
    // Qwen3 默认 enable_thinking=true，易导致空内容或非 JSON
    enable_thinking: false,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(description) },
    ],
  };
  if (withJsonMode) {
    body.response_format = { type: 'json_object' };
  }
  return body;
}

async function postChatCompletions(
  description: string,
  config: LlmConfig,
  withJsonMode: boolean,
): Promise<GenerateResult> {
  const model = normalizeModelName(config.model);
  const endpoint = resolveChatCompletionsUrl(config.baseUrl);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify(buildRequestBody(description, model, withJsonMode)),
    });
  } catch (err) {
    const msg = (err as Error).message || String(err);
    throw new Error(
      `网络请求失败（${msg}）。请用 npm run dev 打开本工具（开发代理可绕过 CORS），并确认 API Key 正确。`,
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    if (
      withJsonMode &&
      (res.status === 400 || res.status === 422) &&
      /response_format|json_object|unsupported|invalid/i.test(errText)
    ) {
      return postChatCompletions(description, config, false);
    }
    throw new Error(`模型请求失败 (${res.status}) [${model}]: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as Parameters<typeof pickMessageContent>[0];
  const rawText = pickMessageContent(data);
  if (!rawText) {
    throw new Error('模型返回内容为空。请确认模型为 Qwen/Qwen3-32B 且账户可用。');
  }

  try {
    const parsed = extractJson(rawText);
    const validation = validateSpec(parsed);
    return { validation, rawText };
  } catch (err) {
    throw new Error(
      `无法从模型回复中解析 JSON：${(err as Error).message}。原始片段：${rawText.slice(0, 280)}`,
    );
  }
}

export async function generateSpecFromNl(
  description: string,
  config: LlmConfig,
): Promise<GenerateResult> {
  if (!config.apiKey.trim()) {
    throw new Error('请先填写 API Key（硅基流动控制台）');
  }
  if (!description.trim()) {
    throw new Error('请输入需求描述');
  }

  return postChatCompletions(
    description,
    { ...config, model: normalizeModelName(config.model) },
    false,
  );
}
