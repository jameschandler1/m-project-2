const db = require("../db");

/**
 * Media Model
 * 
 * Handles all database operations for media files attached to tasks.
 * Supports both local file storage and S3 cloud storage.
 * 
 * Features:
 * - Separate media model for security and maintainability
 * - Supports images (.jpg, .gif, .png) and videos (.mp4, .mov)
 * - File size validation (5MB max)
 * - Independent deletion of media files
 * - S3 integration for production
 */

class Media {
  /**
   * Create a new media record
   * 
   * @param {Object} mediaData - Media file data
   * @param {number} mediaData.user_id - User ID who owns the media
   * @param {number} mediaData.task_id - Task ID the media is attached to
   * @param {string} mediaData.filename - Original filename
   * @param {string} mediaData.file_path - Storage path (local or S3)
   * @param {string} mediaData.file_type - MIME type (image/jpeg, video/mp4, etc.)
   * @param {number} mediaData.file_size - File size in bytes
   * @param {string} mediaData.storage_type - 'local' or 's3'
   * @returns {Promise<number>} New media ID
   */
  static async create({ user_id, task_id, filename, file_path, file_type, file_size, storage_type }) {
    const query = `
      INSERT INTO media (user_id, task_id, filename, file_path, file_type, file_size, storage_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.promise().execute(query, [
      user_id, task_id, filename, file_path, file_type, file_size, storage_type
    ]);
    
    return result.insertId;
  }

  /**
   * Get all media files for a specific task
   * 
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID (for security check)
   * @returns {Promise<Array>} Array of media objects
   */
  static async getByTaskId(taskId, userId) {
    const query = `
      SELECT * FROM media 
      WHERE task_id = ? AND user_id = ? 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await db.promise().execute(query, [taskId, userId]);
    return rows;
  }

  /**
   * Get a specific media file by ID
   * 
   * @param {number} mediaId - Media ID
   * @param {number} userId - User ID (for security check)
   * @returns {Promise<Object|null>} Media object or null
   */
  static async getById(mediaId, userId) {
    const query = `
      SELECT * FROM media 
      WHERE id = ? AND user_id = ?
    `;
    
    const [rows] = await db.promise().execute(query, [mediaId, userId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Delete a media file by ID
   * 
   * @param {number} mediaId - Media ID
   * @param {number} userId - User ID (for security check)
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(mediaId, userId) {
    const query = `
      DELETE FROM media 
      WHERE id = ? AND user_id = ?
    `;
    
    const [result] = await db.promise().execute(query, [mediaId, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Validate file type and size
   * 
   * @param {Object} file - File object from multer
   * @returns {Object} Validation result { valid: boolean, error?: string }
   */
  static validateFile(file) {
    // Allowed file types
    const allowedTypes = {
      'image/jpeg': 'jpg',
      'image/gif': 'gif', 
      'image/png': 'png',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov'
    };

    // Check file type
    if (!allowedTypes[file.mimetype]) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${Object.values(allowedTypes).join(', ')}`
      };
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit'
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from MIME type
   * 
   * @param {string} mimetype - MIME type
   * @returns {string} File extension
   */
  static getFileExtension(mimetype) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/png': 'png', 
      'video/mp4': 'mp4',
      'video/quicktime': 'mov'
    };
    
    return extensions[mimetype] || 'bin';
  }
}

module.exports = Media;
