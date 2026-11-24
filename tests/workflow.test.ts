import { describe, expect, it } from "vitest";
import { makeStarterWorkflow, parseWorkflows, simulateWorkflow, validateWorkflow } from "../lib/workflow";

describe("Workflow engine", () => {
  it("validates the starter workflow", () => {
    expect(validateWorkflow(makeStarterWorkflow())).toEqual([]);
  });
  it("executes nodes in dependency order", () => {
    const run = simulateWorkflow(makeStarterWorkflow());
    expect(run.ok).toBe(true);
    expect(run.steps.map(step => step.id)).toEqual(["start", "qualify", "notify"]);
  });
  it("rejects cycles without executing steps", () => {
    const workflow = makeStarterWorkflow();
    workflow.edges.push({ id: "back", source: "notify", target: "start" });
    const run = simulateWorkflow(workflow);
    expect(run.ok).toBe(false);
    expect(run.steps).toEqual([]);
    expect(run.error).toContain("cycle");
  });
  it("rejects edges to unknown nodes", () => {
    const workflow = makeStarterWorkflow();
    workflow.edges.push({ id: "dangling", source: "notify", target: "missing" });
    expect(validateWorkflow(workflow)).toContain("Invalid edge dangling.");
  });
  it("handles malformed local storage", () => {
    expect(parseWorkflows("{")).toHaveLength(1);
    expect(parseWorkflows(JSON.stringify([]))).toEqual([]);
  });
});
