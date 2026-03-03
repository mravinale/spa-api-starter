import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { rbacService } from "@features/Admin/services/rbacService";
import { useAuth } from "./AuthContext";

interface PermissionsContextType {
    permissions: string[];
    isLoading: boolean;
    can: (resource: string, action: string) => boolean;
    refetchPermissions: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const permissionsQueryKey = ["rbac", "my-permissions"] as const;

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isAdminOrManager } = useAuth();
    const queryClient = useQueryClient();

    const { data: permissions = [], isLoading } = useQuery({
        queryKey: [...permissionsQueryKey, user?.id ?? "anonymous", user?.role ?? "member"],
        queryFn: () => rbacService.getMyPermissions(),
        enabled: isAuthenticated && isAdminOrManager,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const permissionSet = useMemo(() => new Set(permissions), [permissions]);

    const can = useCallback(
        (resource: string, action: string): boolean => {
            if (!isAuthenticated || !isAdminOrManager) return false;
            if (isLoading) return false;
            return permissionSet.has(`${resource}:${action}`);
        },
        [isAuthenticated, isAdminOrManager, isLoading, permissionSet],
    );

    const refetchPermissions = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: permissionsQueryKey });
    }, [queryClient]);

    const value: PermissionsContextType = useMemo(
        () => ({ permissions, isLoading, can, refetchPermissions }),
        [permissions, isLoading, can, refetchPermissions],
    );

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissionsContext() {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error("usePermissionsContext must be used within a PermissionsProvider");
    }
    return context;
}
