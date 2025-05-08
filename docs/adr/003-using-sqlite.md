# ADR 003: Choosing SQLite over PostgreSQL/In-memory

**Date:** 2025-05-08

**Status:** Accepted

## Context

Critical storage requirements:

- No external dependencies
- ACID transactions support
- Minimal resource load

Options under consideration:

1. **PostgreSQL**: Requires a separate container, redundant functions
2. **In-memory (Redis)**: Data loss on restart, TTL required
3. **SQLite**: Embedded, file system as storage

## Solution

Use SQLite 3 with:

- WAL (Write-Ahead Logging) mode
- Backups via `sqlite-backup`
- `better-sqlite3` connector

## Rationale

**Feature comparison**:

| Parameter    | PostgreSQL | Redis | SQLite (our choice) |
| ------------ | ---------- | ----- | ------------------- |
| Containers   | 2+         | 1     | 0                   |
| Transactions | Full       | None  | ACID                |
| Durability   | High       | Low   | Custom              |
| RAM Usage    | 120MB+     | 50MB+ | < 15MB              |

**Key arguments**:

1. Zero additional containers
2. Direct backup via file copying
3. 8x less memory than PostgreSQL

## Consequences

- ✅ Simplification of architecture to 0 external dependencies
- ✅ Ability to work in read-only file systems
- ⚠️ Limitation on 100+ parallel records
- ⚠️ Need for manual migration management
