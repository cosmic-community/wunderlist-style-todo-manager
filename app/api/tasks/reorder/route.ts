import { NextResponse } from 'next/server'
import { cosmic } from '@/lib/cosmic'

// Bulk update task orders
export async function POST(request: Request) {
  try {
    const { tasks } = await request.json()

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Invalid request: tasks must be an array' },
        { status: 400 }
      )
    }

    console.log('Reordering tasks:', JSON.stringify(tasks, null, 2))

    // Update each task's order sequentially to avoid rate limiting
    const results = []
    for (const { id, order } of tasks as { id: string; order: number }[]) {
      try {
        // First fetch the current task to get existing metadata
        const currentTask = await cosmic.objects.findOne({ id, type: 'tasks' })

        if (!currentTask?.object) {
          console.error(`Task ${id} not found`)
          results.push({ id, order, success: false, error: 'Task not found' })
          continue
        }

        // Merge order into existing metadata
        const updatedMetadata = {
          ...currentTask.object.metadata,
          order
        }

        const result = await cosmic.objects.updateOne(id, {
          metadata: updatedMetadata
        })

        console.log(`Updated task ${id} with order ${order}`)
        results.push({ id, order, success: true, newOrder: result.object?.metadata?.order })
      } catch (err) {
        console.error(`Failed to update task ${id}:`, err)
        results.push({ id, order, success: false, error: String(err) })
      }
    }

    const failed = results.filter(r => !r.success)
    if (failed.length > 0) {
      console.error('Some tasks failed to update:', JSON.stringify(failed, null, 2))
    }

    return NextResponse.json({ success: failed.length === 0, results })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    return NextResponse.json(
      { error: 'Failed to reorder tasks', details: String(error) },
      { status: 500 }
    )
  }
}
