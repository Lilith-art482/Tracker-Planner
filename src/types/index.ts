export interface PlanItem {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'weekly' | 'monthly';
  weekStart: string;
  month: string;
  userId: string;
  createdAt: Date;
}

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  priority: Priority;
  comment: string;
  status: TaskStatus;
  date: Date;
  projectId: string | null;
  planId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  features: string[];
  notes: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
}
