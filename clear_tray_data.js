// Clear tray data from localStorage for testing
console.log('Clearing tray data from localStorage...');

// Clear the tray tracking data
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('trayTrackingData');
  console.log('Tray data cleared from localStorage');
} else {
  console.log('localStorage not available in this context');
}
