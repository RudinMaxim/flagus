# ADR 005: Choosing Clean Architecture over DDD/Event-Driven

**Date:** 2025-05-08

**Status:** Accepted

## Context

Architectural style requirements:

- Easy long-term support
- Components can be replaced (e.g. DB or framework)
- Data flow transparency

Options under consideration:

1. **Clean Architecture**:

- Layered structure (core → adapters)
- Dependency inversion

2. **DDD** (Domain-Driven Design):

- Focus on the domain model
- Complex bounded contexts

3. **Event-Driven**:

- Message brokers (Kafka/RabbitMQ)
- Asynchronous handlers

## Solution

Implement a modified Clean Architecture:

```
Core (Model, Services)
↑ ↓
Adapters (Fastify, SQLite, HTMX)
```

Without:

- Strict layer isolation
- Full dependency inversion

## Rationale

**Comparison of approaches**:

| Criteria                  | Clean Arch | DDD    | Event-Driven | Our choice |
| ------------------------- | ---------- | ------ | ------------ | ---------- |
| Implementation complexity | Medium     | High   | High         | Low        |
| Infrastructure costs      | No         | No     | High         | No         |
| Flexibility to change     | High       | Medium | Low          | Medium     |
| Suitability for scale     | 80%        | 20%    | 10%          | 95%        |

**Key arguments**:

1. **For feature-flags**:

- No complex business logic (CRUD + toggle)
- No cross-domain interactions

2. **Why not DDD**:

- No complex aggregation (flags are independent)
- Redundancy of tactical design

3. **Why not Event-Driven**:

- No asynchronous scenarios
- Adds dependencies (message broker)

## Consequences

- ✅ Ability to replace the DB without changing the core
- ✅ Simplification of unit testing Services
- ⚠️ Redundancy for simple scenarios
- ⚠️ Manual dependency management

## Criticism of the solution

**Potential problems**:

1. **"Astronaut architecture"**:

- Risk of creating redundant abstraction
- Solution: Start with a simple implementation, add layers as needed growth

2. **Violation of Clean Architecture principles**:

- Direct infrastructure calls from Services
- Solution: Allow controlled coupling for simplicity

**When to reconsider**:

- Emergence of complex business rules
- Need for integration with external systems
- Transition to microservice architecture

### Relationship with other ADRs

1. **ADR-002**: Fastify acts as an HTTP → Core adapter
2. **ADR-003**: SQLite implements Core repository interfaces
3. **ADR-004**: HTML is integrated via templates in the Adapter layer
