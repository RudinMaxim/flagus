# 🏗️ Flagus - Feature Flags Service

A tiny open source service for managing feature flags.  
**The goal** is to provide an easy and fast way to manage enabling/disabling application functionality without having to deploy new versions.

The project is designed for use in a single Docker container, without the need to set up separate databases or front-end applications.

---

## 📋 Tech stack

| Component            | Technology        |
|----------------------|-------------------|
| HTTP-server          | Fastify          |
| PL                   | TypeScript       |
| Database             | SQLite           |
| Client side          | HTMX             |
| Containerization     | Docker           |

---

## ✨ Brief description of functionality

- Manage feature flags via a simple web interface
- Create, edit, delete flags
- Enable/disable flags in real time
- API for receiving flag status by applications
- Minimal load on infrastructure: everything in one container
- No need for a separate frontend assembly or database service
