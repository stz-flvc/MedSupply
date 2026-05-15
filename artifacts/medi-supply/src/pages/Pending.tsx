import { Link } from "wouter";
import { Clock, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Pending() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
          <Package className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-base">MedSupply</span>
      </div>

      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Account Under Review</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {user?.status === "rejected"
              ? "Your account registration was not approved."
              : "Your account is currently being reviewed by our team. You will be notified once your account is approved."}
          </p>
        </div>

        {user?.status === "rejected" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-destructive mb-1">Reason for rejection:</p>
            <p className="text-sm text-muted-foreground">{user.rejectionReason ?? "No reason provided."}</p>
          </div>
        )}

        {user?.status === "pending" && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left space-y-1.5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">What happens next</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Our team reviews your submitted documents</li>
              <li>• Verification typically takes 24–48 hours</li>
              <li>• You will receive an email notification upon approval</li>
            </ul>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
