// Changed: Added TaskPriority type export
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  slug: string
  type: string
  created_at?: string
  modified_at?: string
  metadata: {
    title: string
    description?: string
    completed: boolean
    priority?: {
      key: string
      value: string
    }
    due_date?: string
    list?: List | string
    owner?: User | string
    starred?: boolean
    order?: number
  }
}

export interface List {
  id: string
  title: string
  slug: string
  type: string
  created_at?: string
  modified_at?: string
  metadata: {
    name: string
    description?: string
    color?: string
    owner?: User | string
    created_by?: User | string
    shared_with?: (User | string)[]
    share_token?: string
  }
}

export interface User {
  id: string
  title: string
  slug: string
  type: string
  metadata: {
    email: string
    password_hash: string
    display_name: string
    email_verified?: boolean
    verification_code?: string
    password_reset_token?: string
    password_reset_expires?: string
    checkbox_position?: CheckboxPosition | { key: string; value: string }
    color_theme?: ColorTheme | { key: string; value: string }
    style_theme?: StyleTheme | { key: string; value: string }
  }
}

export interface AuthUser {
  id: string
  email: string
  display_name: string
  email_verified: boolean
  checkbox_position?: CheckboxPosition
  color_theme?: ColorTheme
  style_theme?: StyleTheme
}

export type CheckboxPosition = 'left' | 'right'
// Changed: Updated ColorTheme to include light, dark, system options used in the app
export type ColorTheme = 'light' | 'dark' | 'system'
// Changed: Updated StyleTheme to include all themes used in the app
export type StyleTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'lavender' | 'peach' | 'mint'