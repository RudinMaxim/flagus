# ADR 001: Service mono-containerization

**Date:** 2025-05-08

**Status:** Accepted

## Context

When analyzing open-source solutions for feature flags (Flagsmith, Unleash, etc.), common problems were identified:

- **Redundant infrastructure**: A typical stack requires 4+ containers (UI, API, Redis, PostgreSQL)
- **Orchestration complexity**: The need for coordination between services complicates CI/CD
- **Resource intensity**: Each container consumes at least 50-100MB RAM

For our use case:

- Team of 3 developers
- Small/medium-scale projects (up to 100 flags)
- Deployment time requirements < 2 minutes

## Decision made

Use a single Docker container containing:
backend (Fastify) + embedded UI (HTMX) + SQLite + migrations

## Rationale

| Factor               | Multi-container | Our solution |
| -------------------- | --------------- | ------------ |
| Minimum resources    | ~500MB RAM      | < 100MB RAM  |
| Deployment time      | 3-5 min         | 15 sec       |
| Points of failure    | 5+              | 1            |
| Debugging complexity | High            | Minimal      |

**Key arguments**:

1. SQLite eliminates the need for a separate DB
2. HTMX eliminates SPA and frontend assembly
3. Built-in migrations replace a separate evolution service

## Consequences

- ✅ Simplification of DevOps processes
- ✅ Reduction in infrastructure costs
- ⚠️ Limitation of horizontal scaling
- ⚠️ Special care is required when updating the DB
