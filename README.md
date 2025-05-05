# 🏗️ Flagus - Feature Flags Management

Flagus is a lightweight, open-source feature flag management service designed for simplicity and speed.
It provides a minimalistic web UI and API to create, edit, and toggle feature flags without the need for a separate frontend or database.
Easily deployable in a single Docker container, Flagus is ideal for small to medium-sized projects looking for a hassle-free way to manage feature rollouts

---

## 📋 Tech stack

| Component            | Technology        |
|----------------------|-------------------|
| HTTP-server          | Fastify          |
| Language             | TypeScript       |
| Database             | SQLite           |
| Client side          | HTMX             |

---

## ✨ Brief description of functionality

- Manage feature flags via a simple web interface
- Create, edit, delete flags
- Enable/disable flags in real time
- API for receiving flag status by applications
- Minimal load on infrastructure: everything in one container
- No need for a separate frontend assembly or database service
