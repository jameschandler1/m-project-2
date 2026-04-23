# Flask Backend Documentation

## Overview

This Flask backend provides a drop-in replacement for the Node.js backend, maintaining full API compatibility with the existing React frontend. It uses the same MySQL database and implements identical authentication and task management functionality.

## Features

- **Authentication**: Session-based authentication with bcrypt password hashing
- **Task Management**: Full CRUD operations for tasks
- **Database**: MySQL with direct SQL queries (no ORM complications)
- **Security**: Input validation, CORS, session security
- **API Compatibility**: Exact JSON response formats as Node.js backend

## Prerequisites

- Python 3.8+
- MySQL server
- Existing `taskapp` database with `user` and `tasks` tables

## Installation

### 1. Setup Virtual Environment

```bash
cd backend-py
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

The Flask backend uses the same `.env` file as the Node.js backend. Ensure the `backend/.env` file exists with:

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

### 4. Database Setup

Ensure your MySQL database exists with the correct schema:

```bash
mysql -u root -pYourPassword taskapp < backend/schema.sql
```

## Running the Backend

### Development Server

```bash
cd backend-py
source venv/bin/activate
python app.py
```

The server will start on `http://localhost:4000`

### Production Deployment

For production, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn --bind 0.0.0.0:4000 app:app
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
- **Input Validation**: Email and password validation
- **CORS Protection**: Configured for frontend origins
- **SQL Injection Prevention**: Parameterized queries
- **Session Store**: MySQL-based session storage

## Database Schema

The backend uses the same database schema as Node.js:

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

The Flask backend uses the same environment variables as Node.js:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | (required) |
| `DB_NAME` | Database name | taskapp |
| `SESSION_SECRET` | Session secret key | (required) |
| `NODE_ENV` | Environment | development |

## Frontend Compatibility

This Flask backend is **100% compatible** with the existing React frontend. No changes are required to the frontend code.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `backend/.env`
   - Ensure database exists and schema is imported

2. **Session Issues**
   - Verify `SESSION_SECRET` is set in `backend/.env`
   - Check cookie settings for HTTP/HTTPS
   - Ensure session store tables exist

3. **CORS Issues**
   - Verify frontend URL is in CORS configuration
   - Check that credentials are being sent in requests

4. **Authentication Issues**
   - Ensure session middleware is properly configured
   - Check that session cookies are being sent
   - Verify user exists in database

## Development Notes

- Uses Flask with direct SQL queries (no ORM complications)
- MySQL connection pooling for performance
- Session-based authentication
- Comprehensive input validation
- Error handling and logging
- CORS configured for frontend development

## Comparison with Node.js Backend

| Feature | Node.js | Flask |
|---------|---------|-------|
| **Framework** | Express.js | Flask |
| **Database** | mysql2 | mysql-connector-python |
| **Sessions** | express-mysql-session | Flask-Session |
| **Password Hashing** | bcrypt | bcrypt |
| **CORS** | cors middleware | Flask-CORS |
| **Validation** | express-validator | Custom validation |
| **Response Format** | Identical | Identical |

## Performance

- **Startup Time**: ~1-2 seconds
- **Memory Usage**: ~50-100MB
- **Request Handling**: Synchronous, efficient
- **Database**: Direct SQL queries, no ORM overhead
