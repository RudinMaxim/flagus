# Flagus Client Architecture

## Directory Structure

```
infrastructure/
└── delivery/
    └── client/
        ├── register.ts                 # Client routes registration
        ├── assets/                     # Static assets
        │   ├── css/                    # Custom styles
        │   ├── js/                     # Client-side scripts
        │   └── images/                    # Images
        ├── controllers/                # Client controllers
        │   ├── index.ts                # Exports all controllers
        │   ├── BaseController.ts       # Base controller class
        │   ├── DashboardController.ts  # Dashboard views
        │   ├── FlagController.ts       # Flag management
        │   ├── CategoryController.ts   # Category management
        │   ├── AuditController.ts      # Audit logs
        │   └── UserController.ts       # User management
        ├── middleware/                 # Client-specific middleware
        │   ├── authView.middleware.ts  # Authentication for views
        │   └── themePreference.ts      # Theme preferences
        ├── templates/                  # Handlebars templates
        │   ├── layouts/
        │   │   ├── main.hbs            # Main layout
        │   │   └── auth.hbs            # Authentication layout
        │   ├── partials/               # Reusable components
        │   │   ├── header.hbs
        │   │   ├── sidebar.hbs
        │   │   ├── footer.hbs
        │   │   ├── pagination.hbs
        │   │   └── notifications.hbs
        │   ├── components/             # HTMX components
        │   │   ├── flagToggle.hbs      # Toggle switch component
        │   │   ├── flagForm.hbs        # Flag creation/edit form
        │   │   ├── categoryTree.hbs    # Category hierarchical view
        │   │   ├── auditTable.hbs      # Audit logs table
        │   │   └── userForm.hbs        # User form
        │   ├── pages/                  # Full page templates
        │   │   ├── dashboard/
        │   │   │   └── index.hbs       # Dashboard home
        │   │   ├── flags/
        │   │   │   ├── list.hbs        # Flag listing
        │   │   │   ├── create.hbs      # Create flag
        │   │   │   ├── edit.hbs        # Edit flag
        │   │   │   └── detail.hbs      # Flag details
        │   │   ├── categories/
        │   │   │   ├── list.hbs        # Category listing
        │   │   │   ├── create.hbs      # Create category
        │   │   │   └── edit.hbs        # Edit category
        │   │   ├── audit/
        │   │   │   ├── list.hbs        # Audit log listing
        │   │   │   └── detail.hbs      # Audit log detail
        │   │   ├── users/
        │   │   │   ├── list.hbs        # User listing
        │   │   │   ├── create.hbs      # Create user
        │   │   │   └── edit.hbs        # Edit user
        │   │   └── auth/
        │   │       ├── login.hbs       # Login page
        │   │       └── setup.hbs       # First-time setup
        └── utils/                      # Client utilities
            ├── handlebarsHelpers.ts    # Custom handlebars helpers
            └── clientValidation.ts     # Form validation
```

## Core Components

### 1. HTMX Integration

HTMX will be used for dynamic content updates without full page reloads. The implementation focuses on:

- Partial updates for toggle switches (`hx-post`, `hx-target`)
- Form submissions with validation feedback
- Filtering and pagination of lists
- Dynamic category tree manipulation

### 2. Bootstrap Components

Bootstrap will provide the responsive UI framework:

- Responsive grid system for layouts
- Navigation components (navbar, sidebar)
- Form controls and validation styles
- Modals for confirmation dialogs
- Cards for feature flag display
- Alerts for notifications

### 3. Controller Pattern

Controllers will handle the rendering logic and data preparation:

```typescript
// BaseController.ts
export abstract class BaseController {
  protected viewData: Record<string, any> = {};

  constructor(protected services: any) {}

  protected render(reply: any, template: string, data: any = {}) {
    return reply.view(`templates/pages/${template}`, {
      ...this.viewData,
      ...data,
    });
  }

  protected renderPartial(reply: any, partial: string, data: any = {}) {
    return reply.view(`templates/components/${partial}`, {
      ...data,
    });
  }
}

// FlagController.ts example
export class FlagController extends BaseController {
  async listFlags(request: any, reply: any) {
    const flags = await this.services.flagService.getAll();
    const categories = await this.services.categoryService.getAll();

    return this.render(reply, 'flags/list', {
      flags,
      categories,
      title: 'Feature Flags',
    });
  }

  async toggleFlag(request: any, reply: any) {
    const { id } = request.params;
    const flag = await this.services.flagService.toggle(id);

    // Return only the toggle component for HTMX to replace
    return this.renderPartial(reply, 'flagToggle', { flag });
  }
}
```

