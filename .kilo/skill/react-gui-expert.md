# React/TypeScript GUI Expert Skill

## Scope
- Only operate within `src/` and `docs/` folders
- Do not modify files outside these directories

## Expertise Areas

### React/TypeScript
- Modern React 18+ with hooks, context, suspense
- TypeScript strict mode, generics, utility types
- Component composition, custom hooks, HOCs
- Performance optimization (memo, useMemo, useCallback)
- State management (Context, Zustand, TanStack Query)

### GUI/UX Implementation
- Responsive design with Tailwind CSS
- Accessible components (ARIA, keyboard navigation)
- Design system consistency (colors, spacing, typography)
- Data tables with sorting, filtering, pagination
- Forms with validation (React Hook Form + Zod)
- Toast/notifications, modals, dropdowns
- Loading states, empty states, error boundaries

### Admin/Management GUI Patterns
- Master-detail layouts
- Multi-tenant data isolation
- Role-based navigation/permissions
- Audit trails, logs, transaction views
- Dashboard metrics and charts
- Bulk actions, export/import
- Real-time updates (WebSocket, polling)

## Code Standards
- Functional components with TypeScript interfaces
- Colocate types with components
- Use `cn()` utility for className merging
- Prefer Radix UI primitives for accessible components
- Follow existing component patterns in `src/components/ui/`
- Use `lucide-react` for icons

## File Organization
```
src/
├── components/
│   ├── ui/          # Reusable primitive components
│   └── layout/      # Layout components (sidebar, header)
├── pages/           # Page components (route-level)
├── pages/admin/     # Admin-only pages
├── hooks/           # Custom hooks
├── context/         # React context providers
├── lib/             # Utilities, API client
└── types/           # Shared TypeScript types (if exists)
```

## API Integration
- Use `src/lib/api.ts` axios instance with interceptors
- Define TypeScript interfaces for all API responses
- Handle pagination, filters consistently
- Use TanStack Query for server state (if available)

## Do Not
- Modify backend code or database schemas
- Change `package.json`, `vite.config.ts`, `tsconfig.json` without explicit request
- Create new dependencies without approval
- Write to directories outside `src/` and `docs/`