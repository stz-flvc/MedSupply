import { useState, useMemo } from "react";
import { useListAdminProducts } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Warehouse,
  ChevronRight,
  ChevronDown,
  Building2,
  Layers3,
  Package,
  Boxes,
  TrendingUp,
  Search,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "User Verification", href: "/admin/users" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Stock Count", href: "/admin/stock-count" },
  { label: "All Users", href: "/admin/all-users" },
  { label: "Chats", href: "/admin/chats" },
];

type Product = {
  id: number;
  vendorId: number;
  vendorName?: string | null;
  name: string;
  category: string;
  quantityAvailable: number;
  status: string;
  pricePerUnit: number;
  imageUrl?: string | null;
  nafdacNumber?: string | null;
};

type VendorGroup = {
  vendorId: number;
  vendorName: string;
  totalQuantity: number;
  productCount: number;
  categories: CategoryGroup[];
};

type CategoryGroup = {
  category: string;
  totalQuantity: number;
  productCount: number;
  products: Product[];
};

function buildHierarchy(products: Product[]): VendorGroup[] {
  const vendorMap = new Map<number, VendorGroup>();

  for (const p of products) {
    if (p.status !== "verified") continue;

    let vendor = vendorMap.get(p.vendorId);
    if (!vendor) {
      vendor = {
        vendorId: p.vendorId,
        vendorName: p.vendorName || `Vendor #${p.vendorId}`,
        totalQuantity: 0,
        productCount: 0,
        categories: [],
      };
      vendorMap.set(p.vendorId, vendor);
    }

    vendor.totalQuantity += p.quantityAvailable;
    vendor.productCount += 1;

    let cat = vendor.categories.find((c) => c.category === p.category);
    if (!cat) {
      cat = { category: p.category, totalQuantity: 0, productCount: 0, products: [] };
      vendor.categories.push(cat);
    }
    cat.totalQuantity += p.quantityAvailable;
    cat.productCount += 1;
    cat.products.push(p);
  }

  // Sort vendors by name, categories by name, products by quantity desc
  const vendors = Array.from(vendorMap.values()).sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName)
  );
  for (const v of vendors) {
    v.categories.sort((a, b) => a.category.localeCompare(b.category));
    for (const c of v.categories) {
      c.products.sort((a, b) => b.quantityAvailable - a.quantityAvailable);
    }
  }
  return vendors;
}

function formatQty(n: number) {
  return n.toLocaleString();
}

