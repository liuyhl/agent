import type { PrototypeSpec } from '../types/spec';

/** 请假申请示例规格（无 API 时也可演示） */
export const leaveSample: PrototypeSpec = {
  title: '请假申请',
  description: '用于与业务确认请假表单字段及审批分支条件。',
  form: {
    name: '请假申请单',
    fields: [
      {
        id: 'applicant',
        label: '申请人',
        type: 'text',
        readonly: true,
        placeholder: '当前登录人',
      },
      {
        id: 'dept',
        label: '所属部门',
        type: 'text',
        readonly: true,
      },
      {
        id: 'leaveType',
        label: '请假类型',
        type: 'select',
        required: true,
        options: ['年假', '事假', '病假', '调休'],
      },
      {
        id: 'startDate',
        label: '开始日期',
        type: 'date',
        required: true,
      },
      {
        id: 'endDate',
        label: '结束日期',
        type: 'date',
        required: true,
      },
      {
        id: 'days',
        label: '请假天数',
        type: 'number',
        required: true,
        description: '用于审批分支判断',
      },
      {
        id: 'reason',
        label: '请假事由',
        type: 'textarea',
        required: true,
        placeholder: '请说明请假原因',
      },
    ],
  },
  process: {
    processId: 'leave_approval',
    name: '请假审批流程',
    elements: [
      { id: 'start', type: 'startEvent', name: '提交申请' },
      {
        id: 't_dept',
        type: 'userTask',
        name: '部门经理审批',
        assigneeRole: '部门经理',
      },
      {
        id: 'g_days',
        type: 'exclusiveGateway',
        name: '是否超过3天',
        description: '根据请假天数分支',
      },
      {
        id: 't_hr',
        type: 'userTask',
        name: 'HR审批',
        assigneeRole: 'HR',
      },
      { id: 'end_ok', type: 'endEvent', name: '归档' },
      { id: 'end_reject', type: 'endEvent', name: '驳回结束' },
    ],
    flows: [
      { id: 'f1', from: 'start', to: 't_dept' },
      { id: 'f2', from: 't_dept', to: 'g_days', name: '通过' },
      { id: 'f3', from: 't_dept', to: 'end_reject', name: '驳回' },
      {
        id: 'f4',
        from: 'g_days',
        to: 't_hr',
        condition: '请假天数 > 3',
      },
      {
        id: 'f5',
        from: 'g_days',
        to: 'end_ok',
        condition: '请假天数 ≤ 3',
      },
      { id: 'f6', from: 't_hr', to: 'end_ok', name: '通过' },
      { id: 'f7', from: 't_hr', to: 'end_reject', name: '驳回' },
    ],
  },
};

export const defaultPrompt = `做一个请假申请页：申请人、部门只读；请假类型下拉（年假/事假/病假/调休）；开始/结束日期和请假天数必填；事由多行必填。
提交后部门经理审批；通过后若请假超过3天再经HR审批，否则直接归档；任意节点驳回则结束。`;
