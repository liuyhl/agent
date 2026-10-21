import './style.css';
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  generateSpecFromNl,
  loadLlmConfig,
  normalizeModelName,
  saveLlmConfig,
  type LlmConfig,
} from './llm/generate';
import { renderPrototypeHtml } from './render/renderPrototype';
import { validateSpec } from './schema/validate';
import { defaultPrompt, leaveSample } from './samples/leave';
import type { PrototypeSpec } from './types/spec';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="app-header">
    <h1>企业信息化原型生成器</h1>
    <p>自然语言描述 → 字段表单 + BPMN 审批流静态原型，便于与业务确认需求</p>
  </header>
  <div class="layout">
    <section class="panel">
      <div class="panel-hd"><h2>需求描述</h2></div>
      <div class="panel-bd">
        <div>
          <label class="field-label" for="nl">用自然语言描述页面字段与审批流程</label>
          <textarea id="nl" placeholder="例如：请假申请、字段、审批人、超过 N 天走 HR…"></textarea>
        </div>

        <details class="settings" id="settings">
          <summary>模型设置（OpenAI 兼容 API）</summary>
          <div class="inner">
            <div>
              <label class="field-label" for="baseUrl">API Base URL</label>
              <input id="baseUrl" type="text" placeholder="https://api.siliconflow.cn/v1" />
            </div>
            <div>
              <label class="field-label" for="apiKey">API Key（仅存本机浏览器）</label>
              <input id="apiKey" type="password" placeholder="sk-..." autocomplete="off" />
            </div>
            <div>
              <label class="field-label" for="model">Model</label>
              <input id="model" type="text" placeholder="Qwen/Qwen3-32B" />
            </div>
            <p class="status">默认：硅基流动 + Qwen/Qwen3-32B。请用 npm run dev 访问（本地代理可避免 CORS）。</p>
          </div>
        </details>

        <div class="actions">
          <button type="button" class="primary" id="btn-generate">生成原型</button>
          <button type="button" id="btn-demo">加载请假示例</button>
          <button type="button" class="ghost" id="btn-from-json">从下方 JSON 渲染</button>
        </div>
        <div class="status" id="status"></div>

        <div>
          <label class="field-label" for="specJson">规格 JSON（可编辑后重新渲染）</label>
          <textarea id="specJson" class="spec-box" spellcheck="false"></textarea>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-hd">
        <h2>原型预览</h2>
        <div class="preview-toolbar">
          <button type="button" id="btn-download" disabled>下载 HTML</button>
          <button type="button" id="btn-open" disabled>新窗口打开</button>
        </div>
      </div>
      <div class="panel-bd">
        <iframe class="preview" id="preview" title="原型预览"></iframe>
      </div>
    </section>
  </div>
`;

const nlEl = document.querySelector<HTMLTextAreaElement>('#nl')!;
const statusEl = document.querySelector<HTMLDivElement>('#status')!;
const specJsonEl = document.querySelector<HTMLTextAreaElement>('#specJson')!;
const previewEl = document.querySelector<HTMLIFrameElement>('#preview')!;
const baseUrlEl = document.querySelector<HTMLInputElement>('#baseUrl')!;
const apiKeyEl = document.querySelector<HTMLInputElement>('#apiKey')!;
const modelEl = document.querySelector<HTMLInputElement>('#model')!;
const btnGenerate = document.querySelector<HTMLButtonElement>('#btn-generate')!;
const btnDemo = document.querySelector<HTMLButtonElement>('#btn-demo')!;
const btnFromJson = document.querySelector<HTMLButtonElement>('#btn-from-json')!;
const btnDownload = document.querySelector<HTMLButtonElement>('#btn-download')!;
const btnOpen = document.querySelector<HTMLButtonElement>('#btn-open')!;

let currentHtml = '';
let currentSpec: PrototypeSpec | null = null;

function setStatus(message: string, kind: '' | 'ok' | 'warn' | 'error' = '') {
  statusEl.textContent = message;
  statusEl.className = `status${kind ? ` ${kind}` : ''}`;
}

function readConfig(): LlmConfig {
  return {
    baseUrl: baseUrlEl.value.trim() || DEFAULT_BASE_URL,
    apiKey: apiKeyEl.value.trim(),
    model: normalizeModelName(modelEl.value),
  };
}

function applyConfig(config: LlmConfig) {
  baseUrlEl.value = config.baseUrl || DEFAULT_BASE_URL;
  apiKeyEl.value = config.apiKey;
  modelEl.value = normalizeModelName(config.model) || DEFAULT_MODEL;
}

function persistConfig() {
  saveLlmConfig(readConfig());
}

function showSpec(spec: PrototypeSpec, warnings: string[] = []) {
  currentSpec = spec;
  currentHtml = renderPrototypeHtml(spec);
  specJsonEl.value = JSON.stringify(spec, null, 2);
  previewEl.srcdoc = currentHtml;
  btnDownload.disabled = false;
  btnOpen.disabled = false;

  if (warnings.length) {
    setStatus(`已生成（有警告）：${warnings.join('；')}`, 'warn');
  } else {
    setStatus('原型已更新', 'ok');
  }
}

function renderFromJsonText(text: string) {
  try {
    const parsed = JSON.parse(text) as unknown;
    const result = validateSpec(parsed);
    if (!result.ok || !result.spec) {
      setStatus(`JSON 校验失败：${result.errors.join('；')}`, 'error');
      return;
    }
    showSpec(result.spec, result.warnings);
  } catch (err) {
    setStatus(`JSON 解析失败：${(err as Error).message}`, 'error');
  }
}

btnDemo.addEventListener('click', () => {
  nlEl.value = defaultPrompt;
  showSpec(leaveSample);
});

btnFromJson.addEventListener('click', () => {
  renderFromJsonText(specJsonEl.value);
});

btnGenerate.addEventListener('click', async () => {
  persistConfig();
  const config = readConfig();
  btnGenerate.disabled = true;
  setStatus('正在调用模型生成规格…');
  try {
    const { validation } = await generateSpecFromNl(nlEl.value, config);
    if (!validation.ok || !validation.spec) {
      setStatus(`生成结果校验失败：${validation.errors.join('；')}`, 'error');
      if (validation.warnings.length) {
        /* keep errors primary */
      }
      return;
    }
    showSpec(validation.spec, validation.warnings);
  } catch (err) {
    setStatus((err as Error).message, 'error');
  } finally {
    btnGenerate.disabled = false;
  }
});

btnDownload.addEventListener('click', () => {
  if (!currentHtml || !currentSpec) return;
  const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentSpec.title || 'prototype'}.html`;
  a.click();
  URL.revokeObjectURL(url);
});

btnOpen.addEventListener('click', () => {
  if (!currentHtml) return;
  const w = window.open('');
  if (w) {
    w.document.open();
    w.document.write(currentHtml);
    w.document.close();
  }
});

[baseUrlEl, apiKeyEl, modelEl].forEach((el) => {
  el.addEventListener('change', persistConfig);
});

applyConfig(loadLlmConfig());
nlEl.value = defaultPrompt;
showSpec(leaveSample);
setStatus('已加载请假示例，可直接预览或修改描述后生成', 'ok');
