import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/files — Save project files
export async function POST(request: NextRequest) {
  try {
    const { projectId, files } = await request.json();

    if (!projectId || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Project ID and files array required' }, { status: 400 });
    }

    // Upsert all files
    const results = [];
    for (const file of files) {
      const result = await db.projectFile.upsert({
        where: {
          project_id_file_path: {
            project_id: projectId,
            file_path: file.path,
          },
        },
        update: {
          content: file.content,
          size_bytes: Buffer.byteLength(file.content, 'utf8'),
        },
        create: {
          project_id: projectId,
          file_path: file.path,
          content: file.content,
          size_bytes: Buffer.byteLength(file.content, 'utf8'),
        },
      });
      results.push(result);
    }

    return NextResponse.json({ saved: results.length });
  } catch (error) {
    console.error('Save files error:', error);
    return NextResponse.json({ error: 'Failed to save files' }, { status: 500 });
  }
}

// GET /api/projects/files — Get project files
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const files = await db.projectFile.findMany({
      where: { project_id: projectId },
      orderBy: { file_path: 'asc' },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json({ error: 'Failed to get files' }, { status: 500 });
  }
}
