import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthState, LoginCredentials, SignupCredentials } from "@features/Auth/types";

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Failed to parse stored user:", error);
                localStorage.removeItem("auth_user");
            }
        }
    }, []);

    const login = async (credentials: LoginCredentials) => {
        // Mock login - in real app, this would call an API
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockUser: User = {
            id: "1",
            name: credentials.email.split("@")[0],
            email: credentials.email,
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem("auth_user", JSON.stringify(mockUser));
    };

    const signup = async (credentials: SignupCredentials) => {
        // Mock signup - in real app, this would call an API
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockUser: User = {
            id: Date.now().toString(),
            name: credentials.name,
            email: credentials.email,
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem("auth_user", JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("auth_user");
    };

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
