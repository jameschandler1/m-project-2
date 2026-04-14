import React, { useEffect, useState } from "react";

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    category: "",
  });
  const [editing, setEditing] = useState(null); // task id being edited

  // Fetch tasks on mount
  useEffect(() => {
    fetch("/api/tasks", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        // Ensure we always set an array
        if (Array.isArray(data)) {
          setTasks(data);
        } else if (data.error) {
          setError(data.error);
          setTasks([]);
        } else {
          setTasks([]);
        }
      })
      .catch(() => setError("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, []);

  // Add or update task
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/tasks/${editing}` : "/api/tasks";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save task");
      setForm({ title: "", description: "", due_date: "", category: "" });
      setEditing(null);
      // Refresh tasks
      const updated = await fetch("/api/tasks", {
        credentials: "include",
      }).then((r) => r.json());
      setTasks(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit task
  const handleEdit = (task) => {
    setEditing(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      category: task.category || "",
    });
  };

  // Delete task
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="dashboard-container">
      <h2 className="dtitle">Task Dashboard</h2>
      <h3 className="dnt-title">{editing ? "Edit Task" : "Add New Task"}</h3>
      <form className="dform" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">{editing ? "Update" : "Add"} Task</button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
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
      {error && <div className="error">{error}</div>}
      <h3 className="dtl-title">All Tasks</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li className="dtask" key={task.id}>
              <input
                className="check"
                type="checkbox"
                checked={!!task.completed}
                onChange={async (e) => {
                  const completed = e.target.checked ? 1 : 0;
                  await fetch(`/api/tasks/${task.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ completed: e.target.checked }),
                  });
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, completed } : t,
                    ),
                  );
                }}
              />
              <span className="dcat-lab">
                ({task.category}) - Due:{" "}
                {task.due_date &&
                  new Date(task.due_date).toLocaleDateString("en-US")}{" "}
              </span>
              <br />
              <strong
                className="task"
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                }}
              >
                Task: {task.title}
              </strong>
              <br />
              {task.description && (
                <span className="desc">
                  Description: {task.description}
                  <br />
                </span>
              )}
              <br />
              <span className="d-btn-span">
                <button onClick={() => handleEdit(task)}>Edit</button>
                <button onClick={() => handleDelete(task.id)}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="dlog-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
