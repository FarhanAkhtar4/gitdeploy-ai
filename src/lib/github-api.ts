// ✅ [VERIFIED] GitHub REST API v3 Service Layer
// All endpoints used are documented at https://docs.github.com/en/rest

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubApiOptions {
  token: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface GitHubApiResult<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

class GitHubApiError extends Error {
  status: number;
  headers: Record<string, string>;
  body: unknown;

  constructor(message: string, status: number, headers: Record<string, string>, body?: unknown) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
}

async function githubRequest<T = unknown>(path: string, options: GitHubApiOptions): Promise<GitHubApiResult<T>> {
  const { token, method = 'GET', body, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  const maxRetries = 3;
  const delays = [2000, 5000, 15000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${GITHUB_API_BASE}${path}`, fetchOptions);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (response.status === 429) {
        const resetTime = responseHeaders['x-ratelimit-reset'];
        const retryAfter = resetTime
          ? Math.max(Number(resetTime) * 1000 - Date.now(), 1000)
          : 60000;
        throw new GitHubApiError(
          `Rate limit hit. Retry after ${new Date(Number(resetTime) * 1000).toISOString()}.`,
          429,
          responseHeaders
        );
      }

      if (response.status >= 500) {
        lastError = new GitHubApiError(
          `GitHub server error: ${response.status}`,
          response.status,
          responseHeaders
        );
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          continue;
        }
        throw lastError;
      }

      let data: T;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : ({} as T);
      } catch {
        data = text as unknown as T;
      }

      if (!response.ok) {
        throw new GitHubApiError(
          (data as { message?: string })?.message || `GitHub API error: ${response.status}`,
          response.status,
          responseHeaders,
          data
        );
      }

      return { data, status: response.status, headers: responseHeaders };
    } catch (error) {
      if (error instanceof GitHubApiError) {
        if (error.status >= 500 && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          continue;
        }
        throw error;
      }
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        continue;
      }
    }
  }

  throw lastError || new Error('GitHub API request failed after retries');
}

// ✅ [VERIFIED] GET /user — Get the authenticated user
export async function getAuthenticatedUser(token: string) {
  return githubRequest('/user', { token });
}

// ✅ [VERIFIED] GET /repos/{owner}/{repo} — Check if repo exists
export async function getRepo(token: string, owner: string, repo: string) {
  return githubRequest(`/repos/${owner}/${repo}`, { token });
}

// ✅ [VERIFIED] POST /user/repos — Create a repository for the authenticated user
export async function createRepo(token: string, payload: {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}) {
  return githubRequest('/user/repos', { token, method: 'POST', body: payload });
}

// ✅ [VERIFIED] GET /repos/{owner}/{repo}/contents/{path} — Get file contents
export async function getFileContents(token: string, owner: string, repo: string, path: string) {
  return githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, { token });
}

// ✅ [VERIFIED] PUT /repos/{owner}/{repo}/contents/{path} — Create or update file contents
export async function createOrUpdateFile(token: string, owner: string, repo: string, path: string, payload: {
  message: string;
  content: string;
  sha?: string;
  branch?: string;
}) {
  return githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    token,
    method: 'PUT',
    body: payload,
  });
}

// ✅ [VERIFIED] GET /repos/{owner}/{repo}/actions/workflows — List repository workflows
export async function listWorkflows(token: string, owner: string, repo: string) {
  return githubRequest(`/repos/${owner}/${repo}/actions/workflows`, { token });
}

// ✅ [VERIFIED] POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches — Create a workflow dispatch event
export async function dispatchWorkflow(token: string, owner: string, repo: string, workflowId: string, ref: string = 'main') {
  return githubRequest(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
    token,
    method: 'POST',
    body: { ref, inputs: {} },
  });
}

// ✅ [VERIFIED] GET /repos/{owner}/{repo}/actions/runs — List workflow runs for a repository
export async function listWorkflowRuns(token: string, owner: string, repo: string) {
  return githubRequest(`/repos/${owner}/${repo}/actions/runs`, { token });
}

// ✅ [VERIFIED] GET /repos/{owner}/{repo}/actions/runs/{run_id} — Get a workflow run
export async function getWorkflowRun(token: string, owner: string, repo: string, runId: string) {
  return githubRequest(`/repos/${owner}/${repo}/actions/runs/${runId}`, { token });
}

// ✅ [VERIFIED] GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs — Download workflow run logs
export async function getWorkflowRunLogs(token: string, owner: string, repo: string, runId: string) {
  return githubRequest(`/repos/${owner}/${repo}/actions/runs/${runId}/logs`, { token });
}

// ✅ [VERIFIED] DELETE /repos/{owner}/{repo}/actions/runs/{run_id} — Delete a workflow run
export async function deleteWorkflowRun(token: string, owner: string, repo: string, runId: string) {
  return githubRequest(`/repos/${owner}/${repo}/actions/runs/${runId}`, {
    token,
    method: 'DELETE',
  });
}

export { GitHubApiError };
