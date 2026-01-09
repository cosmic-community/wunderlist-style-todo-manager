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

// Changed: Added checkbox position type
export type CheckboxPosition = 'left' | 'right';

// Changed: Added color theme type
export type ColorTheme = 'light' | 'dark' | 'system';

// Changed: Added four new feminine style themes: rose, lavender, peach, mint
export type StyleTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'lavender' | 'peach' | 'mint';

// User object type
// Changed: Added checkbox_position, color_theme, and style_theme fields for user preferences
export interface User extends CosmicObject {
  type: 'users';
  metadata: {
    email: string;
    password_hash: string;
    display_name: string;
    email_verified: boolean;
    verification_code?: string;
    password_reset_token?: string;
    password_reset_expires?: string;
    checkbox_position?: {
      key: CheckboxPosition;
      value: string;
    };
    color_theme?: {
      key: ColorTheme;
      value: string;
    };
    style_theme?: {
      key: StyleTheme;
      value: string;
    };
  };
}

// List object type
export interface List extends CosmicObject {
  type: 'lists';
  metadata: {
    name: string;
    description?: string;
    color?: string;
    owner?: string | User;
    shared_with?: string[] | User[];
    share_token?: string;
    created_by?: string | User;
  };
}

// Task object type
// Changed: Added owner field to allow tasks to be associated directly with a user
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
    list?: List | string;
    owner?: User | string; // Changed: Added owner field
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

export interface UpdateListData {
  name?: string;
  description?: string;
  color?: string;
}

// Auth types
// Changed: Added checkbox_position, color_theme, and style_theme to AuthUser
export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  email_verified: boolean;
  checkbox_position?: CheckboxPosition;
  color_theme?: ColorTheme;
  style_theme?: StyleTheme;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface SignupData {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface InviteData {
  email: string;
  listId: string;
  inviterName: string;
}

// Changed: Added ForgotPasswordData and ResetPasswordData types
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

// Changed: Added UserPreferences type for preference updates
export interface UserPreferences {
  checkbox_position?: CheckboxPosition;
  color_theme?: ColorTheme;
  style_theme?: StyleTheme;
}