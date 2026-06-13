const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");
const Media = require("../models/media");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * =====================================================
 * File Upload Configuration
 * =====================================================
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const extension = Media.getFileExtension(file.mimetype);
    cb(null, `${req.user.id}_${uniqueSuffix}.${extension}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const validation = Media.validateFile(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// S3 configuration (for production)
let s3;
if (process.env.NODE_ENV === 'production') {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
}

/**
 * =====================================================
 * Upload Routes
 * =====================================================
 */

/**
 * POST /api/upload
 * Upload a media file to a task
 * 
 * Request Body (multipart/form-data):
 * - file: Media file (required)
 * - task_id: Task ID to attach media to (required)
 * 
 * Response:
 * - 201: Success with media data
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Task not found
 * - 500: Server error
 */
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    const { task_id } = req.body;
    const user_id = req.user.id; // Set by authentication middleware

    // Validate required fields
    if (!task_id) {
      return res.status(400).json({ 
        success: false, 
        error: "Task ID is required" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "File is required" 
      });
    }

    // Verify task belongs to user
    const db = require("../db");
    const [taskCheck] = await db.promise().execute(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [task_id, user_id]
    );

    if (taskCheck.length === 0) {
      // Clean up uploaded file if task doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        error: "Task not found or access denied" 
      });
    }

    // Determine storage type and path
    let storage_type = 'local';
    let file_path = req.file.path;

    // Upload to S3 if in production
    if (process.env.NODE_ENV === 'production' && s3) {
      try {
        const s3Key = `uploads/${user_id}/${req.file.filename}`;
        
        const s3Params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
          Body: fs.createReadStream(req.file.path),
          ContentType: req.file.mimetype
        };

        const s3Result = await s3.upload(s3Params).promise();
        
        // Clean up local file after successful S3 upload
        fs.unlinkSync(req.file.path);
        
        storage_type = 's3';
        file_path = s3Result.Location;
        
      } catch (s3Error) {
        console.error("S3 upload failed, using local storage:", s3Error);
        // Fall back to local storage if S3 fails
      }
    }

    // Create media record in database
    const mediaId = await Media.create({
      user_id,
      task_id: parseInt(task_id),
      filename: req.file.originalname,
      file_path,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      storage_type
    });

    res.status(201).json({
      success: true,
      media: {
        id: mediaId,
        filename: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        storage_type,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle multer validation errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          error: "File size exceeds 5MB limit" 
        });
      }
      return res.status(400).json({ 
        success: false, 
        error: "File upload error: " + error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: "Failed to upload file" 
    });
  }
});

/**
 * GET /api/upload/:task_id
 * Get all media files for a specific task
 * 
 * URL Parameters:
 * - task_id: Task ID
 * 
 * Response:
 * - 200: Success with media array
 * - 401: Unauthorized
 * - 404: Task not found
 * - 500: Server error
 */
router.get("/:task_id", auth, async (req, res) => {
  try {
    const { task_id } = req.params;
    const user_id = req.user.id;

    // Verify task belongs to user
    const db = require("../db");
    const [taskCheck] = await db.promise().execute(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [task_id, user_id]
    );

    if (taskCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Task not found or access denied" 
      });
    }

    // Get media files for task
    const mediaFiles = await Media.getByTaskId(parseInt(task_id), user_id);

    res.json({
      success: true,
      media: mediaFiles.map(media => ({
        id: media.id,
        task_id: media.task_id,
        filename: media.filename,
        file_type: media.file_type,
        file_size: media.file_size,
        storage_type: media.storage_type,
        created_at: media.created_at
      }))
    });

  } catch (error) {
    console.error("Get media error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve media files" 
    });
  }
});

/**
 * GET /api/upload/file/:task_id/:media_id
 * Serve a media file
 * 
 * URL Parameters:
 * - task_id: Task ID (for security check)
 * - media_id: Media ID
 * 
 * Response:
 * - 200: File data (stream)
 * - 302: Redirect to S3 URL (if stored in S3)
 * - 401: Unauthorized
 * - 404: Media not found
 * - 500: Server error
 */
router.get("/file/:task_id/:media_id", auth, async (req, res) => {
  try {
    const { task_id, media_id } = req.params;
    const user_id = req.user.id;

    // Get media file
    const mediaFile = await Media.getById(parseInt(media_id), user_id);
    
    if (!mediaFile) {
      return res.status(404).json({ 
        success: false, 
        error: "Media not found or access denied" 
      });
    }

    // Verify task belongs to user
    const db = require("../db");
    const [taskCheck] = await db.promise().execute(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [task_id, user_id]
    );

    if (taskCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Task not found or access denied" 
      });
    }

    // Serve file based on storage type
      if (mediaFile.storage_type === "s3") {
      // Extract the key from the full S3 URL
      const url = new URL(mediaFile.file_path);
      const s3Key = decodeURIComponent(url.pathname.substring(1));

      // Generate a signed URL valid for 1 hour
      const signedUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Expires: 60 * 60,
      });

      return res.redirect(302, signedUrl);
    } else {
      // Serve local file
      const filePath = mediaFile.file_path;
      if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
      } else {
        res.status(404).json({ 
          success: false, 
          error: "File not found on server" 
        });
      }
    }

  } catch (error) {
    console.error("Serve file error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to serve file" 
    });
  }
});

/**
 * DELETE /api/upload/:media_id
 * Delete a media file
 * 
 * URL Parameters:
 * - media_id: Media ID
 * 
 * Response:
 * - 200: Success
 * - 401: Unauthorized
 * - 404: Media not found
 * - 500: Server error
 */
router.delete("/:media_id", auth, async (req, res) => {
  try {
    const { media_id } = req.params;
    const user_id = req.user.id;

    // Get media file before deletion
    const mediaFile = await Media.getById(parseInt(media_id), user_id);
    
    if (!mediaFile) {
      return res.status(404).json({ 
        success: false, 
        error: "Media not found or access denied" 
      });
    }

    // Delete from storage
    if (mediaFile.storage_type === 's3' && s3) {
      try {
        // Extract S3 key from file path
        const s3Key = mediaFile.file_path.split('/').pop();
        await s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `uploads/${user_id}/${s3Key}`
        }).promise();
      } catch (s3Error) {
        console.error("S3 deletion failed:", s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    } else if (mediaFile.storage_type === 'local') {
      // Delete local file
      if (fs.existsSync(mediaFile.file_path)) {
        fs.unlinkSync(mediaFile.file_path);
      }
    }

    // Delete from database
    const deleted = await Media.delete(parseInt(media_id), user_id);
    
    if (deleted) {
      res.json({
        success: true,
        message: "Media file deleted successfully"
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: "Media not found" 
      });
    }

  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete media file" 
    });
  }
});

module.exports = router;
