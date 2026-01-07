// Base Cosmic object interface
export interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metadata: Record<string, unknown>;
  type: string;
  created_at: string;
  modified_at: string;
}

// Priority type for select-dropdown (exact values from content model)
export type TaskPriority = 'low' | 'medium' | 'high';

// List object type
export interface List extends CosmicObject {
  type: 'lists';
  metadata: {
    name: string;
    description?: string;
    color?: string;
  };
}

// Task object type
export interface Task extends CosmicObject {
  type: 'tasks';
  metadata: {
    title: string;
    description?: string;
    completed: boolean;
    starred?: boolean;
    priority?: {
      key: TaskPriority;
      value: string;
    };
    due_date?: string;
    list?: List;
  };
}

// API response types
export interface CosmicResponse<T> {
  objects: T[];
  total: number;
  limit?: number;
  skip?: number;
}

// Form data types
export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  list?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  completed?: boolean;
  starred?: boolean;
  priority?: TaskPriority;
  due_date?: string;
  list?: string;
}

// List form data types
export interface CreateListData {
  name: string;
  description?: string;
  color?: string;
}