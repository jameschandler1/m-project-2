#!/usr/bin/env python3
"""
Simplified Flask backend that exactly matches Node.js database schema
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
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

app = Flask(__name__)
app.secret_key = os.getenv('SESSION_SECRET', 'dev-secret-key')

# CORS configuration
CORS(app, 
     origins=[os.getenv('CORS_ORIGIN', 'http://localhost:3000')],
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE'],
     allow_headers=['Content-Type'])

# Database connection
def get_db_connection():
    """Get MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '3306')),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'taskapp'),
            autocommit=True
        )
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

# Validation functions
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password: 8+ chars, uppercase, lowercase, number"""
    if len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_upper and has_lower and has_digit

# Authentication middleware
def require_auth(f):
    """Decorator to require authentication"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user - exact match to Node.js response"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        errors = []
        if not validate_email(email):
            errors.append({'field': 'email', 'message': 'Invalid email format'})
        if not validate_password(password):
            errors.append({'field': 'password', 'message': 'Password must be at least 8 characters with uppercase, lowercase, and number'})
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Check if user exists
            cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({'error': 'Email already registered'}), 409
            
            # Create user
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("INSERT INTO user (email, hashed_password) VALUES (%s, %s)", (email, hashed_password))
            user_id = cursor.lastrowid
            
            # Set session
            session['user_id'] = user_id
            
            # Exact response format matching Node.js
            return jsonify({'id': user_id, 'email': email}), 201
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user - exact match to Node.js response"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        errors = []
        if not validate_email(email):
            errors.append({'field': 'email', 'message': 'Invalid email format'})
        if not password:
            errors.append({'field': 'password', 'message': 'Password is required'})
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Find user
            cursor.execute("SELECT id, email, hashed_password FROM user WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check password
            if not bcrypt.checkpw(password.encode('utf-8'), user['hashed_password'].encode('utf-8')):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Set session
            session['user_id'] = user['id']
            
            # Exact response format matching Node.js
            return jsonify({'id': user['id'], 'email': user['email']})
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user - exact match to Node.js response"""
    try:
        session.clear()
        return jsonify({'message': 'Logged out'})
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500

# Task routes
@app.route('/api/tasks', methods=['GET'])
@require_auth
def get_tasks():
    """Get all tasks for user - exact match to Node.js response"""
    try:
        user_id = session['user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Get all tasks for user
            cursor.execute("SELECT * FROM tasks WHERE user_id = %s ORDER BY due_date", (user_id,))
            tasks = cursor.fetchall()
            
            # Convert datetime objects to ISO format strings
            for task in tasks:
                if task['due_date']:
                    task['due_date'] = task['due_date'].isoformat()
                if task.get('created_at'):
                    task['created_at'] = task['created_at'].isoformat()
                if task.get('updated_at'):
                    task['updated_at'] = task['updated_at'].isoformat()
                # Ensure boolean for completed
                task['completed'] = bool(task['completed'])
            
            return jsonify(tasks)
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Get tasks error: {e}")
        return jsonify({'error': 'Failed to load tasks'}), 500

@app.route('/api/tasks', methods=['POST'])
@require_auth
def create_task():
    """Create new task - exact match to Node.js response"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        due_date = data.get('due_date', '')
        
        # Basic validation
        if not title:
            return jsonify({'errors': [{'field': 'title', 'message': 'Title is required'}]}), 400
        if not due_date:
            return jsonify({'errors': [{'field': 'due_date', 'message': 'Due date is required'}]}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Create task - match Node.js exactly
            cursor.execute(
                "INSERT INTO tasks (user_id, title, description, due_date, category, completed, updated_at) VALUES (%s, %s, %s, %s, %s, %s, NOW())",
                (user_id, title, description, due_date, '', False)
            )
            task_id = cursor.lastrowid
            
            # Exact response format matching Node.js
            return jsonify({'id': task_id}), 201
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Create task error: {e}")
        return jsonify({'error': 'Failed to create task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@require_auth
def update_task(task_id):
    """Update task - exact match to Node.js response"""
    try:
        user_id = session['user_id']
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Build dynamic update query
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
            
            if not update_fields:
                return jsonify({'error': 'Not found or no changes'}), 404
            
            # Update task
            update_query = f"UPDATE tasks SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s AND user_id = %s"
            update_values.extend([task_id, user_id])
            
            cursor.execute(update_query, update_values)
            updated = cursor.rowcount > 0
            
            if updated:
                return jsonify({'success': True})
            else:
                return jsonify({'error': 'Not found or no changes'}), 404
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Update task error: {e}")
        return jsonify({'error': 'Failed to update task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@require_auth
def delete_task(task_id):
    """Delete task - exact match to Node.js response"""
    try:
        user_id = session['user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Delete task
            cursor.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
            deleted = cursor.rowcount > 0
            
            if deleted:
                return jsonify({'success': True})
            else:
                return jsonify({'error': 'Not found'}), 404
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Delete task error: {e}")
        return jsonify({'error': 'Failed to delete task'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)
