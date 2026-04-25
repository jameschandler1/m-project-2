#!/usr/bin/env python3
"""
Flask Backend API for Task Tracking Application

This Flask application provides a REST API that exactly matches the Node.js backend
functionality and database schema. It handles user authentication and task management
with MySQL database integration.

Features:
- User registration and authentication with bcrypt password hashing
- Session-based authentication
- CRUD operations for tasks
- CORS support for frontend integration
- Input validation and error handling

Environment Variables Required:
- SESSION_SECRET: Secret key for session encryption
- DB_HOST: MySQL server hostname
- DB_PORT: MySQL server port (default: 3306)
- DB_USER: MySQL username
- DB_PASSWORD: MySQL password
- DB_NAME: Database name (default: taskapp)
- CORS_ORIGINS: Comma-separated list of allowed origins
"""

import os
import re
import json
import bcrypt
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
from datetime import datetime, date

# Load environment variables from backend/.env
# This allows sharing the same .env file between Node.js and Python backends
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Initialize Flask application
app = Flask(__name__)
# Set secret key for session management
# Falls back to development key if not set (should be overridden in production)
app.secret_key = os.getenv('SESSION_SECRET', 'dev-secret-key')

# Configure CORS origins from environment variable
# Parse comma-separated origins and strip whitespace
cors_origins = [
    o.strip() for o in os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:3001,http://52.14.51.85:3000,http://52.14.51.85:3001'
    ).split(',')
]

# Apply CORS middleware with comprehensive configuration
# supports_credentials=True allows cookies to be sent with cross-origin requests
CORS(app, 
     origins=cors_origins,
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE'],
     allow_headers=['Content-Type'])

# =====================================================
# Database Connection Management
# =====================================================

def get_db_connection():
    """
    Create and return a MySQL database connection
    
    This function establishes a connection to the MySQL database using
    environment variables for configuration. It uses autocommit mode
    for simplicity in this application.
    
    Returns:
        mysql.connector.connection.MySQLConnection: Database connection object
        None: If connection fails
        
    Environment Variables Used:
        - DB_HOST: Database server hostname (default: localhost)
        - DB_PORT: Database server port (default: 3306)
        - DB_USER: Database username (default: root)
        - DB_PASSWORD: Database password (default: empty)
        - DB_NAME: Database name (default: taskapp)
    """
    try:
        # Establish database connection with configuration from environment
        # Parameter chain: environment variables -> connection parameters -> MySQL connection
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '3306')),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'taskapp'),
            autocommit=True  # Auto-commit for simplicity (consider transactions for production)
        )
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

# =====================================================
# Input Validation Functions
# =====================================================

def validate_email(email):
    """
    Validate email format using regular expression
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if email format is valid, False otherwise
        
    Pattern Explanation:
        - ^[a-zA-Z0-9._%+-]+: Local part (alphanumeric and common symbols)
        - @: Literal @ symbol
        - [a-zA-Z0-9.-]+: Domain name
        - \.[a-zA-Z]{2,}$: Top-level domain (2+ letters)
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength requirements
    
    Password must meet the following criteria:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    
    Args:
        password (str): Password to validate
        
    Returns:
        bool: True if password meets all requirements, False otherwise
    """
    if len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_upper and has_lower and has_digit

# =====================================================
# Authentication Middleware
# =====================================================

def require_auth(f):
    """
    Decorator to require authentication for Flask routes
    
    This decorator checks if a valid user session exists before allowing
    access to protected routes. If no user_id is found in the session,
    it returns a 401 Unauthorized response.
    
    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            return jsonify({'message': 'Access granted'})
    
    Args:
        f (function): The Flask route function to protect
        
    Returns:
        function: Decorated function that checks authentication
    """
    def decorated_function(*args, **kwargs):
        # Check if user_id exists in session (set during login)
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        # If authenticated, proceed with the original function
        return f(*args, **kwargs)
    # Preserve the original function name for Flask routing
    decorated_function.__name__ = f.__name__
    return decorated_function

