/**
 * @fileoverview Dashboard component for task management
 * @description Main dashboard interface for viewing, creating, editing, and deleting tasks.
 * Features include task filtering, real-time updates, and form validation.
 * 
 * @component Dashboard
 * @param {Object} props - Component props
 * @param {Function} props.onLogout - Callback function to handle user logout
 * 
 * @author Generated
 * @since 1.0.0
 */
import { createSignal, createEffect, onMount, For } from 'solid-js';

/**
 * Dashboard component - Main task management interface
 * 
 * Provides full CRUD operations for tasks with filtering capabilities.
 * Uses SolidJS reactive signals for state management.
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onLogout - Function to call when user logs out
 * @returns {JSX.Element} Rendered dashboard component
 */
function Dashboard(props) {
  // Reactive state signals for component data
  const [tasks, setTasks] = createSignal([]);           // Array of all tasks from API
  const [loading, setLoading] = createSignal(true);     // Loading state for async operations
  const [error, setError] = createSignal('');           // Error message display
  const [form, setForm] = createSignal({                // Form data for task creation/editing
    title: '',
    description: '',
    due_date: ''
  });
  const [editing, setEditing] = createSignal(null);     // ID of task currently being edited
  const [filter, setFilter] = createSignal('all');      // Current filter state: 'all', 'dueSoon', or 'completed'

  /**
   * Filters tasks based on the currently selected filter option
   * 
   * @function filteredTasks
   * @returns {Array} Filtered array of tasks based on current filter state
   * 
   * Filter logic:
   * - 'all': Returns all tasks
   * - 'completed': Returns only tasks marked as completed
   * - 'dueSoon': Returns tasks due within 24 hours (including overdue up to 24h past)
   */
  const filteredTasks = () => {
    return tasks().filter((task) => {
      const now = new Date();                    // Current timestamp for comparison
      const dueDate = new Date(task.due_date);   // Convert task due date to Date object
      // Calculate hours difference (positive = future, negative = past)
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
      
      switch (filter()) {
        case 'completed':
          return task.completed;  // Only show completed tasks
        case 'dueSoon':
          // Show incomplete tasks due within 24 hours (including those overdue by up to 24h)
          return !task.completed && hoursUntilDue <= 24 && hoursUntilDue > -24;
        case 'all':
        default:
          return true;  // Show all tasks regardless of status or due date
      }
    });
  };

  /**
   * Fetches tasks from the API when component mounts
   * 
   * Uses SolidJS onMount lifecycle hook to fetch initial data.
   * Handles various response formats and sets appropriate error states.
   * 
   * @async
     * @function onMountEffect
     * @returns {Promise<void>}
   */
  onMount(async () => {
    try {
      // Fetch tasks with credentials for authentication
      const response = await fetch('/api/tasks', { credentials: 'include' });
      const data = await response.json();
      
      // Defensive programming: ensure we always set an array
      if (Array.isArray(data)) {
        setTasks(data);           // Success: set tasks array
      } else if (data.error) {
        setError(data.error);     // API returned error message
        setTasks([]);            // Ensure empty array on error
      } else {
        setTasks([]);            // Fallback: unexpected response format
      }
    } catch (err) {
      // Network or parsing error
      setError('Failed to load tasks');
    } finally {
      setLoading(false);          // Always stop loading state
    }
  });

  /**
   * Handles form submission for creating or updating tasks
   * 
   * Determines whether to create a new task or update an existing one
   * based on the editing state. Performs API calls and refreshes task list.
   * 
   * @async
     * @function handleSubmit
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent default form submission behavior
    setError('');        // Clear any existing errors
    
    try {
      // Determine HTTP method and URL based on editing state
      const method = editing() ? 'PUT' : 'POST';
      const url = editing() ? `/api/tasks/${editing()}` : '/api/tasks';
      
      // Send task data to API
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Include authentication cookies
        body: JSON.stringify(form()),  // Convert form data to JSON
      });
      
      if (!response.ok) throw new Error('Failed to save task');
      
      // Reset form state after successful submission
      setForm({ title: '', description: '', due_date: '' });
      setEditing(null);  // Exit editing mode
      
      // Refresh the entire task list to show changes
      const updatedResponse = await fetch('/api/tasks', {
        credentials: 'include',
      });
      const updated = await updatedResponse.json();
      setTasks(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setError(err.message);  // Display error to user
    }
  };

  /**
   * Puts a task into edit mode by populating the form with its data
   * 
   * @function handleEdit
   * @param {Object} task - The task object to edit
   * @param {number} task.id - Task ID
   * @param {string} task.title - Task title
   * @param {string} [task.description] - Optional task description
   * @param {string} task.due_date - Task due date in ISO format
   */
  const handleEdit = (task) => {
    setEditing(task.id);  // Set editing mode with task ID
    // Populate form with existing task data
    setForm({
      title: task.title,
      description: task.description || '',  // Handle undefined description
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',  // Format date for input
    });
  };

  /**
   * Deletes a task after user confirmation
   * 
   * Shows a confirmation dialog before proceeding with deletion.
   * Updates local state immediately for better UX.
   * 
   * @async
   * @function handleDelete
   * @param {number} id - ID of the task to delete
   * @returns {Promise<void>}
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;  // User cancelled
    
    // Send delete request to API
    await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    // Update local state immediately (optimistic update)
    setTasks(tasks().filter((t) => t.id !== id));
  };

  /**
   * Toggles the completion status of a task
   * 
   * Sends a PUT request to update the task's completed status.
   * Uses 0/1 for database compatibility instead of boolean.
   * 
   * @async
   * @function toggleTask
   * @param {Object} task - The task to toggle
   * @param {number} task.id - Task ID
   * @param {number|boolean} task.completed - Current completion status
   * @returns {Promise<void>}
   */
  const toggleTask = async (task) => {
    // Convert to 0/1 for database compatibility (many databases use integers)
    const completed = task.completed ? 0 : 1;
    
    // Update task in backend
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ completed: !task.completed }),  // Send boolean to API
    });
    
    // Update local state with new completion status
    setTasks(tasks().map((t) =>
      t.id === task.id ? { ...t, completed } : t,  // Spread operator to update specific task
    ));
  };

  /**
   * Cancels edit mode and resets the form to empty state
   * 
   * Called when user clicks cancel button or after successful edit.
   * Clears both editing state and form data.
   * 
   * @function cancelEdit
   * @returns {void}
   */
  const cancelEdit = () => {
    setEditing(null);  // Exit editing mode
    // Reset form to initial empty state
    setForm({
      title: '',
      description: '',
      due_date: '',
    });
  };

  // Render the dashboard UI with all interactive elements
  return (
    <div className="dashboard-container">
      <h2 className="dtitle">Task Dashboard</h2>
      
      {/* Filter buttons for task viewing */}
      <div className="filter-buttons">
        <button 
          classList={{ active: filter() === 'all' }}  // Dynamic class for active state
          onClick={() => setFilter('all')}
        >
          All Tasks
        </button>
        <button 
          classList={{ active: filter() === 'dueSoon' }}
          onClick={() => setFilter('dueSoon')}
        >
          Due Soon
        </button>
        <button 
          classList={{ active: filter() === 'completed' }}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>
      
      {/* Task creation/editing form */}
      <h3 className="dnt-title">{editing() ? 'Edit Task' : 'Add New Task'}</h3>
      <form className="dform" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={form().title}
          onInput={(e) => setForm({ ...form(), title: e.target.value })}
          required
        />
        <input
          type="date"
          value={form().due_date}
          onInput={(e) => setForm({ ...form(), due_date: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form().description}
          onInput={(e) => setForm({ ...form(), description: e.target.value })}
        />
        <button type="submit">{editing() ? 'Update' : 'Add'} Task</button>
        {/* Show cancel button only when editing */}
        {editing() && (
          <button
            type="button"
            onClick={cancelEdit}
          >
            Cancel
          </button>
        )}
      </form>
      
      {/* Error message display */}
      {error() && <div className="error">{error()}</div>}
      
      {/* Dynamic task list title based on filter */}
      <h3 className="dtl-title">
        {filter() === 'all' && 'All Tasks'}
        {filter() === 'dueSoon' && 'Due Soon'}
        {filter() === 'completed' && 'Completed'}
      </h3>
      
      {/* Task list with loading state */}
      {loading() ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {/* SolidJS For component for efficient list rendering */}
          <For each={filteredTasks()}>
            {(task) => (
              <li className="dtask">
                {/* Checkbox for task completion */}
                <input
                  className="check"
                  type="checkbox"
                  checked={!!task.completed}  // Convert to boolean
                  onChange={() => toggleTask(task)}
                />
                {/* Task due date display */}
                <span className="dcat-lab">
                  Due: {task.due_date && new Date(task.due_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                </span>
                <br />
                {/* Task title with strikethrough for completed tasks */}
                <strong
                  className="task"
                  style={{ 'text-decoration': task.completed ? 'line-through' : 'none' }}
                >
                  Task: {task.title}
                </strong>
                <br />
                {/* Optional task description */}
                {task.description && (
                  <span className="desc">
                    Description: {task.description}
                    <br />
                  </span>
                )}
                <br />
                {/* Action buttons for task management */}
                <span className="d-btn-span">
                  <button onClick={() => handleEdit(task)}>Edit</button>
                  <button onClick={() => handleDelete(task.id)}>Delete</button>
                </span>
              </li>
            )}
          </For>
        </ul>
      )}
      
      {/* Logout button */}
      <button className="dlog-btn" onClick={props.onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