// Animated counter-style number display
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -translate-y-6 translate-x-6"
        style={{ background: accent }}
      />
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}14` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {sublabel && (
            <p className="text-[11px] text-gray-400 mt-1.5">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminStockCount() {
  const { data: products = [], isLoading } = useListAdminProducts();
  const [expandedVendors, setExpandedVendors] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const hierarchy = useMemo(() => buildHierarchy(products as Product[]), [products]);

  // Compute totals
  const totalQuantity = useMemo(
    () => hierarchy.reduce((sum, v) => sum + v.totalQuantity, 0),
    [hierarchy]
  );
  const totalVendors = hierarchy.length;
  const totalCategories = useMemo(
    () => new Set(hierarchy.flatMap((v) => v.categories.map((c) => c.category))).size,
    [hierarchy]
  );
  const totalProducts = useMemo(
    () => hierarchy.reduce((sum, v) => sum + v.productCount, 0),
    [hierarchy]
  );

  // Filter vendors/categories/products by search
  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) return hierarchy;
    const q = searchQuery.toLowerCase();
    return hierarchy
      .map((vendor) => {
        const vendorMatch = vendor.vendorName.toLowerCase().includes(q);
        const filteredCats = vendor.categories
          .map((cat) => {
            const catMatch = cat.category.toLowerCase().includes(q);
            const filteredProducts = cat.products.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.nafdacNumber || "").toLowerCase().includes(q)
            );
            if (catMatch) return cat;
            if (filteredProducts.length > 0)
              return { ...cat, products: filteredProducts, productCount: filteredProducts.length, totalQuantity: filteredProducts.reduce((s, p) => s + p.quantityAvailable, 0) };
            return null;
          })
          .filter(Boolean) as CategoryGroup[];

        if (vendorMatch) return vendor;
        if (filteredCats.length > 0)
          return {
            ...vendor,
            categories: filteredCats,
            productCount: filteredCats.reduce((s, c) => s + c.productCount, 0),
            totalQuantity: filteredCats.reduce((s, c) => s + c.totalQuantity, 0),
          };
        return null;
      })
      .filter(Boolean) as VendorGroup[];
  }, [hierarchy, searchQuery]);

  const toggleVendor = (vendorId: number) => {
    setExpandedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId);
      else next.add(vendorId);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Warehouse size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Stock Count</h1>
            </div>
            <p className="text-sm text-gray-500 ml-[42px]">
              Hierarchical inventory breakdown across all vendors
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors, categories, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Boxes}
              label="Total Stock"
              value={formatQty(totalQuantity)}
              sublabel="units across all vendors"
              accent="#6366f1"
            />
            <StatCard
              icon={Building2}
              label="Active Vendors"
              value={totalVendors.toString()}
              sublabel="with verified products"
              accent="#0ea5e9"
            />
            <StatCard
              icon={Layers3}
              label="Categories"
              value={totalCategories.toString()}
              sublabel="product categories"
              accent="#8b5cf6"
            />
            <StatCard
              icon={Package}
              label="Products"
              value={formatQty(totalProducts)}
              sublabel="verified listings"
              accent="#10b981"
            />
          </div>
        )}

        {/* Hierarchy Tree */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-4 h-16 animate-pulse"
              />
            ))}
          </div>
        ) : filteredHierarchy.length === 0 ? (
          <div className="text-center py-20">
            <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery ? `No results matching "${searchQuery}"` : "No verified products in stock"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHierarchy.map((vendor) => {
              const isExpanded = expandedVendors.has(vendor.vendorId);
              return (
                <div
                  key={vendor.vendorId}
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                >
                  {/* Vendor Row */}
                  <button
                    onClick={() => toggleVendor(vendor.vendorId)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shrink-0 border border-sky-200/60">
                      <Building2 size={18} className="text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {vendor.vendorName}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {vendor.productCount} product{vendor.productCount !== 1 ? "s" : ""} · {vendor.categories.length} categor{vendor.categories.length !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                    <div className="text-right mr-2 shrink-0">
                      <p className="text-lg font-bold text-gray-900">
                        {formatQty(vendor.totalQuantity)}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        units
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Categories */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/40">
                      {vendor.categories.map((cat) => {
                        const catKey = `${vendor.vendorId}-${cat.category}`;
                        const isCatExpanded = expandedCategories.has(catKey);
                        return (
                          <div key={catKey}>
                            {/* Category Row */}
                            <button
                              onClick={() => toggleCategory(catKey)}
                              className="w-full flex items-center gap-4 pl-8 sm:pl-12 pr-4 sm:pr-5 py-3.5 text-left hover:bg-gray-100/60 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0 border border-violet-200/60">
                                <Layers3 size={14} className="text-violet-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-semibold text-gray-800 capitalize truncate">
                                  {cat.category}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="text-right mr-2 shrink-0">
                                <p className="text-base font-bold text-gray-800">
                                  {formatQty(cat.totalQuantity)}
                                </p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                                  units
                                </p>
                              </div>
                              <div className="shrink-0">
                                {isCatExpanded ? (
                                  <ChevronDown size={16} className="text-gray-400" />
                                ) : (
                                  <ChevronRight size={16} className="text-gray-400" />
                                )}
                              </div>
                            </button>

                            {/* Products */}
                            {isCatExpanded && (
                              <div className="bg-white border-t border-gray-100">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-50/80">
                                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-14 sm:pl-20 pr-4 py-2.5">
                                        Product
                                      </th>
                                      <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 hidden sm:table-cell">
                                        Price/Unit
                                      </th>
                                      <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 hidden sm:table-cell">
                                        NAFDAC
                                      </th>
                                      <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 sm:pr-5 py-2.5">
                                        Qty Available
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cat.products.map((product) => (
                                      <tr
                                        key={product.id}
                                        className="border-t border-gray-50 hover:bg-indigo-50/30 transition-colors"
                                      >
                                        <td className="pl-14 sm:pl-20 pr-4 py-3">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200/60">
                                              {product.imageUrl ? (
                                                <img
                                                  src={product.imageUrl}
                                                  alt={product.name}
                                                  className="w-full h-full object-contain rounded-lg p-0.5"
                                                />
                                              ) : (
                                                <Package size={14} className="text-gray-400" />
                                              )}
                                            </div>
                                            <span className="text-xs font-medium text-gray-800 truncate">
                                              {product.name}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 text-right font-medium hidden sm:table-cell">
                                          ₦{Number(product.pricePerUnit).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-gray-400 text-right font-mono hidden sm:table-cell">
                                          {product.nafdacNumber || "—"}
                                        </td>
                                        <td className="px-4 sm:pr-5 py-3 text-right">
                                          <span
                                            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                                              product.quantityAvailable > 100
                                                ? "bg-emerald-50 text-emerald-700"
                                                : product.quantityAvailable > 20
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-red-50 text-red-700"
                                            }`}
                                          >
                                            {formatQty(product.quantityAvailable)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
