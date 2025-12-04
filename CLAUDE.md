# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

There's a file modification bug in Claude Code. The workaround is: always use complete absolute Windows paths with drive letters and backslashes for ALL file operations. Apply this rule going forward, not just for this file.

## Project Overview

This is an Astro-based mobile employee task management system (员工端手机端任务系统) built with SSR (Server-Side Rendering). The application handles task performance tracking, commission management, and user authentication.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (accessible on network via 0.0.0.0)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm start

# Type check
npx astro check
```

**Note:** Development server runs on `0.0.0.0` to allow network access from mobile devices during testing.

## Project Architecture

### SSR Configuration

- **Output Mode**: `server` (full SSR, not static)
- **Adapter**: `@astrojs/node` in standalone mode
- **Node Version**: 24.9.0 (managed by Volta)

### API Proxy Configuration

Two proxy endpoints are configured in `astro.config.mjs`:

1. **`/api`** → `https://api.china9.cn/api`
2. **`/taskApi`** → `https://flexible.china9.cn/api`

These proxies handle CORS and route API requests to backend services.

### Authentication & Middleware

**File**: `src/middleware.ts`

The middleware handles authentication for all routes:

- **Checks**: `token` or `employee_token` cookies
- **Protected**: All routes except:
  - `/login`
  - `/api/*` routes
  - Static assets (images, CSS, JS, fonts, etc.)
- **Behavior**: Redirects to `/login?redirect=<original-path>` if unauthenticated

### Directory Structure

```
src/
├── components/          # Astro components (reusable UI)
│   ├── ProjectPerformance.astro
│   ├── TaskPerformance.astro
│   ├── FilterDrawer.astro
│   ├── ConfirmDialog.astro
│   └── ...
├── pages/              # File-based routing
│   ├── index.astro     # Home page (task list)
│   ├── login.astro     # Login page
│   ├── my-tasks.astro
│   ├── my-commission.astro
│   ├── profile.astro
│   ├── task/[id].astro             # Dynamic task detail
│   └── project-task-detail/[id].astro
├── utils/              # Shared utilities
│   ├── listStateManager.ts   # List state management (IMPORTANT)
│   ├── taskCardTemplate.ts   # Task card HTML generation
│   ├── taskListLoader.ts     # List loading logic
│   ├── filterConfig.ts       # Filter configuration
│   ├── map.ts                # Data mapping utilities
│   ├── tool.ts               # General utilities
│   └── url.ts                # URL utilities
├── types/              # TypeScript types
│   ├── filter.ts       # Filter-related types
│   └── global.d.ts     # Global type definitions
└── middleware.ts       # Authentication middleware
```

## Critical Architectural Patterns

### 1. List State Management (MUST USE)

**Key Files**:
- `src/utils/listStateManager.ts`
- `LIST_STATE_MANAGER_USAGE.md`
- `BEFORE_AFTER_COMPARISON.md`

**Usage Pattern**:

```typescript
import { createListStateManager } from "../utils/listStateManager";

// Creates manager and auto-generates all UI elements (loading, complete, stats)
const stateManager = createListStateManager();

async function loadData() {
  stateManager.onRequestStart();

  try {
    const response = await fetch('/api/tasks', { /* ... */ });
    const result = await response.json();

    // Automatically updates stats and completion state
    const isComplete = stateManager.onRequestSuccess(
      result.data.total,
      loadedCount,
      limit
    );
  } catch (error) {
    stateManager.onRequestError();
  }
}
```

**Benefits**:
- Auto-creates loading indicators, completion messages, and stats UI
- Reduces code by 70%+
- Centralizes list state logic
- See `LIST_STATE_MANAGER_USAGE.md` for complete documentation

### 2. Server-Side Data Fetching Pattern

Astro components can fetch data during SSR:

```astro
---
const proxyUrl = `${Astro.url.origin}/proxy`;

const response = await fetch(proxyUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Cookie": Astro.request.headers.get("cookie") || "",
  },
  body: JSON.stringify({
    path: "/api/endpoint",
    // ... params
  }),
});

const data = await response.json();
---

<div>
  {data.map(item => <div>{item.name}</div>)}
</div>
```

**Important**: Always forward cookies for authenticated requests.

### 3. Client-Side State with localStorage/sessionStorage

**Problem**: `localStorage` is NOT available in Astro's SSR `---` blocks (server-side).

**Solution**: Use client-side scripts:

