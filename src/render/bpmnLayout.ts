import type { BpmnElement, BpmnFlow, BpmnProcess } from '../types/spec';

export interface LaidOutNode {
  el: BpmnElement;
  x: number;
  y: number;
  w: number;
  h: number;
  column: number;
  row: number;
}

export interface LaidOutEdge {
  flow: BpmnFlow;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface FlowLayout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
}

const COL_GAP = 160;
const ROW_GAP = 110;
const PAD = 48;

function successors(id: string, flows: BpmnFlow[]): string[] {
  return flows.filter((f) => f.from === id).map((f) => f.to);
}

/** 按拓扑分层（BFS），同层多节点纵向排布 */
export function layoutProcess(process: BpmnProcess): FlowLayout {
  const { elements, flows } = process;
  const byId = new Map(elements.map((e) => [e.id, e]));
  const start = elements.find((e) => e.type === 'startEvent');
  if (!start) {
    return { nodes: [], edges: [], width: 400, height: 200 };
  }

  const column = new Map<string, number>();
  const queue: string[] = [start.id];
  column.set(start.id, 0);

  while (queue.length) {
    const id = queue.shift()!;
    const col = column.get(id)!;
    for (const next of successors(id, flows)) {
      const nextCol = col + 1;
      const prev = column.get(next);
      if (prev === undefined || nextCol > prev) {
        column.set(next, nextCol);
        queue.push(next);
      } else if (!column.has(next)) {
        column.set(next, nextCol);
        queue.push(next);
      }
    }
  }

  // 未连通节点放到末列
  let maxCol = 0;
  for (const c of column.values()) maxCol = Math.max(maxCol, c);
  for (const el of elements) {
    if (!column.has(el.id)) {
      maxCol += 1;
      column.set(el.id, maxCol);
    }
  }

  const rowsInCol = new Map<number, string[]>();
  for (const [id, col] of column) {
    const list = rowsInCol.get(col) ?? [];
    list.push(id);
    rowsInCol.set(col, list);
  }

  const nodeSize = (el: BpmnElement) => {
    if (el.type === 'startEvent' || el.type === 'endEvent') return { w: 44, h: 44 };
    if (el.type === 'exclusiveGateway') return { w: 52, h: 52 };
    return { w: 140, h: 56 };
  };

  const nodes: LaidOutNode[] = [];
  let maxRow = 0;
  for (const [col, ids] of rowsInCol) {
    ids.forEach((id, row) => {
      const el = byId.get(id)!;
      const { w, h } = nodeSize(el);
      maxRow = Math.max(maxRow, row);
      nodes.push({
        el,
        column: col,
        row,
        w,
        h,
        x: PAD + col * COL_GAP,
        y: PAD + row * ROW_GAP,
      });
    });
  }

  const pos = new Map(nodes.map((n) => [n.el.id, n]));
  const edges: LaidOutEdge[] = flows.map((flow) => {
    const a = pos.get(flow.from);
    const b = pos.get(flow.to);
    if (!a || !b) {
      return { flow, x1: 0, y1: 0, x2: 0, y2: 0 };
    }
    return {
      flow,
      x1: a.x + a.w,
      y1: a.y + a.h / 2,
      x2: b.x,
      y2: b.y + b.h / 2,
    };
  });

  const width = PAD * 2 + (maxCol + 1) * COL_GAP;
  const height = PAD * 2 + (maxRow + 1) * ROW_GAP;

  return { nodes, edges, width: Math.max(width, 480), height: Math.max(height, 220) };
}