# Authentication routes
# =====================================================
# Authentication Routes
# =====================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """
    Register a new user account
    
    This endpoint creates a new user with email and password.
    It validates input, checks for existing users, hashes passwords,
    and creates a session for the new user.
    
    Request Body:
        - email (string): User's email address
        - password (string): User's password
        
    Response:
        - 201: Success with user ID and email
        - 400: Validation errors
        - 409: Email already registered
        - 500: Server error
    """
    try:
        # Extract and parse JSON data from request
        data = request.get_json()
        email = data.get('email', '').strip().lower()  # Normalize email: trim and lowercase
        password = data.get('password', '')
        
        # Input validation using helper functions
        errors = []
        if not validate_email(email):
            errors.append({'field': 'email', 'message': 'Invalid email format'})
        if not validate_password(password):
            errors.append({'field': 'password', 'message': 'Password must be at least 8 characters with uppercase, lowercase, and number'})
        
        # Return validation errors if any
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Establish database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            # Create cursor with dictionary=True for row results as dictionaries
            cursor = conn.cursor(dictionary=True)
            
            # Check if user with this email already exists
            cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({'error': 'Email already registered'}), 409
            
            # Hash password using bcrypt with salt
            # Parameter chain: password -> encode -> hashpw -> decode -> store
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Insert new user into database
            cursor.execute("INSERT INTO user (email, hashed_password) VALUES (%s, %s)", (email, hashed_password))
            user_id = cursor.lastrowid  # Get ID of newly inserted user
            
            # Create session for authenticated user
            session['user_id'] = user_id
            
            # Return response matching Node.js format exactly
            return jsonify({'id': user_id, 'email': email}), 201
            
        finally:
            # Always close cursor and connection to prevent resource leaks
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Authenticate and login a user
    
    This endpoint validates user credentials and creates a session
    if authentication is successful.
    
    Request Body:
        - email (string): User's email address
        - password (string): User's password
        
    Response:
        - 200: Success with user ID and email
        - 400: Validation errors
        - 401: Invalid credentials
        - 500: Server error
    """
    try:
        # Extract and normalize login credentials
        data = request.get_json()
        email = data.get('email', '').strip().lower()  # Normalize email format
        password = data.get('password', '')
        
        # Input validation
        errors = []
        if not validate_email(email):
            errors.append({'field': 'email', 'message': 'Invalid email format'})
        if not password:
            errors.append({'field': 'password', 'message': 'Password is required'})
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Establish database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Retrieve user by email (includes hashed password for verification)
            cursor.execute("SELECT id, email, hashed_password FROM user WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if not user:
                # User not found - return generic error for security
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Verify password against stored hash
            # Parameter chain: input password -> encode -> compare with stored hash
            if not bcrypt.checkpw(password.encode('utf-8'), user['hashed_password'].encode('utf-8')):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Create authenticated session
            session['user_id'] = user['id']
            
            # Return user information (excluding sensitive data)
            return jsonify({'id': user['id'], 'email': user['email']})
            
        finally:
            # Clean up database resources
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """
    Logout the current user
    
    This endpoint clears the user's session, effectively logging them out.
    
    Response:
        - 200: Success message
        - 500: Server error
    """
    try:
        # Clear all session data for the current user
        session.clear()
        return jsonify({'message': 'Logged out'})
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500

# =====================================================
# Task Management Routes
# =====================================================

@app.route('/api/tasks', methods=['GET'])
@require_auth
def get_tasks():
    """
    Retrieve all tasks for the authenticated user
    
    This endpoint fetches all tasks belonging to the current user,
    ordered by due date. It converts datetime objects to ISO format
    for JSON compatibility.
    
    Response:
        - 200: Array of task objects
        - 401: Unauthorized
        - 500: Server error
    """
    try:
        # Get user ID from session (set by require_auth decorator)
        user_id = session['user_id']
        
        # Establish database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Retrieve all tasks for the authenticated user, ordered by due date
            # Parameter chain: session user_id -> SQL query -> task list
            cursor.execute("SELECT * FROM tasks WHERE user_id = %s ORDER BY due_date", (user_id,))
            tasks = cursor.fetchall()
            
            # Convert datetime objects to ISO format strings for JSON serialization
            # This ensures compatibility with frontend JavaScript Date objects
            for task in tasks:
                if task['due_date']:
                    task['due_date'] = task['due_date'].isoformat()
                if task.get('created_at'):
                    task['created_at'] = task['created_at'].isoformat()
                if task.get('updated_at'):
                    task['updated_at'] = task['updated_at'].isoformat()
                # Ensure completed field is boolean (MySQL returns 0/1)
                task['completed'] = bool(task['completed'])
            
            return jsonify(tasks)
            
        finally:
            # Clean up database resources
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Get tasks error: {e}")
        return jsonify({'error': 'Failed to load tasks'}), 500

@app.route('/api/tasks', methods=['POST'])
@require_auth
def create_task():
    """
    Create a new task for the authenticated user
    
    This endpoint validates input and creates a new task with the
    provided details. Category is set to empty string to match
    Node.js backend behavior.
    
    Request Body:
        - title (string): Task title (required)
        - description (string): Task description (optional)
        - due_date (string): Due date in ISO format (required)
        
    Response:
        - 201: Success with task ID
        - 400: Validation errors
        - 401: Unauthorized
        - 500: Server error
    """
    try:
        # Get user ID from session
        user_id = session['user_id']
        data = request.get_json()
        
        # Extract and sanitize input data
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        due_date = data.get('due_date', '')
        
        # Input validation
        if not title:
            return jsonify({'errors': [{'field': 'title', 'message': 'Title is required'}]}), 400
        if not due_date:
            return jsonify({'errors': [{'field': 'due_date', 'message': 'Due date is required'}]}), 400
        
        # Establish database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Create new task in database
            # Parameter chain: user_id + input data -> SQL INSERT -> task ID
            # Category set to empty string to match Node.js behavior
            cursor.execute(
                "INSERT INTO tasks (user_id, title, description, due_date, category, completed, updated_at) VALUES (%s, %s, %s, %s, %s, %s, NOW())",
                (user_id, title, description, due_date, '', False)
            )
            task_id = cursor.lastrowid  # Get ID of newly created task
            
            # Return response matching Node.js format exactly
            return jsonify({'id': task_id}), 201
            
        finally:
            # Clean up database resources
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Create task error: {e}")
        return jsonify({'error': 'Failed to create task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@require_auth
def update_task(task_id):
    """
    Update an existing task
    
    This endpoint updates specific fields of a task. Only provided
    fields are updated, allowing partial updates. The task must
    belong to the authenticated user.
    
    URL Parameters:
        - task_id (int): ID of task to update
        
    Request Body (all optional):
        - title (string): New task title
        - description (string): New task description
        - due_date (string): New due date
        - completed (boolean): New completion status
        
    Response:
        - 200: Success
        - 401: Unauthorized
        - 404: Task not found or no changes
        - 500: Server error
    """
    try:
        # Get user ID from session
        user_id = session['user_id']
        data = request.get_json()
        
        # Establish database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Build dynamic update query based on provided fields
            # This allows partial updates - only update fields that are provided
            update_fields = []
            update_values = []
            
            if 'title' in data:
                update_fields.append("title = %s")
                update_values.append(data['title'].strip())
            if 'description' in data:
                update_fields.append("description = %s")
                update_values.append(data['description'].strip())
            if 'due_date' in data:
                update_fields.append("due_date = %s")
                update_values.append(data['due_date'])
            if 'completed' in data:
                update_fields.append("completed = %s")
                update_values.append(bool(data['completed']))
            
            # If no fields provided, nothing to update
            if not update_fields:
                return jsonify({'error': 'Not found or no changes'}), 404
            
            # Construct and execute dynamic UPDATE query
            # Parameter chain: update_fields + task_id + user_id -> SQL UPDATE -> result
            update_query = f"UPDATE tasks SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s AND user_id = %s"
            update_values.extend([task_id, user_id])  # Add WHERE clause parameters
            
            cursor.execute(update_query, update_values)
            updated = cursor.rowcount > 0  # Check if any rows were affected
            
            if updated:
                return jsonify({'success': True})
            else:
                return jsonify({'error': 'Not found or no changes'}), 404
            
        finally:
            # Clean up database resources
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Update task error: {e}")
        return jsonify({'error': 'Failed to update task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@require_auth
def delete_task(task_id):
    """
    Delete an existing task
    
    This endpoint permanently deletes a task. The task must
    belong to the authenticated user.
    
    URL Parameters:
        - task_id (int): ID of task to delete
        
    Response:
        - 200: Success
        - 401: Unauthorized
        - 404: Task not found
        - 500: Server error
    """
    try:
        # Get user ID from session
        user_id = session['user_id']
        
        # Establish database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Delete task with user ownership verification
            # Parameter chain: task_id + user_id -> SQL DELETE -> result
            cursor.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
            deleted = cursor.rowcount > 0  # Check if any rows were deleted
            
            if deleted:
                return jsonify({'success': True})
            else:
                return jsonify({'error': 'Not found'}), 404
            
        finally:
            # Clean up database resources
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Delete task error: {e}")
        return jsonify({'error': 'Failed to delete task'}), 500

# =====================================================
# Application Entry Point
# =====================================================

if __name__ == '__main__':
    """
    Start the Flask development server
    
    This block runs when the script is executed directly
    (not when imported as a module). It starts the Flask
    application with debug mode enabled for development.
    
    Server Configuration:
        - host: '0.0.0.0' (accept connections from any IP)
        - port: 4000 (matches Node.js backend)
        - debug: True (auto-reload on code changes)
    """
    app.run(host='0.0.0.0', port=4000, debug=True)
