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
import { createStaffFromMicrosoftLogin, updateLastActive, initializeExpectedStaff } from "@/services/staffService";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { teamsAuthService } from "./services/teamsAuthService";

const msalInstance = new PublicClientApplication(msalConfig);

// The staff service now handles user creation and role assignment automatically

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
  const [teamsAuthAttempted, setTeamsAuthAttempted] = useState(false);
  
  // Activity tracking for the current user
  useActivityTracking(currentUser?.id);

  // Try Teams authentication first
  useEffect(() => {
    const attemptTeamsAuth = async () => {
      if (teamsAuthAttempted) return;
      
      setTeamsAuthAttempted(true);
      console.log("Attempting Teams authentication...");
      
      try {
        const teamsResult = await teamsAuthService.initialize();
        
        if (teamsResult.isInTeams && teamsResult.account) {
          console.log("Running in Teams, auto-authenticating user:", teamsResult.account.name);
          
          // Verify email domain
          if (!isAuthorizedEmail(teamsResult.account.username)) {
            console.error('Access denied. Only @growspace.farm emails are allowed.');
            teamsAuthService.notifyFailure('Access denied. Only @growspace.farm emails are allowed.');
            setIsLoading(false);
            return;
          }

          // Process Teams user same as regular MSAL user
          await processUserLogin(teamsResult.account);
          teamsAuthService.notifySuccess();
          return;
        }
      } catch (error) {
        console.log("Teams authentication failed, falling back to regular MSAL:", error);
      }
      
      // If not in Teams or Teams auth failed, check regular MSAL
      if (isAuthenticated && accounts[0]) {
        await processUserLogin(accounts[0]);
      } else {
        setIsLoading(false);
      }
    };

    attemptTeamsAuth();
  }, [isAuthenticated, accounts, teamsAuthAttempted]);

  const processUserLogin = async (account: any) => {
    try {
      // Create or update staff entry automatically
      const staffMember = await createStaffFromMicrosoftLogin(
        account.localAccountId || account.homeAccountId || '',
        account.name || 'User',
        account.username
      );

      // Determine role based on staff member
      let role: 'Staff' | 'Manager' | 'Corporate' = 'Staff';
      let isManager = false;
      let isCorporateManager = false;

      if (staffMember.rolesAssigned.includes('Corporate Manager')) {
        role = 'Corporate';
        isManager = true;
        isCorporateManager = true;
      } else if (staffMember.rolesAssigned.includes('Manager')) {
        role = 'Manager';
        isManager = true;
      }

      // Create user object for context
      const user = {
        id: staffMember.id,
        name: staffMember.fullName,
        email: staffMember.email,
        role,
        isManager,
        isCorporateManager,
        location: staffMember.location
      };

      console.log('Initialized user:', user.name, user.email, user.role);
      setCurrentUser(user);

      // Initialize expected staff members if current user is corporate
      if (role === 'Corporate') {
          try {
            await initializeExpectedStaff();
          } catch (error) {
            console.error('Failed to initialize expected staff:', error);
          }
        }
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
