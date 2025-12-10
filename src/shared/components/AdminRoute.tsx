import { Navigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";

interface AdminRouteProps {
    children: React.ReactNode;
    fallbackPath?: string;
}

/**
 * Route guard that only allows access to users with admin role.
 * Redirects to fallbackPath (default: "/") if user is not an admin.
 */
export function AdminRoute({ children, fallbackPath = "/" }: AdminRouteProps) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    // Show nothing while checking authentication status
    if (isLoading) {
        return null;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to fallback if not admin
    if (!isAdmin) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <>{children}</>;
}
