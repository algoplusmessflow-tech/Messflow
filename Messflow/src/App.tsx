import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { BroadcastModal } from "@/components/BroadcastModal";
import PublicHome from "./pages/PublicHome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Menu from "./pages/Menu";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Pricing from "./pages/Pricing";
import StaffPayroll from "./pages/StaffPayroll";
import Settings from "./pages/Settings";
import Renewal from "./pages/Renewal";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminSecurity from "./pages/SuperAdminSecurity";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/renewal" element={
              <ProtectedRoute>
                <Renewal />
              </ProtectedRoute>
            } />
            <Route path="/super-admin" element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdmin />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/security" element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdminSecurity />
              </ProtectedRoute>
            } />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <BroadcastModal />
                    <Dashboard />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Members />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Menu />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Inventory />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <StaffPayroll />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Expenses />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Reports />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Pricing />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <SubscriptionBanner />
                    <Settings />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
