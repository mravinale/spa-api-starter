import { admin, organization } from "@shared/lib/auth-client";
import type {
    AdminUser,
    UserSession,
    UserFilterParams,
    CreateUserParams,
    UpdateUserParams,
    BanUserParams,
    SetRoleParams,
    SetPasswordParams,
    PaginatedResponse,
} from "../types";

/**
 * Admin service for user management operations.
 * Wraps Better Auth admin client methods.
 */
export const adminService = {
    // ============ User Operations ============

    /**
     * List all users with optional filtering and pagination.
     */
    async listUsers(params: UserFilterParams = {}): Promise<PaginatedResponse<AdminUser>> {
        const { data, error } = await admin.listUsers({
            query: {
                limit: params.limit ?? 10,
                offset: params.offset ?? 0,
                sortBy: params.sortBy,
                sortDirection: params.sortDirection,
                searchValue: params.searchValue,
                searchField: params.searchField,
                searchOperator: params.searchOperator,
                filterField: params.filterField,
                filterValue: params.filterValue,
                filterOperator: params.filterOperator,
            },
        });

        if (error) {
            throw new Error(error.message || "Failed to list users");
        }

        return {
            data: (data?.users ?? []) as unknown as AdminUser[],
            total: data?.total ?? 0,
            limit: "limit" in (data ?? {}) ? (data as { limit?: number }).limit : undefined,
            offset: "offset" in (data ?? {}) ? (data as { offset?: number }).offset : undefined,
        };
    },

    /**
     * Create a new user.
     */
    async createUser(params: CreateUserParams): Promise<AdminUser> {
        const { data, error } = await admin.createUser({
            email: params.email,
            password: params.password,
            name: params.name,
            role: params.role as "user" | "admin" | undefined,
            data: params.data,
        });

        if (error) {
            throw new Error(error.message || "Failed to create user");
        }

        // The response contains { user: ... }
        const userData = data as unknown as { user?: AdminUser } | AdminUser;
        return "user" in userData ? userData.user as AdminUser : userData as AdminUser;
    },

    /**
     * Update a user's details.
     */
    async updateUser(params: UpdateUserParams): Promise<AdminUser> {
        const { data, error } = await admin.updateUser({
            userId: params.userId,
            data: params.data,
        });

        if (error) {
            throw new Error(error.message || "Failed to update user");
        }

        const userData = data as unknown as { user?: AdminUser } | AdminUser;
        return "user" in userData ? userData.user as AdminUser : userData as AdminUser;
    },

    /**
     * Remove (delete) a user.
     */
    async removeUser(userId: string): Promise<void> {
        const { error } = await admin.removeUser({ userId });

        if (error) {
            throw new Error(error.message || "Failed to remove user");
        }
    },

    /**
     * Ban a user.
     */
    async banUser(params: BanUserParams): Promise<void> {
        const { error } = await admin.banUser({
            userId: params.userId,
            banReason: params.banReason,
            banExpiresIn: params.banExpiresIn,
        });

        if (error) {
            throw new Error(error.message || "Failed to ban user");
        }
    },

    /**
     * Unban a user.
     */
    async unbanUser(userId: string): Promise<void> {
        const { error } = await admin.unbanUser({ userId });

        if (error) {
            throw new Error(error.message || "Failed to unban user");
        }
    },

    /**
     * Set a user's role.
     */
    async setRole(params: SetRoleParams): Promise<void> {
        const { error } = await admin.setRole({
            userId: params.userId,
            role: params.role as "user" | "admin" | ("user" | "admin")[],
        });

        if (error) {
            throw new Error(error.message || "Failed to set user role");
        }
    },

    /**
     * Set a user's password.
     */
    async setPassword(params: SetPasswordParams): Promise<void> {
        const { error } = await admin.setUserPassword({
            userId: params.userId,
            newPassword: params.newPassword,
        });

        if (error) {
            throw new Error(error.message || "Failed to set user password");
        }
    },

    // ============ Session Operations ============

    /**
     * List all sessions for a user.
     */
    async listUserSessions(userId: string): Promise<UserSession[]> {
        const { data, error } = await admin.listUserSessions({ userId });

        if (error) {
            throw new Error(error.message || "Failed to list user sessions");
        }

        const sessionsData = data as unknown as { sessions?: UserSession[] } | UserSession[];
        return Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions ?? []);
    },

    /**
     * Revoke a specific session.
     */
    async revokeSession(sessionToken: string): Promise<void> {
        const { error } = await admin.revokeUserSession({ sessionToken });

        if (error) {
            throw new Error(error.message || "Failed to revoke session");
        }
    },

    /**
     * Revoke all sessions for a user.
     */
    async revokeAllSessions(userId: string): Promise<void> {
        const { error } = await admin.revokeUserSessions({ userId });

        if (error) {
            throw new Error(error.message || "Failed to revoke all sessions");
        }
    },

    // ============ Impersonation ============

    /**
     * Impersonate a user.
     */
    async impersonateUser(userId: string): Promise<void> {
        const { error } = await admin.impersonateUser({ userId });

        if (error) {
            throw new Error(error.message || "Failed to impersonate user");
        }
    },

    /**
     * Stop impersonating a user.
     */
    async stopImpersonating(): Promise<void> {
        const { error } = await admin.stopImpersonating();

        if (error) {
            throw new Error(error.message || "Failed to stop impersonating");
        }
    },

    // ============ Permission Checking ============

    /**
     * Check if a user has specific permissions.
     * This fetches the user to get their role, then checks permissions client-side.
     */
    async hasPermission(params: {
        userId: string;
        permissions: Record<string, string[]>;
    }): Promise<{ hasPermission: boolean }> {
        // Fetch user to get their role
        const { data, error } = await admin.listUsers({
            query: {
                limit: 1,
                filterField: "id",
                filterValue: params.userId,
            },
        });

        if (error) {
            throw new Error(error.message || "Failed to check permission");
        }

        const user = data?.users?.[0];
        if (!user) {
            return { hasPermission: false };
        }

        // Admin role has all permissions
        if (user.role === "admin") {
            return { hasPermission: true };
        }

        // For other roles, we would check against the RBAC config
        // For now, return false for non-admin users
        return { hasPermission: false };
    },
};

