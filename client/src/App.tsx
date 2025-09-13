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
import { msalConfig, isAuthorizedEmail, debugLog, detectIOSEnvironment, testStorageAvailability } from './config/authConfig';
import { MicrosoftLogin } from './components/auth/MicrosoftLogin';
import { DevLogin } from './components/DevLogin';
import { UserProvider } from './contexts/UserContext';
import Tasks from "@/pages/Tasks";
import Inventory from "@/pages/Inventory";
import Education from "@/pages/Education";
import Account from "@/pages/Account";
import DevTools from "@/pages/DevTools";
import RecurringTasks from "@/pages/RecurringTasks";
import TaskData from "@/pages/TaskData";
import StaffData from "@/pages/StaffData";
import ProductionData from "@/pages/ProductionData";
import TrayTracking from "@/pages/TrayTracking";
import NotFound from "@/pages/not-found";
import Confetti from "@/components/Confetti";
import { LocationProvider } from "@/contexts/LocationContext";
import { CurrentUserProvider } from "@/contexts/CurrentUserContext";
import { initializeProductionData } from "@/data/initialData";
import { initializeCleanState } from "@/utils/dataCleanup";
import { createStaffFromMicrosoftLogin, updateLastActive, initializeExpectedStaff } from "@/services/staffService";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { teamsAuthService } from "./services/teamsAuthService";
import { useLocation } from "wouter";
import { setStoredAuth } from "@/lib/auth";

const msalInstance = new PublicClientApplication(msalConfig);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <CurrentUserProvider>
        <Layout>{children}</Layout>
      </CurrentUserProvider>
    </LocationProvider>
  );
}

function AppContent() {
  const isAuthenticated = useIsAuthenticated();
  const { accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamsAuthAttempted, setTeamsAuthAttempted] = useState(false);
  const [, setLocation] = useLocation();
  
  // Activity tracking for the current user
  useActivityTracking(currentUser?.id);

  // Keyboard shortcut for dev tools (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D' && currentUser?.role === 'Corporate') {
        e.preventDefault();
        setLocation('/dev');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setLocation, currentUser]);

  // Window focus verification trigger - respects backend locking and timing
  useEffect(() => {
    if (!currentUser || !isAuthenticated) return;

    let lastVerificationCall = 0;
    const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between calls
    
    const handleWindowFocus = async () => {
      const now = Date.now();
      
      // Client-side throttling - don't call more than once every 5 minutes
      if (now - lastVerificationCall < MIN_INTERVAL) {
        console.log(`⏳ Window focus verification skipped - last call was ${Math.round((now - lastVerificationCall) / 1000 / 60)} minutes ago`);
        return;
      }
      
      try {
        lastVerificationCall = now;
        console.log('🔄 Window focus detected - triggering verification check...');
        
        const response = await fetch('/api/system/verify-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Window focus verification completed:', result.message);
        } else {
          console.log('⚠️ Window focus verification request failed:', response.status);
        }
      } catch (error) {
        console.log('❌ Window focus verification error:', error);
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    const initializeUser = async () => {
      // If we already have a user, don't re-initialize
      if (currentUser) return;

      // Try Teams authentication first if not already attempted
      if (!teamsAuthAttempted) {
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
      }

      // Regular MSAL authentication
      if (isAuthenticated && accounts[0]) {
        await processUserLogin(accounts[0]);
      } else {
        setIsLoading(false);
      }
    };

    const processUserLogin = async (account: any) => {
      try {
        // Verify email domain for regular MSAL (Teams already verified above)
        if (!isAuthorizedEmail(account.username)) {
          alert('Access denied. Only @growspace.farm emails are allowed.');
          if (instance) {
            await instance.logoutPopup();
          }
          setIsLoading(false);
          return;
        }

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
        
        // Store in localStorage for getStoredAuth()
        setStoredAuth({
          id: parseInt(staffMember.id),
          username: staffMember.email,
          password: '', // Not needed for client-side auth with SSO
          name: staffMember.fullName,
          role: role.toLowerCase() as 'staff' | 'manager' | 'corporate',
          approved: true, // SSO users are pre-approved
          location: staffMember.location,
          payType: 'hourly',
          payRate: 16.00,
          businessEmail: staffMember.email,
          personalEmail: null,
          homePhone: null,
          businessPhone: null,
          mobilePhone: null,
          emergencyContactName: null,
          emergencyRelationship: null,
          emergencyPhone: null,
          lastActive: null,
          createdAt: new Date()
        });

        // Initialize expected staff members if current user is corporate
        if (role === 'Corporate') {
          try {
            await initializeExpectedStaff();
          } catch (error) {
            console.error('Failed to initialize expected staff:', error);
          }
        }

        // Initialize data if needed
        try {
          await initializeProductionData();
          await initializeCleanState();
        } catch (error) {
          console.error('Failed to initialize production data:', error);
        }
      } catch (error) {
        console.error('Error processing user login:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [isAuthenticated, accounts, instance, currentUser, teamsAuthAttempted]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <h2>🌱 Loading Grow Space...</h2>
      </div>
    );
  }

  if (!isAuthenticated && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="space-y-6 w-full max-w-md">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🌱 Grow Space</h1>
            <p className="text-gray-600 dark:text-gray-400">Farm Management System</p>
          </div>
          
          {/* Development Login - Show first for easier access */}
          <DevLogin onSuccess={() => {}} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          {/* Microsoft Login */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">Microsoft Authentication</h3>
            <MicrosoftLogin />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <div className="loading-screen">Setting up your account...</div>;
  }

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
      <Route path="/dev">
        <ProtectedRoute>
          <DevTools />
        </ProtectedRoute>
      </Route>
      <Route>
        <ProtectedRoute>
          <NotFound />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <AppContent />
            <Toaster />
            <Confetti />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}

export default App;