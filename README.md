# m-project-2

A lightweight to-do web app where users can manage tasks by category. Users can create, view, update, and delete tasks. Each task has a title, description, due date, and category. Includes secure user authentication and persistent task storage.

## Overview

This project supports two backend implementations:
- **Node.js Backend** (original) - Express.js with MySQL
- **Flask Backend** (Python) - Flask with MySQL (drop-in replacement)

Both backends provide identical API endpoints and work seamlessly with the React frontend.

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

### Option 1: Node.js Backend (Original)

```bash
# Install dependencies
npm install

# Start both backend and frontend
npm run dev

# Or start individually
npm run server  # Backend on http://localhost:4000
npm run client  # Frontend on http://localhost:3000
```

### Option 2: Flask Backend (Python)

```bash
# Setup Flask backend
cd backend-py
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Flask backend
python app.py  # Backend on http://localhost:4000

# In another terminal, start frontend
cd ../frontend
npm start  # Frontend on http://localhost:3000
```

## Available Scripts

### Root Package Scripts

```bash
npm start          # Start Node.js backend only
npm run server     # Start Node.js backend
npm run client     # Start React frontend
npm run dev        # Start both Node.js backend and frontend concurrently
npm test           # Run tests (placeholder)
```

### Flask Backend Commands

```bash
cd backend-py
source venv/bin/activate
python app.py      # Start Flask backend on http://localhost:4000
```

### Frontend Commands

```bash
cd frontend
npm start          # Start React development server on http://localhost:3000
npm build          # Build for production
npm test           # Run tests
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
```bash
cd frontend
npm run build
# Serve the build directory with nginx or Apache
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `backend/.env`
   - Ensure database exists and schema is imported

2. **Port Conflicts**
   - Ensure port 4000 is free for backend
   - Ensure port 3000 is free for frontend
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
