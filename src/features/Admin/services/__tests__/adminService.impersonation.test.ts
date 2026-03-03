import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
    mockAdminImpersonateUser,
    mockAdminStopImpersonating,
    mockAdminStopOrgImpersonating,
    mockFetchWithAuth,
} = vi.hoisted(() => ({
    mockAdminImpersonateUser: vi.fn(),
    mockAdminStopImpersonating: vi.fn(),
    mockAdminStopOrgImpersonating: vi.fn(),
    mockFetchWithAuth: vi.fn(),
}));

vi.mock('@shared/lib/auth-client', () => ({
    admin: {
        impersonateUser: mockAdminImpersonateUser,
        stopImpersonating: mockAdminStopImpersonating,
        stopOrgImpersonating: mockAdminStopOrgImpersonating,
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

        it('should preserve original bearer token for admin stop flow', async () => {
            localStorageMock.setItem('bearer_token', 'original-admin-token');
            vi.clearAllMocks();
            mockAdminImpersonateUser.mockResolvedValue({ error: null });

            await adminService.impersonateUser('user-1', { role: 'admin' });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'original_bearer_token',
                'original-admin-token',
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith('impersonation_mode', 'admin');
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
            expect(localStorageMock.setItem).toHaveBeenCalledWith('impersonation_mode', 'org');
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

        it('should throw when org-scoped response has no sessionToken — covers line 319', async () => {
            mockFetchWithAuth.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await expect(
                adminService.impersonateUser('user-1', {
                    role: 'manager',
                    organizationId: 'org-1',
                }),
            ).rejects.toThrow('Missing impersonation session token');
        });
    });
});

describe('adminService.stopImpersonating — additional branch coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('throws on non-missing-session admin stop error — covers line 343', async () => {
        localStorageMock.setItem('original_bearer_token', 'original-token');
        localStorageMock.setItem('impersonation_mode', 'admin');
        vi.clearAllMocks();
        mockAdminStopImpersonating.mockResolvedValue({
            error: { code: 'UNEXPECTED_ERROR', message: 'Unexpected server error' },
        });

        await expect(adminService.stopImpersonating()).rejects.toThrow('Unexpected server error');
    });

    it('throws when stopOrgImpersonating returns error — covers line 385', async () => {
        localStorageMock.setItem('impersonation_mode', 'org');
        vi.clearAllMocks();
        mockAdminStopOrgImpersonating.mockResolvedValue({
            error: { message: 'Stop org impersonating failed' },
        });

        await expect(adminService.stopImpersonating()).rejects.toThrow('Stop org impersonating failed');
    });
});

describe('adminService.stopImpersonating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    describe('admin stop with preserved original token', () => {
        it('should call admin.stopImpersonating and restore original token in one attempt', async () => {
            localStorageMock.setItem('bearer_token', 'impersonated-token');
            localStorageMock.setItem('original_bearer_token', 'original-token');
            localStorageMock.setItem('impersonation_mode', 'admin');
            vi.clearAllMocks();
            mockAdminStopImpersonating.mockResolvedValue({ error: null });

            await adminService.stopImpersonating();

            expect(mockAdminStopImpersonating).toHaveBeenCalledTimes(1);
            expect(mockFetchWithAuth).not.toHaveBeenCalled();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('bearer_token', 'original-token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('original_bearer_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('impersonation_mode');
        });

        it('should restore original token when admin session is already missing', async () => {
            localStorageMock.setItem('bearer_token', 'impersonated-token');
            localStorageMock.setItem('original_bearer_token', 'original-token');
            localStorageMock.setItem('impersonation_mode', 'admin');
            vi.clearAllMocks();
            mockAdminStopImpersonating.mockResolvedValue({
                error: { code: 'FAILED_TO_FIND_ADMIN_SESSION', message: 'Failed to find admin session' },
            });

            await expect(adminService.stopImpersonating()).resolves.toBeUndefined();

            expect(mockAdminStopImpersonating).toHaveBeenCalledTimes(1);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('bearer_token', 'original-token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('original_bearer_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('impersonation_mode');
        });
    });

    describe('org-scoped stop (original_bearer_token present)', () => {
        it('should call org-scoped stop endpoint and restore original token', async () => {
            localStorageMock.setItem('bearer_token', 'impersonated-token');
            localStorageMock.setItem('original_bearer_token', 'original-token');
            localStorageMock.setItem('impersonation_mode', 'org');
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
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('impersonation_mode');
            expect(mockAdminStopImpersonating).not.toHaveBeenCalled();
        });

        it('should throw on non-recoverable org-scoped stop error', async () => {
            localStorageMock.setItem('original_bearer_token', 'original-token');
            localStorageMock.setItem('impersonation_mode', 'org');
            vi.clearAllMocks();

            mockFetchWithAuth.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'Internal error', statusCode: 500 }),
            });

            await expect(adminService.stopImpersonating()).rejects.toThrow('Internal error');
        });

        it('should fallback to local token restore for legacy sessions without mode metadata', async () => {
            localStorageMock.setItem('bearer_token', 'impersonated-token');
            localStorageMock.setItem('original_bearer_token', 'original-token');
            vi.clearAllMocks();

            mockFetchWithAuth.mockResolvedValue({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ message: 'Session not found', statusCode: 404 }),
            });

            await expect(adminService.stopImpersonating()).resolves.toBeUndefined();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('bearer_token', 'original-token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('original_bearer_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('impersonation_mode');
        });
    });

    describe('admin stop (no original_bearer_token)', () => {
        it('should call admin.stopOrgImpersonating when mode is org and clear mode', async () => {
            localStorageMock.setItem('impersonation_mode', 'org');
            vi.clearAllMocks();
            mockAdminStopOrgImpersonating.mockResolvedValue({ error: null });

            await adminService.stopImpersonating();

            expect(mockAdminStopOrgImpersonating).toHaveBeenCalledTimes(1);
            expect(mockAdminStopImpersonating).not.toHaveBeenCalled();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('impersonation_mode');
        });

        it('should warn and clear mode when mode is org but stopOrgImpersonating is unavailable', async () => {
            localStorageMock.setItem('impersonation_mode', 'org');
            vi.clearAllMocks();
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            const authClient = await import('@shared/lib/auth-client');
            const adminObj = authClient.admin as unknown as Record<string, unknown>;
            const originalStopOrgImpersonating = adminObj.stopOrgImpersonating;
            delete adminObj.stopOrgImpersonating;

            try {
                await adminService.stopImpersonating();

                expect(mockAdminStopImpersonating).not.toHaveBeenCalled();
                expect(warnSpy).toHaveBeenCalledWith(
                    '[Impersonation] org stop requested without original token, but admin.stopOrgImpersonating is unavailable; clearing local mode only.',
                );
                expect(localStorageMock.removeItem).toHaveBeenCalledWith('impersonation_mode');
            } finally {
                adminObj.stopOrgImpersonating = originalStopOrgImpersonating;
                warnSpy.mockRestore();
            }
        });

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
