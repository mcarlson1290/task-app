import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import Tasks from "@/pages/Tasks";
import Inventory from "@/pages/Inventory";
import Education from "@/pages/Education";

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
import { initializeProductionData } from "@/data/initialData";

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
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
              <p className="text-gray-600">This feature is being developed and will be available soon.</p>
            </div>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/staff-data">
        <ProtectedRoute>
          <StaffData />
        </ProtectedRoute>
      </Route>
      <Route path="/production-data">
        <ProtectedRoute>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
              <p className="text-gray-600">This feature is being developed and will be available soon.</p>
            </div>
          </div>
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
  // Initialize production data on app startup
  useEffect(() => {
    initializeProductionData();
    
    // First-time user welcome
    const hasVisited = localStorage.getItem('hasVisitedBeta');
    if (!hasVisited) {
      setTimeout(() => {
        alert(
          'Welcome to Grow Space Task App Beta! 🌱\n\n' +
          'This is a test version of our new task management system. ' +
          'Please explore the features and report any issues to Matt.\n\n' +
          'Thank you for helping us test and improve!'
        );
        localStorage.setItem('hasVisitedBeta', 'true');
      }, 1000); // Small delay to ensure app is fully loaded
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Confetti />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
