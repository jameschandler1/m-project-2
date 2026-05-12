-- =====================================================
-- Media Table Setup Script
-- =====================================================
-- This script adds the media table to the existing database
-- Run this script to enable file upload functionality

-- Add media table for file attachments
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

-- Show table structure for verification
DESCRIBE media;
