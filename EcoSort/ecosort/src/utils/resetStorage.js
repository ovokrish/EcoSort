/**
 * Utility to reset the localStorage ecoPoints
 */

// Reset ecoPoints in localStorage to zero
localStorage.removeItem('ecoPoints');
localStorage.setItem('ecoPoints', '0');

console.log('✅ EcoPoints have been reset to 0'); 