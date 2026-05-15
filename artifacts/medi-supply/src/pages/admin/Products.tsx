import { useState } from "react";
import { useListAdminProducts, useVerifyProduct, useRejectProduct, getListAdminProductsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package2, CheckCircle, XCircle, Clock, FileText, ShieldCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "User Verification", href: "/admin/users" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "All Users", href: "/admin/all-users" },
];

type Product = {
  id: number; vendorId: number; vendorName?: string | null; name: string;
  category: string; description: string; imageUrl?: string | null; coaUrl?: string | null;
  nafdacNumber?: string | null; barcode?: string | null; pricePerUnit: number;
  quantityAvailable: number; status: string; rejectionReason?: string | null; createdAt: string;
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"pending" | "verified" | "rejected">("pending");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialog, setRejectDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceInput, setPriceInput] = useState("");

  const handleReview = (p: Product) => {
    setSelectedProduct(p);
    setPriceInput(p.pricePerUnit.toString());
  };

  const { data: products = [], isLoading } = useListAdminProducts({ status: statusFilter });

  const filteredProducts = (products as Product[]).filter((p) => {
    const s = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s) ||
      (p.vendorName?.toLowerCase().includes(s) ?? false)
    );
  });
  const verify = useVerifyProduct();
  const reject = useRejectProduct();

  const handleVerify = (id: number) => {
    const data = priceInput && !isNaN(Number(priceInput)) ? { pricePerUnit: Number(priceInput) } : undefined;
    verify.mutate({ id, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAdminProductsQueryKey({ status: statusFilter }) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setSelectedProduct(null);
        toast({ title: "Product verified and published" });
      },
    });
  };

  const handleReject = () => {
    if (!selectedProduct || !rejectReason.trim()) return;
    reject.mutate({ id: selectedProduct.id, data: { reason: rejectReason } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAdminProductsQueryKey({ status: statusFilter }) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setSelectedProduct(null);
        setRejectDialog(false);
        setRejectReason("");
        toast({ title: "Product rejected" });
      },
    });
  };

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Product Verification</h1>
            <p className="text-sm text-muted-foreground">Review vendor product listings before publishing to the marketplace</p>
          </div>
          <div className="relative w-full sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by product, category or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-full bg-card"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(["pending", "verified", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground bg-card"}`}>
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse" />)}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            ) : (
              <Package2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground">{searchQuery ? `No products matching "${searchQuery}"` : `No ${statusFilter} products`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Vendor</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Category</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Price</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain rounded-lg p-1" /> : <Package2 className="w-5 h-5 text-muted-foreground/50" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.nafdacNumber && <p className="text-xs text-muted-foreground font-mono">{p.nafdacNumber}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.vendorName || `Vendor #${p.vendorId}`}</td>
                    <td className="px-4 py-3 text-sm">{p.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">₦{Number(p.pricePerUnit).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">{p.quantityAvailable.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleReview(p)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct && !rejectDialog} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedProduct?.name}</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.imageUrl && (
                <div className="aspect-video bg-muted/40 rounded-lg flex items-center justify-center">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="max-h-full object-contain" />
                </div>
              )}
              <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Category", value: selectedProduct.category },
                  { label: "Vendor", value: selectedProduct.vendorName || `#${selectedProduct.vendorId}` },
                  { 
                    label: "Price/Unit", 
                    value: selectedProduct.status === "pending" ? undefined : `₦${Number(selectedProduct.pricePerUnit).toLocaleString()}`,
                    customRender: selectedProduct.status === "pending" ? (
                      <div className="bg-muted/40 rounded-lg p-2.5 flex flex-col justify-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Price/Unit (₦)</p>
                        <Input 
                          type="number" 
                          value={priceInput} 
                          onChange={(e) => setPriceInput(e.target.value)} 
                          className="h-7 text-xs font-medium px-2 py-1"
                        />
                      </div>
                    ) : null
                  },
                  { label: "Stock", value: `${selectedProduct.quantityAvailable.toLocaleString()} units` },
                  { label: "NAFDAC No.", value: selectedProduct.nafdacNumber },
                  { label: "Barcode", value: selectedProduct.barcode },
                ].filter((i) => i.value !== undefined || i.customRender).map(({ label, value, customRender }) => (
                  customRender ? (
                    <div key={label} className="h-full">{customRender}</div>
                  ) : (
                    <div key={label} className="bg-muted/40 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="font-medium text-xs">{value}</p>
                    </div>
                  )
                ))}
              </div>
              {selectedProduct.coaUrl && (
                <a href={selectedProduct.coaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <FileText className="w-4 h-4" /> View Certificate of Analysis (COA)
                </a>
              )}
            </div>
          )}
          {selectedProduct?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setRejectDialog(true)}>
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button onClick={() => handleVerify(selectedProduct.id)} disabled={verify.isPending}>
                <ShieldCheck className="w-4 h-4 mr-1" /> {verify.isPending ? "Verifying..." : "Verify & Publish"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(false); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Product</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for rejection *</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Invalid NAFDAC number, missing COA..." />
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
