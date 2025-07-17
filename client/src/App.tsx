import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Tasks from "@/pages/Tasks";
import Inventory from "@/pages/Inventory";
import Education from "@/pages/Education";
import Analytics from "@/pages/Analytics";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { getStoredAuth } from "@/lib/auth";
import Confetti from "@/components/Confetti";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = getStoredAuth();
  
  if (!auth.isAuthenticated) {
    return <Login />;
  }
  
  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      </Route>
      <Route path="/education">
        <ProtectedRoute>
          <Education />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Confetti />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
