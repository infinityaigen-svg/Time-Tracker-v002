
import { User, Task, TaskStatus, UserRole } from './types';

// --- MOCK DATABASE ---
const now = Date.now();
let users: User[] = [
  { id: '1', name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN, isActive: true, createdAt: now, updatedAt: now, createdBy: null, updatedBy: null },
  { id: '2', name: 'Alex Kit', email: 'alex.kit@example.com', role: UserRole.USER, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '3', name: 'Jane Anderson', email: 'jane.anderson@example.com', role: UserRole.USER, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '4', name: 'David Smith', email: 'david.smith@example.com', role: UserRole.USER, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '5', name: 'Susan David', email: 'susan.david@example.com', role: UserRole.USER, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '6', name: 'Tammy Smith', email: 'tammy.smith@example.com', role: UserRole.USER, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '7', name: 'Mary James', email: 'mary.james@example.com', role: UserRole.USER, isActive: false, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '8', name: 'Sandy Anderson', email: 'sandy.ksnl@gmail.com', role: UserRole.ADMIN, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
  { id: '9', name: 'New Admin', email: 'about.ksnl@gmail.com', role: UserRole.ADMIN, isActive: true, createdAt: now, updatedAt: now, createdBy: 'admin@example.com', updatedBy: 'admin@example.com' },
];

let tasks: Task[] = [
  { id: 't1', name: 'Design new landing page', description: 'Create mockups and wireframes in Figma.', estimatedTime: 3600 * 2, elapsedTime: 1800, status: TaskStatus.STARTED, assignedTo: 'alex.kit@example.com', createdBy: 'admin@example.com', createdAt: Date.now() - 86400000, logs: [], notes: [], startedAt: Date.now() - 1800000, urlLink: 'https://www.figma.com/design', updatedAt: now, updatedBy: 'admin@example.com' },
  { id: 't2', name: 'Develop login feature', description: 'Implement JWT authentication for the API.', estimatedTime: 3600 * 4, elapsedTime: 0, status: TaskStatus.NEW, assignedTo: 'jane.anderson@example.com', createdBy: 'admin@example.com', createdAt: Date.now() - 172800000, logs: [], notes: [], updatedAt: now, updatedBy: 'admin@example.com' },
  { id: 't3', name: 'Client meeting preparation', description: 'Prepare slides for the Q3 review meeting.', estimatedTime: 3600, elapsedTime: 3600, status: TaskStatus.REVIEW, assignedTo: 'david.smith@example.com', createdBy: 'admin@example.com', createdAt: Date.now() - 259200000, logs: [], notes: [], startedAt: Date.now() - 260000000, completedAt: Date.now() - 259200000, updatedAt: now, updatedBy: 'admin@example.com' },
  { id: 't4', name: 'Deploy staging server', description: 'Update the staging environment with the latest build.', estimatedTime: 1800, elapsedTime: 1800, status: TaskStatus.COMPLETED, assignedTo: 'admin@example.com', createdBy: 'admin@example.com', createdAt: Date.now() - 345600000, logs: [], notes: [{ timestamp: Date.now() - 345000000, user: 'admin@example.com', text: 'Approved.' }], updatedAt: now, updatedBy: 'admin@example.com' },
];

// --- MOCK API FUNCTIONS ---

// Fix: Make simulateNetwork generic to correctly infer return types.
const simulateNetwork = <T>(data: T, delay = 500): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), delay));

// Fix: Explicitly type return as Promise<never> for better type checking with rejected promises.
const simulateError = (message: string, delay = 500): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), delay));

