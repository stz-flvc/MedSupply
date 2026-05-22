import { useState } from "react";
import { useListAdminOrders, useUpdateOrderStatus, getListAdminOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "User Verification", href: "/admin/users" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Stock Count", href: "/admin/stock-count" },
  { label: "All Users", href: "/admin/all-users" },
  { label: "Chats", href: "/admin/chats" },
];

const STATUSES = [
  { value: "received", label: "Received" },
  { value: "confirmed", label: "Confirmed" },
  { value: "proceed_to_pay", label: "Proceed to Pay" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "fulfilled", label: "Fulfilled" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  received: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  proceed_to_pay: "bg-orange-100 text-orange-800 border-orange-200",
  payment_confirmed: "bg-teal-100 text-teal-800 border-teal-200",
  fulfilled: "bg-green-100 text-green-800 border-green-200",
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders = [], isLoading } = useListAdminOrders(statusFilter ? { status: statusFilter } : undefined);

  const filteredOrders = orders.filter((o) => {
    const s = searchQuery.toLowerCase();
    return (
      o.id.toString().includes(s) ||
      (o.buyerCompany?.toLowerCase().includes(s) ?? false) ||
      (o.buyerName?.toLowerCase().includes(s) ?? false) ||
      (o.productName?.toLowerCase().includes(s) ?? false)
    );
  });
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = (id: number, status: string) => {
    setUpdatingId(id);
    updateStatus.mutate(
      { id, data: { status: status as "received" | "confirmed" | "proceed_to_pay" | "payment_confirmed" | "fulfilled" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAdminOrdersQueryKey(statusFilter ? { status: statusFilter } : undefined) });
          toast({ title: status === "proceed_to_pay" ? "Buyer will be notified to pay" : "Order status updated" });
          setUpdatingId(null);
        },
        onError: () => { toast({ title: "Failed to update status", variant: "destructive" }); setUpdatingId(null); },
      }
    );
  };

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Order Management</h1>
            <p className="text-sm text-muted-foreground">Track and update all buyer orders</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, buyer or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full bg-card"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-full bg-card">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            ) : (
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground">{searchQuery ? `No orders matching "${searchQuery}"` : "No orders found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Order #</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Buyer</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Product</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Qty</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">#{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{order.buyerCompany || order.buyerName || `Buyer #${order.buyerId}`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{order.productName || `Product #${order.productId}`}</p>
                      {order.vendorName && <p className="text-xs text-muted-foreground">{order.vendorName}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{order.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">₦{Number(order.totalPrice).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                        {STATUSES.find((s) => s.value === order.status)?.label || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusUpdate(order.id, v)}
                        disabled={updatingId === order.id || order.status === "fulfilled"}
                      >
                        <SelectTrigger className="h-8 text-xs w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
