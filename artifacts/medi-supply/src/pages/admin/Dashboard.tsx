import { Link } from "wouter";
import { useGetAdminStats } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Users, Package, ShoppingCart, CheckCircle, Clock, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "User Verification", href: "/admin/users" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Stock Count", href: "/admin/stock-count" },
  { label: "All Users", href: "/admin/all-users" },
  { label: "Chats", href: "/admin/chats" },
];

export default function AdminDashboard() {
  const { data: stats, isLoading, error, refetch } = useGetAdminStats();

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview and management</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Failed to load dashboard data</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as any)?.message || "Could not fetch admin stats. Please try again."}
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Buyers", value: stats.totalBuyers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Total Vendors", value: stats.totalVendors, icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
                { label: "Pending Users", value: stats.pendingUsers, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", href: "/admin/users" },
                { label: "Total Products", value: stats.totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Pending Products", value: stats.pendingProducts, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", href: "/admin/products" },
                { label: "Verified Products", value: stats.verifiedProducts, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Active Orders", value: stats.pendingOrders, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/orders" },
                { label: "Fulfilled Orders", value: stats.fulfilledOrders, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
              ].map(({ label, value, icon: Icon, color, bg, href }) => {
                const card = (
                  <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
                    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={label} href={href}>{card}</Link>
                ) : (
                  <div key={label}>{card}</div>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Review Pending Users", href: "/admin/users", count: stats.pendingUsers, color: "text-yellow-600" },
                  { label: "Verify Products", href: "/admin/products", count: stats.pendingProducts, color: "text-orange-600" },
                  { label: "Manage Orders", href: "/admin/orders", count: stats.pendingOrders, color: "text-blue-600" },
                  { label: "All Users", href: "/admin/all-users", count: stats.totalBuyers + stats.totalVendors, color: "text-purple-600" },
                ].map(({ label, href, count, color }) => (
                  <Link key={href} href={href}>
                    <div className="border border-border rounded-lg p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                      <p className="text-xs font-medium mb-1">{label}</p>
                      <p className={`text-lg font-bold ${color}`}>{count}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No data available.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
