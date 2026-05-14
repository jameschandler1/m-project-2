-- Add payment tracking columns to user table
ALTER TABLE user 
ADD COLUMN payment_status ENUM('free', 'paid') DEFAULT 'free',
ADD COLUMN tasks_created INT DEFAULT 0;
