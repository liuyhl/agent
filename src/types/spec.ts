/** 表单字段类型（企业信息化常用子集） */
export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'textarea'
  | 'checkbox';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

/** BPMN 子集元素 */
export type BpmnElementType =
  | 'startEvent'
  | 'userTask'
  | 'exclusiveGateway'
  | 'endEvent';

export interface BpmnElement {
  id: string;
  type: BpmnElementType;
  name: string;
  /** 审批角色，仅 userTask 使用 */
  assigneeRole?: string;
  description?: string;
}

export interface BpmnFlow {
  id: string;
  from: string;
  to: string;
  name?: string;
  /** 网关出边条件文案 */
  condition?: string;
}

export interface BpmnProcess {
  processId: string;
  name: string;
  elements: BpmnElement[];
  flows: BpmnFlow[];
}

/** LLM / 本地模板共用的页面规格 */
export interface PrototypeSpec {
  title: string;
  description?: string;
  form: {
    name: string;
    fields: FormField[];
  };
  process: BpmnProcess;
}

export const FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'date',
  'datetime',
  'select',
  'textarea',
  'checkbox',
];

export const BPMN_TYPES: BpmnElementType[] = [
  'startEvent',
  'userTask',
  'exclusiveGateway',
  'endEvent',
];
