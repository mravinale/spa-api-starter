import { Navigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { RouteGuardLoading } from "@shared/components/RouteGuardLoading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <RouteGuardLoading />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
