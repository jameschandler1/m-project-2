/**
 * Dashboard Component
 *
 * This is the main task management interface that handles:
 * - Displaying and filtering tasks
 * - Creating new tasks
 * - Editing existing tasks
 * - Deleting tasks
 * - Marking tasks as complete
 *
 * Props:
 * - user: User object with authentication data
 * - onLogout: Function to handle user logout
 *
 * State Management:
 * - tasks: Array of task objects
 * - loading: Loading state for API calls
 * - error: Error messages
 * - form: Task form data for create/edit
 * - editing: ID of task being edited (null for new)
 * - filter: Current filter mode ('all', 'dueSoon', 'completed')
 */

import React, { useEffect, useState } from "react";

function Dashboard({ user, onLogout, paymentStatus, onTaskCreated }) {
  // Task list state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Task form state for create/edit operations
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  // UI state management
  const [editing, setEditing] = useState(null); // task id being edited
  const [filter, setFilter] = useState("all"); // Filter state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState({}); // media files per task
  const [uploading, setUploading] = useState(false); // upload progress
  const [uploadError, setUploadError] = useState(""); // upload errors

  /**
   * Filter tasks based on selected filter mode
   *
   * This computed property filters the tasks array based on
   * the current filter selection:
   * - 'all': Show all tasks
   * - 'completed': Show only completed tasks
   * - 'dueSoon': Show tasks due within 24 hours (including overdue)
   *
   * Time Calculation:
   * - hoursUntilDue = (dueDate - now) / (1000 * 60 * 60)
   * - Positive: Future due date
   * - Negative: Overdue
   * - 0 to 24: Due within 24 hours
   */
  const filteredTasks = tasks.filter((task) => {
    const now = new Date();
    const dueDate = new Date(task.due_date);
    // Calculate hours until due (positive = future, negative = overdue)
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

    switch (filter) {
      case "completed":
        return task.completed;
      case "dueSoon":
        // Include tasks due within 24 hours (including overdue up to 24h past)
        return !task.completed && hoursUntilDue <= 24 && hoursUntilDue > -24;
      case "all":
      default:
        return true;
    }
  });

  const loadTasks = async (targetPage = page) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/tasks?page=${targetPage}&limit=50`, {
        credentials: "include",
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        setTasks(data);
        setPagination((currentPagination) => ({
          ...currentPagination,
          page: targetPage,
          total: data.length,
          totalPages: 1,
        }));
      } else if (data?.tasks) {
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setPagination({
          page: data.pagination?.page || targetPage,
          limit: data.pagination?.limit || 50,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        });
      } else if (data?.error) {
        setError(data.error);
        setTasks([]);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch tasks from API whenever the page changes.
   */
  useEffect(() => {
    loadTasks(page);
  }, [page]);

  /**
   * Fetch media files for a specific task
   */
  const fetchMediaFiles = async (taskId) => {
    try {
      const response = await fetch(`/api/upload/${taskId}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setMediaFiles((prev) => ({
          ...prev,
          [taskId]: data.media,
        }));
      }
    } catch (error) {
      console.error("Error fetching media files:", error);
    }
  };

  /**
   * Fetch media files for all tasks on component mount and when tasks change
   */
  useEffect(() => {
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        fetchMediaFiles(task.id);
      });
    }
  }, [tasks]);

  /**
   * Handle task creation or update
   *
   * This function manages both creating new tasks and updating
   * existing tasks based on the editing state:
   *
   * Flow:
   * 1. Prevent form submission
   * 2. Clear errors
   * 3. Determine API method and URL based on editing state
   * 4. Make API call with form data
   * 5. Reset form state on success
   * 6. Refresh task list
   *
   * API Call Chain:
   * - editing null: POST /api/tasks (create)
   * - editing has ID: PUT /api/tasks/{id} (update)
   * - Followed by GET /api/tasks to refresh list
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Dynamic API call based on editing state
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/tasks/${editing}` : "/api/tasks";

      let taskId;

      if (editing) {
        // Update existing task (no file upload)
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to save task");
        taskId = editing;
      } else {
        // Create new task
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create task");

        const taskData = await res.json();
        taskId = taskData.id;

        // Upload file if one was selected
        if (form.file) {
          await handleFileUpload(taskId, form.file);
        }
      }

      if (onTaskCreated) {
        onTaskCreated();
      }

      // Reset form state after successful save
      setForm({ title: "", description: "", due_date: "", file: null });
      setEditing(null);
      if (!editing) {
        setPage(1);
        await loadTasks(1);
      } else {
        await loadTasks(page);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Handle file upload for a task
   */
  const handleFileUpload = async (taskId, file) => {
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("task_id", taskId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        // Refresh media files for this task
        await fetchMediaFiles(taskId);
        setUploadError("");
      } else {
        setUploadError(data.error || "Upload failed");
      }
    } catch (error) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle media file deletion
   */
  const handleMediaDelete = async (mediaId, taskId) => {
    try {
      const response = await fetch(`/api/upload/${mediaId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        // Refresh media files for this task
        await fetchMediaFiles(taskId);
      } else {
        setUploadError(data.error || "Delete failed");
      }
    } catch (error) {
      setUploadError("Delete failed. Please try again.");
    }
  };

  /**
   * Render media file (image or video)
   */
  const renderMediaFile = (media) => {
    const isImage = media.file_type.startsWith("image/");
    const isVideo = media.file_type.startsWith("video/");

    if (isImage) {
      return (
        <img
          className="media-image"
          src={`/api/upload/file/${media.task_id}/${media.id}`}
          alt={media.filename}
        />
      );
    } else if (isVideo) {
      return (
        <video className="media-video" controls>
          <source
            src={`/api/upload/file/${media.task_id}/${media.id}`}
            type={media.file_type}
          />
          Your browser does not support the video tag.
        </video>
      );
    }
    return null;
  };

  /**
   * Prepare task for editing
   *
   * This function populates the form with existing task data
   * and sets the editing state to the task ID.
   *
   * Data Transformation:
   * - task.title -> form.title
   * - task.description -> form.description (fallback to empty string)
   * - task.due_date -> form.due_date (format to YYYY-MM-DD)
   */
  const handleEdit = (task) => {
    // Set editing state to task ID
    setEditing(task.id);
    // Populate form with task data
    setForm({
      title: task.title,
      description: task.description || "",
      // Format date for HTML date input (YYYY-MM-DD)
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    });
  };

  /**
   * Handle task deletion
   *
   * This function deletes a task after user confirmation:
   *
   * Flow:
   * 1. Show confirmation dialog
   * 2. If confirmed, make DELETE API call
   * 3. Update local state to remove task from list
   *
   * API Call Chain:
   * - DELETE /api/tasks/{id} with session credentials
   * - Update local state immediately (optimistic UI)
   */
  const handleDelete = async (id) => {
    // User confirmation before destructive action
    if (!window.confirm("Delete this task?")) return;

    // API call to delete task
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    await loadTasks(page);
  };

  /**
   * Render Dashboard component
   *
   * The render structure includes:
   * - Filter buttons for task filtering
   * - Task form for create/edit operations
   * - Task list with completion toggles
   * - Error and loading states
   * - Logout button
   */
  return (
    <div className="dashboard-container">
      {/* Dashboard title */}
      <h2 className="dtitle">Task Dashboard</h2>

      {/* Payment status display */}
      <div className="payment-status-bar">
        {paymentStatus.paymentStatus === "paid" ? (
          <span className="payment-status-paid">
            ✓ Premium Account - Unlimited Tasks
          </span>
        ) : (
          <span className="payment-status-free">
            Free Tasks Remaining: {paymentStatus.freeTasksRemaining} / 3
          </span>
        )}
      </div>

      {/* Paywall warning */}
      {paymentStatus.isPaywalled && (
        <div className="paywall-warning">
          ⚠️ You've reached your free task limit. Upgrade to continue creating
          tasks.
        </div>
      )}

      {/* Filter buttons section */}
      <div className="filter-buttons">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All Tasks
        </button>
        <button
          className={filter === "dueSoon" ? "active" : ""}
          onClick={() => setFilter("dueSoon")}
        >
          Due Soon
        </button>
        <button
          className={filter === "completed" ? "active" : ""}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={pagination.page <= 1}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
          total tasks)
        </span>
        <button
          onClick={() =>
            setPage((currentPage) =>
              Math.min(pagination.totalPages, currentPage + 1),
            )
          }
          disabled={pagination.page >= pagination.totalPages}
        >
          Next
        </button>
      </div>

      {/* Task form section */}
      <h3 className="dnt-title">{editing ? "Edit Task" : "Add New Task"}</h3>
      {!paymentStatus.isPaywalled || editing ? (
        <form className="dform" onSubmit={handleSubmit}>
          {/* Title input */}
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          {/* Due date input */}
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            required
          />
          {/* Description textarea */}
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {/* File upload for new tasks */}
          {!editing && (
            <div className="file-upload-section" style={{ margin: "10px 0" }}>
              <label
                htmlFor="task-file"
                style={{ display: "block", marginBottom: "5px" }}
              >
                Attach file (optional):
              </label>
              <input
                id="task-file"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm({ ...form, file });
                  }
                }}
                style={{ marginBottom: "10px" }}
              />
              {form.file && (
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Selected: {form.file.name} (
                  {(form.file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}
          {/* Submit button with dynamic text */}
          <button type="submit">{editing ? "Update" : "Add"} Task</button>

          {/* Cancel button - only shows when editing */}
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                // Reset form to empty state
                setForm({
                  title: "",
                  description: "",
                  due_date: "",
                  category: "",
                });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      ) : (
        <div className="paywall-message">
          <p>
            Task creation is disabled. Please upgrade your account to continue.
          </p>
        </div>
      )}

      {/* Error display */}
      {error && <div className="error">{error}</div>}

      {/* Upload error display */}
      {uploadError && (
        <div className="error" style={{ marginTop: "10px" }}>
          {uploadError}
        </div>
      )}

      {/* Dynamic task list title based on filter */}
      <h3 className="dtl-title">
        {filter === "all" && "All Tasks"}
        {filter === "dueSoon" && "Due Soon"}
        {filter === "completed" && "Completed"}
      </h3>

      {/* Task list or loading state */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {filteredTasks.map((task) => (
            <li className="dtask" key={task.id}>
              {/* Task completion checkbox */}
              <input
                className="check"
                type="checkbox"
                checked={!!task.completed}
                onChange={async (e) => {
                  // Convert boolean to integer for API compatibility
                  const completed = e.target.checked ? 1 : 0;

                  // Optimistic update: update UI immediately
                  // Parameter chain: checkbox state -> API call -> local state update
                  await fetch(`/api/tasks/${task.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ completed: e.target.checked }),
                  });

                  // Update local state to reflect change
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, completed } : t,
                    ),
                  );
                }}
              />

              {/* Due date display */}
              <span className="dcat-lab">
                Due:{" "}
                {task.due_date &&
                  new Date(task.due_date).toLocaleDateString("en-US", {
                    timeZone: "UTC",
                  })}{" "}
              </span>
              <br />

              {/* Task title with strikethrough for completed tasks */}
              <strong
                className="task"
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                }}
              >
                Task: {task.title}
              </strong>
              <br />

              {/* Conditional description display */}
              {task.description && (
                <span className="desc">
                  Description: {task.description}
                  <br />
                </span>
              )}

              {/* Media files display */}
              {mediaFiles[task.id] && mediaFiles[task.id].length > 0 && (
                <div className="media-container" style={{ margin: "10px 0" }}>
                  <strong>Media:</strong>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
                  >
                    {mediaFiles[task.id].map((media) => (
                      <div key={media.id} style={{ position: "relative" }}>
                        {renderMediaFile(media)}
                        <button
                          onClick={() => handleMediaDelete(media.id, task.id)}
                          style={{
                            position: "absolute",
                            top: "5px",
                            right: "5px",
                            background: "red",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File upload */}
              <div className="upload-section" style={{ margin: "10px 0" }}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(task.id, file);
                    }
                  }}
                  disabled={uploading}
                  style={{ margin: "5px 0" }}
                />
                {uploading && (
                  <span style={{ marginLeft: "10px" }}>Uploading...</span>
                )}
              </div>
              <br />

              {/* Action buttons */}
              <span className="d-btn-span">
                <button onClick={() => handleEdit(task)}>Edit</button>
                <button onClick={() => handleDelete(task.id)}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Logout button */}
      <button className="dlog-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
