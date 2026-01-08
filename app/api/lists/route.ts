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
    
    // Changed: Return demo lists for unauthenticated users
    try {
      const response = await cosmic.objects
        .find({ type: 'lists' })
        .props(['id', 'title', 'slug', 'metadata'])
        .depth(1)
      
      // Filter to show only demo lists (lists without owner or with empty owner)
      const demoLists = response.objects.filter((list: any) => {
        const owner = list.metadata.owner
        return !owner || owner === '' || (typeof owner === 'object' && !owner.id)
      })
      
      return NextResponse.json({ lists: demoLists })
    } catch (error) {
      // If no demo lists exist, return empty array
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return NextResponse.json({ lists: [] })
      }
      throw error
    }
  } catch (error) {
    console.error('Error fetching lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const session = await getSession()
    
    // Generate a slug from the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Changed: Allow list creation without auth (demo mode)
    const listData: any = {
      title: name.trim(),
      slug: slug + '-' + Date.now(),
      type: 'lists',
      metadata: {
        name: name.trim(),
        description: description?.trim() || '',
        color: color || '#3b82f6',
        shared_with: [],
        share_token: ''
      }
    }

    // Only add owner if authenticated
    if (session) {
      listData.metadata.owner = session.user.id
      listData.metadata.created_by = session.user.id
    }

    const response = await cosmic.objects.insertOne(listData)

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