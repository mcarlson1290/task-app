import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest, isAuthorizedEmail, detectIOSEnvironment, debugLog } from '../../config/authConfig';

export const MicrosoftLogin = () => {
  const { instance, inProgress } = useMsal();
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [showIOSFallback, setShowIOSFallback] = useState(false);
  
  useEffect(() => {
    const info = detectIOSEnvironment();
    setDeviceInfo(info);
    debugLog('MicrosoftLogin component mounted', info);
    
    // Show iOS fallback after 3 seconds if on iOS and no accounts
    if (info.isIOS) {
      setTimeout(() => {
        const hasAccounts = instance.getAllAccounts().length > 0;
        if (!hasAccounts) {
          debugLog('Showing iOS login fallback after timeout');
          setShowIOSFallback(true);
        }
      }, 3000);
    }
  }, [instance]);

  const handleLogin = async () => {
    debugLog('Login attempt started', { 
      method: deviceInfo.isIOS ? 'redirect' : 'popup',
      isIOS: deviceInfo.isIOS 
    });
    
    try {
      let response;
      
      // Use redirect flow for iOS, popup for others
      if (deviceInfo.isIOS || deviceInfo.isWebView) {
        debugLog('Using redirect flow for iOS/WebView');
        await instance.loginRedirect({
          ...loginRequest,
          prompt: "select_account",
          redirectStartPage: window.location.href
        });
        return; // Redirect will handle the response
      } else {
        debugLog('Using popup flow for desktop');
        response = await instance.loginPopup(loginRequest);
      }
      
      if (response) {
        debugLog('Login successful', { 
          username: response.account.username,
          name: response.account.name 
        });
        
        // Check email domain
        if (!isAuthorizedEmail(response.account.username)) {
          debugLog('Email domain check failed', { email: response.account.username });
          alert('Access denied. Only Grow Space employees can access this app.');
          await instance.logoutPopup();
        }
      }
    } catch (error) {
      debugLog('Login failed', { 
        error: (error as any).message,
        errorCode: (error as any).errorCode,
        errorDesc: (error as any).errorDesc 
      });
      console.error('Login failed:', error);
    }
  };

  const handleRedirectResponse = async () => {
    try {
      debugLog('Handling redirect response');
      const response = await instance.handleRedirectPromise();
      if (response) {
        debugLog('Redirect response received', { 
          username: response.account?.username 
        });
        return response;
      }
    } catch (error) {
      debugLog('Handle redirect failed', { error: (error as Error).message });
    }
  };
  
  // Handle redirect response on mount
  useEffect(() => {
    if (deviceInfo.isIOS) {
      handleRedirectResponse();
    }
  }, [deviceInfo.isIOS]);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-section">
          <h1>🌱 Grow Space</h1>
          <h2>Task Management System</h2>
        </div>
        
        <div className="login-section">
          <p>Sign in with your Grow Space Microsoft account</p>
          
          {/* iOS Detection Info */}
          {deviceInfo.isIOS && (
            <div style={{
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#856404'
            }}>
              📱 iOS detected - using redirect authentication
            </div>
          )}
          
          <button 
            onClick={handleLogin} 
            className="microsoft-signin-btn"
            disabled={inProgress === "login"}
            data-testid="microsoft-login-button"
          >
            <svg width="21" height="21" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            {deviceInfo.isIOS ? 'Sign in (Redirect)' : 'Sign in with Microsoft'}
          </button>
          
          {/* iOS Fallback Message */}
          {showIOSFallback && deviceInfo.isIOS && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#721c24'
            }}>
              <strong>Auto-login not available on this device</strong><br/>
              Please tap the button above to sign in manually.
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <p className="security-note">
            🔒 Secure login through Microsoft Azure AD
          </p>
        </div>
      </div>
    </div>
  );
};