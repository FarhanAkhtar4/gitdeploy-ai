import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { getWorkflowRun, listWorkflowRuns } from '@/lib/github-api';

// GET /api/deploy/status — Poll deployment status
export async function GET(request: NextRequest) {
  try {
    const deploymentId = request.nextUrl.searchParams.get('deploymentId');
    const projectId = request.nextUrl.searchParams.get('projectId');
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Get deployment from database
    let deployment;
    if (deploymentId) {
      deployment = await db.deployment.findUnique({ where: { id: deploymentId } });
    } else if (projectId) {
      deployment = await db.deployment.findFirst({
        where: { project_id: projectId },
        orderBy: { started_at: 'desc' },
      });
    }

    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    // If we have a GitHub run ID, poll GitHub for status
    let githubStatus = null;
    if (deployment.github_run_id) {
      try {
        const credential = await db.gitHubCredential.findFirst({
          where: { user_id: userId },
        });

        if (credential) {
          const token = decrypt(credential.encrypted_token, credential.iv, credential.auth_tag);
          const user = await db.user.findUnique({ where: { id: userId } });

          if (user?.github_username) {
            const project = await db.project.findUnique({
              where: { id: deployment.project_id },
            });

            if (project) {
              const repoName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const runResult = await getWorkflowRun(
                token,
                user.github_username,
                repoName,
                deployment.github_run_id
              );
              const runData = runResult.data as Record<string, unknown>;
              githubStatus = {
                status: runData.status,
                conclusion: runData.conclusion,
                html_url: runData.html_url,
              };

              // Update deployment status based on GitHub
              const ghStatus = runData.status as string;
              const ghConclusion = runData.conclusion as string | null;

              if (ghStatus === 'completed') {
                await db.deployment.update({
                  where: { id: deployment.id },
                  data: {
                    status: ghConclusion === 'success' ? 'completed' : 'failed',
                    completed_at: new Date(),
                    duration_ms: deployment.started_at
                      ? Date.now() - new Date(deployment.started_at).getTime()
                      : null,
                  },
                });

                await db.project.update({
                  where: { id: deployment.project_id },
                  data: {
                    status: ghConclusion === 'success' ? 'live' : 'failed',
                  },
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('GitHub status poll error:', error);
      }
    }

    // Get recent runs as fallback
    let recentRuns = null;
    try {
      const credential = await db.gitHubCredential.findFirst({
        where: { user_id: userId },
      });
      if (credential && projectId) {
        const token = decrypt(credential.encrypted_token, credential.iv, credential.auth_tag);
        const user = await db.user.findUnique({ where: { id: userId } });
        const project = await db.project.findUnique({ where: { id: projectId } });

        if (user?.github_username && project) {
          const repoName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const runsResult = await listWorkflowRuns(token, user.github_username, repoName);
          const runsData = runsResult.data as Record<string, unknown>;
          recentRuns = runsData.workflow_runs;
        }
      }
    } catch {
      // Ignore errors fetching recent runs
    }

    return NextResponse.json({
      deployment: {
        id: deployment.id,
        status: deployment.status,
        startedAt: deployment.started_at,
        completedAt: deployment.completed_at,
        durationMs: deployment.duration_ms,
        logSummary: deployment.log_summary,
        errorMessage: deployment.error_message,
        triggeredBy: deployment.triggered_by,
      },
      githubStatus,
      recentRuns,
    });
  } catch (error) {
    console.error('Deploy status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
