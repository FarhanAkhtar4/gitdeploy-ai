import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import {
  getRepo,
  createRepo,
  getFileContents,
  createOrUpdateFile,
  listWorkflows,
  dispatchWorkflow,
} from '@/lib/github-api';

// POST /api/projects/deploy — Deploy project to GitHub
export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and User ID required' }, { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get user's GitHub token
    const credential = await db.gitHubCredential.findFirst({
      where: { user_id: userId },
    });

    if (!credential) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 });
    }

    const token = decrypt(credential.encrypted_token, credential.iv, credential.auth_tag);
    const owner = credential.scopes; // We need to get the owner from the user
    const user = await db.user.findUnique({ where: { id: userId } });
    const githubOwner = user?.github_username;

    if (!githubOwner) {
      return NextResponse.json({ error: 'GitHub username not found' }, { status: 400 });
    }

    const repoName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // STEP D1 — Repository Setup
    let repoExists = false;
    try {
      await getRepo(token, githubOwner, repoName);
      repoExists = true;
    } catch {
      // Repo doesn't exist, will create it
    }

    if (!repoExists) {
      await createRepo(token, {
        name: repoName,
        description: project.description || `Project built with GitDeploy AI`,
        private: false,
        auto_init: false,
      });
    }

    // Update project with repo URL
    await db.project.update({
      where: { id: projectId },
      data: {
        github_repo_url: `https://github.com/${githubOwner}/${repoName}`,
        status: 'deploying',
      },
    });

    // Create deployment record
    const deployment = await db.deployment.create({
      data: {
        project_id: projectId,
        triggered_by: 'manual',
        status: 'in_progress',
      },
    });

    // STEP D2 — File Upload
    let uploadedCount = 0;
    const totalFiles = project.files.length;
    const uploadErrors: string[] = [];

    for (const file of project.files) {
      try {
        // Check if file exists to get SHA
        let sha: string | undefined;
        try {
          const existingFile = await getFileContents(token, githubOwner, repoName, file.file_path);
          const fileData = existingFile.data as Record<string, unknown>;
          sha = fileData.sha as string;
        } catch {
          // File doesn't exist yet
        }

        // Base64 encode content
        const content = Buffer.from(file.content).toString('base64');

        // Push file
        await createOrUpdateFile(token, githubOwner, repoName, file.file_path, {
          message: `feat: add ${file.file_path}`,
          content,
          sha,
          branch: project.default_branch,
        });

        uploadedCount++;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        uploadErrors.push(`${file.file_path}: ${errMsg}`);
      }
    }

    // STEP D3 — Workflow Deployment
    const deployWorkflowContent = project.files.find(
      (f) => f.file_path.includes('.github/workflows/')
    );
    if (deployWorkflowContent) {
      try {
        let sha: string | undefined;
        try {
          const existingFile = await getFileContents(
            token, githubOwner, repoName, deployWorkflowContent.file_path
          );
          const fileData = existingFile.data as Record<string, unknown>;
          sha = fileData.sha as string;
        } catch {
          // File doesn't exist
        }

        const content = Buffer.from(deployWorkflowContent.content).toString('base64');
        await createOrUpdateFile(token, githubOwner, repoName, deployWorkflowContent.file_path, {
          message: 'ci: add deployment workflow',
          content,
          sha,
          branch: project.default_branch,
        });
      } catch (error) {
        uploadErrors.push(`Workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // STEP D4 — Trigger Deployment Run
    let workflowDispatched = false;
    try {
      const workflowsResult = await listWorkflows(token, githubOwner, repoName);
      const workflowsData = workflowsResult.data as Record<string, unknown>;
      const workflows = (workflowsData.workflows as Array<Record<string, unknown>>) || [];

      if (workflows.length > 0) {
        const workflowId = String(workflows[0].id);
        await dispatchWorkflow(token, githubOwner, repoName, workflowId, project.default_branch);
        workflowDispatched = true;
      }
    } catch (error) {
      console.error('Workflow dispatch error:', error);
    }

    // Update deployment
    await db.deployment.update({
      where: { id: deployment.id },
      data: {
        status: uploadErrors.length === 0 ? 'completed' : 'partial',
        completed_at: new Date(),
        duration_ms: Date.now() - deployment.started_at.getTime(),
        log_summary: `Uploaded ${uploadedCount}/${totalFiles} files. Workflow ${workflowDispatched ? 'dispatched' : 'not dispatched'}.`,
        error_message: uploadErrors.length > 0 ? uploadErrors.join('\n') : null,
      },
    });

    // Update project status
    await db.project.update({
      where: { id: projectId },
      data: {
        status: uploadErrors.length === 0 ? 'live' : 'failed',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        user_id: userId,
        action: 'PROJECT_DEPLOYED',
        entity_type: 'Project',
        entity_id: projectId,
        metadata: JSON.stringify({
          repo: `${githubOwner}/${repoName}`,
          filesUploaded: uploadedCount,
          totalFiles,
          workflowDispatched,
          errors: uploadErrors,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      repoUrl: `https://github.com/${githubOwner}/${repoName}`,
      filesUploaded: uploadedCount,
      totalFiles,
      workflowDispatched,
      errors: uploadErrors,
      deploymentId: deployment.id,
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    );
  }
}
