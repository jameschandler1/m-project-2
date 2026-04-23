# Node.js Backend Documentation

## Overview

This Node.js backend provides a RESTful API for the task management application with secure authentication and task CRUD operations. It uses Express.js with MySQL for data persistence.

## Features

- **Authentication**: Session-based authentication with bcrypt password hashing
- **Task Management**: Full CRUD operations for tasks
- **Database**: MySQL with connection pooling
- **Security**: Input validation, CORS, session security
- **API**: RESTful endpoints with JSON responses

## Prerequisites

- Node.js 14+
- MySQL server
- Existing `taskapp` database with `user` and `tasks` tables

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskapp

# Session Configuration
SESSION_SECRET=your_very_long_random_secret_key_here_at_least_32_characters

# Environment
NODE_ENV=development
```

### 3. Database Setup

Ensure your MySQL database exists with the correct schema:

```bash
mysql -u root -pYourPassword taskapp < schema.sql
```

## Running the Backend

### Development Server

```bash
cd backend
npm run server
```

The server will start on `http://localhost:4000`

### With Frontend (Concurrent)

From the project root directory:

```bash
npm run dev
```

This runs both backend and frontend concurrently.

### Production Deployment

For production, use PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start backend/server.js --name "taskapp-backend"

# View logs
pm2 logs

# Stop
pm2 stop taskapp-backend
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |

#### Register Request
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### Register Response
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

#### Login Request
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### Login Response
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks for authenticated user |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/:id` | Get single task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

#### Create Task Request
```json
{
  "title": "New Task",
  "description": "Task description",
  "due_date": "2026-04-25"
}
```

#### Create Task Response
```json
{
  "id": 123
}
```

#### Task List Response
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Task Title",
    "description": "Description",
    "due_date": "2026-04-25",
    "category": null,
    "completed": false,
    "created_at": "2026-04-23T10:30:00.000Z",
    "updated_at": "2026-04-23T10:30:00.000Z"
  }
]
```

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **Session Management**: Secure HTTP-only cookies
- **Input Validation**: express-validator for all inputs
- **CORS Protection**: Configured for frontend origins
- **SQL Injection Prevention**: Parameterized queries
- **Session Store**: MySQL-based session storage

## Database Schema

### User Table
```sql
CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  category VARCHAR(100) NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | (required) |
| `DB_NAME` | Database name | taskapp |
| `SESSION_SECRET` | Session secret key | (required) |
| `NODE_ENV` | Environment | development |

## Project Structure

```
backend/
|-- db.js              # Database connection configuration
|-- middleware/
|   |-- auth.js        # Authentication middleware
|-- models/
|   |-- user.js        # User model and database operations
|   |-- task.js        # Task model and database operations
|-- routes/
|   |-- auth.js        # Authentication routes
|   |-- tasks.js       # Task CRUD routes
|-- server.js          # Main Express server
|-- schema.sql         # Database schema
|-- .env.example       # Environment variables template
|-- package.json       # Dependencies and scripts
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node backend/server.js` | Start production server |
| `server` | `node backend/server.js` | Start backend server |
| `dev` | `concurrently "npm run server" "npm run client"` | Run backend and frontend |
| `client` | `cd frontend && npm start` | Start frontend only |

## Security Implementation

### Password Security
- Uses bcrypt with 10 salt rounds
- Password complexity requirements: 8+ chars, uppercase, lowercase, number
- Passwords are never stored in plaintext

### Session Security
- HTTP-only cookies prevent XSS attacks
- SameSite strict prevents CSRF attacks
- Secure flag for HTTPS in production
- MySQL session store for persistence

### Input Validation
- Email validation and normalization
- Password complexity validation
- Task field validation (title length, date format)
- SQL injection prevention via parameterized queries

### Data Minimization
- Passwords never returned in responses
- Only necessary user data exposed
- Tasks filtered by user ownership

## Frontend Compatibility

This Node.js backend is fully compatible with the React frontend. The API endpoints and JSON responses are designed to work seamlessly with the existing frontend code.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists and schema is imported

2. **Session Issues**
   - Verify `SESSION_SECRET` is set in `.env`
   - Check cookie settings for HTTP/HTTPS
   - Ensure session store tables exist

3. **CORS Issues**
   - Verify frontend URL in CORS origin list
   - Check that credentials are being sent in requests

4. **Authentication Issues**
   - Ensure session middleware is properly configured
   - Check that session cookies are being sent
   - Verify user exists in database

## Production Deployment

### EC2 Deployment

1. **Setup Server**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

2. **Setup Database**
```bash
# Create database and user
mysql -u root -p
CREATE DATABASE taskapp;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON taskapp.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

3. **Deploy Application**
```bash
# Clone repository
git clone https://github.com/yourusername/m-project-2.git
cd m-project-2

# Install dependencies
npm install

# Setup environment
cp backend/.env.example backend/.env
# Edit .env with your settings

# Import schema
mysql -u root -pYourPassword taskapp < backend/schema.sql

# Start with PM2
pm2 start backend/server.js --name "taskapp-backend"
pm2 startup
pm2 save
```

## Development Notes

- Uses Express.js with middleware for security
- MySQL connection pooling for performance
- Session-based authentication
- Comprehensive input validation
- Error handling and logging
- CORS configured for frontend development
