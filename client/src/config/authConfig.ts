export const msalConfig = {
  auth: {
    clientId: "0b4cf8e2-eda5-4fd9-8319-7ec72614f0f2", // Your Application ID
    authority: "https://login.microsoftonline.com/86f7db5f-eb1e-4ac8-b010-4a2964d7749c", // Your Directory ID
    redirectUri: window.location.origin, // Automatically uses current URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "email", "profile", "openid"]
};

// Email domain validation
export const isAuthorizedEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@growspace.farm');
};