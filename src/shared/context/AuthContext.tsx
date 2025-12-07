import React, { createContext, useContext } from "react";
import type { User, AuthState, LoginCredentials, SignupCredentials } from "@features/Auth/types";
import { useSession, signIn, signUp, signOut } from "@shared/lib/auth-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AuthContextType extends AuthState {
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    sendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Use Better Auth's useSession hook
    const { data: session, isPending: isLoading } = useSession();

    const user: User | null = session?.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    } : null;

    const isAuthenticated = !!session?.user;

    const login = async (credentials: LoginCredentials) => {
        const result = await signIn.email({
            email: credentials.email,
            password: credentials.password,
        });

        if (result.error) {
            throw new Error(result.error.message || "Login failed");
        }
    };

    const signup = async (credentials: SignupCredentials) => {
        const result = await signUp.email({
            name: credentials.name,
            email: credentials.email,
            password: credentials.password,
        });

        if (result.error) {
            throw new Error(result.error.message || "Signup failed");
        }
    };

    const logout = async () => {
        await signOut();
    };

    const forgotPassword = async (email: string) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email,
                redirectTo: `${window.location.origin}/set-new-password`,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || "Failed to send reset email");
        }
    };

    const resetPassword = async (token: string, newPassword: string) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ token, newPassword }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || "Failed to reset password");
        }
    };

    const sendVerificationEmail = async (email: string) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/send-verification-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || "Failed to send verification email");
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                signup,
                logout,
                forgotPassword,
                resetPassword,
                sendVerificationEmail,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
