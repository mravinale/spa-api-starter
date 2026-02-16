import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useUsers,
  useCreateUser,
  useBanUser,
  useUnbanUser,
  useSetUserRole,
  useUserCapabilities,
  useImpersonateUser,
  useStopImpersonating,
  userKeys,
} from '../useUsers';
import { adminService } from '../../services/adminService';

// Mock the admin service
vi.mock('../../services/adminService', () => ({
  adminService: {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    setRole: vi.fn(),
    getUserCapabilities: vi.fn(),
    setPassword: vi.fn(),
    removeUser: vi.fn(),
    listUserSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllSessions: vi.fn(),
    impersonateUser: vi.fn(),
    stopImpersonating: vi.fn(),
  },
}));

// Get typed mock references
const mockAdminService = adminService as unknown as {
  listUsers: Mock
  createUser: Mock
  banUser: Mock
  unbanUser: Mock
  setRole: Mock
  getUserCapabilities: Mock
};

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUsers hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch users successfully', async () => {
    const mockUsers = {
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com', emailVerified: false, createdAt: new Date(), updatedAt: new Date() },
      ],
      total: 2,
    };

    mockAdminService.listUsers.mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUsers);
    expect(mockAdminService.listUsers).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
    });
  });

  it('should handle fetch error', async () => {
    mockAdminService.listUsers.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useUsers({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create user successfully', async () => {
    const newUser = {
      id: '3',
      name: 'New User',
      email: 'new@example.com',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAdminService.createUser.mockResolvedValue(newUser);

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'member',
      organizationId: 'org-1',
    });

    expect(mockAdminService.createUser).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'member',
      organizationId: 'org-1',
    });
  });
});

describe('useBanUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ban user successfully', async () => {
    mockAdminService.banUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBanUser(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      userId: '1',
      banReason: 'Violation of terms',
    });

    expect(mockAdminService.banUser).toHaveBeenCalledWith({
      userId: '1',
      banReason: 'Violation of terms',
    });
  });
});

describe('useUnbanUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should unban user successfully', async () => {
    mockAdminService.unbanUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUnbanUser(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('1');

    expect(mockAdminService.unbanUser).toHaveBeenCalledWith('1');
  });
});

describe('useSetUserRole hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set user role successfully', async () => {
    mockAdminService.setRole.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSetUserRole(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      userId: '1',
      role: 'admin',
    });

    expect(mockAdminService.setRole).toHaveBeenCalledWith({
      userId: '1',
      role: 'admin',
    });
  });
});

describe('useUserCapabilities hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch capabilities successfully', async () => {
    const capabilities = {
      targetUserId: '1',
      targetRole: 'member',
      isSelf: false,
      actions: {
        update: true,
        setRole: true,
        ban: true,
        unban: true,
        setPassword: true,
        remove: true,
        revokeSessions: true,
        impersonate: true,
      },
    };

    mockAdminService.getUserCapabilities.mockResolvedValue(capabilities);

    const { result } = renderHook(() => useUserCapabilities('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockAdminService.getUserCapabilities).toHaveBeenCalledWith('1');
    expect(result.current.data).toEqual(capabilities);
  });
});

describe('useImpersonateUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminService.impersonateUser with userId, role, and organizationId', async () => {
    (adminService.impersonateUser as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useImpersonateUser(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      userId: 'user-1',
      role: 'manager',
      organizationId: 'org-1',
    });

    expect(adminService.impersonateUser).toHaveBeenCalledWith('user-1', {
      role: 'manager',
      organizationId: 'org-1',
    });
  });

  it('should call adminService.impersonateUser with admin role by default', async () => {
    (adminService.impersonateUser as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useImpersonateUser(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ userId: 'user-1' });

    expect(adminService.impersonateUser).toHaveBeenCalledWith('user-1', {
      role: undefined,
      organizationId: undefined,
    });
  });
});

describe('useStopImpersonating hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminService.stopImpersonating', async () => {
    (adminService.stopImpersonating as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useStopImpersonating(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync();

    expect(adminService.stopImpersonating).toHaveBeenCalled();
  });
});

describe('userKeys', () => {
  it('should generate correct query keys', () => {
    expect(userKeys.all).toEqual(['users']);
    expect(userKeys.lists()).toEqual(['users', 'list']);
    expect(userKeys.list({ limit: 10 })).toEqual(['users', 'list', { limit: 10 }]);
    expect(userKeys.details()).toEqual(['users', 'detail']);
    expect(userKeys.detail('1')).toEqual(['users', 'detail', '1']);
    expect(userKeys.sessions('1')).toEqual(['users', 'sessions', '1']);
    expect(userKeys.capabilities('1')).toEqual(['users', 'capabilities', '1']);
  });
});
