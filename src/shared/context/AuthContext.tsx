import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthState, LoginCredentials, SignupCredentials } from "@features/Auth/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function apiRequest<T>(url: string, method: string, body?: unknown): Promise<T> {
    const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE_URL}${url}`, options);
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || "Request failed");
    }
    return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const session = await apiRequest<{ user: User }>("/me", "GET");
            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
            }
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        const response = await apiRequest<{ user: User }>("/api/auth/sign-in/email", "POST", {
            email: credentials.email,
            password: credentials.password,
        });

        if (response?.user) {
            setUser(response.user);
            setIsAuthenticated(true);
        }
    };

    const signup = async (credentials: SignupCredentials) => {
        const response = await apiRequest<{ user: User }>("/api/auth/sign-up/email", "POST", {
            name: credentials.name,
            email: credentials.email,
            password: credentials.password,
        });

        if (response?.user) {
            setUser(response.user);
            setIsAuthenticated(true);
        }
    };

    const logout = async () => {
        try {
            await apiRequest("/api/auth/sign-out", "POST");
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
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
