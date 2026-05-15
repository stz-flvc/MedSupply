import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

const vendorNav = [
  { label: "My Products", href: "/vendor/products" },
  { label: "Upload Product", href: "/vendor/upload" },
  { label: "Notifications", href: "/vendor/notifications" },
];

export default function VendorNotifications() {
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout navItems={vendorNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unread > 0 && <p className="text-sm text-muted-foreground">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate(undefined, { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) })} className="gap-2">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 h-16 animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-card border rounded-xl p-4 flex items-start gap-3 cursor-pointer ${!n.read ? "border-primary/20 bg-primary/5" : "border-border hover:bg-muted/30"}`}
                onClick={() => {
                  if (!n.read) markRead.mutate({ id: n.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) });
                }}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-primary" : "bg-muted-foreground/30"}`} />
                <div className="flex-1">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
