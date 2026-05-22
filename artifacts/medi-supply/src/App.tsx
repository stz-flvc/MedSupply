import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import BuyerSignup from "@/pages/signup/Buyer";
import VendorSignup from "@/pages/signup/Vendor";
import Pending from "@/pages/Pending";
import NotFound from "@/pages/not-found";

// Buyer pages
import Marketplace from "@/pages/buyer/Marketplace";
import ProductDetail from "@/pages/buyer/ProductDetail";
import BuyerOrders from "@/pages/buyer/Orders";
import BuyerNotifications from "@/pages/buyer/Notifications";

// Vendor pages
import VendorProducts from "@/pages/vendor/Products";
import VendorUpload from "@/pages/vendor/Upload";
import VendorNotifications from "@/pages/vendor/Notifications";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminAllUsers from "@/pages/admin/AllUsers";
import AdminChats from "@/pages/admin/Chats";
import AdminStockCount from "@/pages/admin/StockCount";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if ((error as { status?: number })?.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30000,
    },
  },
});

function RoleRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (user.status === "pending" || user.status === "rejected") return <Redirect to="/pending" />;
  if (user.role === "admin") return <Redirect to="/admin" />;
  if (user.role === "vendor") return <Redirect to="/vendor/products" />;
  return <Redirect to="/buyer/marketplace" />;
}

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup/buyer" component={BuyerSignup} />
        <Route path="/signup/vendor" component={VendorSignup} />
        <Route path="/pending" component={Pending} />
        <Route path="/dashboard">
          <RoleRedirect />
        </Route>

        {/* Buyer */}
        <Route path="/buyer/marketplace">
          <ProtectedRoute role="buyer"><Marketplace /></ProtectedRoute>
        </Route>
        <Route path="/buyer/marketplace/:id">
          {(params) => (
            <ProtectedRoute role="buyer"><ProductDetail id={Number(params.id)} /></ProtectedRoute>
          )}
        </Route>
        <Route path="/buyer/orders">
          <ProtectedRoute role="buyer"><BuyerOrders /></ProtectedRoute>
        </Route>
        <Route path="/buyer/notifications">
          <ProtectedRoute role="buyer"><BuyerNotifications /></ProtectedRoute>
        </Route>

        {/* Vendor */}
        <Route path="/vendor/products">
          <ProtectedRoute role="vendor"><VendorProducts /></ProtectedRoute>
        </Route>
        <Route path="/vendor/upload">
          <ProtectedRoute role="vendor"><VendorUpload /></ProtectedRoute>
        </Route>
        <Route path="/vendor/notifications">
          <ProtectedRoute role="vendor"><VendorNotifications /></ProtectedRoute>
        </Route>

        {/* Admin */}
        <Route path="/admin">
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>
        </Route>
        <Route path="/admin/products">
          <ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>
        </Route>
        <Route path="/admin/orders">
          <ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>
        </Route>
        <Route path="/admin/all-users">
          <ProtectedRoute role="admin"><AdminAllUsers /></ProtectedRoute>
        </Route>
        <Route path="/admin/stock-count">
          <ProtectedRoute role="admin"><AdminStockCount /></ProtectedRoute>
        </Route>
        <Route path="/admin/chats">
          <ProtectedRoute role="admin"><AdminChats /></ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
