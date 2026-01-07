import { NextRequest, NextResponse } from 'next/server'
import { cosmic, getListsForUser } from '@/lib/cosmic'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    // Check for authenticated user
    const session = await getSession()
    
    if (session) {
      // Return only user's lists
      const lists = await getListsForUser(session.user.id)
      return NextResponse.json({ lists })
    }
    
    // No auth - return empty array (user must log in)
    return NextResponse.json({ lists: [] })
  } catch (error) {
    // Handle 404 (no objects found) as empty array
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return NextResponse.json({ lists: [] })
    }
    console.error('Error fetching lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { name, description, color } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Generate a slug from the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const response = await cosmic.objects.insertOne({
      title: name.trim(),
      slug: slug + '-' + Date.now(),
      type: 'lists',
      metadata: {
        name: name.trim(),
        description: description?.trim() || '',
        color: color || '#3b82f6',
        owner: session.user.id,
        created_by: session.user.id,
        shared_with: [],
        share_token: ''
      }
    })

    // Changed: Return the full list object with all properties
    return NextResponse.json({ 
      list: {
        id: response.object.id,
        slug: response.object.slug,
        title: response.object.title,
        type: response.object.type,
        created_at: response.object.created_at,
        modified_at: response.object.modified_at,
        metadata: response.object.metadata
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating list:', error)
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    )
  }
}