import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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
  
  fetch(apiUrl, {
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Cookie': req.get('cookie') || ''
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    credentials: 'include'
  })
  .then(async (response) => {
    const data = await response.json();
    res.status(response.status).json(data);
  })
  .catch(error => {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  });
});

// Serve main HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
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
