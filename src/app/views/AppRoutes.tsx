import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import {
  LoginPage,
  SignupPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  SetNewPasswordPage,
  AcceptInvitationPage,
} from "@features/Auth";
import { DashboardPage, SettingsPage, AccountPage } from "@features/Dashboard";
import { UsersPage, SessionsPage, OrganizationsPage, InvitationsPage, RolesPage } from "@features/Admin";
import RootLayout from "./RootLayout";
import { useInitializeApp } from "../hooks/useInitializeApp";
import { ThemeProvider } from "@shared/components/ui";
import { AuthProvider } from "@shared/context/AuthContext";
import { PermissionsProvider } from "@shared/context/PermissionsContext";
import { ProtectedRoute } from "@shared/components/ProtectedRoute";
import { AdminRoute } from "@shared/components/AdminRoute";
import { Toaster } from "@shared/components/ui/sonner";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useInitializeApp();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
          <PermissionsProvider>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/set-new-password" element={<SetNewPasswordPage />} />
              <Route path="/accept-invitation/:invitationId" element={<AcceptInvitationPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RootLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                
                {/* Admin routes */}
                <Route
                  path="admin/users"
                  element={
                    <AdminRoute requiredPermission={{ resource: "user", action: "read" }}>
                      <UsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/sessions"
                  element={
                    <AdminRoute requiredPermission={{ resource: "session", action: "read" }}>
                      <SessionsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/organizations"
                  element={
                    <AdminRoute requiredPermission={{ resource: "organization", action: "read" }}>
                      <OrganizationsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/roles"
                  element={
                    <AdminRoute requiredPermission={{ resource: "role", action: "read" }}>
                      <RolesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/invitations"
                  element={
                    <AdminRoute requiredPermission={{ resource: "organization", action: "read" }}>
                      <InvitationsPage />
                    </AdminRoute>
                  }
                />

                {/* User pages */}
                <Route path="settings" element={<SettingsPage />} />
                <Route path="account" element={<AccountPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PermissionsProvider>
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default AppRoutes;
