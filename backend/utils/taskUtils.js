/**
 * Task Utility Functions
 * 
 * Helper functions for task sorting and date formatting
 */

/**
 * Sort tasks by due date (ascending) and then by id (ascending)
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of tasks
 */
function sortTasks(tasks) {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  return [...tasks].sort((a, b) => {
    // First sort by due_date
    if (a.due_date && b.due_date) {
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
    }
    
    // If due dates are equal or missing, sort by id
    return a.id - b.id;
  });
}

/**
 * Format due date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDueDate(dateStr) {
  if (!dateStr) return 'No due date';
  
  // Parse date string manually to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Check if a task is overdue
 * @param {string} dueDate - Due date string in YYYY-MM-DD format
 * @returns {boolean} True if task is overdue
 */
function isOverdue(dueDate) {
  if (!dueDate) return false;
  
  // Parse date string manually to avoid timezone issues
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  
  // Reset time to midnight for accurate comparison
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return due < today;
}

module.exports = {
  sortTasks,
  formatDueDate,
  isOverdue
};
