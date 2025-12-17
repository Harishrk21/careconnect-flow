import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import CasesList from "./pages/cases/CasesList";
import CaseDetail from "./pages/cases/CaseDetail";
import CreateCase from "./pages/cases/CreateCase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse-soft text-muted-foreground">Loading...</div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cases" element={<CasesList />} />
        <Route path="cases/new" element={<CreateCase />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="users" element={<Dashboard />} />
        <Route path="hospitals" element={<Dashboard />} />
        <Route path="documents" element={<Dashboard />} />
        <Route path="payments" element={<Dashboard />} />
        <Route path="notifications" element={<Dashboard />} />
        <Route path="settings" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
