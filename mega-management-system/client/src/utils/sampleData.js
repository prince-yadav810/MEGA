// Sample task data for demonstration
export const sampleTasks = [
  {
    id: 1,
    title: "Create quotation for ABC Industries",
    description: "Prepare detailed quotation for industrial hoses and connectors",
    status: "in_progress",
    priority: "high",
    assignees: [
      { id: 1, name: "Rajesh Kumar", avatar: "RK", email: "rajesh@mega.com" },
      { id: 2, name: "Priya Sharma", avatar: "PS", email: "priya@mega.com" }
    ],
    dueDate: "2024-12-15",
    createdDate: "2024-12-01",
    tags: ["quotation", "abc-industries"],
    client: "ABC Industries",
    attachments: 2,
    comments: 3,
    timeTracked: "2h 30m",
    estimatedTime: "4h"
  },
  {
    id: 2,
    title: "Follow up payment - XYZ Corp",
    description: "Send WhatsApp reminder for overdue payment of ₹2,50,000",
    status: "todo",
    priority: "urgent",
    assignees: [
      { id: 3, name: "Amit Patel", avatar: "AP", email: "amit@mega.com" }
    ],
    dueDate: "2024-12-10",
    createdDate: "2024-12-05",
    tags: ["payment", "follow-up"],
    client: "XYZ Corporation",
    attachments: 1,
    comments: 5,
    timeTracked: "1h 15m",
    estimatedTime: "2h"
  },
  {
    id: 3,
    title: "Update safety equipment catalog",
    description: "Add new safety equipment products with images and specifications",
    status: "completed",
    priority: "medium",
    assignees: [
      { id: 4, name: "Sneha Reddy", avatar: "SR", email: "sneha@mega.com" }
    ],
    dueDate: "2024-12-08",
    createdDate: "2024-11-28",
    completedDate: "2024-12-07",
    tags: ["catalog", "safety-equipment"],
    client: null,
    attachments: 8,
    comments: 2,
    timeTracked: "6h 45m",
    estimatedTime: "8h"
  },
  {
    id: 4,
    title: "Prepare monthly sales report",
    description: "Compile sales data and create presentation for management review",
    status: "review",
    priority: "medium",
    assignees: [
      { id: 2, name: "Priya Sharma", avatar: "PS", email: "priya@mega.com" },
      { id: 5, name: "Vikash Singh", avatar: "VS", email: "vikash@mega.com" }
    ],
    dueDate: "2024-12-20",
    createdDate: "2024-12-03",
    tags: ["report", "sales"],
    client: null,
    attachments: 4,
    comments: 7,
    timeTracked: "3h 20m",
    estimatedTime: "5h"
  },
  {
    id: 5,
    title: "Client meeting - DEF Engineering",
    description: "Discuss new project requirements and technical specifications",
    status: "scheduled",
    priority: "high",
    assignees: [
      { id: 1, name: "Rajesh Kumar", avatar: "RK", email: "rajesh@mega.com" }
    ],
    dueDate: "2024-12-12",
    createdDate: "2024-12-04",
    tags: ["meeting", "client"],
    client: "DEF Engineering",
    attachments: 0,
    comments: 1,
    timeTracked: "0h",
    estimatedTime: "2h"
  },
  {
    id: 6,
    title: "Inventory check - Hoses & Connectors",
    description: "Conduct physical inventory verification for Q4",
    status: "todo",
    priority: "low",
    assignees: [
      { id: 4, name: "Sneha Reddy", avatar: "SR", email: "sneha@mega.com" },
      { id: 3, name: "Amit Patel", avatar: "AP", email: "amit@mega.com" }
    ],
    dueDate: "2024-12-25",
    createdDate: "2024-12-06",
    tags: ["inventory", "hoses", "connectors"],
    client: null,
    attachments: 1,
    comments: 0,
    timeTracked: "0h",
    estimatedTime: "6h"
  },
  {
    id: 7,
    title: "WhatsApp automation setup",
    description: "Configure automated payment reminder sequences",
    status: "in_progress",
    priority: "medium",
    assignees: [
      { id: 5, name: "Vikash Singh", avatar: "VS", email: "vikash@mega.com" }
    ],
    dueDate: "2024-12-18",
    createdDate: "2024-12-02",
    tags: ["automation", "whatsapp"],
    client: null,
    attachments: 3,
    comments: 4,
    timeTracked: "4h 15m",
    estimatedTime: "8h"
  },
  {
    id: 8,
    title: "Update client database",
    description: "Clean and update contact information for all clients",
    status: "completed",
    priority: "low",
    assignees: [
      { id: 2, name: "Priya Sharma", avatar: "PS", email: "priya@mega.com" }
    ],
    dueDate: "2024-12-05",
    createdDate: "2024-11-25",
    completedDate: "2024-12-04",
    tags: ["database", "clients"],
    client: null,
    attachments: 0,
    comments: 1,
    timeTracked: "2h 30m",
    estimatedTime: "3h"
  }
];

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
  review: {
    label: "Review",
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-yellow-500"
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-purple-100 text-purple-800",
    dotColor: "bg-purple-500"
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

// Team members
export const teamMembers = [
  { id: 1, name: "Rajesh Kumar", avatar: "RK", email: "rajesh@mega.com", role: "Sales Manager" },
  { id: 2, name: "Priya Sharma", avatar: "PS", email: "priya@mega.com", role: "Operations" },
  { id: 3, name: "Amit Patel", avatar: "AP", email: "amit@mega.com", role: "Accounts" },
  { id: 4, name: "Sneha Reddy", avatar: "SR", email: "sneha@mega.com", role: "Inventory" },
  { id: 5, name: "Vikash Singh", avatar: "VS", email: "vikash@mega.com", role: "Technical" }
];

// Helper functions
export const getTasksByStatus = (status) => {
  return sampleTasks.filter(task => task.status === status);
};

export const getCompletedTasks = () => {
  return sampleTasks.filter(task => task.status === 'completed');
};

export const getTasksByPriority = (priority) => {
  return sampleTasks.filter(task => task.priority === priority);
};

export const getOverdueTasks = () => {
  const today = new Date();
  return sampleTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== 'completed';
  });
};

export const getTasksDueToday = () => {
  const today = new Date().toISOString().split('T')[0];
  return sampleTasks.filter(task => task.dueDate === today);
};

export const getTaskStats = () => {
  return {
    total: sampleTasks.length,
    completed: getCompletedTasks().length,
    inProgress: getTasksByStatus('in_progress').length,
    overdue: getOverdueTasks().length,
    dueToday: getTasksDueToday().length
  };
};