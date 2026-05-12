-- =====================================================
-- Database Schema Definition for Task Tracking App
-- =====================================================
-- This file defines the current database schema structure.
-- It can be used for reference, migrations, or database recreation.

-- =====================================================
-- User Table Schema
-- =====================================================
-- Core user authentication and profile information
CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,                    -- Auto-incrementing unique user identifier
  email VARCHAR(255) UNIQUE NOT NULL,                   -- User email (unique constraint prevents duplicates)
  hashed_password VARCHAR(255) NOT NULL,                -- Bcrypt-hashed password (never store plain text)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP         -- Timestamp when user account was created
);

-- =====================================================
-- Tasks Table Schema
-- =====================================================
-- Task management data with user relationship and audit trails
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,                    -- Auto-incrementing unique task identifier
  user_id INT NOT NULL,                                -- Foreign key linking to user table
  title VARCHAR(255) NOT NULL,                          -- Task title (required field, indexed for search)
  description TEXT,                                     -- Optional detailed task description
  due_date DATE NOT NULL,                              -- Task due date (required for scheduling)
  category VARCHAR(100) NULL,                           -- Optional task category (nullable for flexibility)
  completed BOOLEAN DEFAULT FALSE,                       -- Task completion flag (defaults to incomplete)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- Task creation timestamp (auto-set)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Auto-updated modification timestamp
  
  -- Foreign key constraint with cascade deletion
  -- Ensures referential integrity: tasks cannot exist without valid user
  -- ON DELETE CASCADE automatically removes user's tasks when user is deleted
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  
  -- Performance optimization index
  -- Speeds up queries filtering tasks by user_id (common operation)
  INDEX idx_user_id (user_id)
);

-- =====================================================
-- Media Table Schema
-- =====================================================
-- Media file attachments for tasks with cloud storage support
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,                    -- Auto-incrementing unique media identifier
  user_id INT NOT NULL,                                -- Foreign key linking to user table
  task_id INT NOT NULL,                                -- Foreign key linking to tasks table
  filename VARCHAR(255) NOT NULL,                      -- Original filename from user upload
  file_path VARCHAR(500) NOT NULL,                     -- Storage path (local filesystem or S3 URL)
  file_type VARCHAR(100) NOT NULL,                     -- MIME type (image/jpeg, video/mp4, etc.)
  file_size INT NOT NULL,                              -- File size in bytes
  storage_type ENUM('local', 's3') DEFAULT 'local',     -- Storage type: local filesystem or S3 cloud
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Media upload timestamp (auto-set)
  
  -- Foreign key constraints with cascade deletion
  -- Ensures referential integrity: media cannot exist without valid user and task
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Performance optimization indexes
  -- Speeds up queries filtering media by user_id and task_id (common operations)
  INDEX idx_user_id (user_id),
  INDEX idx_task_id (task_id)
);