### 4. Handlebars Templates

Templates will be organized in a modular fashion:

```handlebars
{{!-- templates/layouts/main.hbs --}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flagus - {{title}}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  {{> partials/header }}

  <div class="container-fluid">
    <div class="row">
      {{> partials/sidebar }}

      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
        {{> partials/notifications }}
        {{{body}}}
      </main>
    </div>
  </div>

  {{> partials/footer }}
  <script src="/assets/js/main.js"></script>
</body>
</html>
```

### 5. HTMX Components Example

```handlebars
{{!-- templates/components/flagToggle.hbs --}}
<div class="form-check form-switch">
  <input
    class="form-check-input"
    type="checkbox"
    id="flag-{{flag.id}}"
    {{#if flag.enabled}}checked{{/if}}
    hx-post="/api/v1/flags/{{flag.id}}/toggle"
    hx-target="closest div"
    hx-swap="outerHTML"
    hx-indicator="#spinner-{{flag.id}}"
  >
  <label class="form-check-label" for="flag-{{flag.id}}">
    {{#if flag.enabled}}Enabled{{else}}Disabled{{/if}}
  </label>
  <span id="spinner-{{flag.id}}" class="htmx-indicator spinner-border spinner-border-sm" role="status"></span>
</div>
```

## Route Registration

The `register.ts` file will connect controllers to routes:

```typescript
// register.ts
import { FastifyInstance } from 'fastify';
import {
  DashboardController,
  FlagController,
  CategoryController,
  AuditController,
  UserController,
} from './controllers';

export default async function register(fastify: FastifyInstance) {
  // Setup view engine
  fastify.register(require('@fastify/view'), {
    engine: {
      handlebars: require('handlebars'),
    },
    root: __dirname,
    layout: 'templates/layouts/main',
    options: {
      partials: {
        'partials/header': 'templates/partials/header.hbs',
        'partials/sidebar': 'templates/partials/sidebar.hbs',
        'partials/footer': 'templates/partials/footer.hbs',
        'partials/notifications': 'templates/partials/notifications.hbs',
      },
    },
  });

  // Register static assets
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
  });

  // Initialize controllers
  const controllers = {
    dashboard: new DashboardController(fastify.diContainer.cradle),
    flag: new FlagController(fastify.diContainer.cradle),
    category: new CategoryController(fastify.diContainer.cradle),
    audit: new AuditController(fastify.diContainer.cradle),
    user: new UserController(fastify.diContainer.cradle),
  };

  // Dashboard routes
  fastify.get('/', controllers.dashboard.index.bind(controllers.dashboard));

  // Flag routes
  fastify.get('/flags', controllers.flag.listFlags.bind(controllers.flag));
  fastify.get('/flags/create', controllers.flag.createFlagForm.bind(controllers.flag));
  fastify.post('/flags/create', controllers.flag.createFlag.bind(controllers.flag));
  fastify.get('/flags/:id', controllers.flag.viewFlag.bind(controllers.flag));
  fastify.get('/flags/:id/edit', controllers.flag.editFlagForm.bind(controllers.flag));
  fastify.post('/flags/:id/edit', controllers.flag.updateFlag.bind(controllers.flag));
  fastify.post('/flags/:id/toggle', controllers.flag.toggleFlag.bind(controllers.flag));
  fastify.delete('/flags/:id', controllers.flag.deleteFlag.bind(controllers.flag));

  // Register other routes (categories, audit, users)
  // ...
}
```

## Scaling the Architecture

This architecture is designed to scale through:

1. **Component-based design**: Each UI element is isolated and reusable
2. **Controller inheritance**: Common functionality in base controllers
3. **Partials and layouts**: Reusable template components
4. **HTMX for targeted updates**: Minimizing full page reloads
5. **Clear separation of concerns**: Templates, controllers, and services
