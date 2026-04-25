# m-project-2

A lightweight to-do web app where users can manage tasks by category. Users can create, view, update, and delete tasks. Each task has a title, description, due date, and category. Includes secure user authentication and persistent task storage. Contains two frontends one is React.js and the other is Solid.js. We also Have two backends one is Node based the other is Python (flask). All frontends and Backends are interchangeable, meaning they fullfill the same contracts, and they are also stylistically the same (same css). Currently only one backend can run at a time, which will be updated soon.

## Overview

This project supports multiple backend and frontend implementations:

**Backends:**
- **Node.js Backend** (original) - Express.js with MySQL
- **Flask Backend** (Python) - Flask with MySQL (drop-in replacement)

**Frontends:**
- **React Frontend** (original) - React with custom CSS
- **Solid.js Frontend** - Solid.js with identical styling and functionality

All backends provide identical API endpoints and work seamlessly with both frontends. Frontends are interchangeable and maintain the same appearance and functionality.

## Prerequisites

- Node.js 16+ (for Node.js backend)
- Python 3.8+ (for Flask backend)
- MySQL server
- npm (for frontend and Node.js backend)

## Database Setup

1. Install MySQL and create the database:
```bash
mysql -u root -p
CREATE DATABASE taskapp;
```

2. Import the database schema:
```bash
mysql -u root -p taskapp < backend/schema.sql
```

3. Configure environment variables in `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskapp
SESSION_SECRET=your_very_long_random_secret_key_here_at_least_32_characters
NODE_ENV=development
```

## Quick Start

### Option 1: Node.js Backend + React Frontend (Original)

```bash
# Install dependencies
npm install

# Start both backend and frontend
npm run dev

# Or start individually
npm run server  # Backend on http://localhost:4000
npm run client  # React frontend on http://localhost:3000
```

### Option 2: Node.js Backend + Solid.js Frontend

```bash
# Start Node.js backend
npm run server  # Backend on http://localhost:4000

# In another terminal, start Solid.js frontend
cd frontend-sld
npm install
npm run dev     # Solid.js frontend on http://localhost:3001
```

### Option 3: Flask Backend + React Frontend

```bash
# Setup Flask backend
cd backend-py
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Flask backend
python app.py  # Backend on http://localhost:4000

# In another terminal, start React frontend
cd ../frontend
npm start  # React frontend on http://localhost:3000
```

### Option 4: Flask Backend + Solid.js Frontend

```bash
# Setup Flask backend
cd backend-py
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Flask backend
python app.py  # Backend on http://localhost:4000

# In another terminal, start Solid.js frontend
cd ../frontend-sld
npm install
npm run dev     # Solid.js frontend on http://localhost:3001
```

## Available Scripts

### Root Package Scripts

```bash
npm start          # Start Node.js backend only
npm run server     # Start Node.js backend
npm run client     # Start React frontend
npm run dev        # Start both Node.js backend and React frontend concurrently
npm run dev-solid  # Start both Node.js backend and Solid.js frontend concurrently
npm run solid      # Start Solid.js frontend only
npm test           # Run tests (placeholder)
```

### Flask Backend Commands

```bash
cd backend-py
source venv/bin/activate
python app.py      # Start Flask backend on http://localhost:4000
```

### Frontend Commands

**React Frontend:**
```bash
cd frontend
npm start          # Start React development server on http://localhost:3000
npm build          # Build for production
npm test           # Run tests
```

**Solid.js Frontend:**
```bash
cd frontend-sld
npm install        # Install dependencies
npm run dev        # Start Solid.js development server on http://localhost:3001
npm run build      # Build for production
npm run preview    # Preview production build
```

## Project Structure

```
m-project-2/
├── backend/              # Node.js backend
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── server.js        # Main server file
│   ├── schema.sql       # Database schema
│   └── .env            # Environment variables
├── backend-py/           # Flask backend (Python)
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   ├── README.md        # Flask backend documentation
│   └── venv/           # Virtual environment
├── frontend/             # React frontend
│   ├── src/            # React source code
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies
├── frontend-sld/         # Solid.js frontend
│   ├── src/            # Solid.js source code
│   ├── index.html      # HTML entry point
│   ├── vite.config.js  # Vite configuration
│   └── package.json    # Solid.js dependencies
├── package.json         # Root package scripts
└── README.md           # This file
```

## API Endpoints

Both backends provide identical API endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tasks
- `GET /api/tasks` - Get all tasks for authenticated user
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Backend Comparison

| Feature | Node.js | Flask |
|---------|---------|-------|
| **Framework** | Express.js | Flask |
| **Database** | mysql2 | mysql-connector-python |
| **Sessions** | express-mysql-session | Flask-Session |
| **Password Hashing** | bcrypt | bcrypt |
| **CORS** | cors middleware | Flask-CORS |
| **Validation** | express-validator | Custom validation |
| **Response Format** | Identical | Identical |

## Development

### Node.js Backend Development
```bash
cd backend
npm install
npm run dev
```

### Flask Backend Development
```bash
cd backend-py
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## Production Deployment

### Node.js Backend
```bash
# Install production dependencies
npm ci --production

# Use PM2 for process management
npm install -g pm2
pm2 start backend/server.js --name "taskapp-backend"
```

### Flask Backend
```bash
cd backend-py
source venv/bin/activate
pip install gunicorn
gunicorn --bind 0.0.0.0:4000 app:app
```

### Frontend

**React Frontend:**
```bash
cd frontend
npm run build
# Serve the build directory with nginx or Apache
```

**Solid.js Frontend:**
```bash
cd frontend-sld
npm run build
npm run preview  # Preview production build
# Serve the dist directory with nginx or Apache
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `backend/.env`
   - Ensure database exists and schema is imported

2. **Port Conflicts**
   - Ensure port 4000 is free for backend
   - Ensure port 3000 is free for React frontend
   - Ensure port 3001 is free for Solid.js frontend
   - Kill processes using these ports if needed

3. **Environment Variables**
   - Copy `.env.example` to `.env` if it doesn't exist
   - Set proper database credentials
   - Generate a secure SESSION_SECRET

4. **Flask Backend Issues**
   - Activate virtual environment: `source venv/bin/activate`
   - Install dependencies: `pip install -r requirements.txt`
   - Check Python version (3.8+ required)

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **Session Management**: Secure HTTP-only cookies
- **Input Validation**: Email and password validation
- **CORS Protection**: Configured for frontend origins
- **SQL Injection Prevention**: Parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both backends if applicable
5. Submit a pull request

## License

ISC
