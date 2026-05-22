import { useState } from "react";
import { useListAdminUsers, useSuspendUser, useDeleteUser, getListAdminUsersQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Users, UserX, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  suspended: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminAllUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState<"buyer" | "vendor" | "">("" as "buyer" | "vendor" | "");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: buyers = [] } = useListAdminUsers({ role: "buyer" });
  const { data: vendors = [] } = useListAdminUsers({ role: "vendor" });
  const suspend = useSuspendUser();
  const deleteUser = useDeleteUser();

  const allUsers = roleFilter === "buyer" ? buyers : roleFilter === "vendor" ? vendors : [...buyers, ...vendors];

  const filteredUsers = allUsers.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      (user.fullName?.toLowerCase().includes(search) ?? false) ||
      (user.companyName?.toLowerCase().includes(search) ?? false)
    );
  });

  const users = filteredUsers;

  const handleSuspend = (id: number) => {
    if (!confirm("Suspend this account?")) return;
    suspend.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ role: "buyer" }) });
        qc.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ role: "vendor" }) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "Account suspended" });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Permanently delete this account?")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ role: "buyer" }) });
        qc.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ role: "vendor" }) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "Account deleted" });
      },
    });
  };

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">All Users</h1>
            <p className="text-sm text-muted-foreground">Manage all buyer and vendor accounts</p>
          </div>
          <div className="relative w-full sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-full bg-card"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ label: "All", value: "" }, { label: "Buyers", value: "buyer" }, { label: "Vendors", value: "vendor" }].map(({ label, value }) => (
            <button key={value} onClick={() => setRoleFilter(value as "buyer" | "vendor" | "")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${roleFilter === value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground bg-card"}`}>
              {label}
            </button>
          ))}
        </div>

        {users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name / Company</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{user.companyName || user.fullName || "—"}</p>
                      {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${user.role === "buyer" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${STATUS_COLORS[user.status] || "bg-muted text-muted-foreground"}`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {user.status !== "suspended" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-600" onClick={() => handleSuspend(user.id)}>
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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
