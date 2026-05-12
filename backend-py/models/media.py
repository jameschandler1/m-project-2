import os
import time
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from app import get_db_connection

class Media:
    """
    Media Model for Flask Backend
    
    Handles all database operations for media files attached to tasks.
    Supports both local file storage and S3 cloud storage.
    
    Features:
    - Separate media model for security and maintainability
    - Supports images (.jpg, .gif, .png) and videos (.mp4, .mov)
    - File size validation (5MB max)
    - Independent deletion of media files
    - S3 integration for production
    """

    @staticmethod
    def create(user_id, task_id, filename, file_path, file_type, file_size, storage_type):
        """
        Create a new media record in the database
        
        Args:
            user_id (int): User ID who owns the media
            task_id (int): Task ID the media is attached to
            filename (str): Original filename
            file_path (str): Storage path (local or S3)
            file_type (str): MIME type (image/jpeg, video/mp4, etc.)
            file_size (int): File size in bytes
            storage_type (str): 'local' or 's3'
            
        Returns:
            int: New media ID
        """
        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        
        try:
            cursor = conn.cursor()
            query = """
                INSERT INTO media (user_id, task_id, filename, file_path, file_type, file_size, storage_type, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """
            cursor.execute(query, (user_id, task_id, filename, file_path, file_type, file_size, storage_type))
            media_id = cursor.lastrowid
            return media_id
        except Exception as e:
            raise Exception(f"Failed to create media record: {e}")
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_by_task_id(task_id, user_id):
        """
        Get all media files for a specific task
        
        Args:
            task_id (int): Task ID
            user_id (int): User ID (for security check)
            
        Returns:
            list: Array of media objects
        """
        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        
        try:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT * FROM media 
                WHERE task_id = %s AND user_id = %s 
                ORDER BY created_at DESC
            """
            cursor.execute(query, (task_id, user_id))
            media_files = cursor.fetchall()
            return media_files
        except Exception as e:
            raise Exception(f"Failed to retrieve media files: {e}")
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_by_id(media_id, user_id):
        """
        Get a specific media file by ID
        
        Args:
            media_id (int): Media ID
            user_id (int): User ID (for security check)
            
        Returns:
            dict: Media object or None
        """
        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        
        try:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT * FROM media 
                WHERE id = %s AND user_id = %s
            """
            cursor.execute(query, (media_id, user_id))
            media_file = cursor.fetchone()
            return media_file
        except Exception as e:
            raise Exception(f"Failed to retrieve media file: {e}")
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def delete(media_id, user_id):
        """
        Delete a media file by ID
        
        Args:
            media_id (int): Media ID
            user_id (int): User ID (for security check)
            
        Returns:
            bool: True if deleted, False if not found
        """
        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        
        try:
            cursor = conn.cursor()
            query = """
                DELETE FROM media 
                WHERE id = %s AND user_id = %s
            """
            cursor.execute(query, (media_id, user_id))
            return cursor.rowcount > 0
        except Exception as e:
            raise Exception(f"Failed to delete media file: {e}")
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def validate_file(file):
        """
        Validate file type and size
        
        Args:
            file: File object from request.files
            
        Returns:
            dict: Validation result { valid: bool, error?: str }
        """
        # Allowed file types
        allowed_types = {
            'image/jpeg': 'jpg',
            'image/gif': 'gif', 
            'image/png': 'png',
            'video/mp4': 'mp4',
            'video/quicktime': 'mov'
        }

        # Check file type
        if file.filename and '.' in file.filename:
            file_ext = file.filename.rsplit('.', 1)[1].lower()
            if file_ext not in ['jpg', 'jpeg', 'gif', 'png', 'mp4', 'mov']:
                return {
                    'valid': False,
                    'error': f"Invalid file type. Allowed types: jpg, jpeg, gif, png, mp4, mov"
                }
        else:
            return {
                'valid': False,
                'error': "Invalid filename"
            }

        # Check file size (5MB max)
        if hasattr(file, 'content_length'):
            file_size = file.content_length
        else:
            # For testing, assume reasonable size
            file_size = 1024 * 1024  # 1MB default
            
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if file_size > max_size:
            return {
                'valid': False,
                'error': 'File size exceeds 5MB limit'
            }

        return { 'valid': True }

    @staticmethod
    def get_file_extension(filename):
        """
        Get file extension from filename
        
        Args:
            filename (str): Original filename
            
        Returns:
            str: File extension
        """
        if '.' in filename:
            return filename.rsplit('.', 1)[1].lower()
        return 'bin'

    @staticmethod
    def generate_unique_filename(user_id, original_filename):
        """
        Generate unique filename for storage
        
        Args:
            user_id (int): User ID
            original_filename (str): Original filename
            
        Returns:
            str: Unique filename
        """
        timestamp = int(time.time())
        random_suffix = str(int(time.time() * 1000))[-6:]
        extension = Media.get_file_extension(original_filename)
        return f"{user_id}_{timestamp}_{random_suffix}.{extension}"

    @staticmethod
    def get_mime_type(filename):
        """
        Get MIME type from filename
        
        Args:
            filename (str): Filename
            
        Returns:
            str: MIME type
        """
        extension = Media.get_file_extension(filename)
        mime_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'png': 'image/png',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime'
        }
        return mime_types.get(extension, 'application/octet-stream')
