"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, applyEdgeChanges, applyNodeChanges,
  type Connection, type Edge, type EdgeChange, type NodeChange
} from "@xyflow/react";
import { ArrowUpRight, CheckCircle2, CirclePlay, FolderPlus, GitBranch, Layers3, Plus, Save, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { makeStarterWorkflow, parseWorkflows, simulateWorkflow, STORAGE_KEY, type StepKind, type Workflow, type WorkflowNode, type RunResult } from "@/lib/workflow";

const nodeColors: Record<StepKind, string> = { trigger: "#ce8ab1", condition: "#dfb87b", action: "#7c8bc8" };
const kinds: { kind: StepKind; label: string; description: string }[] = [
  { kind: "trigger", label: "Trigger", description: "Start a new event" },
  { kind: "condition", label: "Condition", description: "Evaluate a rule" },
  { kind: "action", label: "Action", description: "Perform a step" }
];

export default function Studio() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeId, setActiveId] = useState("starter");
  const [loaded, setLoaded] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [savedMessage, setSavedMessage] = useState("Not saved yet");

  useEffect(() => {
    const stored = parseWorkflows(localStorage.getItem(STORAGE_KEY));
    setWorkflows(stored);
    setActiveId(stored[0]?.id ?? "");
    setLoaded(true);
  }, []);

  const active = workflows.find(workflow => workflow.id === activeId);
  const update = useCallback((fn: (workflow: Workflow) => Workflow) => {
    setWorkflows(current => current.map(workflow => workflow.id === activeId ? { ...fn(workflow), updatedAt: new Date().toISOString() } : workflow));
    setRunResult(null);
    setSavedMessage("Unsaved changes");
  }, [activeId]);

  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => update(workflow => ({ ...workflow, nodes: applyNodeChanges(changes, workflow.nodes) })), [update]);
  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => update(workflow => ({ ...workflow, edges: applyEdgeChanges(changes, workflow.edges) })), [update]);
  const onConnect = useCallback((connection: Connection) => update(workflow => ({ ...workflow, edges: addEdge({ ...connection, animated: true }, workflow.edges) })), [update]);

  function addNode(kind: StepKind) {
    if (!active) return;
    const label = kind === "trigger" ? "New event" : kind === "condition" ? "Check condition" : "New action";
    const node: WorkflowNode = {
      id: crypto.randomUUID(),
      type: kind === "trigger" ? "input" : kind === "action" ? "output" : "default",
      data: { kind, label },
      position: { x: 160 + active.nodes.length * 48, y: 120 + active.nodes.length * 40 }
    };
    update(workflow => ({ ...workflow, nodes: [...workflow.nodes, node] }));
  }

  function addWorkflow() {
    const id = crypto.randomUUID();
    const workflow: Workflow = { id, name: `Untitled workflow ${workflows.length + 1}`, nodes: [], edges: [], updatedAt: new Date().toISOString() };
    setWorkflows(current => [...current, workflow]);
    setActiveId(id);
    setRunResult(null);
    setSavedMessage("Unsaved changes");
  }

  function deleteWorkflow(id: string) {
    const next = workflows.filter(workflow => workflow.id !== id);
    setWorkflows(next);
    if (activeId === id) setActiveId(next[0]?.id ?? "");
    setRunResult(null);
    setSavedMessage("Unsaved changes");
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
      setSavedMessage("Saved locally");
    } catch { setSavedMessage("Save failed: browser storage unavailable"); }
  }

  function run() {
    if (!active) return;
    setRunResult(simulateWorkflow(active));
  }

  if (!loaded) return <main className="loading">Preparing your workspace…</main>;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><WorkflowIcon size={21} /></span><span>ORBIT<small>WORKFLOW STUDIO</small></span></div>
        <div className="section-label">WORKSPACE <span>01</span></div>
        <div className="nav-active"><Layers3 size={17} /> My workflows <span>{workflows.length}</span></div>
        <div className="divider" />
        <div className="section-label">PROJECTS <button title="Create workflow" aria-label="Create workflow" onClick={addWorkflow}><Plus size={17}/></button></div>
        <div className="workflow-list">
          {workflows.map(workflow => (
            <div key={workflow.id} className={`workflow-item ${activeId === workflow.id ? "selected" : ""}`}>
              <button onClick={() => { setActiveId(workflow.id); setRunResult(null); }} className="workflow-open"><GitBranch size={15}/><span>{workflow.name}</span></button>
              <button onClick={() => deleteWorkflow(workflow.id)} title={`Delete ${workflow.name}`} aria-label={`Delete ${workflow.name}`} className="delete"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="create-workflow" onClick={addWorkflow}><FolderPlus size={16}/> New workflow</button>
        <div className="sidebar-footer"><span className="avatar">NM</span><span>Nina's Workspace<small>Local demo · v0.1</small></span></div>
      </aside>
      <section className="main">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> Workflows <span>/</span> <strong>{active?.name ?? "Untitled"}</strong></div><div className="header-right"><span className="online-dot"/> Local-first editor <ArrowUpRight size={15}/></div></header>
        <div className="workspace">
          <div className="page-heading"><div><div className="eyebrow">DESIGN SPACE / 2026</div><input aria-label="Workflow name" className="title-input" value={active?.name ?? ""} onChange={e => update(workflow => ({ ...workflow, name: e.target.value }))} disabled={!active}/><p>Design automations, connect steps, and see your ideas come to life.</p></div><div className="toolbar"><button className="btn-secondary" onClick={save}><Save size={15}/> Save</button><button className="btn-primary" onClick={run} disabled={!active}><CirclePlay size={16}/> Run workflow</button></div></div>
          <div className="statusline"><span><span className="status-dot" /> {savedMessage}</span><span>{active?.nodes.length ?? 0} nodes · {active?.edges.length ?? 0} connections</span></div>
          <div className="editor-grid"><div className="canvas-container">
            {active ? <ReactFlow<WorkflowNode, Edge> key={active.id} nodes={active.nodes.map(n => ({...n, style: { border: `1px solid ${nodeColors[n.data.kind]}`, borderRadius: 10, padding: 8, color: "#382935", backgroundColor: "#fffafd", boxShadow: "0 9px 32px rgba(82, 47, 75, .07)", minWidth: 160, fontSize: 13, fontWeight: 600 }}))} edges={active.edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView proOptions={{ hideAttribution: true }}><Background gap={22} color="#e7dce4"/><MiniMap zoomable pannable nodeColor={node => nodeColors[(node.data?.kind as StepKind) ?? "action"]} /><Controls/></ReactFlow> : <div className="empty-state">Select or create a workflow to get started.</div>}
            <div className="canvas-label"><span className="online-dot"/> LIVE CANVAS</div>
          </div><aside className="inspector"><div className="inspector-heading">COMPONENTS <span>03</span></div><p>Build your workflow by adding steps to the canvas.</p><div className="component-list">{kinds.map(item => <button key={item.kind} onClick={() => addNode(item.kind)} disabled={!active} className="component"><span className="component-icon" style={{ color: nodeColors[item.kind], backgroundColor: `${nodeColors[item.kind]}22` }}><Plus size={17}/></span><span><strong>{item.label}</strong><small>{item.description}</small></span><Plus size={15} className="component-add"/></button>)}</div><div className="inspector-tip"><strong>Quick tip</strong><p>Drag nodes and connect their handles. Double-clicking does not create new steps; use the components above.</p></div></aside></div>
          <div className="bottom-panel"><div className="bottom-heading"><div><strong>Execution preview</strong><span>Simulated run — no external APIs are called</span></div><span className={`run-pill ${runResult?.ok ? "run-ok" : ""}`}>{runResult ? runResult.ok ? "COMPLETED" : "FAILED" : "READY"}</span></div>{!runResult ? <p className="run-empty">Click <strong>Run workflow</strong> to inspect execution order and check for invalid connections or cycles.</p> : runResult.ok ? <div className="run-results">{runResult.steps.map((step,index) => <div className="run-step" key={step.id}><CheckCircle2 size={16}/><span>{String(index+1).padStart(2,"0")}</span><strong>{step.label}</strong><small>{step.message}</small></div>)}</div> : <p role="alert" className="run-error">{runResult.error}</p>}</div>
        </div>
      </section>
    </main>
  );
}
