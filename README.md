# 🚀 React SPA API Starter with Better Auth

A modern, production-ready React Single Page Application (SPA) starter template built with **Vite**, **TypeScript**, **Better Auth**, and a **feature-folder architecture**. This project demonstrates best practices for scalable frontend applications with complete authentication.

> 📖 **Based on:** [How to structure a React App in 2025 (SPA, SSR or Native)](https://ramonprata.medium.com/how-to-structure-a-react-app-in-2025-spa-ssr-or-native-10d8de7a245a)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Technology Stack](#-technology-stack)
- [Authentication](#-authentication)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [E2E Testing](#-e2e-testing)
- [Creating a New Feature](#-creating-a-new-feature)
- [Development Guidelines](#-development-guidelines)
- [Available Scripts](#-available-scripts)

---

## ✨ Features

- **Complete Authentication** — Login, signup, email verification, password reset
- **Better Auth Integration** — Modern auth client with React hooks
- **Protected Routes** — Automatic redirect for unauthenticated users
- **Session Management** — Secure httpOnly cookie-based sessions
- **Feature-Folder Architecture** — Scalable and maintainable structure
- **Modern UI** — Tailwind CSS with shadcn/ui components
- **E2E Testing** — Playwright tests for all auth flows
- **Type Safety** — Full TypeScript support

---

## 🏃 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or **yarn** / **pnpm**)
- **Backend API** — [nestjs-api-starter](../nestjs-api-starter) running on port 3000

### 1. Start the Backend API

First, ensure the backend API is running:

```bash
cd ../nestjs-api-starter
npm install
npm run start:dev
```

### 2. Install and Run Frontend

```bash
# Clone the repository
git clone <your-repo-url>
cd spa-api-starter

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at **http://localhost:5173**

### 3. Configure Environment (Optional)

Create a `.env` file if you need to customize the API URL:

```env
VITE_API_URL=http://localhost:3000
```

### Build for Production

```bash
# Type-check and build
npm run build

# Preview production build
npm run preview
```

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 7.x | Build tool & dev server |
| **Better Auth** | 1.x | Authentication client |
| **React Router** | 7.x | Client-side routing |
| **TanStack Query** | 5.x | Server state management |
| **Zustand** | 5.x | Client state management |
| **Tailwind CSS** | 4.x | Styling |
| **shadcn/ui** | - | UI components |
| **Playwright** | 1.x | E2E testing |

### Dev Dependencies

- **ESLint** — Code linting with TypeScript support
- **Playwright** — End-to-end testing
- **vite-tsconfig-paths** — TypeScript path aliases in Vite

---

## 🔐 Authentication

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Signup  │────▶│  Email   │────▶│  Verify  │────▶│  Login   │
│  /signup │     │  Sent    │     │  /verify │     │  /login  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Forgot  │────▶│  Reset   │────▶│  Set New │────▶│Dashboard │
│ /forgot  │     │  Email   │     │ /set-new │     │    /     │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### Auth Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `LoginPage` | User login |
| `/signup` | `SignupPage` | User registration |
| `/verify-email` | `VerifyEmailPage` | Email verification |
| `/forgot-password` | `ForgotPasswordPage` | Request password reset |
| `/set-new-password` | `SetNewPasswordPage` | Set new password |

### Using Authentication

```tsx
import { useAuth } from "@shared/context/AuthContext";

function MyComponent() {
  const { 
    user,           // Current user or null
    isAuthenticated,// Boolean
    isLoading,      // Loading state
    login,          // Login function
    signup,         // Signup function
    logout,         // Logout function
    forgotPassword, // Request password reset
    resetPassword,  // Reset password with token
  } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <div>Welcome, {user?.name}!</div>;
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from "@shared/components/ProtectedRoute";

// In your routes
<Route
  path="/"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Better Auth Client

The auth client is configured in `src/shared/lib/auth-client.ts`:

```tsx
import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  plugins: [
    organizationClient(),
    adminClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## 🏗️ Architecture Overview

This project follows a **simplified feature-folder architecture** where each feature is self-contained with its own components, logic, and state - without excessive abstraction layers.

### Core Principles

1. **Feature Independence** - Features are loosely coupled and highly cohesive
2. **Pragmatic Simplification** - No unnecessary abstractions
3. **Type Safety** - Strict TypeScript throughout
4. **Scalability** - Easy to add new features without affecting existing ones

### Data Flow (Simplified)

```
┌─────────────────┐
│  UI Component   │ ← Presentation Layer
└────────┬────────┘
         │ (React Query Hook)
         ▼
┌─────────────────┐
│ ProductsService │ ← Service Layer (API calls + transformations)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Axios Client  │ ← Network Layer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │
└─────────────────┘
```

### State Management Strategy

- **Server State** (TanStack Query): API data, caching, background updates
- **Client State** (Zustand): UI state, user preferences - direct stores per feature

---

## 📁 Project Structure

```
spa-api-starter/
├── public/                  # Static assets
├── e2e/                     # Playwright E2E tests
│   └── auth.spec.ts         # Authentication tests
├── src/
│   ├── app/                 # Application layer
│   │   ├── hooks/           # App-level hooks
│   │   ├── utils/           # App-level utilities
│   │   └── views/           # Routing & layout components
│   │       ├── AppRoutes.tsx        # Route configuration
│   │       ├── RootLayout.tsx       # Layout wrapper
│   │       └── styles/              # Global styles
│   │
│   ├── features/            # Feature modules (vertical slices)
│   │   ├── Auth/            # Authentication feature
│   │   │   ├── views/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── SignupPage.tsx
│   │   │   │   ├── VerifyEmailPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   └── SetNewPasswordPage.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── Dashboard/
│   │   └── Products/
│   │
│   └── shared/              # Shared utilities & components
│       ├── api/
│       │   └── client.ts            # Axios client (with credentials)
│       ├── components/
│       │   ├── ui/                  # shadcn/ui components
│       │   └── ProtectedRoute.tsx   # Auth route guard
│       ├── context/
│       │   └── AuthContext.tsx      # Auth context provider
│       ├── lib/
│       │   └── auth-client.ts       # Better Auth React client
│       ├── hooks/
│       ├── store/
│       ├── types/
│       └── utils/
│
├── playwright.config.ts     # Playwright configuration
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Key Directories Explained

#### `/src/app` - Application Layer
- **Purpose**: Application-wide concerns (routing, layouts, initialization)
- **Contains**: Routes, layouts, navigation, app-level hooks
- **When to modify**: Adding new routes, changing global layout

#### `/src/features` - Feature Modules
- **Purpose**: Self-contained feature implementations
- **Contains**: Feature-specific UI, business logic, state, types
- **When to modify**: Adding/modifying features

#### `/src/shared` - Shared Layer
- **Purpose**: Reusable code across features
- **Contains**: API clients, utility functions, shared components, auth context
- **When to modify**: Adding utilities/components used by multiple features

---

## 🧪 E2E Testing

This project uses **Playwright** for end-to-end testing with automatic server startup.

### Running Tests

```bash
# Run all tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in headed mode
npx playwright test --headed

# View test report
npx playwright show-report
```

### Test Configuration

The `playwright.config.ts` automatically starts both servers:

```typescript
webServer: [
  {
    command: 'npm run start:dev',
    cwd: '../nestjs-api-starter',  // Backend API
    url: 'http://localhost:3000/api/auth/ok',
    reuseExistingServer: !process.env.CI,
  },
  {
    command: 'npm run dev',         // Frontend
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
],
```

### Test Coverage

The E2E tests cover all authentication flows:

| Test Suite | Tests |
|------------|-------|
| **Signup Flow** | Display, submit, navigation |
| **Login Flow** | Display, valid login, invalid credentials, unverified email |
| **Forgot Password** | Display, submit, navigation |
| **Set New Password** | Invalid link, form display, validation |
| **Email Verification** | Token handling, error states |
| **Protected Routes** | Redirect unauthenticated users |
| **Logout** | Session termination |

### Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-route');
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

---

## 🎯 Creating a New Feature

Follow this step-by-step guide to create a new feature. We'll use **"Todo"** as an example.

### Step 1: Create Feature Folder Structure

```bash
mkdir -p src/features/Todo/{views,hooks,services,store,types,utils}
```

Your structure should look like:
```
src/features/Todo/
├── views/
├── hooks/
├── services/
├── store/
├── types/
├── utils/
└── index.ts
```

### Step 2: Define TypeScript Types

Create `src/features/Todo/types/ITodo.ts`:

```typescript
// Data Transfer Object (from API)
export interface ITodoDto {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

// View Model (for UI)
export interface ITodoView {
  id: string;
  title: string;
  isCompleted: boolean;
}
```

Create `src/features/Todo/types/ITodoRepository.ts`:

```typescript
import type { ITodoDto } from './ITodo';

export interface ITodoRepository {
  fetchTodos(): Promise<ITodoDto[]>;
  createTodo(todo: Omit<ITodoDto, 'id'>): Promise<ITodoDto>;
}
```

### Step 3: Create Data Mappers

Create `src/features/Todo/utils/todoMappers.ts`:

```typescript
import type { ITodoDto, ITodoView } from '../types/ITodo';

export const todoMappers = {
  getTodos: {
    transform(dtos: ITodoDto[]): ITodoView[] {
      return dtos.map(dto => ({
        id: dto.id.toString(),
        title: dto.title,
        isCompleted: dto.completed
      }));
    }
  }
};
```

### Step 4: Implement Repository (Data Access)

Create `src/features/Todo/services/TodoRepository.ts`:

```typescript
import type { IHttpClient } from '@shared/types/IHttpClient';
import type { ITodoDto } from '../types/ITodo';
import type { ITodoRepository } from '../types/ITodoRepository';

export class TodoRepository implements ITodoRepository {
  constructor(private apiClient: IHttpClient) {}

  async fetchTodos(): Promise<ITodoDto[]> {
    return this.apiClient.get<ITodoDto[]>('/todos');
  }

  async createTodo(todo: Omit<ITodoDto, 'id'>): Promise<ITodoDto> {
    return this.apiClient.post<ITodoDto>('/todos', todo);
  }
}
```

### Step 5: Implement Manager (Business Logic)

Create `src/features/Todo/services/TodoManager.ts`:

```typescript
import type { ITodoView } from '../types/ITodo';
import type { ITodoRepository } from '../types/ITodoRepository';

export class TodoManager {
  constructor(private repository: ITodoRepository) {}

  async getTodos(): Promise<ITodoView[]> {
    const dtos = await this.repository.fetchTodos();
    return todoMappers.getTodos.transform(dtos);
  }

  async addTodo(title: string): Promise<ITodoView> {
    const dto = await this.repository.createTodo({
      title,
      completed: false,
      userId: 1
    });
    return todoMappers.getTodos.transform([dto])[0];
  }
}
```

### Step 6: Wire Up Services

Create `src/features/Todo/services/index.ts`:

```typescript
import { eComApi } from '@shared/api';
import { TodoRepository } from './TodoRepository';
import { TodoManager } from './TodoManager';
import { todoMappers } from '../utils/todoMappers';

const todoRepository = new TodoRepository(eComApi);
const todoManager = new TodoManager(todoRepository, todoMappers);

export default todoManager;
```

### Step 7: Create React Query Hooks

Create `src/features/Todo/hooks/useTodos.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import todoManager from '../services';

export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: () => todoManager.getTodos()
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (title: string) => todoManager.addTodo(title),
    onSuccess: () => {
      // Invalidate and refetch todos
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}
```

### Step 8: Create Zustand Store (Optional)

If you need local state, create `src/features/Todo/store/todoSliceStore.ts`:

```typescript
import type { SetCallback } from '@shared/store';

export interface ITodoState {
  filter: 'all' | 'active' | 'completed';
}

const initialState: ITodoState = {
  filter: 'all'
};

const actions = (set: SetCallback<ITodoState>) => ({
  setFilter: (filter: ITodoState['filter']) =>
    set((state) => {
      state.filter = filter;
    })
});

const slice = (set: SetCallback<ITodoState>) => ({
  ...initialState,
  ...actions(set)
});

export type TTodoActions = ReturnType<typeof actions>;

const todoSliceStore = {
  slice,
  initialState
};

export default todoSliceStore;
```

Then add to global store in `src/shared/store/store.ts`:

```typescript
import todoSliceStore from '@features/Todo/store/todoSliceStore';

export const slices = {
  productsSliceStore: productsSliceStore.slice,
  todoSliceStore: todoSliceStore.slice, // Add this
};
```

### Step 9: Create UI Components

Create `src/features/Todo/views/TodoPage.tsx`:

```typescript
import { useTodos, useAddTodo } from '../hooks/useTodos';
import { useState } from 'react';
import styles from './styles/TodoPage.module.scss';

export default function TodoPage() {
  const { data: todos, isLoading } = useTodos();
  const addTodo = useAddTodo();
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo.mutate(newTodo);
      setNewTodo('');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <main className={styles.todoPage}>
      <h1>Todos</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo..."
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>
            <input type="checkbox" checked={todo.isCompleted} />
            <span>{todo.title}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### Step 10: Create Feature Entry Point

Create `src/features/Todo/index.ts`:

```typescript
export { default as TodoPage } from './views/TodoPage';
```

### Step 11: Add Route

Update `src/app/utils/constants.ts`:

```typescript
export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  TODOS: "/todos", // Add this
};

export const NAVIGATION_TABS = [
  { id: "home", label: "Home", path: ROUTES.HOME },
  { id: "products", label: "Products", path: ROUTES.PRODUCTS },
  { id: "todos", label: "Todos", path: ROUTES.TODOS }, // Add this
];
```

Update `src/app/views/AppRoutes.tsx`:

```typescript
import { TodoPage } from "@features/Todo"; // Add import

// In the Routes component:
<Route path={ROUTES.HOME} element={<RootLayout />}>
  <Route index element={<HomePage />} />
  <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
  <Route path={ROUTES.TODOS} element={<TodoPage />} /> {/* Add this */}
</Route>
```

### Step 12: Create Styles (Optional)

Create `src/features/Todo/views/styles/TodoPage.module.scss`:

```scss
.todoPage {
  padding: 2rem;

  h1 {
    margin-bottom: 1.5rem;
  }

  form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
  }
}
```

### ✅ Done!

You now have a fully functional feature following the project's architecture!

---

## 📚 Development Guidelines

### Naming Conventions

- **Files**: PascalCase for components (`TodoPage.tsx`), camelCase for utilities (`todoMappers.ts`)
- **Folders**: PascalCase for features (`Products/`), camelCase for utilities (`utils/`)
- **Interfaces**: Prefix with `I` (`ITodo`, `ITodoRepository`)
- **Types**: Prefix with `T` (`TProductsActions`)
- **Stores**: Suffix with `Store` (`productsSliceStore`)

### Import Aliases

Use TypeScript path aliases for cleaner imports:

```typescript
// ✅ Good
import { eComApi } from '@shared/api';
import { TodoPage } from '@features/Todo';

// ❌ Avoid
import { eComApi } from '../../../shared/api';
```

### Component Structure

Follow this order in React components:

1. Imports
2. Types/Interfaces
3. Component function
4. Hooks
5. Event handlers
6. Render logic
7. Export

### When to Create a New Feature

Create a new feature folder when:
- The functionality is a distinct domain concept
- It has its own routes/pages
- It needs independent state management
- It's likely to grow in complexity

### When to Use Shared Code

Put code in `/shared` when:
- Multiple features need it
- It's a utility function with no business logic
- It's a reusable UI component
- It's a common type or constant

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Testing
npx playwright test           # Run E2E tests
npx playwright test --ui      # Run with UI
npx playwright show-report    # View test report

# Type checking
npx tsc --noEmit     # Check TypeScript types
```

---

## 🔍 Code Examples

### Making API Calls

```typescript
// In a repository
async fetchData() {
  return this.httpClient.get<DataDto[]>('/endpoint');
}
```

### Using TanStack Query

```typescript
// In a hook
export function useData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: () => dataManager.getData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Using Zustand

```typescript
// In a component
import { useStore } from '@shared/store';

function MyComponent() {
  const favoriteIds = useStore(state => state.favoriteProducts);
  const addFavorite = useStore(state => state.addFavoriteProduct);
  
  return <button onClick={() => addFavorite('123')}>Add</button>;
}
```

---

## 🤝 Contributing

1. Follow the feature-folder structure
2. Maintain type safety (no `any` types)
3. Write meaningful component and function names
4. Use the existing patterns as examples
5. Keep features independent

---

## � Related Projects

- **[nestjs-api-starter](../nestjs-api-starter)** — NestJS backend API for this SPA
- **[Better Auth](https://better-auth.com)** — Authentication library
- **[shadcn/ui](https://ui.shadcn.com)** — UI component library

---

## �📖 Additional Resources

- [Feature-Folder Architecture Article](https://ramonprata.medium.com/how-to-structure-a-react-app-in-2025-spa-ssr-or-native-10d8de7a245a)
- [Better Auth Documentation](https://better-auth.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## 📝 License

MIT
