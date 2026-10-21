import {
  BPMN_TYPES,
  FIELD_TYPES,
  type BpmnElementType,
  type FieldType,
  type PrototypeSpec,
} from '../types/spec';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  spec?: PrototypeSpec;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

export function validateSpec(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(input)) {
    return { ok: false, errors: ['规格必须是 JSON 对象'], warnings };
  }

  const title = asString(input.title);
  if (!title) errors.push('缺少 title');

  if (!isObject(input.form)) {
    errors.push('缺少 form');
  }

  if (!isObject(input.process)) {
    errors.push('缺少 process');
  }

  if (errors.length) {
    return { ok: false, errors, warnings };
  }

  const formObj = input.form as Record<string, unknown>;
  const processObj = input.process as Record<string, unknown>;
  const rawFields = Array.isArray(formObj.fields) ? formObj.fields : [];
  if (!rawFields.length) errors.push('form.fields 不能为空');

  const fields: PrototypeSpec['form']['fields'] = [];
  rawFields.forEach((raw, i) => {
    if (!isObject(raw)) {
      errors.push(`fields[${i}] 不是对象`);
      return;
    }
    const type = asString(raw.type) as FieldType;
    if (!FIELD_TYPES.includes(type)) {
      errors.push(`fields[${i}].type 不支持: ${raw.type}`);
    }
    const id = asString(raw.id) || `field_${i + 1}`;
    const label = asString(raw.label) || id;
    const options = Array.isArray(raw.options)
      ? raw.options.filter((o): o is string => typeof o === 'string')
      : undefined;
    if (type === 'select' && (!options || !options.length)) {
      warnings.push(`字段「${label}」为 select 但未提供 options`);
    }
    fields.push({
      id,
      label,
      type: FIELD_TYPES.includes(type) ? type : 'text',
      required: Boolean(raw.required),
      readonly: Boolean(raw.readonly),
      placeholder: asString(raw.placeholder) || undefined,
      options,
      description: asString(raw.description) || undefined,
    });
  });

  const rawElements = Array.isArray(processObj.elements) ? processObj.elements : [];
  const rawFlows = Array.isArray(processObj.flows) ? processObj.flows : [];
  if (!rawElements.length) errors.push('process.elements 不能为空');
  if (!rawFlows.length) errors.push('process.flows 不能为空');

  const elements: PrototypeSpec['process']['elements'] = [];
  rawElements.forEach((raw, i) => {
    if (!isObject(raw)) {
      errors.push(`elements[${i}] 不是对象`);
      return;
    }
    const type = asString(raw.type) as BpmnElementType;
    if (!BPMN_TYPES.includes(type)) {
      errors.push(`elements[${i}].type 不支持: ${raw.type}`);
    }
    const id = asString(raw.id);
    if (!id) errors.push(`elements[${i}] 缺少 id`);
    elements.push({
      id,
      type: BPMN_TYPES.includes(type) ? type : 'userTask',
      name: asString(raw.name) || id,
      assigneeRole: asString(raw.assigneeRole) || undefined,
      description: asString(raw.description) || undefined,
    });
  });

  const idSet = new Set(elements.map((e) => e.id));
  const starts = elements.filter((e) => e.type === 'startEvent');
  const ends = elements.filter((e) => e.type === 'endEvent');
  if (starts.length !== 1) errors.push('必须恰好有 1 个 startEvent');
  if (ends.length < 1) errors.push('至少需要 1 个 endEvent');

  const flows: PrototypeSpec['process']['flows'] = [];
  rawFlows.forEach((raw, i) => {
    if (!isObject(raw)) {
      errors.push(`flows[${i}] 不是对象`);
      return;
    }
    const id = asString(raw.id) || `flow_${i + 1}`;
    const from = asString(raw.from);
    const to = asString(raw.to);
    if (!from || !to) errors.push(`flows[${i}] 缺少 from/to`);
    if (from && !idSet.has(from)) errors.push(`flows[${i}].from 引用不存在: ${from}`);
    if (to && !idSet.has(to)) errors.push(`flows[${i}].to 引用不存在: ${to}`);
    flows.push({
      id,
      from,
      to,
      name: asString(raw.name) || undefined,
      condition: asString(raw.condition) || undefined,
    });
  });

  for (const el of elements) {
    if (el.type === 'exclusiveGateway') {
      const outs = flows.filter((f) => f.from === el.id);
      if (outs.length < 2) {
        errors.push(`网关 ${el.id} 至少需要 2 条出边`);
      }
      for (const f of outs) {
        if (!f.condition && !f.name) {
          warnings.push(`网关出边 ${f.id} 建议填写 condition`);
        }
      }
    }
    if (el.type === 'userTask' && !el.assigneeRole) {
      warnings.push(`任务「${el.name}」未填写 assigneeRole`);
    }
  }

  for (const el of elements) {
    const ins = flows.filter((f) => f.to === el.id);
    const outs = flows.filter((f) => f.from === el.id);
    if (el.type === 'startEvent' && outs.length < 1) {
      errors.push('startEvent 需要至少 1 条出边');
    }
    if (el.type === 'endEvent' && ins.length < 1) {
      warnings.push(`结束节点 ${el.id} 没有入边`);
    }
    if (el.type !== 'startEvent' && el.type !== 'endEvent' && ins.length < 1) {
      warnings.push(`节点 ${el.id} 没有入边`);
    }
  }

  if (errors.length) {
    return { ok: false, errors, warnings };
  }

  const spec: PrototypeSpec = {
    title,
    description: asString(input.description) || undefined,
    form: {
      name: asString(formObj.name) || title,
      fields,
    },
    process: {
      processId: asString(processObj.processId) || 'process_1',
      name: asString(processObj.name) || `${title}流程`,
      elements,
      flows,
    },
  };

  return { ok: true, errors, warnings, spec };
}

/** 从模型回复中提取 JSON（兼容 markdown 代码块） */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('未找到 JSON 对象');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
