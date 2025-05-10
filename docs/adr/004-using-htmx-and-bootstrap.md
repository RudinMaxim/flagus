# ADR 004: Using HTMX + Bootstrap for admin panel

**Date:** 2025-05-08

**Status:** Accepted

## Context

Client side requirements:

- Minimal JS bundle (< 50KB)
- No separate frontend build
- Ability to embed in server templates
- Support for modern UI patterns

Problems of modern SPA frameworks:

- **React/Vue**:
- Bundle size 100-300KB
- Need for Node.js in build
- Excessive complexity for CRUD interface
- **Next/Nuxt**:
- Hidden SSR dependencies
- Hot update requires dev server
- Violation of the "all in one container" principle

## Solution

Use:

- **HTMX 1.9** - for dynamic UI
- **Bootstrap 5.3** - base styles and components

Client architecture:

```
Server-Side Rendered (SSR)
↳ Bootstrap Grid + Components
↳ HTMX for AJAX requests
No Webpack/Vite, only CDN resources
```

## Rationale

**Comparison of approaches**:

| Parameter              | SPA (React)     | Our solution  |
| ---------------------- | --------------- | ------------- |
| JS size                | 278KB (gzip)    | 42KB (gzip)   |
| First Paint time       | 1.8s            | 0.4s          |
| Number of dependencies | 150+            | 3 (CDN)       |
| API Integration        | Complex (Axios) | Native (HTML) |

**Key Benefits**:

1. **Zero-JS Fallback**: All features work without JavaScript
2. **Incremental Updates**: Replace only changed DOM elements
3. **Modal Window Implementation Example**:

```html
<button hx-get="/flags/edit/123" hx-target="#modal-container">Edit</button>
```

## Consequences

- ✅ Reduced UI load time
- ✅ Elimination of separate frontend build process
- ✅ Ability to deploy directly from the backend
- ⚠️ Limited ecosystem of ready-made components
- ⚠️ Need for manual DOM state management

### Relationship with other ADRs

1. **ADR-001**: Elimination of separate frontend container is possible thanks to minimalist client
2. **ADR-002**: Fastify is perfect for SSR with EJS/Mustache templates
3. **ADR-003**: SQLite allows storing UI templates in DB if needed
