/**
 * @fileoverview Application entry point
 * @description Main entry point for the SolidJS application. Sets up the virtual DOM,
 * routing, and renders the root App component into the DOM.
 * 
 * @module main
 * @author Generated
 * @since 1.0.0
 */
import { render } from 'solid-js/web';
import { Router } from 'solid-app-router';
import './app.css';  // Import global styles
import App from './App';  // Import root application component

/**
 * Renders the SolidJS application into the DOM
 * 
 * Wraps the App component with Router for client-side routing
 * and mounts it to the root DOM element.
 */
render(() => (
  <Router>
    {/* Router provides client-side routing capabilities */}
    <App />
  </Router>
), document.getElementById('root'));  // Mount to root element in index.html
