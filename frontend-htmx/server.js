import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: '../backend/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; // Force port 3000 for HTMX frontend

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'htmx-frontend-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy API requests to backend
app.use('/api', (req, res) => {
  const apiUrl = `http://localhost:4000${req.originalUrl}`;
  
  const headers = {
    'Cookie': req.get('cookie') || ''
  };
  
  // Only set Content-Type if not multipart/form-data (let fetch set it automatically for multipart)
  if (req.headers['content-type'] && !req.headers['content-type'].includes('multipart/form-data')) {
    headers['Content-Type'] = req.headers['content-type'];
  }
  
  // For multipart/form-data, we need to pipe the raw request body
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Stream the request body directly
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      
      fetch(apiUrl, {
        method: req.method,
        headers: {
          ...headers,
          'Content-Type': req.headers['content-type']
        },
        body: buffer,
        credentials: 'include'
      })
      .then(async (response) => {
        // Forward Set-Cookie header from backend response
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          console.log('Set-Cookie header from backend:', setCookieHeader);
          res.setHeader('Set-Cookie', setCookieHeader);
        }
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          res.status(response.status).json(data);
        } else {
          // For non-JSON responses (like images), pipe the response directly
          response.body.pipe(res);
        }
      })
      .catch(error => {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy request' });
      });
    });
  } else {
    const body = req.method !== 'GET' ? JSON.stringify(req.body) : undefined;
    
    fetch(apiUrl, {
      method: req.method,
      headers,
      body,
      credentials: 'include'
    })
    .then(async (response) => {
      // Forward Set-Cookie header from backend response
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('Set-Cookie header from backend:', setCookieHeader);
        res.setHeader('Set-Cookie', setCookieHeader);
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        // For non-JSON responses (like images), pipe the response directly
        response.body.pipe(res);
      }
    })
    .catch(error => {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy request' });
    });
  }
});

// Serve main HTML with Stripe key
app.get('/', (req, res) => {
  const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  let html = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
  
  // Inject Stripe key into the HTML
  if (stripeKey) {
    html = html.replace(
      '<meta name="stripe-publishable-key" content="">',
      `<meta name="stripe-publishable-key" content="${stripeKey}">`
    );
  }
  
  res.send(html);
});

// Serve HTML fragments for HTMX
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'payment.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`HTMX frontend server running on port ${PORT}`);
});
