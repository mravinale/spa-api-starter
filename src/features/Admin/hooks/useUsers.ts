import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/adminService";
import type {
    UserFilterParams,
    CreateUserParams,
    UpdateUserParams,
    BanUserParams,
    SetRoleParams,
    SetPasswordParams,
} from "../types";

// Query keys
export const userKeys = {
    all: ["users"] as const,
    lists: () => [...userKeys.all, "list"] as const,
    list: (params: UserFilterParams) => [...userKeys.lists(), params] as const,
    details: () => [...userKeys.all, "detail"] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
    sessions: (userId: string) => [...userKeys.all, "sessions", userId] as const,
};

/**
 * Hook to fetch paginated list of users with server-side filtering.
 */
export function useUsers(params: UserFilterParams = {}) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => adminService.listUsers(params),
    });
}

/**
 * Hook to fetch user sessions.
 */
export function useUserSessions(userId: string) {
    return useQuery({
        queryKey: userKeys.sessions(userId),
        queryFn: () => adminService.listUserSessions(userId),
        enabled: !!userId,
    });
}

/**
 * Hook to create a new user.
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateUserParams) => adminService.createUser(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to update a user.
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: UpdateUserParams) => adminService.updateUser(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to remove a user.
 */
export function useRemoveUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminService.removeUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to bulk remove multiple users.
 */
export function useRemoveUsers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userIds: string[]) => adminService.removeUsers(userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to ban a user.
 */
export function useBanUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: BanUserParams) => adminService.banUser(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to unban a user.
 */
export function useUnbanUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminService.unbanUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to set a user's role.
 */
export function useSetUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: SetRoleParams) => adminService.setRole(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
}

/**
 * Hook to set a user's password.
 */
export function useSetUserPassword() {
    return useMutation({
        mutationFn: (params: SetPasswordParams) => adminService.setPassword(params),
    });
}

/**
 * Hook to revoke a user session.
 */
export function useRevokeSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionToken: string) => adminService.revokeSession(sessionToken),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * Hook to revoke all user sessions.
 */
export function useRevokeAllSessions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminService.revokeAllSessions(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * Hook to impersonate a user.
 */
export function useImpersonateUser() {
    return useMutation({
        mutationFn: (params: { userId: string; role?: string; organizationId?: string }) =>
            adminService.impersonateUser(params.userId, { role: params.role, organizationId: params.organizationId }),
    });
}

/**
 * Hook to stop impersonating.
 */
export function useStopImpersonating() {
    return useMutation({
        mutationFn: () => adminService.stopImpersonating(),
    });
}
