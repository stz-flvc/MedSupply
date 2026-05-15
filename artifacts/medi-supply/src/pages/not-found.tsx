import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base">MedSupply</span>
        </div>
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground text-sm">The page you are looking for does not exist.</p>
        <Button asChild className="mt-2">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
