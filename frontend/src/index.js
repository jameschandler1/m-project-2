/**
 * React Application Entry Point
 * 
 * This file is the main entry point for the React application.
 * It renders the root App component into the DOM and initializes
 * performance monitoring with reportWebVitals.
 * 
 * Rendering Flow:
 * 1. Import React and ReactDOM dependencies
 * 2. Import global styles and App component
 * 3. Create React root for concurrent rendering
 * 4. Render App component with StrictMode enabled
 * 5. Initialize performance monitoring
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global styles
import App from './App'; // Main application component
import reportWebVitals from './reportWebVitals'; // Performance monitoring

// Create React 18 root for concurrent features
// This replaces the legacy ReactDOM.render() API
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the main application with StrictMode enabled
// StrictMode helps catch potential issues and provides warnings
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize performance monitoring
// reportWebVitals collects metrics like FCP, LCP, TTFB, and CLS
// This helps identify performance issues in production
// 
// Usage Options:
// - reportWebVitals(console.log) for development logging
// - Custom endpoint for analytics integration
// Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
