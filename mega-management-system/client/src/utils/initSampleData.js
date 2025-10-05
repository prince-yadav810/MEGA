import { sampleTasks } from './sampleData';

const TASKS_STORAGE_KEY = 'mega_tasks';

export const initializeSampleData = () => {
  // Check if data already exists
  const existingTasks = localStorage.getItem(TASKS_STORAGE_KEY);

  if (!existingTasks || JSON.parse(existingTasks).length === 0) {
    // Initialize with sample data
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(sampleTasks));
    console.log('Sample data initialized in localStorage');
    return true;
  }

  console.log('Existing tasks found in localStorage');
  return false;
};

export const clearSampleData = () => {
  localStorage.removeItem(TASKS_STORAGE_KEY);
  console.log('Sample data cleared from localStorage');
};

export const resetSampleData = () => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(sampleTasks));
  console.log('Sample data reset in localStorage');
};
