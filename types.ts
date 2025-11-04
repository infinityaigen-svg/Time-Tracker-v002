export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum TaskStatus {
  NEW = 'New Task',
  STARTED = 'Task Started',
  REVIEW = 'Task Review',
  COMPLETED = 'Completed',
  DELETED = 'Deleted',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt?: number;
  deletedBy?: string | null;
}

export interface TaskLog {
  timestamp: number;
  user: string;
  change: string;
}

export interface TaskNote {
  timestamp: number;
  user: string;
  text: string;
}

export interface Task {
  id:string;
  name: string;
  description: string;
  estimatedTime: number; // in seconds
  elapsedTime: number; // in seconds
  status: TaskStatus;
  assignedTo: string; // user email
  createdBy: string; // user email
  createdAt: number; // timestamp
  updatedAt: number;
  updatedBy: string | null;
  deletedAt?: number;
  deletedBy?: string | null;
  startedAt?: number; // timestamp
  completedAt?: number; // timestamp
  logs: TaskLog[];
  notes: TaskNote[];
  urlLink?: string;
}