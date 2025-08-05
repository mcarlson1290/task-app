import React from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest, isAuthorizedEmail } from '../../config/authConfig';

export const MicrosoftLogin = () => {
  const { instance, inProgress } = useMsal();

  const handleLogin = async () => {
    try {
      const response = await instance.loginPopup(loginRequest);
      console.log('Login successful:', response);
      
      // Check email domain
      if (!isAuthorizedEmail(response.account.username)) {
        alert('Access denied. Only Grow Space employees can access this app.');
        await instance.logoutPopup();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-section">
          <h1>🌱 Grow Space</h1>
          <h2>Task Management System</h2>
        </div>
        
        <div className="login-section">
          <p>Sign in with your Grow Space Microsoft account</p>
          
          <button 
            onClick={handleLogin} 
            className="microsoft-signin-btn"
            disabled={inProgress === "login"}
          >
            <svg width="21" height="21" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>
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