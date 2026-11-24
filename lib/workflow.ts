import type { Edge, Node } from "@xyflow/react";

export type StepKind = "trigger" | "action" | "condition";
export type WorkflowNode = Node<{ label: string; kind: StepKind }>;
export type Workflow = { id: string; name: string; nodes: WorkflowNode[]; edges: Edge[]; updatedAt: string };
export type StepResult = { id: string; label: string; kind: StepKind; status: "completed"; message: string };
export type RunResult = { ok: boolean; steps: StepResult[]; error?: string };

export const STORAGE_KEY = "orbit_workflows_v1";

export function makeStarterWorkflow(): Workflow {
  return {
    id: "starter",
    name: "Welcome flow",
    updatedAt: new Date().toISOString(),
    nodes: [
      { id: "start", type: "input", position: { x: 80, y: 150 }, data: { label: "New lead arrives", kind: "trigger" } },
      { id: "qualify", position: { x: 360, y: 150 }, data: { label: "Qualify lead", kind: "condition" } },
      { id: "notify", type: "output", position: { x: 640, y: 150 }, data: { label: "Notify the team", kind: "action" } }
    ],
    edges: [
      { id: "edge-start-qualify", source: "start", target: "qualify", animated: true },
      { id: "edge-qualify-notify", source: "qualify", target: "notify", animated: true }
    ]
  };
}

export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];
  if (!workflow.name.trim()) errors.push("Workflow name cannot be empty.");
  if (!workflow.nodes.length) errors.push("Add at least one node.");
  const ids = new Set(workflow.nodes.map(n => n.id));
  if (ids.size !== workflow.nodes.length) errors.push("Node IDs must be unique.");
  for (const node of workflow.nodes) {
    if (!node.data?.label?.trim()) errors.push(`Node ${node.id} is missing a label.`);
  }
  for (const edge of workflow.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) errors.push(`Invalid edge ${edge.id}.`);
    if (edge.source === edge.target) errors.push(`Self-loops are not supported (${edge.id}).`);
  }
  return errors;
}

export function simulateWorkflow(workflow: Workflow): RunResult {
  const errors = validateWorkflow(workflow);
  if (errors.length) return { ok: false, steps: [], error: errors.join(" ") };
  const adj = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const node of workflow.nodes) { adj.set(node.id, []); indegree.set(node.id, 0); }
  for (const edge of workflow.edges) {
    adj.get(edge.source)!.push(edge.target);
    indegree.set(edge.target, indegree.get(edge.target)! + 1);
  }
  const queue = workflow.nodes.filter(n => indegree.get(n.id) === 0).map(n => n.id);
  const order: string[] = [];
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    order.push(id);
    for (const next of adj.get(id)!) {
      indegree.set(next, indegree.get(next)! - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== workflow.nodes.length) return { ok: false, steps: [], error: "A cycle was detected. Workflows must be directed acyclic graphs." };
  const nodeById = new Map(workflow.nodes.map(n => [n.id, n]));
  return {
    ok: true,
    steps: order.map(id => {
      const node = nodeById.get(id)!;
      const messages: Record<StepKind, string> = {
        trigger: "Event received (simulated)",
        condition: "Condition evaluated as true (simulated)",
        action: "Action completed (simulated)"
      };
      return { id, label: node.data.label, kind: node.data.kind, status: "completed" as const, message: messages[node.data.kind] };
    })
  };
}

export function parseWorkflows(raw: string | null): Workflow[] {
  if (!raw) return [makeStarterWorkflow()];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [makeStarterWorkflow()];
    return value.filter((v): v is Workflow => Boolean(v && typeof v === "object" && typeof v.id === "string" && typeof v.name === "string" && Array.isArray(v.nodes) && Array.isArray(v.edges)));
  } catch { return [makeStarterWorkflow()]; }
}
