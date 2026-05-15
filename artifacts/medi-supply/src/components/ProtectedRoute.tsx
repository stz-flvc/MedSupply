import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "buyer" | "vendor" | "admin";
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (user.status === "pending" || user.status === "rejected") {
    navigate("/pending");
    return null;
  }

  if (user.status === "suspended") {
    navigate("/login");
    return null;
  }

  if (role && user.role !== role) {
    const dashboardRoutes: Record<string, string> = {
      buyer: "/buyer/marketplace",
      vendor: "/vendor/products",
      admin: "/admin",
    };
    navigate(dashboardRoutes[user.role] || "/login");
    return null;
  }

  return <>{children}</>;
}
