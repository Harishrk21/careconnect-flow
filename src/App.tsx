import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import CasesList from "./pages/cases/CasesList";
import CaseDetail from "./pages/cases/CaseDetail";
import CreateCase from "./pages/cases/CreateCase";
import ClientsList from "./pages/clients/ClientsList";
import CreateClient from "./pages/clients/CreateClient";
import UserManagement from "./pages/UserManagement";
import HospitalManagement from "./pages/HospitalManagement";
import UniversityManagement from "./pages/UniversityManagement";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse-soft text-muted-foreground">Loading...</div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Redirect to password reset if user hasn't changed password
  if (isAuthenticated && user && !user.passwordChanged) {
    return <Navigate to="/reset-password" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Root route - show login if not authenticated, redirect if authenticated */}
      <Route 
        path="/" 
        element={
          isAuthenticated && user?.passwordChanged 
            ? <Navigate to="/dashboard" replace /> 
            : isAuthenticated && !user?.passwordChanged
            ? <Navigate to="/reset-password" replace />
            : <Login />
        } 
      />
      <Route path="/login" element={isAuthenticated && user?.passwordChanged ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      {/* Protected routes with MainLayout - using explicit paths to avoid conflict with root route */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases" element={<CasesList />} />
        <Route path="/cases/new" element={<CreateCase />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/clients" element={<ClientsList />} />
        <Route path="/clients/new" element={<CreateClient />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/hospitals" element={<HospitalManagement />} />
        <Route path="/universities" element={<UniversityManagement />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
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
