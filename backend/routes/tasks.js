const express = require("express");
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
router.post("/", async (req, res) => {
  const { title, description, due_date, category } = req.body;
  if (!title || !due_date || !category)
    return res.status(400).json({ error: "Missing fields" });
  const id = await Task.create(
    req.session.userId,
    title,
    description,
    due_date,
    category,
  );
  res.status(201).json({ id });
});

// Update task
router.put("/:id", async (req, res) => {
  const updated = await Task.update(
    req.params.id,
    req.session.userId,
    req.body,
  );
  if (!updated)
    return res.status(404).json({ error: "Not found or no changes" });
  res.json({ success: true });
});

// Delete task
router.delete("/:id", async (req, res) => {
  const deleted = await Task.delete(req.params.id, req.session.userId);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

module.exports = router;