/**
 * Organization service for organization management operations.
 * Wraps Better Auth organization client methods.
 */
export const organizationService = {
    /**
     * List all organizations for the current user.
     */
    async listOrganizations() {
        const { data, error } = await organization.list();

        if (error) {
            throw new Error(error.message || "Failed to list organizations");
        }

        return data ?? [];
    },

    /**
     * Create a new organization.
     */
    async createOrganization(params: { name: string; slug: string; logo?: string; metadata?: Record<string, unknown> }) {
        const { data, error } = await organization.create({
            name: params.name,
            slug: params.slug,
            logo: params.logo,
            metadata: params.metadata,
        });

        if (error) {
            throw new Error(error.message || "Failed to create organization");
        }

        return data;
    },

    /**
     * Get full organization details.
     */
    async getOrganization(organizationId: string) {
        const { data, error } = await organization.getFullOrganization({
            query: { organizationId },
        });

        if (error) {
            throw new Error(error.message || "Failed to get organization");
        }

        return data;
    },

    /**
     * Update an organization.
     */
    async updateOrganization(organizationId: string, data: { name?: string; slug?: string; logo?: string; metadata?: Record<string, unknown> }) {
        const { data: result, error } = await organization.update({
            organizationId,
            data,
        });

        if (error) {
            throw new Error(error.message || "Failed to update organization");
        }

        return result;
    },

    /**
     * Delete an organization.
     */
    async deleteOrganization(organizationId: string) {
        const { error } = await organization.delete({ organizationId });

        if (error) {
            throw new Error(error.message || "Failed to delete organization");
        }
    },

    /**
     * List members of an organization.
     */
    async listMembers(organizationId: string) {
        const { data, error } = await organization.listMembers({
            query: { organizationId },
        });

        if (error) {
            throw new Error(error.message || "Failed to list members");
        }

        return data ?? [];
    },

    /**
     * Invite a member to an organization.
     */
    async inviteMember(params: { organizationId: string; email: string; role: string }) {
        const { data, error } = await organization.inviteMember({
            organizationId: params.organizationId,
            email: params.email,
            role: params.role as "admin" | "member" | "owner",
        });

        if (error) {
            throw new Error(error.message || "Failed to invite member");
        }

        return data;
    },

    /**
     * Remove a member from an organization.
     */
    async removeMember(params: { organizationId: string; memberIdOrEmail: string }) {
        const { error } = await organization.removeMember({
            organizationId: params.organizationId,
            memberIdOrEmail: params.memberIdOrEmail,
        });

        if (error) {
            throw new Error(error.message || "Failed to remove member");
        }
    },

    /**
     * Update a member's role.
     */
    async updateMemberRole(params: { organizationId: string; memberId: string; role: string | string[] }) {
        const { error } = await organization.updateMemberRole({
            organizationId: params.organizationId,
            memberId: params.memberId,
            role: params.role as "admin" | "member" | "owner" | ("admin" | "member" | "owner")[],
        });

        if (error) {
            throw new Error(error.message || "Failed to update member role");
        }
    },

    /**
     * List invitations for an organization.
     */
    async listInvitations(organizationId: string) {
        const { data, error } = await organization.listInvitations({
            query: { organizationId },
        });

        if (error) {
            throw new Error(error.message || "Failed to list invitations");
        }

        return data ?? [];
    },

    /**
     * Cancel an invitation.
     */
    async cancelInvitation(invitationId: string) {
        const { error } = await organization.cancelInvitation({ invitationId });

        if (error) {
            throw new Error(error.message || "Failed to cancel invitation");
        }
    },

    /**
     * Check if a slug is available.
     */
    async checkSlug(slug: string) {
        const { data, error } = await organization.checkSlug({ slug });

        if (error) {
            throw new Error(error.message || "Failed to check slug");
        }

        return data;
    },

    /**
     * Set active organization.
     */
    async setActive(organizationId: string) {
        const { error } = await organization.setActive({ organizationId });

        if (error) {
            throw new Error(error.message || "Failed to set active organization");
        }
    },

    /**
     * Accept an invitation to join an organization.
     */
    async acceptInvitation(invitationId: string) {
        const { data, error } = await organization.acceptInvitation({ invitationId });

        if (error) {
            throw new Error(error.message || "Failed to accept invitation");
        }

        return data;
    },

    /**
     * Reject an invitation to join an organization.
     */
    async rejectInvitation(invitationId: string) {
        const { error } = await organization.rejectInvitation({ invitationId });

        if (error) {
            throw new Error(error.message || "Failed to reject invitation");
        }
    },

    /**
     * Get invitation details by ID.
     */
    async getInvitation(invitationId: string) {
        const { data, error } = await organization.getInvitation({
            query: { id: invitationId },
        });

        if (error) {
            throw new Error(error.message || "Failed to get invitation");
        }

        return data;
    },

    /**
     * List all invitations for the current user.
     */
    async listUserInvitations() {
        const { data, error } = await organization.listUserInvitations();

        if (error) {
            throw new Error(error.message || "Failed to list user invitations");
        }

        return data ?? [];
    },

    /**
     * Get the current user's active member details.
     */
    async getActiveMember() {
        const { data, error } = await organization.getActiveMember();

        if (error) {
            throw new Error(error.message || "Failed to get active member");
        }

        return data;
    },

    /**
     * Get the current user's role in the active organization.
     */
    async getActiveMemberRole() {
        const { data, error } = await organization.getActiveMemberRole();

        if (error) {
            throw new Error(error.message || "Failed to get active member role");
        }

        return data;
    },

    /**
     * Leave an organization.
     */
    async leaveOrganization(organizationId: string) {
        const { error } = await organization.leave({ organizationId });

        if (error) {
            throw new Error(error.message || "Failed to leave organization");
        }
    },

};