```astro
---
// Server-side: Use default/placeholder data
const defaultData = { /* ... */ };
---

<div id="container">{/* Render with defaultData */}</div>

<script is:inline>
  // Client-side: Read from localStorage and update DOM
  const data = JSON.parse(localStorage.getItem('key') || '{}');
  document.getElementById('container').textContent = data.value;
</script>
```

**Best Practice**: Use `sessionStorage` for temporary page navigation data instead of `localStorage`.

### 4. Data Passing Between Pages

Two main patterns:

1. **sessionStorage** (preferred for navigation):
```javascript
// Page A
sessionStorage.setItem('taskDetail', JSON.stringify(data));
window.location.href = '/task/123';

// Page B
const data = JSON.parse(sessionStorage.getItem('taskDetail') || '{}');
```

2. **URL parameters** (for small data):
```javascript
window.location.href = `/task/${id}?status=pending`;
```

### 5. Dynamic Routes

Astro uses file-based routing with brackets:

- `pages/task/[id].astro` → `/task/123`, `/task/456`
- Access params: `const { id } = Astro.params;`

### 6. Component Data Patterns

Components receive data via props in SSR:

```astro
---
// ProjectPerformance.astro
interface Props {
  data?: Record<string, any>;
}

const { data }: Props = Astro.props;

// Fetch related data server-side
let projectPerformanceInfo = [];
if (data?.id) {
  // Fetch using data.id
}
---
```

Client-side hydration happens via:
```astro
<script is:inline>
  // Expose data to client
  window.__projectPerformanceInfo__ = JSON.parse('{JSON.stringify(projectPerformanceInfo)}');
</script>
```

## Important Utilities

### Task Card Template
`src/utils/taskCardTemplate.ts` - Generates task card HTML. Use this instead of writing card HTML manually.

### Filter Configuration
`src/utils/filterConfig.ts` - Centralized filter definitions for task lists.

### Data Mapping
`src/utils/map.ts` - Contains domain-specific utilities:
- `getBaseCommission()` - Calculate base commission
- `getAddCommission()` - Calculate additional commission
- `earlyWarningOfConstructionPeriod()` - Check deadline warnings
- `isLeave()` - Check leave status

## TypeScript Configuration

- Extends `astro/tsconfigs/strict`
- Strict type checking enabled
- Run `npx astro check` to verify types

## Environment Files

- `.env` - Default environment
- `.env.development` - Development overrides
- `.env.production` - Production configuration

## Common Patterns

### API Requests from Components

Always use the proxy pattern:

```typescript
const proxyUrl = `${Astro.url.origin}/proxy`;
const response = await fetch(proxyUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Cookie": Astro.request.headers.get("cookie") || "",
  },
  body: JSON.stringify({
    path: "/actual/api/path",
    // request params
  }),
});
```

### Handling Response Data

Standard response format:
```typescript
{
  code: 1,           // 1 = success
  data: {
    data: [...],     // actual data array
    total: 100,      // total count
    last_page: 10    // total pages
  }
}
```

### Pagination Loading

Use recursive pattern for complete data fetch:

```typescript
let allData: any[] = [];
let page = 1;
const limit = 100;

async function fetchAll() {
  const response = await fetch(/* ... */, {
    body: JSON.stringify({ page, limit, /* ... */ })
  });

  const res = await response.json();
  if (res.code === 1) {
    allData = allData.concat(...res.data.data);
    if (res.last_page > page) {
      page++;
      await fetchAll();  // Recursive call
    }
  }
}
```

## Key Differences from Standard Astro

1. **SSR-first**: This is NOT a static site. Everything runs server-side first.
2. **Cookie forwarding**: Required for authenticated API calls.
3. **Proxy pattern**: All API calls go through configured proxies.
4. **Mobile-first**: Development server binds to `0.0.0.0` for mobile testing.
5. **State management**: Custom `listStateManager` instead of framework state libraries.

## When Working with This Codebase

1. **Always check middleware** before adding new routes - ensure authentication logic applies
2. **Use listStateManager** for any list/pagination UI - don't reinvent it
3. **Forward cookies** in all server-side API requests
4. **Remember SSR context** - `localStorage`/`sessionStorage` only work in `<script>` tags
5. **Check existing utilities** in `src/utils/` before creating new ones
6. **Follow the proxy pattern** for API requests - never call external APIs directly

## Mobile Development

The dev server runs on `0.0.0.0` (all network interfaces) to enable:
- Testing on physical devices
- QR code scanning for mobile access
- Cross-device development

Access via: `http://<your-local-ip>:4321`
