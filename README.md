# ORBIT — Workflow Studio

A polished, local-first visual workflow editor built with **TypeScript**, **Next.js 15**, **React 19**, **React Flow**, **Tailwind CSS 4**, and custom CSS. Design directed workflows, connect steps, save them to your browser, and simulate an execution without calling external APIs.

> Portfolio demo. Workflow execution is a deterministic simulation, not a production automation engine.

## Features

- Interactive node canvas with draggable nodes and connectable handles
- Trigger, condition and action step types
- Multiple independent workflows with names and delete controls
- Manual save and restore using browser `localStorage`
- Topological execution order with dependency and cycle validation
- Execution log showing simulated steps and clear errors
- Responsive dashboard UI, unit tests, CI, and Docker

## Quick start

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Add steps from the inspector panel, connect the handles, and click **Run workflow**. Click **Save** to persist workflows in the browser. Nothing is sent to a server.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

Tests cover workflow validation, dependency ordering, cycle detection, missing nodes and storage parsing.

## Docker

```bash
docker build -t orbit-workflow-studio .
docker run --rm -p 3000:3000 orbit-workflow-studio
```

## Architecture

```text
app/           Next.js app router and global styles
components/    Client-side visual editor and workspace UI
lib/           Pure workflow validation and simulation engine
tests/         Vitest tests for execution engine
.github/       GitHub Actions CI checks
```

### Design decisions

The editor is **local-first**: workflows are persisted only in the current browser. No credentials, third-party APIs, databases, or accounts are required. The simulation executes tasks in topological order with a Kahn-style dependency walk; cycles cause a clear error instead of silently running in an undefined order. Conditions always evaluate as `true` and actions do not perform real side effects.

## Current limitations

- Local storage is not synchronized across devices; clearing browser data removes saved workflows.
- No authentication, external API calls, background scheduling, or real conditional branching.
- The editor does not yet support undo/redo or server-side collaboration.

## Future roadmap

PostgreSQL persistence, multi-user access, node properties editor, real rule evaluation, run history, retry policies and n8n integration.

## License

MIT — Copyright (c) 2026 Nina Martins.
