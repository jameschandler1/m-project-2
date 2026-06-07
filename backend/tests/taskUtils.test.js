/**
 * Task Utilities Tests
 * 
 * Tests for task sorting and date formatting functions
 */

const { sortTasks, formatDueDate, isOverdue } = require('../utils/taskUtils');

describe('Task Sorting', () => {
  test('should sort tasks by due date ascending', () => {
    const tasks = [
      { id: 1, title: 'Task 3', due_date: '2024-12-31' },
      { id: 2, title: 'Task 1', due_date: '2024-01-01' },
      { id: 3, title: 'Task 2', due_date: '2024-06-15' },
    ];

    const sorted = sortTasks(tasks);
    
    expect(sorted[0].title).toBe('Task 1');
    expect(sorted[1].title).toBe('Task 2');
    expect(sorted[2].title).toBe('Task 3');
  });

  test('should sort tasks by id when due dates are equal', () => {
    const tasks = [
      { id: 3, title: 'Task 3', due_date: '2024-06-15' },
      { id: 1, title: 'Task 1', due_date: '2024-06-15' },
      { id: 2, title: 'Task 2', due_date: '2024-06-15' },
    ];

    const sorted = sortTasks(tasks);
    
    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(3);
  });

  test('should handle tasks without due dates', () => {
    const tasks = [
      { id: 1, title: 'Task 1', due_date: '2024-06-15' },
      { id: 2, title: 'Task 2', due_date: null },
      { id: 3, title: 'Task 3', due_date: '2024-01-01' },
    ];

    const sorted = sortTasks(tasks);
    
    expect(sorted.length).toBe(3);
  });

  test('should return empty array for null input', () => {
    const sorted = sortTasks(null);
    expect(sorted).toEqual([]);
  });

  test('should return empty array for non-array input', () => {
    const sorted = sortTasks({});
    expect(sorted).toEqual([]);
  });

  test('should not mutate original array', () => {
    const tasks = [
      { id: 1, title: 'Task 1', due_date: '2024-06-15' },
      { id: 2, title: 'Task 2', due_date: '2024-01-01' },
    ];

    const originalOrder = tasks.map(t => t.id);
    sortTasks(tasks);
    
    expect(tasks.map(t => t.id)).toEqual(originalOrder);
  });
});

describe('Due Date Formatting', () => {
  test('should format valid date strings', () => {
    const formatted = formatDueDate('2024-06-15');
    expect(formatted).toContain('June');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  test('should return "No due date" for null input', () => {
    const formatted = formatDueDate(null);
    expect(formatted).toBe('No due date');
  });

  test('should return "No due date" for undefined input', () => {
    const formatted = formatDueDate(undefined);
    expect(formatted).toBe('No due date');
  });

  test('should return "No due date" for empty string', () => {
    const formatted = formatDueDate('');
    expect(formatted).toBe('No due date');
  });

  test('should return "Invalid date" for invalid date string', () => {
    const formatted = formatDueDate('invalid-date');
    expect(formatted).toBe('Invalid date');
  });

  test('should format different date formats correctly', () => {
    const date1 = formatDueDate('2024-01-01');
    const date2 = formatDueDate('2024-12-31');
    
    expect(date1).toContain('January');
    expect(date2).toContain('December');
  });
});

describe('Task Overdue Check', () => {
  test('should return true for past due dates', () => {
    // Use a fixed past date to avoid timezone issues
    const pastDateStr = '2020-01-01';
    expect(isOverdue(pastDateStr)).toBe(true);
  });

  test('should return false for future due dates', () => {
    // Use a fixed future date to avoid timezone issues
    const futureDateStr = '2030-12-31';
    expect(isOverdue(futureDateStr)).toBe(false);
  });

  test('should return false for today', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(isOverdue(todayStr)).toBe(false);
  });

  test('should return false for null due date', () => {
    expect(isOverdue(null)).toBe(false);
  });

  test('should return false for undefined due date', () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  test('should return false for empty string', () => {
    expect(isOverdue('')).toBe(false);
  });
});
