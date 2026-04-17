import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/projects/list — List all projects for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const projects = await db.project.findMany({
      where: { user_id: userId },
      include: {
        files: true,
        deployments: {
          orderBy: { started_at: 'desc' },
          take: 5,
        },
        hosting_config: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}

// POST /api/projects/list — Create a new project
export async function POST(request: NextRequest) {
  try {
    const { userId, name, description, framework, stackJson } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        user_id: userId,
        name,
        description: description || '',
        framework: framework || 'nextjs',
        stack_json: stackJson || '{}',
        status: 'not_deployed',
      },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        action: 'PROJECT_CREATED',
        entity_type: 'Project',
        entity_id: project.id,
        metadata: JSON.stringify({ name, framework }),
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
