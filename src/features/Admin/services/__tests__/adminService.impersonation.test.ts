import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockAdminImpersonateUser, mockAdminStopImpersonating, mockFetchWithAuth } = vi.hoisted(() => ({
    mockAdminImpersonateUser: vi.fn(),
    mockAdminStopImpersonating: vi.fn(),
    mockFetchWithAuth: vi.fn(),
}));

vi.mock('@shared/lib/auth-client', () => ({
    admin: {
        impersonateUser: mockAdminImpersonateUser,
        stopImpersonating: mockAdminStopImpersonating,
    },
    organization: {},
}));

vi.mock('@shared/lib/fetch-with-auth', () => ({
    fetchWithAuth: mockFetchWithAuth,
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        _getStore: () => store,
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

import { adminService } from '../adminService';

describe('adminService.impersonateUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    describe('admin path (Better Auth)', () => {
        it('should call admin.impersonateUser for admin role', async () => {
            mockAdminImpersonateUser.mockResolvedValue({ error: null });

            await adminService.impersonateUser('user-1', { role: 'admin' });

            expect(mockAdminImpersonateUser).toHaveBeenCalledWith({ userId: 'user-1' });
            expect(mockFetchWithAuth).not.toHaveBeenCalled();
        });

        it('should default to admin role when no options provided', async () => {
            mockAdminImpersonateUser.mockResolvedValue({ error: null });

            await adminService.impersonateUser('user-1');

            expect(mockAdminImpersonateUser).toHaveBeenCalledWith({ userId: 'user-1' });
        });

        it('should throw on admin impersonation error', async () => {
            mockAdminImpersonateUser.mockResolvedValue({
                error: { message: 'Forbidden' },
            });

            await expect(adminService.impersonateUser('user-1', { role: 'admin' }))
                .rejects.toThrow('Forbidden');
        });
    });

    describe('manager path (org-scoped)', () => {
        it('should call org-scoped endpoint for manager role', async () => {
            mockFetchWithAuth.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ sessionToken: 'new-session-token' }),
            });

            await adminService.impersonateUser('user-1', {
                role: 'manager',
                organizationId: 'org-1',
            });

            expect(mockFetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/api/organization/org-1/impersonate'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ userId: 'user-1' }),
                }),
            );
            expect(mockAdminImpersonateUser).not.toHaveBeenCalled();
        });

        it('should throw when manager has no organizationId', async () => {
            await expect(
                adminService.impersonateUser('user-1', { role: 'manager' }),
            ).rejects.toThrow('Active organization required for manager impersonation');
        });

        it('should save original token before setting new one', async () => {
            localStorageMock.setItem('bearer_token', 'original-token');
            vi.clearAllMocks(); // Clear the setItem call above

            mockFetchWithAuth.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ sessionToken: 'new-session-token' }),
            });

            await adminService.impersonateUser('user-1', {
                role: 'manager',
                organizationId: 'org-1',
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith('original_bearer_token', 'original-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('bearer_token', 'new-session-token');
        });

        it('should throw on org-scoped endpoint error', async () => {
            mockFetchWithAuth.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ message: 'Not a member' }),
            });

            await expect(
                adminService.impersonateUser('user-1', {
                    role: 'manager',
                    organizationId: 'org-1',
                }),
            ).rejects.toThrow('Not a member');
        });
    });
});

describe('adminService.stopImpersonating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    describe('org-scoped stop (original_bearer_token present)', () => {
        it('should call org-scoped stop endpoint and restore original token', async () => {
            localStorageMock.setItem('bearer_token', 'impersonated-token');
            localStorageMock.setItem('original_bearer_token', 'original-token');
            vi.clearAllMocks();

            mockFetchWithAuth.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            await adminService.stopImpersonating();

            expect(mockFetchWithAuth).toHaveBeenCalledWith(
                expect.stringContaining('/api/organization/stop-impersonating'),
                expect.objectContaining({ method: 'POST' }),
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith('bearer_token', 'original-token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('original_bearer_token');
            expect(mockAdminStopImpersonating).not.toHaveBeenCalled();
        });

        it('should throw on org-scoped stop error', async () => {
            localStorageMock.setItem('original_bearer_token', 'original-token');
            vi.clearAllMocks();

            mockFetchWithAuth.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ message: 'Session not found' }),
            });

            await expect(adminService.stopImpersonating()).rejects.toThrow('Session not found');
        });
    });

    describe('admin stop (no original_bearer_token)', () => {
        it('should call admin.stopImpersonating when no original token', async () => {
            mockAdminStopImpersonating.mockResolvedValue({ error: null });

            await adminService.stopImpersonating();

            expect(mockAdminStopImpersonating).toHaveBeenCalled();
            expect(mockFetchWithAuth).not.toHaveBeenCalled();
        });

        it('should throw on admin stop error', async () => {
            mockAdminStopImpersonating.mockResolvedValue({
                error: { message: 'Not impersonating' },
            });

            await expect(adminService.stopImpersonating()).rejects.toThrow('Not impersonating');
        });
    });
});
