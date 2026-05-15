import React from "react";
import { Link, useLocation } from "wouter";
import { Bell, LogOut, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useGetAdminStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";

interface NavItem {
  label: string;
  href: string;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardLayout({ navItems, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const qc = useQueryClient();
  const { data: notifications = [] } = useListNotifications();
  const isAdmin = user?.role === "admin";
  const { data: adminStats } = useGetAdminStats({ query: { enabled: isAdmin, queryKey: ["/api/admin/stats"] as const } });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = notifications.filter((n) => !n.read);

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const displayName = user?.companyName || user?.fullName || user?.email || "";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">MedSupply</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isRootPath = item.href === '/admin' || item.href === '/vendor' || item.href === '/buyer';
            const isActive = isRootPath ? location === item.href : location.startsWith(item.href);
            
            // Notification badge logic per role
            let showBadge = false;

            // Admin: pending items needing review
            if (user?.role === "admin") {
              if (item.label === "User Verification" && (adminStats?.pendingUsers ?? 0) > 0) showBadge = true;
              if (item.label === "Products" && (adminStats?.pendingProducts ?? 0) > 0) showBadge = true;
              if (item.label === "Orders" && (adminStats?.pendingOrders ?? 0) > 0) showBadge = true;
            }

            // Buyer: unread notifications or payment-required alerts
            if (user?.role === "buyer") {
              if (item.label === "Notifications" && unread.length > 0) showBadge = true;
              if (item.label === "My Orders" && unread.some((n) => n.type === "payment_required")) showBadge = true;
            }

            // Vendor: unread notifications or product status updates
            if (user?.role === "vendor") {
              if (item.label === "Notifications" && unread.length > 0) showBadge = true;
              if (item.label === "My Products" && unread.some((n) => n.type === "product_verified" || n.type === "product_rejected")) showBadge = true;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{item.label}</span>
                {showBadge && (
                  <span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/90 backdrop-blur-sm flex items-center justify-end flex-shrink-0 z-40 w-full px-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unread.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-none">
                      {unread.length > 9 ? "9+" : unread.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unread.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-auto py-0.5 px-2 text-primary" onClick={handleMarkAll}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                        onClick={() => {
                          if (!n.read) {
                            markRead.mutate(
                              { id: n.id },
                              { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) }
                            );
                          }
                        }}
                      >
                        <span className={`text-xs leading-snug ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>{n.message}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2.5 px-2 hover:bg-muted/50 rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/20">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start mr-1">
                    <span className="text-sm font-medium max-w-[120px] truncate leading-tight">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 p-2">
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer py-2 focus:bg-destructive focus:text-destructive-foreground mt-1" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
