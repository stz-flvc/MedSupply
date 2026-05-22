import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Package2, ShoppingCart } from "lucide-react";

const CATEGORIES = ["All", "Antibiotics", "Analgesics", "Vitamins & Supplements", "Cardiovascular", "Oncology", "Antivirals", "Antifungals", "Vaccines", "Dermatology"];

const buyerNav = [
  { label: "Marketplace", href: "/buyer/marketplace" },
  { label: "My Orders", href: "/buyer/orders" },
  { label: "Notifications", href: "/buyer/notifications" },
];

function ProductCard({ product }: { product: { id: number; name: string; category: string; imageUrl?: string | null; pricePerUnit: number; quantityAvailable: number; vendorName?: string | null } }) {
  return (
    <Link href={`/buyer/marketplace/${product.id}`}>
      <div className="block bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full flex flex-col">
        <div className="aspect-square bg-muted/40 flex items-center justify-center border-b border-border">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
          ) : (
            <Package2 className="w-12 h-12 text-muted-foreground/40" />
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 space-y-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{product.category}</p>
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
            {product.vendorName && <p className="text-xs text-muted-foreground mt-0.5">{product.vendorName}</p>}
          </div>
          <div className="flex items-center justify-between pt-1 mb-2 mt-auto">
            <div>
              <p className="text-xs text-muted-foreground">Per unit</p>
              <p className="text-base font-bold text-primary">₦{Number(product.pricePerUnit).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">In stock</p>
              <p className="text-sm font-medium">{product.quantityAvailable.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full flex items-center justify-center gap-1.5 text-xs h-8 bg-primary text-primary-foreground rounded-md font-medium transition-colors">
            <ShoppingCart className="w-3.5 h-3.5" />
            View & Order
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: products = [], isLoading } = useListProducts({
    search: search || undefined,
    category: category !== "All" ? category : undefined,
  });

  return (
    <DashboardLayout navItems={buyerNav}>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">Product Marketplace</h1>
          <p className="text-sm text-muted-foreground">Browse verified pharmaceutical products from certified vendors</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-card"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{products.length} product{products.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={{ ...p, pricePerUnit: Number(p.pricePerUnit) }} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
