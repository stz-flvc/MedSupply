import { useState, useEffect } from "react";
import { useListOrders, useConfirmOrderPayment, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ShoppingBag, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const buyerNav = [
  { label: "Marketplace", href: "/buyer/marketplace" },
  { label: "My Orders", href: "/buyer/orders" },
  { label: "Notifications", href: "/buyer/notifications" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  proceed_to_pay: { label: "Proceed to Pay", color: "bg-orange-100 text-orange-800 border-orange-200" },
  payment_confirmed: { label: "Payment Confirmed", color: "bg-teal-100 text-teal-800 border-teal-200" },
  fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800 border-green-200" },
};

export default function BuyerOrders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: orders = [], isLoading } = useListOrders();
  const confirmPayment = useConfirmOrderPayment();
  const [paymentOrder, setPaymentOrder] = useState<(typeof orders)[0] | null>(null);

  // Auto-popup for proceed_to_pay orders
  useEffect(() => {
    const payOrder = orders.find((o) => o.status === "proceed_to_pay");
    if (payOrder && !paymentOrder) setPaymentOrder(payOrder);
  }, [orders]);

  const handleConfirmPayment = () => {
    if (!paymentOrder) return;
    confirmPayment.mutate(
      { id: paymentOrder.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          setPaymentOrder(null);
          toast({ title: "Payment confirmed", description: "Your payment has been processed successfully." });
        },
        onError: () => toast({ title: "Payment initiation failed", variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout navItems={buyerNav}>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">Browse the marketplace to place your first order</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Order #</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Vendor</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Qty</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = STATUS_LABELS[order.status] || { label: order.status, color: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">#{order.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{order.productName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{order.vendorName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right">{order.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">₦{Number(order.totalPrice).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {order.status === "proceed_to_pay" && (
                          <Button size="sm" className="gap-1.5 text-xs h-7" onClick={() => setPaymentOrder(order)}>
                            <CreditCard className="w-3 h-3" /> Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Popup */}
      <Dialog open={!!paymentOrder} onOpenChange={(open) => !open && setPaymentOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Proceed to Payment
            </DialogTitle>
            <DialogDescription>
              Your order has been confirmed. Proceed to complete payment via Paystack.
            </DialogDescription>
          </DialogHeader>
          {paymentOrder && (
            <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{paymentOrder.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{paymentOrder.quantity.toLocaleString()} units</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">₦{Number(paymentOrder.totalPrice).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOrder(null)}>Cancel</Button>
            <Button onClick={handleConfirmPayment} disabled={confirmPayment.isPending} className="gap-2">
              <CreditCard className="w-4 h-4" />
              {confirmPayment.isPending ? "Redirecting..." : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
