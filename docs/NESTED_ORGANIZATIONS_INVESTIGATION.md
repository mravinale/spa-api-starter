# Nested Organizations — Investigation & Implementation Plan

> **Date:** 2026-02-18  
> **Scope:** Both repos — `nestjs-api-starter` (backend) + `spa-api-starter` (frontend)  
> **Library:** better-auth v1.4.3

---

## 1. Goal

Support an n-level organization hierarchy as shown in the mockup below:

```
ACME Corporation          ← root (depth 0)
├── West Region           ← child (depth 1)
│   ├── California Chapter  ← grandchild (depth 2)
│   └── Oregon Chapter
└── East Region
    ├── New York Chapter
    └── Massachusetts Chapter
```

---

## 2. Current Implementation — Findings

### 2.1 Backend (`nestjs-api-starter`)

**better-auth v1.4.3** — `organization` plugin registered in `src/auth.ts`.

**DB Schema** (`src/database/migrations/001_initial_schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS organization (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    slug     TEXT NOT NULL UNIQUE,
    logo     TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT          -- only extensibility hook
);
```

**No `parentId` column. No hierarchy column. Completely flat.**

- `session.activeOrganizationId` — stores a single active org ID; no concept of an "active path" through a tree.
- `AdminOrganizationsService` — all queries are flat `SELECT … FROM organization` with no self-join or recursive CTE.
- `OrgImpersonationService` — membership checks are flat per-org.

### 2.2 Frontend (`spa-api-starter`)

| Component / Hook | Current State |
|---|---|
| `OrganizationsPage.tsx` | Flat list + pagination, no tree rendering |
| `OrganizationSwitcher.tsx` | Flat dropdown of `organization.list()` results |
| `useOrganizations.ts` | All hooks operate on a flat array |
| `Organization` interface | `{ id, name, slug, logo, createdAt, metadata }` — no `parentId` |

### 2.3 better-auth Library Position

better-auth's `organization` plugin **does not support nested/hierarchical organizations natively**. The schema it generates is identical to what is already in the DB — a flat `organization` table. There is no `parentId`, no `path`, no adjacency list, no closure table in the plugin's schema or API surface.

**All hierarchy logic must be implemented as custom code outside the plugin.**

---

## 3. Gap Analysis

| Layer | Current State | Gap |
|---|---|---|
| **DB schema** | Flat `organization` table | Need `parentId` + optional `depth` columns |
| **better-auth plugin** | No hierarchy support | Plugin won't manage parent/child; all hierarchy logic is custom |
| **Session** | Single `activeOrganizationId` | No concept of "active path"; permission inheritance across levels is manual |
| **Backend services** | Flat queries | Need recursive CTEs (`WITH RECURSIVE`) for tree traversal |
| **Backend API** | No `parentId` in DTOs/endpoints | New endpoints for children/tree; `parentId` in create/update DTOs |
| **Frontend types** | No `parentId`/`children` fields | `Organization` interface needs `parentId`, `children?` |
| **Frontend UI** | Flat list + flat dropdown | Need recursive tree component |
| **RBAC/permissions** | Per-org flat membership | Inheritance rules across levels must be designed |
| **`activeOrganizationId`** | Single value | Ambiguous in a tree — which level is "active"? |

---

## 4. Key Design Decisions (Must Resolve Before Implementation)

1. **Permission inheritance** — Does a `manager` of `ACME Corporation` automatically manage `West Region` and `California Chapter`? Or is each level independently membered?
2. **Max depth** — Enforce a limit (e.g., 3 levels) to avoid unbounded recursion and UI complexity?
3. **`activeOrganizationId` semantics** — Does switching to `California Chapter` also "activate" its ancestors for breadcrumb/context purposes?
4. **Slug uniqueness** — Currently globally unique. With nesting, should slugs be unique per-parent (like filesystem paths) or remain globally unique?

---

## 5. Implementation Plan

### Phase 1 — DB Migration (non-breaking)

**File:** `src/database/migrations/003_nested_organizations.sql`

```sql
ALTER TABLE organization
    ADD COLUMN "parentId" TEXT REFERENCES organization(id) ON DELETE SET NULL;

ALTER TABLE organization
    ADD COLUMN depth INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "organization_parentId_idx" ON organization("parentId");
```

- `parentId NULL` = root org — **backward compatible**, all existing orgs remain roots.
- `depth` avoids recursive queries for simple depth-limit checks.

**Acceptance criteria:**
- All existing organizations remain with `parentId = NULL`, `depth = 0`.
- Migration is idempotent (uses `IF NOT EXISTS` / `IF NOT EXISTS` patterns where possible).

---

### Phase 2 — Backend

**Files to touch:**
- `src/platform-admin/dto/` — add `parentId?: string` to `CreateOrganizationDto`, `UpdateOrganizationDto`
- `src/platform-admin/services/admin-organizations.service.ts` — new methods + updated queries
- `src/platform-admin/controllers/` — new endpoints

**New endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/platform-admin/organizations/:id/children` | Direct children only |
| `GET` | `/api/platform-admin/organizations/:id/tree` | Full subtree (recursive CTE) |
| `POST` | `/api/platform-admin/organizations` | Accept `parentId?` in body |
| `PATCH` | `/api/platform-admin/organizations/:id` | Accept `parentId?` to reparent |

**Recursive CTE pattern for tree fetch:**

```sql
WITH RECURSIVE org_tree AS (
    SELECT *, 0 AS level FROM organization WHERE id = $1
    UNION ALL
    SELECT o.*, ot.level + 1 FROM organization o
    JOIN org_tree ot ON o."parentId" = ot.id
)
SELECT * FROM org_tree ORDER BY level, name;
```

**Depth enforcement (if max depth = 3):**

```ts
if (parentDepth + 1 > MAX_DEPTH) {
  throw new BadRequestException(`Maximum organization depth of ${MAX_DEPTH} exceeded`);
}
```

**TDD — unit tests to write first:**
- `findChildren(parentId)` — returns direct children only
- `findTree(rootId)` — returns full subtree
- `create({ parentId })` — sets `depth = parent.depth + 1`
- `create({ parentId })` — throws when depth limit exceeded
- `delete(id)` — cascades to children (or blocks if children exist)

---

### Phase 3 — Frontend

**Files to touch:**
- `src/features/Admin/views/OrganizationsPage.tsx`
- `src/features/Admin/hooks/useOrganizations.ts`
- `src/features/Admin/services/adminService.ts`
- `src/shared/components/OrganizationSwitcher.tsx`

**Type changes:**

```ts
interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  metadata?: unknown
  parentId?: string | null   // NEW
  depth?: number             // NEW
  children?: Organization[]  // NEW (populated by tree endpoint)
}
```

**New hooks:**

```ts
useOrganizationChildren(parentId: string)   // direct children
useOrganizationTree(rootId: string)         // full subtree
```

**UI changes:**

- `OrganizationsPage` — replace flat list with a recursive tree component (collapsible nodes, indent by depth).
- `OrganizationSwitcher` — render grouped/indented dropdown matching the mockup.
- Create-org dialog — add optional "Parent Organization" select field.
- Breadcrumb — show ancestor path when a nested org is selected.

**Component sketch:**

```tsx
function OrgTreeNode({ org, depth }: { org: Organization; depth: number }) {
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <OrgRow org={org} />
      {org.children?.map(child => (
        <OrgTreeNode key={child.id} org={child} depth={depth + 1} />
      ))}
    </div>
  )
}
```

---

### Phase 4 — better-auth Integration Boundary

better-auth's `organization` plugin continues to manage:
- `organization.create()` / `organization.list()` / `organization.setActive()`
- Member CRUD, invitations, `activeOrganizationId` on session

**All hierarchy logic lives outside the plugin** in custom services and custom DB columns. The plugin is unaware of `parentId` — it treats every org as a flat peer.

If "active path" semantics are needed (e.g., breadcrumb showing `ACME > West Region > California Chapter`), store the resolved path in a separate field or derive it client-side from the tree data.

---

## 6. Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Unbounded recursion in tree queries | High | Enforce `MAX_DEPTH` at write time; add `depth` column |
| Permission inheritance complexity | High | Start with **no inheritance** (each level independently membered); add inheritance in a follow-up phase |
| Circular parent references | Medium | Validate that `parentId` is not a descendant of the org being updated |
| Slug uniqueness conflicts | Low | Keep global uniqueness for now; revisit if UX requires path-scoped slugs |
| `activeOrganizationId` ambiguity | Medium | Document that `setActive` always targets a leaf or any node; ancestors are derived client-side |
| better-auth plugin upgrade breaking custom columns | Low | Custom columns are additive; plugin only reads its own schema |

---

## 7. Confidence

**0.93** — Analysis is based on direct inspection of:
- `src/database/migrations/001_initial_schema.sql` (DB schema)
- `src/auth.ts` (better-auth plugin config)
- `src/platform-admin/services/admin-organizations.service.ts` (all org queries)
- `src/features/Admin/views/OrganizationsPage.tsx` (frontend UI)
- `src/shared/components/OrganizationSwitcher.tsx` (org switcher)
- `src/features/Admin/hooks/useOrganizations.ts` (all hooks)
- better-auth v1.4.3 package source (no nested org support confirmed)