export const api = {
  login: async (email: string): Promise<User> => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (!user.isActive) {
        return simulateError('This account has been deactivated.');
      }
      localStorage.setItem('currentUserEmail', user.email);
      return simulateNetwork(user);
    }
    return simulateError('User not found.');
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('currentUserEmail');
    return simulateNetwork(undefined, 200);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const email = localStorage.getItem('currentUserEmail');
    if (!email) return simulateNetwork(null);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return simulateNetwork(user || null);
  },

  getUsers: async (): Promise<User[]> => {
    return simulateNetwork([...users]);
  },

  getTasks: async (): Promise<Task[]> => {
    return simulateNetwork([...tasks]);
  },
  
  createTask: async (newTaskData: Omit<Task, 'id' | 'updatedAt' | 'updatedBy'>): Promise<Task> => {
    const now = Date.now();
    const task: Task = {
      ...newTaskData,
      id: `task-${now}`,
      updatedAt: now,
      updatedBy: newTaskData.createdBy,
    };
    tasks.push(task);
    return simulateNetwork(task);
  },

  updateTask: async (updatedTask: Task, updaterEmail: string): Promise<Task> => {
    const taskWithAudit = { ...updatedTask, updatedAt: Date.now(), updatedBy: updaterEmail };
    tasks = tasks.map(task => (task.id === taskWithAudit.id ? taskWithAudit : task));
    return simulateNetwork(taskWithAudit);
  },
  
  softDeleteTasks: async (taskIds: string[], deleterEmail: string): Promise<{updatedTasks: Task[]}> => {
    const updatedTasks: Task[] = [];
    tasks = tasks.map(task => {
        if (taskIds.includes(task.id)) {
            const updatedTask = { 
                ...task, 
                status: TaskStatus.DELETED,
                deletedAt: Date.now(),
                deletedBy: deleterEmail,
                updatedAt: Date.now(),
                updatedBy: deleterEmail
            };
            updatedTasks.push(updatedTask);
            return updatedTask;
        }
        return task;
    });
    return simulateNetwork({ updatedTasks });
  },
  
  createUser: async (newUserData: Omit<User, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, creatorEmail: string | null): Promise<User> => {
     if (users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase())) {
        return simulateError('A user with this email already exists.');
    }
    const now = Date.now();
    const user: User = {
      ...newUserData,
      id: `user-${now}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: creatorEmail,
      updatedBy: creatorEmail,
    };
    users.push(user);
    return simulateNetwork(user);
  },
  
  updateUser: async (updatedUser: User, updaterEmail: string): Promise<User> => {
    if (users.some(u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id)) {
        return simulateError('Another user with this email already exists.');
    }
    const oldEmail = users.find(u => u.id === updatedUser.id)?.email;
    const userWithAudit = { ...updatedUser, updatedAt: Date.now(), updatedBy: updaterEmail };

    users = users.map(user => (user.id === userWithAudit.id ? userWithAudit : user));
    
    // Cascade email change to tasks
    if (oldEmail && oldEmail !== userWithAudit.email) {
        tasks = tasks.map(task => {
            const updatedTask = {...task};
            if (task.assignedTo === oldEmail) updatedTask.assignedTo = userWithAudit.email;
            if (task.createdBy === oldEmail) updatedTask.createdBy = userWithAudit.email;
            updatedTask.logs = task.logs.map(log => log.user === oldEmail ? {...log, user: userWithAudit.email} : log);
            updatedTask.notes = task.notes.map(note => note.user === oldEmail ? {...note, user: userWithAudit.email} : note);
            return updatedTask;
        });
    }
    
    return simulateNetwork(userWithAudit);
  },
  
  deactivateUser: async (userId: string, deleterEmail: string): Promise<User> => {
    let deactivatedUser: User | null = null;
    users = users.map(u => {
        if (u.id === userId) {
            deactivatedUser = { 
                ...u, 
                isActive: false,
                deletedAt: Date.now(),
                deletedBy: deleterEmail,
                updatedAt: Date.now(),
                updatedBy: deleterEmail,
            };
            return deactivatedUser;
        }
        return u;
    });
    if (deactivatedUser) {
        return simulateNetwork(deactivatedUser);
    }
    return simulateError('User to deactivate not found.');
  }
};