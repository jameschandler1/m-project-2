-- =====================================================
-- Database and tables setup for Task Tracking App
-- =====================================================
-- This script initializes the database and creates the necessary
-- tables for the task management application.
-- Run this script once to set up the initial database structure.

-- Create the main application database if it doesn't exist
-- Using IF NOT EXISTS prevents errors when running script multiple times
CREATE DATABASE IF NOT EXISTS taskapp;

-- Switch to the newly created database for subsequent operations
-- All following table creation commands will execute in this database
USE taskapp;

-- =====================================================
-- User Table
-- =====================================================
-- Stores user authentication information and basic profile data
CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,           -- Unique identifier for each user
  email VARCHAR(255) NOT NULL UNIQUE,          -- User's email address (must be unique)
  hashed_password VARCHAR(255) NOT NULL        -- Bcrypt hash of user's password (never store plain text)
);

-- =====================================================
-- Tasks Table
-- =====================================================
-- Stores task information linked to users through foreign key relationship
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,           -- Unique identifier for each task
  user_id INT NOT NULL,                        -- Foreign key referencing the user who owns this task
  title VARCHAR(255) NOT NULL,                 -- Task title or name (required field)
  description TEXT,                            -- Optional detailed description of the task
  due_date DATE NOT NULL,                      -- Due date for task completion (required)
  completed BOOLEAN DEFAULT 0,                 -- Task completion status (0 = incomplete, 1 = complete)
  category VARCHAR(100) NOT NULL,              -- Task category for organization (required)
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Auto-updated timestamp
  
  -- Foreign key constraint ensuring referential integrity
  -- ON DELETE CASCADE: If a user is deleted, all their tasks are automatically deleted
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
