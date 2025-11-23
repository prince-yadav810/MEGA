// Task status configuration
export const taskStatuses = {
  todo: {
    label: "To Do",
    color: "bg-gray-100 text-gray-800",
    dotColor: "bg-gray-400"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-primary-100 text-primary-800",
    dotColor: "bg-primary-500"
  },
  completed: {
    label: "Completed",
    color: "bg-success-100 text-success-800",
    dotColor: "bg-success-500"
  }
};

// Priority configuration
export const taskPriorities = {
  low: {
    label: "Low",
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  },
  medium: {
    label: "Medium",
    color: "text-primary-600",
    bgColor: "bg-primary-100"
  },
  high: {
    label: "High",
    color: "text-warning-600",
    bgColor: "bg-warning-100"
  },
  urgent: {
    label: "Urgent",
    color: "text-error-600",
    bgColor: "bg-error-100"
  }
};