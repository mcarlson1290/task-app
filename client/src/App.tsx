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
import Account from "@/pages/Account";
import RecurringTasks from "@/pages/RecurringTasks";
import TaskData from "@/pages/TaskData";
import StaffData from "@/pages/StaffData";
import ProductionData from "@/pages/ProductionData";
import TrayTracking from "@/pages/TrayTracking";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { getStoredAuth } from "@/lib/auth";
import Confetti from "@/components/Confetti";
import { LocationProvider } from "@/contexts/LocationContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = getStoredAuth();
  
  if (!auth.isAuthenticated) {
    return <Login />;
  }
  
  return (
    <LocationProvider>
      <Layout>{children}</Layout>
    </LocationProvider>
  );
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
      <Route path="/account">
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      </Route>
      <Route path="/recurring-tasks">
        <ProtectedRoute>
          <RecurringTasks />
        </ProtectedRoute>
      </Route>
      <Route path="/task-data">
        <ProtectedRoute>
          <TaskData />
        </ProtectedRoute>
      </Route>
      <Route path="/staff-data">
        <ProtectedRoute>
          <StaffData />
        </ProtectedRoute>
      </Route>
      <Route path="/production-data">
        <ProtectedRoute>
          <ProductionData />
        </ProtectedRoute>
      </Route>
      <Route path="/tray-tracking">
        <ProtectedRoute>
          <TrayTracking />
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
