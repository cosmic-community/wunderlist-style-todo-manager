# 📝 Wunderlist-Style Todo Manager

![App Preview](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=300&fit=crop&auto=format)

A beautiful, modern todo list application inspired by Wunderlist, built with Next.js 16 and powered by Cosmic CMS. Organize your tasks into custom lists, set priorities and due dates, and track your progress with an intuitive interface.

## ✨ Features

- 📋 **Custom Lists** - Organize tasks into color-coded lists (Work, Personal, Shopping)
- ✅ **Task Management** - Create, edit, complete, and delete tasks with ease
- 🎯 **Priority Levels** - Assign Low, Medium, or High priority to tasks
- 📅 **Due Dates** - Track deadlines and stay on schedule
- 🎨 **Beautiful UI** - Clean, modern design with smooth animations
- 📱 **Mobile Responsive** - Fully optimized for mobile devices with touch interactions
- 🚀 **Real-time Updates** - Instant synchronization with Cosmic CMS
- 🌈 **Color-Coded Lists** - Visual organization with custom list colors

## Clone this Project

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=695dc02cf4835a7e91ecee1d&clone_repository=695dc18ff4835a7e91ecee87)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> "Create a todo list app, similar to Wunderlist."

### Code Generation Prompt

> Based on the content model I created for "Create a todo list app, similar to Wunderlist.", now build a complete web application that showcases this content. Include a modern, responsive design with proper navigation, content display, and user-friendly interface. Make it easy to use on mobile.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠️ Technologies

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **CMS**: Cosmic
- **Language**: TypeScript
- **Icons**: Lucide React
- **Package Manager**: Bun

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cosmic account and bucket

### Installation

1. Clone this repository
2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file in the root directory:
```env
COSMIC_BUCKET_SLUG=your-bucket-slug
COSMIC_READ_KEY=your-read-key
COSMIC_WRITE_KEY=your-write-key
```

4. Run the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Cosmic SDK Examples

### Fetching Tasks with Related Lists

```typescript
import { cosmic } from '@/lib/cosmic'

// Get all tasks with their associated lists
const { objects: tasks } = await cosmic.objects
  .find({ type: 'tasks' })
  .props(['id', 'title', 'slug', 'metadata'])
  .depth(1) // Include related list data

// Filter tasks by completion status
const completedTasks = tasks.filter(task => task.metadata.completed)
const pendingTasks = tasks.filter(task => !task.metadata.completed)
```

### Creating a New Task

```typescript
// Create a task with all metadata fields
await cosmic.objects.insertOne({
  type: 'tasks',
  title: 'New Task',
  metadata: {
    title: 'New Task',
    description: 'Task description here',
    completed: false,
    priority: { key: 'medium', value: 'Medium' },
    due_date: '2024-12-31',
    list: 'list-object-id' // ID of the associated list
  }
})
```

### Updating Task Status

```typescript
// Toggle task completion - only include changed fields
await cosmic.objects.updateOne(taskId, {
  metadata: {
    completed: true
  }
})
```

### Fetching Lists

```typescript
// Get all lists with their metadata
const { objects: lists } = await cosmic.objects
  .find({ type: 'lists' })
  .props(['id', 'title', 'slug', 'metadata'])
```

## 🎨 Cosmic CMS Integration

This application uses two main content types:

### Tasks Object Type
- **Title** (text, required) - Task name
- **Description** (textarea) - Detailed task description
- **Completed** (switch) - Task completion status
- **Priority** (select-dropdown) - Low, Medium, or High
- **Due Date** (date) - Task deadline
- **List** (object relation) - Associated list

### Lists Object Type
- **Name** (text, required) - List name
- **Description** (textarea) - List description
- **Color** (color) - Custom list color for visual organization

All content is managed through your Cosmic dashboard and automatically syncs with the application.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `COSMIC_BUCKET_SLUG`
   - `COSMIC_READ_KEY`
   - `COSMIC_WRITE_KEY`
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Create a new site in Netlify
3. Configure build settings:
   - Build command: `bun run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

For production deployments, ensure all environment variables are properly configured in your hosting platform's dashboard.

<!-- README_END -->