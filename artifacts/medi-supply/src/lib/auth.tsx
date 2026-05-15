import React, { createContext, useContext, useCallback } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import type { User as ApiUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";

type User = ApiUser & { [key: string]: unknown };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  refetch: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading, refetch } = useGetMe();
  const logoutMutation = useLogout();

  const logout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate("/login");
      },
    });
  }, [logoutMutation, navigate]);

  return (
    <AuthContext.Provider value={{ user: (user as User | undefined) ?? null, isLoading, refetch, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
