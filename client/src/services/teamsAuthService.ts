import * as microsoftTeams from "@microsoft/teams-js";
import { AccountInfo } from "@azure/msal-browser";
import { debugLog, detectIOSEnvironment } from '../config/authConfig';

export interface TeamsContext {
  user?: {
    userPrincipalName: string;
    displayName: string;
    id: string; // Changed from objectId to id to match Teams SDK
  };
  app?: {
    host: {
      name: string;
    };
  };
  page?: {
    id: string;
    frameContext: string;
  };
}

export interface TeamsAuthResult {
  isInTeams: boolean;
  context: TeamsContext | null;
  account: AccountInfo | null;
  error?: string;
}

class TeamsAuthService {
  private isInitialized = false;
  private teamsContext: TeamsContext | null = null;

  async initialize(): Promise<TeamsAuthResult> {
    const { isIOS, isTeamsApp } = detectIOSEnvironment();
    debugLog('Teams initialization started', { isIOS, isTeamsApp });
    
    try {
      // Check if we're in an iframe (likely Teams)
      const isInIframe = window.parent !== window.self;
      debugLog('Environment check', { isInIframe, isIOS, isTeamsApp });
      
      if (!isInIframe && !isTeamsApp) {
        debugLog('Not in Teams environment');
        return {
          isInTeams: false,
          context: null,
          account: null
        };
      }

      // iOS-specific Teams initialization with timeout
      if (isIOS) {
        debugLog('Initializing Teams SDK for iOS with extended timeout');
        return await this.initializeTeamsForIOS();
      }

      // Standard Teams initialization
      debugLog('Initializing Teams SDK (standard)');
      await microsoftTeams.app.initialize();
      
      // Get Teams context
      const context = await microsoftTeams.app.getContext();
      debugLog('Teams context obtained', {
        hasUser: !!context.user,
        userPrincipalName: context.user?.userPrincipalName,
        displayName: context.user?.displayName
      });
      
      // Convert to our interface format
      const teamsContext: TeamsContext = {
        user: context.user ? {
          userPrincipalName: context.user.userPrincipalName || '',
          displayName: context.user.displayName || '',
          id: context.user.id || ''
        } : undefined,
        app: context.app,
        page: context.page
      };
      
      this.teamsContext = teamsContext;
      this.isInitialized = true;

      // Create a mock account object compatible with MSAL
      const account: AccountInfo = {
        homeAccountId: context.user?.id || '',
        localAccountId: context.user?.id || '',
        environment: 'login.microsoftonline.com',
        tenantId: '', // Teams context doesn't provide tenant info directly
        username: context.user?.userPrincipalName || '',
        name: context.user?.displayName || '',
        authorityType: 'MSSTS',
        tenantProfiles: new Map(),
        idToken: '',
        idTokenClaims: {},
        nativeAccountId: ''
      };

      debugLog('Teams account created', {
        username: account.username,
        name: account.name
      });

      return {
        isInTeams: true,
        context: teamsContext,
        account,
      };
      
    } catch (error) {
      debugLog('Teams initialization failed', {
        error: (error as Error).message,
        isIOS,
        isTeamsApp
      });
      console.log("Teams initialization failed (not in Teams or error):", error);
      return {
        isInTeams: false,
        context: null,
        account: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // iOS-specific Teams initialization with proper timeout handling
  private async initializeTeamsForIOS(): Promise<TeamsAuthResult> {
    debugLog('iOS Teams initialization started');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        debugLog('iOS Teams initialization timeout');
        resolve({
          isInTeams: false,
          context: null,
          account: null,
          error: 'Teams initialization timeout on iOS'
        });
      }, 10000); // 10 second timeout for iOS
      
      microsoftTeams.app.initialize().then(() => {
        debugLog('iOS Teams SDK initialized successfully');
        
        const contextTimeout = setTimeout(() => {
          debugLog('iOS Teams context timeout');
          clearTimeout(timeout);
          resolve({
            isInTeams: false,
            context: null, 
            account: null,
            error: 'Teams context timeout on iOS'
          });
        }, 5000);
        
        microsoftTeams.app.getContext().then((context) => {
          clearTimeout(timeout);
          clearTimeout(contextTimeout);
          
          debugLog('iOS Teams context received', {
            hasUser: !!context.user,
            userPrincipalName: context.user?.userPrincipalName
          });
          
          const teamsContext: TeamsContext = {
            user: context.user ? {
              userPrincipalName: context.user.userPrincipalName || '',
              displayName: context.user.displayName || '',
              id: context.user.id || ''
            } : undefined,
            app: context.app,
            page: context.page
          };
          
          this.teamsContext = teamsContext;
          this.isInitialized = true;
          
          const account: AccountInfo = {
            homeAccountId: context.user?.id || '',
            localAccountId: context.user?.id || '',
            environment: 'login.microsoftonline.com',
            tenantId: '',
            username: context.user?.userPrincipalName || '',
            name: context.user?.displayName || '',
            authorityType: 'MSSTS',
            tenantProfiles: new Map(),
            idToken: '',
            idTokenClaims: {},
            nativeAccountId: ''
          };
          
          resolve({
            isInTeams: true,
            context: teamsContext,
            account
          });
        }).catch((error) => {
          clearTimeout(timeout);
          clearTimeout(contextTimeout);
          debugLog('iOS Teams context failed', { error: (error as Error).message });
          resolve({
            isInTeams: false,
            context: null,
            account: null,
            error: (error as Error).message
          });
        });
      }).catch((error) => {
        clearTimeout(timeout);
        debugLog('iOS Teams SDK initialization failed', { error: (error as Error).message });
        resolve({
          isInTeams: false,
          context: null,
          account: null,
          error: (error as Error).message
        });
      });
    });
  }

  async getAuthToken(): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error("Teams SDK not initialized");
    }

    return new Promise((resolve, reject) => {
      const authTokenRequest = {
        successCallback: (token: string) => {
          console.log("Got auth token from Teams");
          resolve(token);
        },
        failureCallback: (error: string) => {
          console.error("Failed to get auth token from Teams:", error);
          reject(new Error(error));
        }
      };

      try {
        microsoftTeams.authentication.getAuthToken(authTokenRequest);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTeamsContext(): TeamsContext | null {
    return this.teamsContext;
  }

  isTeamsEnvironment(): boolean {
    return this.isInitialized && this.teamsContext !== null;
  }

  // Notify Teams about authentication state changes
  notifySuccess() {
    if (this.isInitialized) {
      try {
        microsoftTeams.authentication.notifySuccess();
      } catch (error) {
        console.error("Failed to notify Teams of success:", error);
      }
    }
  }

  notifyFailure(reason?: string) {
    if (this.isInitialized) {
      try {
        microsoftTeams.authentication.notifyFailure(reason || "Authentication failed");
      } catch (error) {
        console.error("Failed to notify Teams of failure:", error);
      }
    }
  }
}

export const teamsAuthService = new TeamsAuthService();