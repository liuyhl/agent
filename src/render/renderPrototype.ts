import type { FormField, PrototypeSpec } from '../types/spec';
import { layoutProcess } from './bpmnLayout';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFieldControl(f: FormField): string {
  const req = f.required ? '<span class="req">*</span>' : '';
  const ro = f.readonly ? 'readonly' : '';
  const ph = f.placeholder ? `placeholder="${escapeHtml(f.placeholder)}"` : '';
  const desc = f.description
    ? `<div class="hint">${escapeHtml(f.description)}</div>`
    : '';

  let control = '';
  switch (f.type) {
    case 'select': {
      const opts = (f.options ?? ['请选择'])
        .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
        .join('');
      control = `<select ${f.readonly ? 'disabled' : ''}>${opts}</select>`;
      break;
    }
    case 'textarea':
      control = `<textarea rows="3" ${ro} ${ph}></textarea>`;
      break;
    case 'checkbox':
      control = `<label class="check"><input type="checkbox" ${f.readonly ? 'disabled' : ''}> ${escapeHtml(f.label)}</label>`;
      return `<div class="field" data-field-id="${escapeHtml(f.id)}">${control}${desc}</div>`;
    case 'datetime':
      control = `<input type="datetime-local" ${ro} ${ph}>`;
      break;
    default:
      control = `<input type="${f.type}" ${ro} ${ph}>`;
  }

  return `<div class="field" data-field-id="${escapeHtml(f.id)}">
    <label>${escapeHtml(f.label)}${req}</label>
    ${control}
    ${desc}
  </div>`;
}

function renderFlowSvg(spec: PrototypeSpec): string {
  const layout = layoutProcess(spec.process);
  const nodeShapes = layout.nodes
    .map((n) => {
      const { el, x, y, w, h } = n;
      const title = escapeHtml(el.name);
      const role = el.assigneeRole ? escapeHtml(el.assigneeRole) : '';
      const desc = escapeHtml(el.description ?? '');
      const condHint = '';
      const payload = encodeURIComponent(
        JSON.stringify({
          id: el.id,
          type: el.type,
          name: el.name,
          assigneeRole: el.assigneeRole ?? '',
          description: el.description ?? '',
        }),
      );

      if (el.type === 'startEvent' || el.type === 'endEvent') {
        const fill = el.type === 'startEvent' ? '#e8f5e9' : '#ffebee';
        const stroke = el.type === 'startEvent' ? '#2e7d32' : '#c62828';
        return `<g class="bpmn-node" data-node="${payload}" transform="translate(${x},${y})" role="button" tabindex="0">
          <circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" class="node-label">${title}</text>
        </g>`;
      }

      if (el.type === 'exclusiveGateway') {
        const cx = w / 2;
        const cy = h / 2;
        const r = w / 2 - 2;
        const points = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
        return `<g class="bpmn-node" data-node="${payload}" transform="translate(${x},${y})" role="button" tabindex="0">
          <polygon points="${points}" fill="#fff8e1" stroke="#f9a825" stroke-width="2"/>
          <text x="${cx}" y="${cy + 4}" text-anchor="middle" class="node-label">×</text>
          <text x="${cx}" y="${h + 14}" text-anchor="middle" class="node-sub">${title}</text>
        </g>`;
      }

      return `<g class="bpmn-node" data-node="${payload}" transform="translate(${x},${y})" role="button" tabindex="0">
        <rect width="${w}" height="${h}" rx="8" ry="8" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>
        <text x="${w / 2}" y="${h / 2 - 4}" text-anchor="middle" class="node-label">${title}</text>
        <text x="${w / 2}" y="${h / 2 + 14}" text-anchor="middle" class="node-sub">${role || condHint || desc}</text>
      </g>`;
    })
    .join('\n');

  const edges = layout.edges
    .map((e) => {
      const label = escapeHtml(e.flow.condition || e.flow.name || '');
      const mx = (e.x1 + e.x2) / 2;
      const my = (e.y1 + e.y2) / 2 - 6;
      return `<g class="bpmn-edge">
        <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" marker-end="url(#arrow)"/>
        ${label ? `<text x="${mx}" y="${my}" text-anchor="middle" class="edge-label">${label}</text>` : ''}
      </g>`;
    })
    .join('\n');

  return `<svg class="flow-svg" viewBox="0 0 ${layout.width} ${layout.height}" width="100%" height="${layout.height}">
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#546e7a"/>
      </marker>
    </defs>
    ${edges}
    ${nodeShapes}
  </svg>`;
}

