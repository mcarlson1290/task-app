import * as microsoftTeams from "@microsoft/teams-js";
import { AccountInfo } from "@azure/msal-browser";

export interface TeamsContext {
  user?: {
    userPrincipalName: string;
    displayName: string;
    objectId: string;
  };
  app?: {
    host: {
      name: string;
    };
  };
  tenant?: {
    id: string;
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
    try {
      // Check if we're in an iframe (likely Teams)
      const isInIframe = window.parent !== window.self;
      
      if (!isInIframe) {
        return {
          isInTeams: false,
          context: null,
          account: null
        };
      }

      // Initialize Teams SDK
      await microsoftTeams.app.initialize();
      
      // Get Teams context
      const context = await microsoftTeams.app.getContext();
      console.log("Teams context obtained:", context);
      
      this.teamsContext = context;
      this.isInitialized = true;

      // Create a mock account object compatible with MSAL
      const account: AccountInfo = {
        homeAccountId: context.user?.objectId || '',
        localAccountId: context.user?.objectId || '',
        environment: 'login.microsoftonline.com',
        tenantId: context.tenant?.id || '',
        username: context.user?.userPrincipalName || '',
        name: context.user?.displayName || '',
        authorityType: 'MSSTS',
        tenantProfiles: new Map(),
        idToken: '',
        idTokenClaims: {},
        nativeAccountId: ''
      };

      return {
        isInTeams: true,
        context,
        account,
      };
      
    } catch (error) {
      console.log("Teams initialization failed (not in Teams or error):", error);
      return {
        isInTeams: false,
        context: null,
        account: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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