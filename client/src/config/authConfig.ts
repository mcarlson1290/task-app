// iOS Detection Utility
export const detectIOSEnvironment = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isTeamsApp = /Teams/.test(ua);
  const isWebView = !/Safari/.test(ua) || /CriOS/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  
  return { isIOS, isTeamsApp, isWebView, isSafari };
};

// Debug Logging Utility
export const debugLog = (message: string, data: any = null) => {
  const timestamp = new Date().toISOString();
  const { isIOS, isTeamsApp, isWebView } = detectIOSEnvironment();
  
  console.log(`[AUTH DEBUG ${timestamp}] ${message}`, {
    data,
    isIOS,
    isTeamsApp,
    isWebView,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor
  });
  
  // Store in sessionStorage for remote debugging
  try {
    const logs = JSON.parse(sessionStorage.getItem('authDebugLogs') || '[]');
    logs.push({ timestamp, message, data, isIOS, isTeamsApp, isWebView });
    // Keep only last 50 logs
    if (logs.length > 50) logs.shift();
    sessionStorage.setItem('authDebugLogs', JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to store debug log:', e);
  }
};

// Storage Availability Test
export const testStorageAvailability = () => {
  const results = {
    localStorage: false,
    sessionStorage: false,
    cookies: false
  };
  
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    results.localStorage = true;
    debugLog('localStorage available');
  } catch (e) {
    debugLog('localStorage blocked', { error: (e as Error).message });
  }
  
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    results.sessionStorage = true;
    debugLog('sessionStorage available');
  } catch (e) {
    debugLog('sessionStorage blocked', { error: (e as Error).message });
  }
  
  try {
    document.cookie = "test=test; SameSite=None; Secure";
    results.cookies = document.cookie.includes('test');
    debugLog('Cookies status', { enabled: results.cookies });
  } catch (e) {
    debugLog('Cookies test failed', { error: (e as Error).message });
  }
  
  return results;
};

const { isIOS } = detectIOSEnvironment();

export const msalConfig = {
  auth: {
    clientId: "0b4cf8e2-eda5-4fd9-8319-7ec72614f0f2", // Your Application ID
    authority: "https://login.microsoftonline.com/86f7db5f-eb1e-4ac8-b010-4a2964d7749c", // Your Directory ID
    redirectUri: window.location.origin, // Automatically uses current URL
    navigateToLoginRequestUrl: false // Important for iOS
  },
  cache: {
    cacheLocation: "sessionStorage", // Better compatibility with iOS
    storeAuthStateInCookie: isIOS, // Enable for iOS Safari
    secureCookies: true
  },
  system: {
    allowNativeBroker: false, // Disable for iOS web apps
    windowHashTimeout: isIOS ? 90000 : 60000, // Increase timeout for iOS
    iframeHashTimeout: isIOS ? 15000 : 10000,
    navigateFrameWait: isIOS ? 1000 : 0,
    loadFrameTimeout: isIOS ? 10000 : 6000
  }
};

export const loginRequest = {
  scopes: ["User.Read", "email", "profile", "openid"]
};

// Email domain validation
export const isAuthorizedEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@growspace.farm');
};