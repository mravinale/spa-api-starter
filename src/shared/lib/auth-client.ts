import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    organizationClient(),
    adminClient(),
  ],
});

// Export the client for direct access
export { authClient as auth };

// Export typed methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  organization,
  admin,
} = authClient;
