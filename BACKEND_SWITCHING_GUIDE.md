# Backend Switching Guide

This guide explains how to switch between Node.js and Django backends while maintaining full compatibility with the React frontend.

## Overview

Both backends are designed to be **drop-in replacements** for each other. The React frontend requires no changes when switching between backends because:

- Both use identical API endpoints
- Both return the same JSON response formats
- Both implement the same authentication system
- Both use the same database schema

## Quick Comparison

| Feature | Node.js Backend | Django Backend |
|---------|----------------|---------------|
| **Port** | 4000 | 4000 |
| **Database** | MySQL | MySQL |
| **Authentication** | Session-based | Session-based |
| **Password Hashing** | bcrypt | bcrypt |
| **API Endpoints** | Identical | Identical |
| **JSON Responses** | Identical | Identical |
| **CORS** | Configured | Configured |
| **Session Store** | MySQL | Django Sessions |

## Switching Between Backends

### Option 1: Local Development

#### Using Node.js Backend
```bash
# Start Node.js backend
cd backend
npm run server

# In another terminal, start frontend
cd frontend
npm start
```

#### Using Django Backend
```bash
# Start Django backend
cd backend-py
source venv/bin/activate
python manage.py runserver 4000

# In another terminal, start frontend
cd frontend
npm start
```

### Option 2: Concurrent Development

#### Node.js + Frontend
```bash
# From project root
npm run dev
```

#### Django + Frontend
```bash
# Terminal 1: Django backend
cd backend-py
source venv/bin/activate
python manage.py runserver 4000

# Terminal 2: Frontend
cd frontend
npm start
```

## Frontend Compatibility

### API Endpoints (Both Backends)

#### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login` 
- `POST /api/auth/logout`

#### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Response Formats (Identical)

#### Register/Login Response
```json
{
  "id": 1,
  "email": "user@example.com"
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

#### Task Create Response
```json
{
  "id": 123
}
```

#### Task Update/Delete Response
```json
{
  "success": true
}
```

## Frontend Code Requirements

The React frontend code works with both backends without any modifications:

### Authentication Calls
```javascript
// Login - works with both backends
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password })
});
```

### Task Operations
```javascript
// Get tasks - works with both backends
const tasks = await fetch('/api/tasks', {
  credentials: 'include'
}).then(res => res.json());

// Create task - works with both backends
const newTask = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(taskData)
}).then(res => res.json());
```

## Database Compatibility

Both backends use the **exact same database schema** and can share the same MySQL database:

### Shared Tables
- `user` table with identical structure
- `tasks` table with identical structure
- Same password hashing (bcrypt)
- Same session data (user_id)

### Switching Database Access

Both backends connect to the same database:

```env
# Node.js .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskapp

# Django .env (same database)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskapp
```

## Deployment Scenarios

### Scenario 1: Same Database, Different Backends

You can run both backends against the same database for testing:

```bash
# Stop Node.js backend
# Start Django backend
cd backend-py
source venv/bin/activate
python manage.py runserver 4000
```

All existing users and tasks will work immediately with Django.

### Scenario 2: Production Migration

For production deployment:

1. **Backup existing database**
2. **Deploy Django backend**
3. **Update environment variables**
4. **Test with existing data**
5. **Switch traffic to Django backend**

### Scenario 3: A/B Testing

Run both backends on different ports for comparison:

```bash
# Node.js on port 4000
cd backend && npm run server

# Django on port 4001  
cd backend-py && python manage.py runserver 4001
```

Update frontend API base URL to test either backend.

## Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Document current Node.js version
- [ ] Test Django backend locally
- [ ] Verify all API endpoints work

### Migration Steps
- [ ] Deploy Django backend to staging
- [ ] Test with sample data
- [ ] Test with production data copy
- [ ] Update production environment
- [ ] Switch traffic to Django
- [ ] Monitor for issues

### Post-Migration
- [ ] Verify all functionality works
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] User acceptance testing

## Troubleshooting

### Common Issues When Switching

1. **Session Incompatibility**
   - **Issue**: Existing sessions don't work
   - **Solution**: Users need to re-login after backend switch
   - **Note**: This is expected behavior

2. **CORS Issues**
   - **Issue**: Frontend can't connect to new backend
   - **Solution**: Verify CORS settings in new backend
   - **Check**: Frontend URL is in allowed origins

3. **Database Connection**
   - **Issue**: Backend can't connect to database
   - **Solution**: Verify database credentials and permissions
   - **Check**: Database is accessible from new backend

4. **Port Conflicts**
   - **Issue**: Port 4000 already in use
   - **Solution**: Stop other backend before starting new one
   - **Command**: `lsof -ti:4000 | xargs kill`

## Performance Comparison

### Node.js Backend
- **Startup Time**: ~1-2 seconds
- **Memory Usage**: ~50-100MB
- **Request Handling**: Event-driven, non-blocking
- **Database**: MySQL connection pooling

### Django Backend
- **Startup Time**: ~3-5 seconds
- **Memory Usage**: ~100-200MB
- **Request Handling**: WSGI process-based
- **Database**: Django ORM with connection pooling

## Security Comparison

Both backends implement identical security measures:

| Security Feature | Node.js | Django |
|------------------|---------|--------|
| **Password Hashing** | bcrypt (10 rounds) | bcrypt (10 rounds) |
| **Session Security** | HTTP-only, secure cookies | HTTP-only, secure cookies |
| **Input Validation** | express-validator | Django validators |
| **CSRF Protection** | Built-in middleware | Built-in middleware |
| **SQL Injection** | Parameterized queries | Django ORM |
| **CORS** | Configured origins | Configured origins |

## Development Workflow

### Recommended Workflow

1. **Develop with Node.js** (faster startup, simpler debugging)
2. **Test with Django** (production-like environment)
3. **Deploy with Django** (more robust for production)

### Code Sharing

Both backends can use the same:
- Database schema
- API documentation
- Test cases
- Environment variables (with minor differences)

## Support and Maintenance

### Node.js Backend
- **Community**: Large Node.js ecosystem
- **Debugging**: JavaScript debugging tools
- **Updates**: npm package updates
- **Monitoring**: Node.js specific tools

### Django Backend
- **Community**: Mature Django ecosystem
- **Debugging**: Django debug toolbar
- **Updates**: pip package updates
- **Monitoring**: Django admin interface

## Conclusion

Both backends provide identical functionality with the React frontend. The choice between them depends on:

- **Development preference** (JavaScript vs Python)
- **Deployment requirements** (performance vs features)
- **Team expertise** (Node.js vs Django skills)
- **Production needs** (scalability vs maintainability)

The switching process is designed to be seamless, with zero frontend changes required.
