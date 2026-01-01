---
title: Building My AI Agent Workspace
kind: article
date: 2026-01-01
tags: [AI, agents, productivity, Claude, workflow]
summary: How I set up a multi-AI workspace with Claude Code, Gemini CLI, and Codex CLI working together.
publish: true
---

# Building My AI Agent Workspace

I've spent the last few weeks building something I'm genuinely excited about: a workspace where multiple AI agents collaborate on tasks. Here's how it works.

## The Setup

I run three AI agents simultaneously:

| Agent | Role | Strengths |
|-------|------|-----------|
| **Claude Code** | Orchestrator | Task management, coding, workspace automation |
| **Gemini CLI** | Researcher | Google Search, large file analysis, knowledge base |
| **Codex CLI** | Technical Lead | Advanced coding, architecture, code review |

Each agent has access to the same workspace folder, shared documentation, and a simple coordination system.

## The Coordination System

Rather than complex protocols, I use an ultra-simple approach:

### 1. Shared Updates Log

All agents write to a single `UPDATES.md` file:

```markdown
## 2026-01-01

### Claude Code - 14:30
Completed task: Set up new build system
Next: Testing deployment pipeline

### Gemini CLI - 15:45
Research complete: OAuth 2.0 best practices
Created: Research/oauth-security.md
```

### 2. Handoff Files

When one agent needs another to continue work:

```markdown
---
from: Claude Code
to: Gemini CLI
priority: high
---

# Research Request: Discord Bot APIs

## Context
Building automation tools, need to understand Discord's bot ecosystem.

## Requirements
- [ ] ToS for automation
- [ ] Rate limits
- [ ] Available APIs
```

### 3. Simple Rules

- **Full workspace access** - No protected areas (trust the agents)
- **UK English throughout** - Consistency matters
- **Log everything** - Future agents need context

## Why Multiple Agents?

You might ask: *"Why not just use one AI?"*

Great question. Here's my reasoning:

1. **Specialisation** - Each model has strengths
2. **Parallel work** - Research while coding
3. **Cross-verification** - Different perspectives catch errors
4. **Context limits** - Split large tasks across agents

## Real Example: This Website

This very website was built using this multi-agent approach:

1. **Claude Code** wrote the build script and templates
2. **Gemini CLI** researched static site best practices
3. **Codex CLI** reviewed the architecture

The result? A cleaner codebase than any single agent (or human) would produce alone.

## Lessons Learned

### What Works

- **Simple coordination beats complex protocols**
- **Shared context is everything**
- **Let agents play to their strengths**
- **Trust but verify** - Review AI output

### What Doesn't Work

- Micromanaging agents
- Overly complex handoff procedures
- Assuming agents remember previous sessions
- Forgetting to provide context

## The Future

I'm convinced this is the future of knowledge work:

> Humans set direction. Agents do execution. Everyone wins.

We're not there yet - there's still plenty of supervision needed. But the trajectory is clear.

## Try It Yourself

If you want to experiment with multi-agent workflows:

1. Start with one agent, master it
2. Add a second for specific tasks
3. Create simple coordination rules
4. Iterate based on what works

The tools are available today. The question is: *what will you build?*

---

*This post was drafted by Claude Code, fact-checked by Gemini CLI, and reviewed by a human (me).*
