/**
 * Task Management Routes
 * 
 * This module defines Express routes for task CRUD operations.
 * All routes are protected by authentication middleware.
 * 
 * Routes include:
 * - GET /: List all user's tasks
 * - GET /:id: Get a specific task
 * - POST /: Create a new task
 * - PUT /:id: Update a task
 * - DELETE /:id: Delete a task
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = express.Router();

// Apply authentication middleware to all routes in this router
// This ensures only authenticated users can access task operations
router.use(auth);

/**
 * Get all tasks for the authenticated user
 * 
 * GET /api/tasks
 * 
 * Response:
 * - 200: Array of task objects belonging to the user
 * - 500: Server error
 */
router.get("/", async (req, res) => {
  // Get user ID from session (set by auth middleware)
  const tasks = await Task.findAllByUser(req.session.userId);
  res.json(tasks);
});

/**
 * Get a specific task by ID
 * 
 * GET /api/tasks/:id
 * 
 * Parameters:
 * - id: Task ID (must belong to the authenticated user)
 * 
 * Response:
 * - 200: Task object
 * - 404: Task not found or doesn't belong to user
 * - 500: Server error
 */
router.get("/:id", async (req, res) => {
  // Parameter chain: req.params.id -> Task.findById() -> task object
  // User ID from session ensures user can only access their own tasks
  const task = await Task.findById(req.params.id, req.session.userId);
  if (!task) return res.status(404).json({ error: "Not found" });
  res.json(task);
});

/**
 * Create a new task
 * 
 * POST /api/tasks
 * 
 * Request body:
 * - title: Task title (1-255 characters, will be escaped)
 * - description: Optional task description (will be escaped)
 * - due_date: ISO8601 date string (will be converted to Date)
 * 
 * Response:
 * - 201: Success with task ID
 * - 400: Validation errors
 * - 500: Server error
 */
router.post(
  "/",
  [
    // Validate and sanitize title: trim whitespace, check length, escape HTML
    body("title").trim().isLength({ min: 1, max: 255 }).escape(),
    // Optional description: trim and escape if provided
    body("description").optional().trim().escape(),
    // Validate due_date as ISO8601 format and convert to Date object
    body("due_date").isISO8601().toDate(),
  ],
  async (req, res) => {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract validated and processed data from request body
    const { title, description, due_date } = req.body;
    
    // Parameter chain: req.session.userId + request body -> Task.create() -> task ID
    // This creates a task associated with the authenticated user
    const id = await Task.create(
      req.session.userId, // User ID from session
      title,              // Validated title
      description,         // Validated description (may be null)
      due_date,           // Validated Date object
      null,               // Category is hardcoded to null
    );
    
    // Return 201 Created status with the new task ID
    res.status(201).json({ id });
  }
);

/**
 * Update an existing task
 * 
 * PUT /api/tasks/:id
 * 
 * Parameters:
 * - id: Task ID (must belong to the authenticated user)
 * 
 * Request body (all optional):
 * - title: New task title (1-255 characters, will be escaped)
 * - description: New task description (will be escaped)
 * - due_date: New due date (ISO8601 format)
 * - completed: Boolean completion status
 * 
 * Response:
 * - 200: Success
 * - 400: Validation errors
 * - 404: Task not found or doesn't belong to user
 * - 500: Server error
 */
router.put(
  "/:id",
  [
    // Optional title validation
    body("title").optional().trim().isLength({ min: 1, max: 255 }).escape(),
    // Optional description validation
    body("description").optional().trim().escape(),
    // Optional due_date validation
    body("due_date").optional().isISO8601().toDate(),
    // Optional completed status validation
    body("completed").optional().isBoolean(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Parameter chain: req.params.id + req.session.userId + req.body -> Task.update()
    // This complex parameter passing ensures:
    // 1. Only the specified task is updated
    // 2. Only if it belongs to the authenticated user
    // 3. Only with the provided fields
    const updated = await Task.update(
      req.params.id,    // Task ID from URL
      req.session.userId, // User ID from session (authorization)
      req.body,         // Validated fields to update
    );
    
    if (!updated)
      return res.status(404).json({ error: "Not found or no changes" });
    res.json({ success: true });
  }
);

/**
 * Delete a task
 * 
 * DELETE /api/tasks/:id
 * 
 * Parameters:
 * - id: Task ID (must belong to the authenticated user)
 * 
 * Response:
 * - 200: Success
 * - 404: Task not found or doesn't belong to user
 * - 500: Server error
 */
router.delete("/:id", async (req, res) => {
  // Parameter chain: req.params.id + req.session.userId -> Task.delete()
  // This ensures users can only delete their own tasks
  const deleted = await Task.delete(req.params.id, req.session.userId);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

module.exports = router;
