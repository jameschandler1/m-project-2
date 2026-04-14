const express = require("express");
const { body, validationResult } = require("express-validator");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = express.Router();

// Protect all routes
router.use(auth);

// List all tasks
router.get("/", async (req, res) => {
  const tasks = await Task.findAllByUser(req.session.userId);
  res.json(tasks);
});

// Get one task
router.get("/:id", async (req, res) => {
  const task = await Task.findById(req.params.id, req.session.userId);
  if (!task) return res.status(404).json({ error: "Not found" });
  res.json(task);
});

// Create task
router.post(
  "/",
  [
    body("title").trim().isLength({ min: 1, max: 255 }).escape(),
    body("description").optional().trim().escape(),
    body("due_date").isISO8601().toDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, due_date } = req.body;
    const id = await Task.create(
      req.session.userId,
      title,
      description,
      due_date,
      null, // category is now null
    );
    res.status(201).json({ id });
  }
);

// Update task
router.put(
  "/:id",
  [
    body("title").optional().trim().isLength({ min: 1, max: 255 }).escape(),
    body("description").optional().trim().escape(),
    body("due_date").optional().isISO8601().toDate(),
    body("category").optional().trim().isLength({ min: 1, max: 100 }).escape(),
    body("completed").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updated = await Task.update(
      req.params.id,
      req.session.userId,
      req.body,
    );
    if (!updated)
      return res.status(404).json({ error: "Not found or no changes" });
    res.json({ success: true });
  }
);

// Delete task
router.delete("/:id", async (req, res) => {
  const deleted = await Task.delete(req.params.id, req.session.userId);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

module.exports = router;
