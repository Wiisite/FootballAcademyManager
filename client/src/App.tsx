import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

// Pages
import LoginAdmin from "@/pages/LoginAdmin";
import Dashboard from "@/pages/Dashboard";
import Documentos from "@/pages/Documentos";

function App() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth status
  useEffect(() => {
    fetch("/api/auth/admin/me")
      .then((res) => {
        setIsAuthenticated(res.ok);
        if (!res.ok && window.location.pathname !== "/login") {
          setLocation("/login");
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, [setLocation]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          {!isAuthenticated ? (
            <>
              <Route path="/login" component={LoginAdmin} />
              <Route path="/">
                <LoginAdmin />
              </Route>
            </>
          ) : (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/documentos" component={Documentos} />
              <Route path="/login">
                <Dashboard />
              </Route>
            </>
          )}
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
