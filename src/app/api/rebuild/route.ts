import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { dispatchWorkflow, listWorkflows } from '@/lib/github-api';

// POST /api/rebuild — Trigger a rebuild/re-deploy
export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and User ID required' }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create deployment record
    const deployment = await db.deployment.create({
      data: {
        project_id: projectId,
        triggered_by: 'rebuild',
        status: 'in_progress',
      },
    });

    // Update project status
    await db.project.update({
      where: { id: projectId },
      data: { status: 'building' },
    });

    // Try to dispatch workflow if GitHub is connected
    let workflowDispatched = false;
    try {
      const credential = await db.gitHubCredential.findFirst({
        where: { user_id: userId },
      });
      if (credential && project.github_repo_url) {
        const token = decrypt(credential.encrypted_token, credential.iv, credential.auth_tag);
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user?.github_username) {
          const repoName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const workflowsResult = await listWorkflows(token, user.github_username, repoName);
          const workflowsData = workflowsResult.data as Record<string, unknown>;
          const workflows = (workflowsData.workflows as Array<Record<string, unknown>>) || [];

          if (workflows.length > 0) {
            const workflowId = String(workflows[0].id);
            await dispatchWorkflow(token, user.github_username, repoName, workflowId, project.default_branch);
            workflowDispatched = true;
          }
        }
      }
    } catch (error) {
      console.error('Rebuild workflow dispatch error:', error);
    }

    await db.auditLog.create({
      data: {
        user_id: userId,
        action: 'PROJECT_REBUILD',
        entity_type: 'Project',
        entity_id: projectId,
        metadata: JSON.stringify({ workflowDispatched, deploymentId: deployment.id }),
      },
    });

    return NextResponse.json({
      success: true,
      deploymentId: deployment.id,
      workflowDispatched,
    });
  } catch (error) {
    console.error('Rebuild error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rebuild failed' },
      { status: 500 }
    );
  }
}
