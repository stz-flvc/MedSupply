import { useState } from "react";
import { Link } from "wouter";
import { useListVendorProducts, useGetVendorStats, useDeleteVendorProduct, getListVendorProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Package2, Plus, Trash2, TrendingUp, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const vendorNav = [
  { label: "My Products", href: "/vendor/products" },
  { label: "Upload Product", href: "/vendor/upload" },
  { label: "Notifications", href: "/vendor/notifications" },
];

const STATUS_CONFIG = {
  pending: { label: "Pending Verification", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  verified: { label: "Verified", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function VendorProducts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: products = [], isLoading } = useListVendorProducts();
  const { data: stats } = useGetVendorStats();
  const deleteProduct = useDeleteVendorProduct();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const s = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s) ||
      (p.nafdacNumber?.toLowerCase().includes(s) ?? false)
    );
  });

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListVendorProductsQueryKey() });
        toast({ title: "Product deleted" });
      },
    });
  };

  return (
    <DashboardLayout navItems={vendorNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">My Products</h1>
            <p className="text-sm text-muted-foreground">Manage your pharmaceutical product listings</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, category or NAFDAC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full bg-card"
              />
            </div>
            <Button asChild className="gap-2 h-10 rounded-full">
              <Link href="/vendor/upload"><Plus className="w-4 h-4" /> Upload Product</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: stats.totalProducts, color: "text-foreground" },
              { label: "Pending", value: stats.pendingProducts, color: "text-yellow-600" },
              { label: "Verified", value: stats.verifiedProducts, color: "text-green-600" },
              { label: "Rejected", value: stats.rejectedProducts, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            ) : (
              <Package2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground mb-4">{searchQuery ? `No products matching "${searchQuery}"` : "No products yet"}</p>
            {!searchQuery && (
              <Button asChild variant="outline">
                <Link href="/vendor/upload">Upload your first product</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Category</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Price/Unit</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const status = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || { label: p.status, color: "bg-muted text-muted-foreground border-muted", icon: Clock };
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain rounded-lg p-1" />
                            ) : (
                              <Package2 className="w-5 h-5 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            {p.nafdacNumber && <p className="text-xs text-muted-foreground font-mono">{p.nafdacNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.category}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">₦{Number(p.vendorPrice ?? p.pricePerUnit).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right">{p.quantityAvailable.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${status.color}`}>{status.label}</span>
                        {p.status === "rejected" && p.rejectionReason && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{p.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