function fieldTypeLabel(t: string): string {
  const map: Record<string, string> = {
    text: '文本',
    number: '数字',
    date: '日期',
    datetime: '日期时间',
    select: '下拉',
    textarea: '多行文本',
    checkbox: '勾选',
  };
  return map[t] ?? t;
}

function elementTypeLabel(t: string): string {
  const map: Record<string, string> = {
    startEvent: '开始',
    userTask: '人工任务',
    exclusiveGateway: '排他网关',
    endEvent: '结束',
  };
  return map[t] ?? t;
}

function renderChecklists(spec: PrototypeSpec): string {
  const fieldRows = spec.form.fields
    .map(
      (f) => `<tr>
      <td>${escapeHtml(f.label)}</td>
      <td>${fieldTypeLabel(f.type)}</td>
      <td>${f.required ? '是' : '否'}</td>
      <td>${f.readonly ? '是' : '否'}</td>
      <td>${escapeHtml((f.options ?? []).join(' / ') || f.description || '—')}</td>
      <td><input type="checkbox"></td>
    </tr>`,
    )
    .join('');

  const taskRows = spec.process.elements
    .map(
      (e) => `<tr>
      <td>${escapeHtml(e.name)}</td>
      <td>${elementTypeLabel(e.type)}</td>
      <td>${escapeHtml(e.assigneeRole || '—')}</td>
      <td>${escapeHtml(e.description || '—')}</td>
      <td><input type="checkbox"></td>
    </tr>`,
    )
    .join('');

  const gateFlows = spec.process.flows.filter((f) => {
    const from = spec.process.elements.find((e) => e.id === f.from);
    return from?.type === 'exclusiveGateway';
  });

  const condRows = (gateFlows.length
    ? gateFlows
    : spec.process.flows.filter((f) => f.condition)
  )
    .map(
      (f) => `<tr>
      <td>${escapeHtml(f.from)} → ${escapeHtml(f.to)}</td>
      <td>${escapeHtml(f.condition || f.name || '—')}</td>
      <td><input type="checkbox"></td>
    </tr>`,
    )
    .join('');

  return `
  <div class="panel">
    <h3>字段确认清单</h3>
    <table>
      <thead><tr><th>字段</th><th>类型</th><th>必填</th><th>只读</th><th>选项/说明</th><th>已确认</th></tr></thead>
      <tbody>${fieldRows}</tbody>
    </table>
  </div>
  <div class="panel">
    <h3>审批节点确认清单</h3>
    <table>
      <thead><tr><th>节点</th><th>类型</th><th>角色</th><th>说明</th><th>已确认</th></tr></thead>
      <tbody>${taskRows}</tbody>
    </table>
  </div>
  <div class="panel">
    <h3>分支条件确认清单</h3>
    <table>
      <thead><tr><th>路径</th><th>条件</th><th>已确认</th></tr></thead>
      <tbody>${condRows || '<tr><td colspan="3">无分支条件</td></tr>'}</tbody>
    </table>
  </div>`;
}

const PROTOTYPE_CSS = `
:root {
  --bg: #f4f6f8;
  --card: #ffffff;
  --text: #1a2332;
  --muted: #5c6b7a;
  --line: #d8dee6;
  --accent: #0b6e4f;
  --accent-soft: #e6f4ef;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: var(--text);
  background: var(--bg);
}
.topbar {
  background: linear-gradient(120deg, #0b6e4f 0%, #1b4f72 100%);
  color: #fff;
  padding: 16px 24px;
}
.topbar h1 { margin: 0 0 4px; font-size: 20px; font-weight: 650; }
.topbar p { margin: 0; opacity: 0.9; font-size: 13px; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 20px; }
.tabs {
  display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
}
.tab {
  border: 1px solid var(--line);
  background: var(--card);
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.tab.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.view { display: none; }
.view.active { display: block; }
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
}
.field label { display: block; font-size: 13px; margin-bottom: 6px; color: var(--muted); }
.req { color: #c62828; margin-left: 2px; }
.field input, .field select, .field textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 9px 10px;
  font: inherit;
  background: #fff;
}
.field input[readonly], .field select:disabled {
  background: #f0f3f6;
  color: var(--muted);
}
.hint { font-size: 12px; color: var(--muted); margin-top: 4px; }
.check { font-size: 14px; display: flex; align-items: center; gap: 8px; }
.flow-wrap { overflow-x: auto; }
.flow-svg { background: #fafbfc; border: 1px dashed var(--line); border-radius: 10px; }
.bpmn-node { cursor: pointer; }
.bpmn-node:focus { outline: none; }
.bpmn-node.is-active rect,
.bpmn-node.is-active circle,
.bpmn-node.is-active polygon {
  stroke-width: 3.5;
  filter: drop-shadow(0 0 4px rgba(11,110,79,.45));
}
.node-label { font-size: 11px; fill: var(--text); }
.node-sub { font-size: 10px; fill: var(--muted); }
.edge-label { font-size: 10px; fill: #455a64; }
.bpmn-edge line { stroke: #546e7a; stroke-width: 1.5; }
.detail {
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--accent-soft);
  border-radius: 8px;
  font-size: 13px;
  min-height: 48px;
}
.detail:empty::before { content: "点击流程图节点查看说明"; color: var(--muted); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { border: 1px solid var(--line); padding: 8px 10px; text-align: left; }
th { background: #f0f3f6; }
.panel { margin-bottom: 18px; }
.panel h3 { margin: 0 0 10px; font-size: 15px; }
@media (max-width: 720px) {
  .form-grid { grid-template-columns: 1fr; }
}
`;

