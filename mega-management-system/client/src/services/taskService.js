import api from './api';

// Local storage key for tasks (fallback when API is not available)
const TASKS_STORAGE_KEY = 'mega_tasks';

// Get tasks from localStorage
const getLocalTasks = () => {
  try {
    const tasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return [];
  }
};

// Save tasks to localStorage
const saveLocalTasks = (tasks) => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

const taskService = {
  // Get all tasks
  getAllTasks: async (params = {}) => {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      return { success: true, data: getLocalTasks() };
    }
  },

  // Get single task
  getTask: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const task = tasks.find(t => t.id === id);
      return { success: true, data: task };
    }
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const newTask = {
        ...taskData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(newTask);
      saveLocalTasks(tasks);
      return { success: true, data: newTask, message: 'Task created (offline)' };
    }
  },

  // Update task
  updateTask: async (id, taskData) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...taskData, updatedAt: new Date().toISOString() };
        saveLocalTasks(tasks);
        return { success: true, data: tasks[index], message: 'Task updated (offline)' };
      }
      throw new Error('Task not found');
    }
  },

  // Delete task
  deleteTask: async (id) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const filteredTasks = tasks.filter(t => t.id !== id);
      saveLocalTasks(filteredTasks);
      return { success: true, message: 'Task deleted (offline)' };
    }
  },

  // Get tasks by status
  getTasksByStatus: async (status) => {
    try {
      const response = await api.get(`/tasks/status/${status}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const filtered = tasks.filter(t => t.status === status);
      return { success: true, data: filtered };
    }
  },

  // Add comment to task
  addComment: async (id, comment) => {
    try {
      const response = await api.post(`/tasks/${id}/comments`, { text: comment });
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        if (!tasks[index].comments) tasks[index].comments = [];
        tasks[index].comments.push({
          text: comment,
          user: { name: 'Current User' },
          createdAt: new Date().toISOString()
        });
        saveLocalTasks(tasks);
        return { success: true, data: tasks[index] };
      }
      throw new Error('Task not found');
    }
  },

  // Get task statistics
  getTaskStats: async () => {
    try {
      const response = await api.get('/tasks/stats');
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const tasks = getLocalTasks();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        overdue: tasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          return dueDate < today && t.status !== 'completed';
        }).length,
        dueToday: tasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          return dueDate.toDateString() === today.toDateString();
        }).length
      };
      return { success: true, data: stats };
    }
  }
};

export default taskService;
