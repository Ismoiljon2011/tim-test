import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tests = lazy(() => import("./pages/Tests"));
const TakeTest = lazy(() => import("./pages/TakeTest"));
const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminTests = lazy(() => import("./pages/admin/AdminTests"));
const CreateTest = lazy(() => import("./pages/admin/CreateTest"));
const AdminResults = lazy(() => import("./pages/admin/AdminResults"));
const ResultDetail = lazy(() => import("./pages/admin/ResultDetail"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ForcePasswordChange({ children }: { children: React.ReactNode }) {
  const { mustChangePassword, user } = useAuth();
  if (user && mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/change-password" element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                } />
                
                {/* Protected routes with force password change */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ForcePasswordChange>
                        <Dashboard />
                      </ForcePasswordChange>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tests"
                  element={
                    <ProtectedRoute>
                      <ForcePasswordChange>
                        <Tests />
                      </ForcePasswordChange>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tests/:testId"
                  element={
                    <ProtectedRoute>
                      <ForcePasswordChange>
                        <TakeTest />
                      </ForcePasswordChange>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ForcePasswordChange>
                        <Profile />
                      </ForcePasswordChange>
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ForcePasswordChange>
                        <Admin />
                      </ForcePasswordChange>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="tests" element={<AdminTests />} />
                  <Route path="tests/new" element={<CreateTest />} />
                  <Route path="tests/:testId/edit" element={<CreateTest />} />
                  <Route path="results" element={<AdminResults />} />
                  <Route path="results/:resultId" element={<ResultDetail />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