const PROTOTYPE_JS = `
(function () {
  var tabs = document.querySelectorAll('.tab');
  var views = document.querySelectorAll('.view');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = tab.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      views.forEach(function (v) {
        v.classList.toggle('active', v.id === 'view-' + id);
      });
    });
  });

  var detail = document.getElementById('node-detail');
  var nodes = document.querySelectorAll('.bpmn-node');
  function show(node) {
    nodes.forEach(function (n) { n.classList.remove('is-active'); });
    node.classList.add('is-active');
    try {
      var data = JSON.parse(decodeURIComponent(node.getAttribute('data-node') || '%7B%7D'));
      var typeMap = {
        startEvent: '开始事件',
        userTask: '人工任务',
        exclusiveGateway: '排他网关',
        endEvent: '结束事件'
      };
      detail.innerHTML =
        '<strong>' + (data.name || data.id) + '</strong>' +
        ' · ' + (typeMap[data.type] || data.type) +
        (data.assigneeRole ? '<br/>审批角色：' + data.assigneeRole : '') +
        (data.description ? '<br/>说明：' + data.description : '');
    } catch (e) {
      detail.textContent = '无法解析节点信息';
    }
  }
  nodes.forEach(function (node) {
    node.addEventListener('click', function () { show(node); });
    node.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        show(node);
      }
    });
  });
})();
`;

/** 将规格渲染为可独立打开的完整 HTML 原型 */
export function renderPrototypeHtml(spec: PrototypeSpec): string {
  const fieldsHtml = spec.form.fields.map(renderFieldControl).join('\n');
  const flowHtml = renderFlowSvg(spec);
  const listsHtml = renderChecklists(spec);
  const desc = spec.description
    ? `<p class="desc">${escapeHtml(spec.description)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(spec.title)} · 需求原型</title>
  <style>${PROTOTYPE_CSS}</style>
</head>
<body>
  <header class="topbar">
    <h1>${escapeHtml(spec.title)}</h1>
    <p>${escapeHtml(spec.process.name)} · 静态可点原型（字段 + BPMN 审批流确认）</p>
  </header>
  <div class="wrap">
    ${desc}
    <div class="tabs">
      <button class="tab active" type="button" data-tab="form">表单</button>
      <button class="tab" type="button" data-tab="flow">审批流程</button>
      <button class="tab" type="button" data-tab="list">确认清单</button>
    </div>

    <section id="view-form" class="view active">
      <div class="card">
        <h2 style="margin-top:0;font-size:16px;">${escapeHtml(spec.form.name)}</h2>
        <div class="form-grid">
          ${fieldsHtml}
        </div>
      </div>
    </section>

    <section id="view-flow" class="view">
      <div class="card">
        <h2 style="margin-top:0;font-size:16px;">${escapeHtml(spec.process.name)}</h2>
        <div class="flow-wrap">${flowHtml}</div>
        <div class="detail" id="node-detail"></div>
      </div>
    </section>

    <section id="view-list" class="view">
      <div class="card">${listsHtml}</div>
    </section>
  </div>
  <script>${PROTOTYPE_JS}</script>
</body>
</html>`;
}
