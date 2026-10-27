(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&l(c)}).observe(document,{childList:!0,subtree:!0});function r(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function l(s){if(s.ep)return;s.ep=!0;const n=r(s);fetch(s.href,n)}})();const U=["text","number","date","datetime","select","textarea","checkbox"],z=["startEvent","userTask","exclusiveGateway","endEvent"];function k(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function m(e,t=""){return typeof e=="string"?e.trim():t}function F(e){const t=[],r=[];if(!k(e))return{ok:!1,errors:["规格必须是 JSON 对象"],warnings:r};const l=m(e.title);if(l||t.push("缺少 title"),k(e.form)||t.push("缺少 form"),k(e.process)||t.push("缺少 process"),t.length)return{ok:!1,errors:t,warnings:r};const s=e.form,n=e.process,c=Array.isArray(s.fields)?s.fields:[];c.length||t.push("form.fields 不能为空");const p=[];c.forEach((o,i)=>{if(!k(o)){t.push(`fields[${i}] 不是对象`);return}const a=m(o.type);U.includes(a)||t.push(`fields[${i}].type 不支持: ${o.type}`);const u=m(o.id)||`field_${i+1}`,y=m(o.label)||u,L=Array.isArray(o.options)?o.options.filter(q=>typeof q=="string"):void 0;a==="select"&&(!L||!L.length)&&r.push(`字段「${y}」为 select 但未提供 options`),p.push({id:u,label:y,type:U.includes(a)?a:"text",required:!!o.required,readonly:!!o.readonly,placeholder:m(o.placeholder)||void 0,options:L,description:m(o.description)||void 0})});const f=Array.isArray(n.elements)?n.elements:[],h=Array.isArray(n.flows)?n.flows:[];f.length||t.push("process.elements 不能为空"),h.length||t.push("process.flows 不能为空");const b=[];f.forEach((o,i)=>{if(!k(o)){t.push(`elements[${i}] 不是对象`);return}const a=m(o.type);z.includes(a)||t.push(`elements[${i}].type 不支持: ${o.type}`);const u=m(o.id);u||t.push(`elements[${i}] 缺少 id`),b.push({id:u,type:z.includes(a)?a:"userTask",name:m(o.name)||u,assigneeRole:m(o.assigneeRole)||void 0,description:m(o.description)||void 0})});const x=new Set(b.map(o=>o.id)),w=b.filter(o=>o.type==="startEvent"),O=b.filter(o=>o.type==="endEvent");w.length!==1&&t.push("必须恰好有 1 个 startEvent"),O.length<1&&t.push("至少需要 1 个 endEvent");const v=[];h.forEach((o,i)=>{if(!k(o)){t.push(`flows[${i}] 不是对象`);return}const a=m(o.id)||`flow_${i+1}`,u=m(o.from),y=m(o.to);(!u||!y)&&t.push(`flows[${i}] 缺少 from/to`),u&&!x.has(u)&&t.push(`flows[${i}].from 引用不存在: ${u}`),y&&!x.has(y)&&t.push(`flows[${i}].to 引用不存在: ${y}`),v.push({id:a,from:u,to:y,name:m(o.name)||void 0,condition:m(o.condition)||void 0})});for(const o of b){if(o.type==="exclusiveGateway"){const i=v.filter(a=>a.from===o.id);i.length<2&&t.push(`网关 ${o.id} 至少需要 2 条出边`);for(const a of i)!a.condition&&!a.name&&r.push(`网关出边 ${a.id} 建议填写 condition`)}o.type==="userTask"&&!o.assigneeRole&&r.push(`任务「${o.name}」未填写 assigneeRole`)}for(const o of b){const i=v.filter(u=>u.to===o.id),a=v.filter(u=>u.from===o.id);o.type==="startEvent"&&a.length<1&&t.push("startEvent 需要至少 1 条出边"),o.type==="endEvent"&&i.length<1&&r.push(`结束节点 ${o.id} 没有入边`),o.type!=="startEvent"&&o.type!=="endEvent"&&i.length<1&&r.push(`节点 ${o.id} 没有入边`)}if(t.length)return{ok:!1,errors:t,warnings:r};const g={title:l,description:m(e.description)||void 0,form:{name:m(s.name)||l,fields:p},process:{processId:m(n.processId)||"process_1",name:m(n.name)||`${l}流程`,elements:b,flows:v}};return{ok:!0,errors:t,warnings:r,spec:g}}function ee(e){const t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)```/i),l=r?r[1].trim():t,s=l.indexOf("{"),n=l.lastIndexOf("}");if(s===-1||n===-1||n<=s)throw new Error("未找到 JSON 对象");return JSON.parse(l.slice(s,n+1))}const te=`你是企业信息化需求原型助手。根据用户的中文页面/流程描述，输出一份严格 JSON（不要 markdown，不要解释），用于生成静态可点 HTML 原型。

JSON Schema 形状：
{
  "title": string,
  "description": string,
  "form": {
    "name": string,
    "fields": [
      {
        "id": string,
        "label": string,
        "type": "text"|"number"|"date"|"datetime"|"select"|"textarea"|"checkbox",
        "required": boolean,
        "readonly": boolean,
        "placeholder": string,
        "options": string[],
        "description": string
      }
    ]
  },
  "process": {
    "processId": string,
    "name": string,
    "elements": [
      {
        "id": string,
        "type": "startEvent"|"userTask"|"exclusiveGateway"|"endEvent",
        "name": string,
        "assigneeRole": string,
        "description": string
      }
    ],
    "flows": [
      {
        "id": string,
        "from": string,
        "to": string,
        "name": string,
        "condition": string
      }
    ]
  }
}

硬性规则：
1. 只输出 JSON 对象。
2. 必须恰好 1 个 startEvent，至少 1 个 endEvent。
3. 元素 type 只能使用上述枚举；字段 type 只能使用上述枚举。
4. exclusiveGateway 至少 2 条出边，出边尽量写 condition（中文业务条件即可）。
5. userTask 尽量填写 assigneeRole（角色名，如部门经理、HR）。
6. flows 的 from/to 必须引用 elements 中已有 id。
7. 驳回可指向独立 endEvent，或按描述建模。
8. 不要编造与需求无关的复杂并行网关；本版本不支持 parallelGateway。
9. select 必须提供 options。`;function ne(e){return`请根据以下需求描述生成原型规格 JSON：

${e.trim()}`}const G="prototype-agent-llm-config",R="https://api.siliconflow.cn/v1",P="Qwen/Qwen3-32B";function oe(){try{const e=localStorage.getItem(G);if(e){const t=JSON.parse(e);return{baseUrl:t.baseUrl||R,apiKey:t.apiKey||"",model:S(t.model)}}}catch{}return{baseUrl:R,apiKey:"",model:P}}function se(e){localStorage.setItem(G,JSON.stringify({...e,model:S(e.model)}))}function re(e){return e.replace(/\/+$/,"")}function S(e){const t=(e||"").trim();return!t||t==="gpt-4o-mini"||t==="gpt-4o"?P:t}function ie(e){return`${re(e||R)}/chat/completions`}function I(e){return e.replace(/<think>[\s\S]*?<\/think>/gi,"").replace(/<thinking>[\s\S]*?<\/thinking>/gi,"").trim()}function ae(e){var s,n;const t=(n=(s=e.choices)==null?void 0:s[0])==null?void 0:n.message;if(!t)return"";const r=typeof t.content=="string"?I(t.content):"";return r||(typeof t.reasoning_content=="string"?I(t.reasoning_content):"")}function le(e,t,r){return{model:t,temperature:.2,max_tokens:4096,enable_thinking:!1,messages:[{role:"system",content:te},{role:"user",content:ne(e)}]}}async function de(e,t,r){const l=S(t.model),s=ie(t.baseUrl);let n;try{n=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.apiKey.trim()}`},body:JSON.stringify(le(e,l,r))})}catch(f){const h=f.message||String(f);throw new Error(`网络请求失败：${h}。若为 CORS/Failed to fetch，请确认使用 npm run dev（已代理硅基流动），且 API Key 正确。`)}if(!n.ok){const f=await n.text();throw new Error(`模型请求失败 (${n.status}) [${l}]: ${f.slice(0,500)}`)}const c=await n.json(),p=ae(c);if(!p)throw new Error("模型返回内容为空。已关闭 enable_thinking；若仍为空，请检查硅基流动控制台该模型是否可用。");try{const f=ee(p);return{validation:F(f),rawText:p}}catch(f){throw new Error(`无法从模型回复中解析 JSON：${f.message}。原始片段：${p.slice(0,280)}`)}}async function ce(e,t){if(!t.apiKey.trim())throw new Error("请先填写 API Key（硅基流动控制台）");if(!e.trim())throw new Error("请输入需求描述");return de(e,{...t,model:S(t.model)},!1)}const H=160,B=110,_=48;function pe(e,t){return t.filter(r=>r.from===e).map(r=>r.to)}function fe(e){const{elements:t,flows:r}=e,l=new Map(t.map(o=>[o.id,o])),s=t.find(o=>o.type==="startEvent");if(!s)return{nodes:[],edges:[],width:400,height:200};const n=new Map,c=[s.id];for(n.set(s.id,0);c.length;){const o=c.shift(),i=n.get(o);for(const a of pe(o,r)){const u=i+1,y=n.get(a);y===void 0||u>y?(n.set(a,u),c.push(a)):n.has(a)||(n.set(a,u),c.push(a))}}let p=0;for(const o of n.values())p=Math.max(p,o);for(const o of t)n.has(o.id)||(p+=1,n.set(o.id,p));const f=new Map;for(const[o,i]of n){const a=f.get(i)??[];a.push(o),f.set(i,a)}const h=o=>o.type==="startEvent"||o.type==="endEvent"?{w:44,h:44}:o.type==="exclusiveGateway"?{w:52,h:52}:{w:140,h:56},b=[];let x=0;for(const[o,i]of f)i.forEach((a,u)=>{const y=l.get(a),{w:L,h:q}=h(y);x=Math.max(x,u),b.push({el:y,column:o,row:u,w:L,h:q,x:_+o*H,y:_+u*B})});const w=new Map(b.map(o=>[o.el.id,o])),O=r.map(o=>{const i=w.get(o.from),a=w.get(o.to);return!i||!a?{flow:o,x1:0,y1:0,x2:0,y2:0}:{flow:o,x1:i.x+i.w,y1:i.y+i.h/2,x2:a.x,y2:a.y+a.h/2}}),v=_*2+(p+1)*H,g=_*2+(x+1)*B;return{nodes:b,edges:O,width:Math.max(v,480),height:Math.max(g,220)}}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ue(e){const t=e.required?'<span class="req">*</span>':"",r=e.readonly?"readonly":"",l=e.placeholder?`placeholder="${d(e.placeholder)}"`:"",s=e.description?`<div class="hint">${d(e.description)}</div>`:"";let n="";switch(e.type){case"select":{const c=(e.options??["请选择"]).map(p=>`<option value="${d(p)}">${d(p)}</option>`).join("");n=`<select ${e.readonly?"disabled":""}>${c}</select>`;break}case"textarea":n=`<textarea rows="3" ${r} ${l}></textarea>`;break;case"checkbox":return n=`<label class="check"><input type="checkbox" ${e.readonly?"disabled":""}> ${d(e.label)}</label>`,`<div class="field" data-field-id="${d(e.id)}">${n}${s}</div>`;case"datetime":n=`<input type="datetime-local" ${r} ${l}>`;break;default:n=`<input type="${e.type}" ${r} ${l}>`}return`<div class="field" data-field-id="${d(e.id)}">
    <label>${d(e.label)}${t}</label>
    ${n}
    ${s}
  </div>`}function me(e){const t=fe(e.process),r=t.nodes.map(s=>{const{el:n,x:c,y:p,w:f,h}=s,b=d(n.name),x=n.assigneeRole?d(n.assigneeRole):"",w=d(n.description??""),O="",v=encodeURIComponent(JSON.stringify({id:n.id,type:n.type,name:n.name,assigneeRole:n.assigneeRole??"",description:n.description??""}));if(n.type==="startEvent"||n.type==="endEvent"){const g=n.type==="startEvent"?"#e8f5e9":"#ffebee",o=n.type==="startEvent"?"#2e7d32":"#c62828";return`<g class="bpmn-node" data-node="${v}" transform="translate(${c},${p})" role="button" tabindex="0">
          <circle cx="${f/2}" cy="${h/2}" r="${f/2-2}" fill="${g}" stroke="${o}" stroke-width="2"/>
          <text x="${f/2}" y="${h/2+4}" text-anchor="middle" class="node-label">${b}</text>
        </g>`}if(n.type==="exclusiveGateway"){const g=f/2,o=h/2,i=f/2-2,a=`${g},${o-i} ${g+i},${o} ${g},${o+i} ${g-i},${o}`;return`<g class="bpmn-node" data-node="${v}" transform="translate(${c},${p})" role="button" tabindex="0">
          <polygon points="${a}" fill="#fff8e1" stroke="#f9a825" stroke-width="2"/>
          <text x="${g}" y="${o+4}" text-anchor="middle" class="node-label">×</text>
          <text x="${g}" y="${h+14}" text-anchor="middle" class="node-sub">${b}</text>
        </g>`}return`<g class="bpmn-node" data-node="${v}" transform="translate(${c},${p})" role="button" tabindex="0">
        <rect width="${f}" height="${h}" rx="8" ry="8" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>
        <text x="${f/2}" y="${h/2-4}" text-anchor="middle" class="node-label">${b}</text>
        <text x="${f/2}" y="${h/2+14}" text-anchor="middle" class="node-sub">${x||O||w}</text>
      </g>`}).join(`
`),l=t.edges.map(s=>{const n=d(s.flow.condition||s.flow.name||""),c=(s.x1+s.x2)/2,p=(s.y1+s.y2)/2-6;return`<g class="bpmn-edge">
        <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" marker-end="url(#arrow)"/>
        ${n?`<text x="${c}" y="${p}" text-anchor="middle" class="edge-label">${n}</text>`:""}
      </g>`}).join(`
`);return`<svg class="flow-svg" viewBox="0 0 ${t.width} ${t.height}" width="100%" height="${t.height}">
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#546e7a"/>
      </marker>
    </defs>
    ${l}
    ${r}
  </svg>`}function he(e){return{text:"文本",number:"数字",date:"日期",datetime:"日期时间",select:"下拉",textarea:"多行文本",checkbox:"勾选"}[e]??e}function be(e){return{startEvent:"开始",userTask:"人工任务",exclusiveGateway:"排他网关",endEvent:"结束"}[e]??e}function ye(e){const t=e.form.fields.map(n=>`<tr>
      <td>${d(n.label)}</td>
      <td>${he(n.type)}</td>
      <td>${n.required?"是":"否"}</td>
      <td>${n.readonly?"是":"否"}</td>
      <td>${d((n.options??[]).join(" / ")||n.description||"—")}</td>
      <td><input type="checkbox"></td>
    </tr>`).join(""),r=e.process.elements.map(n=>`<tr>
      <td>${d(n.name)}</td>
      <td>${be(n.type)}</td>
      <td>${d(n.assigneeRole||"—")}</td>
      <td>${d(n.description||"—")}</td>
      <td><input type="checkbox"></td>
    </tr>`).join(""),l=e.process.flows.filter(n=>{const c=e.process.elements.find(p=>p.id===n.from);return(c==null?void 0:c.type)==="exclusiveGateway"}),s=(l.length?l:e.process.flows.filter(n=>n.condition)).map(n=>`<tr>
      <td>${d(n.from)} → ${d(n.to)}</td>
      <td>${d(n.condition||n.name||"—")}</td>
      <td><input type="checkbox"></td>
    </tr>`).join("");return`
  <div class="panel">
    <h3>字段确认清单</h3>
    <table>
      <thead><tr><th>字段</th><th>类型</th><th>必填</th><th>只读</th><th>选项/说明</th><th>已确认</th></tr></thead>
      <tbody>${t}</tbody>
    </table>
  </div>
  <div class="panel">
    <h3>审批节点确认清单</h3>
    <table>
      <thead><tr><th>节点</th><th>类型</th><th>角色</th><th>说明</th><th>已确认</th></tr></thead>
      <tbody>${r}</tbody>
    </table>
  </div>
  <div class="panel">
    <h3>分支条件确认清单</h3>
    <table>
      <thead><tr><th>路径</th><th>条件</th><th>已确认</th></tr></thead>
      <tbody>${s||'<tr><td colspan="3">无分支条件</td></tr>'}</tbody>
    </table>
  </div>`}const ge=`
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
`,ve=`
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
`;function xe(e){const t=e.form.fields.map(ue).join(`
`),r=me(e),l=ye(e),s=e.description?`<p class="desc">${d(e.description)}</p>`:"";return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${d(e.title)} · 需求原型</title>
  <style>${ge}</style>
</head>
<body>
  <header class="topbar">
    <h1>${d(e.title)}</h1>
    <p>${d(e.process.name)} · 静态可点原型（字段 + BPMN 审批流确认）</p>
  </header>
  <div class="wrap">
    ${s}
    <div class="tabs">
      <button class="tab active" type="button" data-tab="form">表单</button>
      <button class="tab" type="button" data-tab="flow">审批流程</button>
      <button class="tab" type="button" data-tab="list">确认清单</button>
    </div>

    <section id="view-form" class="view active">
      <div class="card">
        <h2 style="margin-top:0;font-size:16px;">${d(e.form.name)}</h2>
        <div class="form-grid">
          ${t}
        </div>
      </div>
    </section>

    <section id="view-flow" class="view">
      <div class="card">
        <h2 style="margin-top:0;font-size:16px;">${d(e.process.name)}</h2>
        <div class="flow-wrap">${r}</div>
        <div class="detail" id="node-detail"></div>
      </div>
    </section>

    <section id="view-list" class="view">
      <div class="card">${l}</div>
    </section>
  </div>
  <script>${ve}<\/script>
</body>
</html>`}const D={title:"请假申请",description:"用于与业务确认请假表单字段及审批分支条件。",form:{name:"请假申请单",fields:[{id:"applicant",label:"申请人",type:"text",readonly:!0,placeholder:"当前登录人"},{id:"dept",label:"所属部门",type:"text",readonly:!0},{id:"leaveType",label:"请假类型",type:"select",required:!0,options:["年假","事假","病假","调休"]},{id:"startDate",label:"开始日期",type:"date",required:!0},{id:"endDate",label:"结束日期",type:"date",required:!0},{id:"days",label:"请假天数",type:"number",required:!0,description:"用于审批分支判断"},{id:"reason",label:"请假事由",type:"textarea",required:!0,placeholder:"请说明请假原因"}]},process:{processId:"leave_approval",name:"请假审批流程",elements:[{id:"start",type:"startEvent",name:"提交申请"},{id:"t_dept",type:"userTask",name:"部门经理审批",assigneeRole:"部门经理"},{id:"g_days",type:"exclusiveGateway",name:"是否超过3天",description:"根据请假天数分支"},{id:"t_hr",type:"userTask",name:"HR审批",assigneeRole:"HR"},{id:"end_ok",type:"endEvent",name:"归档"},{id:"end_reject",type:"endEvent",name:"驳回结束"}],flows:[{id:"f1",from:"start",to:"t_dept"},{id:"f2",from:"t_dept",to:"g_days",name:"通过"},{id:"f3",from:"t_dept",to:"end_reject",name:"驳回"},{id:"f4",from:"g_days",to:"t_hr",condition:"请假天数 > 3"},{id:"f5",from:"g_days",to:"end_ok",condition:"请假天数 ≤ 3"},{id:"f6",from:"t_hr",to:"end_ok",name:"通过"},{id:"f7",from:"t_hr",to:"end_reject",name:"驳回"}]}},Y=`做一个请假申请页：申请人、部门只读；请假类型下拉（年假/事假/病假/调休）；开始/结束日期和请假天数必填；事由多行必填。
提交后部门经理审批；通过后若请假超过3天再经HR审批，否则直接归档；任意节点驳回则结束。`,$e=document.querySelector("#app");$e.innerHTML=`
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
            <p class="status">默认：硅基流动 + Qwen/Qwen3-32B。开发态经本地代理调用 /v1/chat/completions，Key 仅存本机。</p>
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
`;const J=document.querySelector("#nl"),K=document.querySelector("#status"),Q=document.querySelector("#specJson"),we=document.querySelector("#preview"),M=document.querySelector("#baseUrl"),C=document.querySelector("#apiKey"),j=document.querySelector("#model"),A=document.querySelector("#btn-generate"),ke=document.querySelector("#btn-demo"),Ee=document.querySelector("#btn-from-json"),W=document.querySelector("#btn-download"),X=document.querySelector("#btn-open");let E="",N=null;function $(e,t=""){K.textContent=e,K.className=`status${t?` ${t}`:""}`}function Z(){return{baseUrl:M.value.trim()||R,apiKey:C.value.trim(),model:S(j.value)}}function Se(e){M.value=e.baseUrl||R,C.value=e.apiKey,j.value=S(e.model)||P}function V(){se(Z())}function T(e,t=[]){N=e,E=xe(e),Q.value=JSON.stringify(e,null,2),we.srcdoc=E,W.disabled=!1,X.disabled=!1,t.length?$(`已生成（有警告）：${t.join("；")}`,"warn"):$("原型已更新","ok")}function Oe(e){try{const t=JSON.parse(e),r=F(t);if(!r.ok||!r.spec){$(`JSON 校验失败：${r.errors.join("；")}`,"error");return}T(r.spec,r.warnings)}catch(t){$(`JSON 解析失败：${t.message}`,"error")}}ke.addEventListener("click",()=>{J.value=Y,T(D)});Ee.addEventListener("click",()=>{Oe(Q.value)});A.addEventListener("click",async()=>{V();const e=Z();A.disabled=!0,$("正在调用模型生成规格…");try{const{validation:t}=await ce(J.value,e);if(!t.ok||!t.spec){$(`生成结果校验失败：${t.errors.join("；")}`,"error"),t.warnings.length;return}T(t.spec,t.warnings)}catch(t){$(t.message,"error")}finally{A.disabled=!1}});W.addEventListener("click",()=>{if(!E||!N)return;const e=new Blob([E],{type:"text/html;charset=utf-8"}),t=URL.createObjectURL(e),r=document.createElement("a");r.href=t,r.download=`${N.title||"prototype"}.html`,r.click(),URL.revokeObjectURL(t)});X.addEventListener("click",()=>{if(!E)return;const e=window.open("");e&&(e.document.open(),e.document.write(E),e.document.close())});[M,C,j].forEach(e=>{e.addEventListener("change",V)});Se(oe());J.value=Y;T(D);$("已加载请假示例，可直接预览或修改描述后生成","ok");
