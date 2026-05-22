import { useState } from "react";
import { useListAdminUsers, useApproveUser, useRejectUser, getListAdminUsersQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, ChevronRight, Building2, Phone, Mail, FileText, Search } from "lucide-react";
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

type User = {
  id: number; email: string; role: string; status: string;
  fullName?: string | null; companyName?: string | null; companyAddress?: string | null;
  phone?: string | null; businessType?: string | null; cacNumber?: string | null;
  businessLicenseUrl?: string | null; contactPerson?: string | null;
  nafdacLicense?: string | null; importerLicenseUrl?: string | null;
  cacDocumentUrl?: string | null; productCategories?: string[] | null;
  rejectionReason?: string | null; createdAt: string;
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialog, setRejectDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useListAdminUsers({ status: statusFilter });

  const filteredUsers = (users as User[]).filter((u) => {
    const s = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(s) ||
      (u.fullName?.toLowerCase().includes(s) ?? false) ||
      (u.companyName?.toLowerCase().includes(s) ?? false)
    );
  });
  const approve = useApproveUser();
  const reject = useRejectUser();

  const handleApprove = (id: number) => {
    approve.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ status: statusFilter }) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setSelectedUser(null);
        toast({ title: "User approved" });
      },
    });
  };

  const handleReject = () => {
    if (!selectedUser || !rejectReason.trim()) return;
    reject.mutate({ id: selectedUser.id, data: { reason: rejectReason } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAdminUsersQueryKey({ status: statusFilter }) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setSelectedUser(null);
        setRejectDialog(false);
        setRejectReason("");
        toast({ title: "User rejected" });
      },
    });
  };

  const handleViewDocument = (url: string, name: string) => {
    try {
      if (!url.startsWith("data:")) {
        window.open(url, "_blank");
        return;
      }
      
      const parts = url.split(";base64,");
      const contentType = parts[0].split(":")[1];
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      
      // Determine extension
      let ext = "bin";
      if (contentType === "image/jpeg") ext = "jpg";
      else if (contentType === "image/png") ext = "png";
      else if (contentType === "image/webp") ext = "webp";
      else if (contentType === "application/pdf") ext = "pdf";
      else if (contentType.includes("word")) ext = "doc";
      else if (contentType.includes("officedocument")) ext = "docx";
      
      a.download = `${name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback
      window.open(url, "_blank");
    }
  };

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">User Verification</h1>
            <p className="text-sm text-muted-foreground">Review and approve buyer and vendor accounts</p>
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
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground bg-card"}`}>
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse" />)}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            ) : (
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground">{searchQuery ? `No users matching "${searchQuery}"` : `No ${statusFilter} users`}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">{(user.companyName || user.fullName || "?").charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{user.companyName || user.fullName || user.email}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize border ${user.role === "buyer" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>{user.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email} · {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setSelectedUser(user)}>
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser && !rejectDialog} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser?.companyName || selectedUser?.fullName || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Role", value: selectedUser.role },
                  { label: "Status", value: selectedUser.status },
                  { label: "Email", value: selectedUser.email },
                  { label: "Phone", value: selectedUser.phone },
                  selectedUser.role === "buyer" ? { label: "Business Type", value: selectedUser.businessType } : null,
                  selectedUser.role === "buyer" ? { label: "CAC Number", value: selectedUser.cacNumber } : null,
                  selectedUser.role === "vendor" ? { label: "Contact Person", value: selectedUser.contactPerson } : null,
                  selectedUser.role === "vendor" ? { label: "NAFDAC License", value: selectedUser.nafdacLicense } : null,
                  { label: "Address", value: selectedUser.companyAddress },
                  { label: "Registered", value: new Date(selectedUser.createdAt).toLocaleDateString() },
                ].filter(Boolean).map((item) => item && (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className="font-medium capitalize text-xs">{item.value || "—"}</p>
                  </div>
                ))}
              </div>
              {selectedUser.role === "vendor" && selectedUser.productCategories && selectedUser.productCategories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Product Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.productCategories.map((c) => (
                      <span key={c} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {(selectedUser.businessLicenseUrl || selectedUser.importerLicenseUrl || selectedUser.cacDocumentUrl) && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Documents</p>
                  {selectedUser.businessLicenseUrl && (
                    <button type="button" onClick={() => handleViewDocument(selectedUser.businessLicenseUrl!, "business-license")} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <FileText className="w-3.5 h-3.5 shrink-0" />Business License
                    </button>
                  )}
                  {selectedUser.importerLicenseUrl && (
                    <button type="button" onClick={() => handleViewDocument(selectedUser.importerLicenseUrl!, "importer-license")} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <FileText className="w-3.5 h-3.5 shrink-0" />Importer License
                    </button>
                  )}
                  {selectedUser.cacDocumentUrl && (
                    <button type="button" onClick={() => handleViewDocument(selectedUser.cacDocumentUrl!, "cac-document")} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <FileText className="w-3.5 h-3.5 shrink-0" />CAC Document
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {selectedUser?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setRejectDialog(true)}>
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button onClick={() => handleApprove(selectedUser.id)} disabled={approve.isPending}>
                <CheckCircle className="w-4 h-4 mr-1" /> {approve.isPending ? "Approving..." : "Approve"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(false); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Account</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for rejection *</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(false); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending}>
              {reject.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
