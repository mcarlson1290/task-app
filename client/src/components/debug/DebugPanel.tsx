import React, { useState, useEffect } from 'react';
import { detectIOSEnvironment, testStorageAvailability } from '../../config/authConfig';

interface DebugLog {
  timestamp: string;
  message: string;
  data: any;
  isIOS: boolean;
  isTeamsApp: boolean;
  isWebView: boolean;
}

export const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  
  useEffect(() => {
    // Only show in development or if specifically enabled
    const showDebug = process.env.NODE_ENV === 'development' || 
                     sessionStorage.getItem('enableDebug') === 'true';
    
    if (!showDebug) return;
    
    // Get device info
    const { isIOS, isTeamsApp, isWebView, isSafari } = detectIOSEnvironment();
    const storageInfo = testStorageAvailability();
    
    setDeviceInfo({
      isIOS,
      isTeamsApp, 
      isWebView,
      isSafari,
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      cookies: navigator.cookieEnabled,
      online: navigator.onLine,
      storage: storageInfo,
      language: navigator.language,
      platform: navigator.platform
    });
    
    // Load existing logs
    const storedLogs = sessionStorage.getItem('authDebugLogs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.warn('Failed to parse debug logs:', e);
      }
    }
    
    // Update logs every 2 seconds
    const interval = setInterval(() => {
      const storedLogs = sessionStorage.getItem('authDebugLogs');
      if (storedLogs) {
        try {
          setLogs(JSON.parse(storedLogs));
        } catch (e) {
          console.warn('Failed to parse debug logs:', e);
        }
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Don't render in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && 
      sessionStorage.getItem('enableDebug') !== 'true') {
    return null;
  }
  
  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 12px',
          backgroundColor: deviceInfo.isIOS ? '#ff6b6b' : '#4ecdc4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
        data-testid="debug-toggle"
      >
        🐛 {deviceInfo.isIOS ? 'iOS' : 'Debug'}
      </button>
      
      {/* Debug Panel */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '50px',
            right: '10px',
            maxWidth: '400px',
            maxHeight: '500px',
            overflow: 'auto',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            fontSize: '11px',
            padding: '15px',
            borderRadius: '8px',
            zIndex: 9998,
            border: deviceInfo.isIOS ? '2px solid #ff6b6b' : '2px solid #4ecdc4'
          }}
          data-testid="debug-panel"
        >
          {/* Device Info Section */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: deviceInfo.isIOS ? '#ff6b6b' : '#4ecdc4' }}>
              📱 Device Info {deviceInfo.isIOS && '(iOS DETECTED)'}
            </h4>
            <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
              <div><strong>Platform:</strong> {deviceInfo.platform}</div>
              <div><strong>Screen:</strong> {deviceInfo.screen}</div>
              <div><strong>Viewport:</strong> {deviceInfo.viewport}</div>
              <div><strong>iOS:</strong> {deviceInfo.isIOS ? '✅' : '❌'}</div>
              <div><strong>Teams App:</strong> {deviceInfo.isTeamsApp ? '✅' : '❌'}</div>
              <div><strong>WebView:</strong> {deviceInfo.isWebView ? '✅' : '❌'}</div>
              <div><strong>Safari:</strong> {deviceInfo.isSafari ? '✅' : '❌'}</div>
              <div><strong>Cookies:</strong> {deviceInfo.cookies ? '✅' : '❌'}</div>
              <div><strong>Online:</strong> {deviceInfo.online ? '✅' : '❌'}</div>
              {deviceInfo.storage && (
                <div>
                  <strong>Storage:</strong> 
                  <span style={{ marginLeft: '4px' }}>
                    Local:{deviceInfo.storage.localStorage ? '✅' : '❌'} 
                    Session:{deviceInfo.storage.sessionStorage ? '✅' : '❌'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Auth Logs Section */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#ffd93d' }}>
              🔐 Auth Debug Logs ({logs.length})
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ fontStyle: 'italic', color: '#999' }}>No logs yet...</div>
              ) : (
                logs.slice(-10).reverse().map((log, i) => (
                  <div key={i} style={{ 
                    marginBottom: '6px', 
                    padding: '4px', 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    borderLeft: log.isIOS ? '3px solid #ff6b6b' : '3px solid #4ecdc4'
                  }}>
                    <div style={{ fontSize: '9px', color: '#ccc' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                      {log.message}
                    </div>
                    {log.data && (
                      <div style={{ fontSize: '9px', color: '#aaa', marginTop: '2px' }}>
                        {typeof log.data === 'object' ? JSON.stringify(log.data, null, 1) : log.data}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Clear Logs Button */}
          <button
            onClick={() => {
              sessionStorage.removeItem('authDebugLogs');
              setLogs([]);
            }}
            style={{
              marginTop: '10px',
              padding: '4px 8px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
            data-testid="clear-logs-button"
          >
            Clear Logs
          </button>
        </div>
      )}
    </>
  );
};

// Hook to enable debug panel
export const useDebugPanel = () => {
  useEffect(() => {
    // Enable debug panel on iOS or in development
    const { isIOS } = detectIOSEnvironment();
    if (isIOS || process.env.NODE_ENV === 'development') {
      sessionStorage.setItem('enableDebug', 'true');
    }
  }, []);
};