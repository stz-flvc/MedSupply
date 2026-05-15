import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetProduct, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package2, FileText, Hash, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const buyerNav = [
  { label: "Marketplace", href: "/buyer/marketplace" },
  { label: "My Orders", href: "/buyer/orders" },
  { label: "Notifications", href: "/buyer/notifications" },
];

export default function ProductDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const { data: product, isLoading } = useGetProduct(id);
  const createOrder = useCreateOrder();

  const handleOrder = () => {
    if (!product) return;
    createOrder.mutate(
      { data: { productId: id, quantity } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order submitted", description: "Your order request has been submitted for review." });
          navigate("/buyer/orders");
        },
        onError: () => toast({ title: "Failed to place order", variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout navItems={buyerNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <Link href="/buyer/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
        </Link>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        ) : !product ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Product not found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image */}
            <div className="bg-card border border-border rounded-xl flex items-center justify-center aspect-square">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-8" />
              ) : (
                <Package2 className="w-24 h-24 text-muted-foreground/30" />
              )}
            </div>

            {/* Details */}
            <div className="space-y-5">
              <div>
                <Badge variant="secondary" className="mb-2 text-xs">{product.category}</Badge>
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {product.vendorName && <p className="text-sm text-muted-foreground mt-1">Supplied by {product.vendorName}</p>}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>


              <div className="border-t border-border pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Price per unit</p>
                    <p className="text-3xl font-bold text-primary">₦{Number(product.pricePerUnit).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Available stock</p>
                    <p className="text-lg font-semibold">{product.quantityAvailable.toLocaleString()} units</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                    <Input
                      type="number"
                      min={1}
                      max={product.quantityAvailable}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(product.quantityAvailable, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-24 text-center"
                    />
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(product.quantityAvailable, quantity + 1))}>+</Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Total</span>
                  <span className="text-lg font-bold text-primary">₦{(Number(product.pricePerUnit) * quantity).toLocaleString()}</span>
                </div>

                <Button size="lg" className="w-full" onClick={handleOrder} disabled={createOrder.isPending}>
                  {createOrder.isPending ? "Submitting..." : "Submit Order Request"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Order is subject to admin confirmation before payment</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
