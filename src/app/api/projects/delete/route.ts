import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/projects/delete — Delete a project (local record only)
export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Delete project and all related records
    await db.deployment.deleteMany({ where: { project_id: projectId } });
    await db.projectFile.deleteMany({ where: { project_id: projectId } });
    await db.hostingConfig.deleteMany({ where: { project_id: projectId } });
    await db.project.delete({ where: { id: projectId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
