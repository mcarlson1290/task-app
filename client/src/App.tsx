import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, isAuthorizedEmail } from './config/authConfig';
import { MicrosoftLogin } from './components/auth/MicrosoftLogin';
import { UserProvider } from './contexts/UserContext';
import Tasks from "@/pages/Tasks";
import Inventory from "@/pages/Inventory";
import Education from "@/pages/Education";

import Account from "@/pages/Account";
import RecurringTasks from "@/pages/RecurringTasks";
import TaskData from "@/pages/TaskData";
import StaffData from "@/pages/StaffData";
import ProductionData from "@/pages/ProductionData";
import TrayTracking from "@/pages/TrayTracking";
import NotFound from "@/pages/not-found";
import Confetti from "@/components/Confetti";
import { LocationProvider } from "@/contexts/LocationContext";
import { initializeProductionData } from "@/data/initialData";
import { initializeCleanState } from "@/utils/dataCleanup";

const msalInstance = new PublicClientApplication(msalConfig);

// Helper function to check existing users
async function checkExistingUser(email: string) {
  // Check for specific corporate users first
  const corporateEmails = [
    'robert@growspace.farm',
    'matt@growspace.farm',
    'matt.carlson@growspace.farm'
  ];
  
  if (corporateEmails.includes(email.toLowerCase())) {
    return {
      role: 'Corporate' as const,
      isManager: true,
      isCorporateManager: true
    };
  }
  
  // Check staff data for other users
  const staffData = JSON.parse(localStorage.getItem('staffData') || '[]');
  const existingUser = staffData.find((staff: any) => staff.email === email);
  
  if (existingUser) {
    return existingUser;
  }
  
  // Default for new users
  return {
    role: 'Staff' as const,
    isManager: false,
    isCorporateManager: false
  };
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <Layout>{children}</Layout>
    </LocationProvider>
  );
}

function AppContent() {
  const isAuthenticated = useIsAuthenticated();
  const { accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initializeUser = async () => {
      if (isAuthenticated && accounts[0]) {
        const account = accounts[0];
        
        // Verify email domain
        if (!isAuthorizedEmail(account.username)) {
          alert('Access denied. Only @growspace.farm emails are allowed.');
          await instance.logoutPopup();
          setIsLoading(false);
          return;
        }

        // Create user object
        const user = {
          id: account.localAccountId || account.homeAccountId,
          name: account.name || 'User',
          email: account.username,
          role: 'Staff' as const, // Default role for new users
          isManager: false,
          isCorporateManager: false,
          location: 'Kenosha'
        };

        // Apply role from existing user check
        const existingUser = await checkExistingUser(account.username);
        if (existingUser) {
          user.role = existingUser.role;
          user.isManager = existingUser.isManager;
          user.isCorporateManager = existingUser.isCorporateManager;
        }

        setCurrentUser(user);
      }
      setIsLoading(false);
    };

    initializeUser();
  }, [isAuthenticated, accounts, instance]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <h2>🌱 Loading Grow Space...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <MicrosoftLogin />;
  }

  if (!currentUser) {
    return <div className="loading-screen">Setting up your account...</div>;
  }

  // Your existing app with UserProvider
  return (
    <UserProvider value={{ currentUser, setCurrentUser }}>
      <Router />
    </UserProvider>
  );
}

function Router() {
  return (
    <Switch>
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
    initializeCleanState();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MsalProvider instance={msalInstance}>
            <AppContent />
          </MsalProvider>
          <Toaster />
          <Confetti />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
