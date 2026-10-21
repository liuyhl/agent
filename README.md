# 企业信息化原型生成器

面向项目经理的需求对接工具：用自然语言描述页面与审批流程，生成**静态可点**的 HTML 原型，重点确认**表单字段**与 **BPMN 子集审批流**。

## 能力

- 自然语言 → 结构化 JSON 规格（OpenAI 兼容 API）
- 本地模板渲染：表单 / 流程图（可点节点）/ 确认清单
- 无 Key 也可「加载请假示例」演示
- 可编辑 JSON 后重新渲染，并下载独立 HTML

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

### 配置模型

在左侧「模型设置」中填写：

| 项 | 说明 |
|----|------|
| API Base URL | 默认 `https://api.siliconflow.cn/v1`（硅基流动） |
| API Key | 硅基流动控制台发放的 Key，仅存本机 `localStorage` |
| Model | 默认 `Qwen/Qwen3-32B` |

实际请求：`POST {Base URL}/chat/completions`（与 OpenAI 兼容）。浏览器直连 API。

> 纯前端直连 API，Key 会出现在浏览器中，仅适合个人试用；正式多人使用请改为服务端代理。

## 项目结构

```
src/
  types/spec.ts          # 表单 + BPMN 子集类型
  schema/validate.ts     # 规格校验与 JSON 提取
  render/bpmnLayout.ts   # 流程图布局
  render/renderPrototype.ts  # HTML 模板渲染
  llm/prompt.ts          # 系统提示词
  llm/generate.ts        # Chat Completions 调用
  samples/leave.ts       # 请假示例
  main.ts                # 工作台 UI
```

## BPMN 子集

当前支持：`startEvent`、`userTask`、`exclusiveGateway`、`endEvent` 及顺序流（含条件文案）。不执行真实流程引擎。
