/**
 * @fileoverview Vite configuration for SolidJS application
 * @description Configures Vite build tool with SolidJS plugin and development server.
 * Includes proxy configuration for API requests to backend server.
 * 
 * @module vite.config
 * @author Generated
 * @since 1.0.0
 */
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * Vite configuration object
 * 
 * Configures the development server with proxy settings and includes
 * the SolidJS plugin for proper JSX compilation and hot module replacement.
 */
export default defineConfig({
  plugins: [solid()],  // SolidJS plugin for JSX compilation and HMR
  
  server: {
    port: 3001,              // Development server port (different from React frontend)
    host: true,               // Allow external connections for testing
    
    // Proxy configuration for API requests
    proxy: {
      '/api': {
        target: 'http://localhost:4000',  // Backend server URL
        changeOrigin: true,                // Change origin header to match target
        secure: false,                     // Allow self-signed certificates
      }
    }
  }
});
