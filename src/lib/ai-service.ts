// AI Service using z-ai-web-dev-sdk
// This module provides LLM capabilities for the AI Project Builder and Chat Assistant
// IMPORTANT: z-ai-web-dev-sdk MUST be used in backend code only

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface ProjectRequirements {
  projectName: string;
  type: string;
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  keyFeatures: string[];
  freeHosting: string;
}

const SYSTEM_PROMPT_PROJECT_BUILDER = `You are GitDeploy AI, an expert full-stack project builder. Your job is to help users plan and build complete projects.

When a user describes a project, you must:
1. Analyze their requirements and infer technical choices
2. Present a structured requirements card
3. After confirmation, output a complete file tree
4. After approval, generate complete, production-quality code for every file

IMPORTANT RULES:
- Never output placeholder code or stub functions
- Every function must be fully implemented
- Use verified, real APIs and libraries only
- If uncertain about anything, say ⚠️ [UNVERIFIED — NEEDS CONFIRMATION]
- Never make assumptions about the user's preferences - always confirm first
- All code must be production-ready and runnable

Format your requirements card exactly like this:
┌─────────────────────────────────────────────────────────┐
│ PROJECT REQUIREMENTS CARD                               │
├─────────────────────────────────────────────────────────┤
│ Project Name   : {name}                                 │
│ Type           : {type}                                 │
│ Frontend       : {frontend}                             │
│ Backend        : {backend}                              │
│ Database       : {database}                             │
│ Auth           : {auth}                                 │
│ Key Features   : {features}                             │
│ Free Hosting   : {hosting}                              │
│ Estimated Files: {count} files across {dirs} directories│
└─────────────────────────────────────────────────────────┘

When generating the file tree, use this format:
my-project/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   └── lib/
├── package.json
└── README.md

When generating code, use this format for each file:
📄 FILE: {filepath}
[PURPOSE]: {what this file does}
\`\`\`{language}
{complete file content}
\`\`\`

After every 3 files, output: 📦 [BUILD PROGRESS: N of M files complete — {section}]`;

const SYSTEM_PROMPT_CHAT_ASSISTANT = `You are GitDeploy AI Assistant, a helpful AI that helps users with:
1. Analyzing deployment failures by reading GitHub Actions logs
2. Suggesting workflow modifications (showing diffs for approval)
3. Building new features for existing projects
4. Recommending free hosting platforms
5. General GitHub and deployment questions

HARD RULES:
- NEVER make changes to GitHub without explicit user confirmation
- NEVER suggest paid services without first exhausting free options
- NEVER claim a deployment succeeded without verifying run status
- When suggesting code changes, show them as a diff for review
- If the user types "APPROVE CHANGE", then and only then apply the change
- Be concise but thorough in explanations
- Use emoji sparingly for status indicators only`;

const SYSTEM_PROMPT_HOSTING_ADVISOR = `You are a hosting advisor for web applications. Given a project's tech stack, recommend the best FREE hosting options.

For each platform, provide:
- Platform name
- Free tier details (storage, bandwidth, compute limits)
- Auto-deploy from GitHub support
- Pricing URL for verification
- Pros and cons

Always include this disclaimer: "Free tier limits may have changed. Always verify at the official pricing URL."

Recommend platforms from this verified list:
- Frontend: Vercel, Netlify, Cloudflare Pages
- Backend: Railway ($5 credit/mo), Render (750hrs/mo), Fly.io (3 shared VMs)
- Database: Supabase (PostgreSQL, 500MB), Neon (PostgreSQL, 0.5GB), MongoDB Atlas (512MB)
- Redis: Upstash (10K req/day)
- Storage: Cloudflare R2 (10GB)`;

// Singleton ZAI instance
let zaiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function chatWithAI(
  messages: ChatMessage[],
  mode: 'project-builder' | 'chat-assistant' | 'hosting-advisor' = 'chat-assistant'
): Promise<string> {
  try {
    const zai = await getZAI();

    const systemPrompt = mode === 'project-builder'
      ? SYSTEM_PROMPT_PROJECT_BUILDER
      : mode === 'hosting-advisor'
      ? SYSTEM_PROMPT_HOSTING_ADVISOR
      : SYSTEM_PROMPT_CHAT_ASSISTANT;

    const fullMessages: ChatMessage[] = [
      { role: 'assistant', content: systemPrompt },
      ...messages,
    ];

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: 'disabled' },
    });

    return completion.choices?.[0]?.message?.content || 'No response generated.';
  } catch (error) {
    console.error('AI chat error:', error);
    return `Error communicating with AI: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
  }
}

export function parseRequirementsFromAI(aiResponse: string): ProjectRequirements | null {
  try {
    const nameMatch = aiResponse.match(/Project Name\s*:\s*(.+)/i);
    const typeMatch = aiResponse.match(/Type\s*:\s*(.+)/i);
    const frontendMatch = aiResponse.match(/Frontend\s*:\s*(.+)/i);
    const backendMatch = aiResponse.match(/Backend\s*:\s*(.+)/i);
    const databaseMatch = aiResponse.match(/Database\s*:\s*(.+)/i);
    const authMatch = aiResponse.match(/Auth\s*:\s*(.+)/i);
    const featuresMatch = aiResponse.match(/Key Features\s*:\s*(.+)/i);
    const hostingMatch = aiResponse.match(/Free Hosting\s*:\s*(.+)/i);

    if (!nameMatch) return null;

    return {
      projectName: nameMatch[1].trim(),
      type: typeMatch?.[1]?.trim() || 'SaaS',
      frontend: frontendMatch?.[1]?.trim() || 'Next.js',
      backend: backendMatch?.[1]?.trim() || 'Node/Express',
      database: databaseMatch?.[1]?.trim() || 'PostgreSQL',
      auth: authMatch?.[1]?.trim() || 'JWT',
      keyFeatures: featuresMatch?.[1]?.split(',').map(f => f.trim()) || [],
      freeHosting: hostingMatch?.[1]?.trim() || 'Vercel + Railway',
    };
  } catch {
    return null;
  }
}

export function parseFileTreeFromAI(aiResponse: string): string[] {
  const files: string[] = [];
  const lines = aiResponse.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const fileMatch = trimmed.match(/^[├└│─┐┘┤┬┴┼]\s+(.+)/);
    if (fileMatch) {
      const path = fileMatch[1].trim().replace(/[├└│─┐┘┤┬┴┼]/g, '').trim();
      if (path && !path.endsWith('/')) {
        files.push(path);
      }
    }
  }
  return files;
}

export function parseGeneratedFiles(aiResponse: string): Array<{ path: string; content: string; purpose: string }> {
  const files: Array<{ path: string; content: string; purpose: string }> = [];

  // Match: 📄 FILE: path \n [PURPOSE]: desc \n ```lang \n content \n ```
  const fileRegex = /📄\s*FILE:\s*(.+)\n\[PURPOSE\]:\s*(.+)\n```[\w]*\n([\s\S]*?)```/g;
  let match;

  while ((match = fileRegex.exec(aiResponse)) !== null) {
    files.push({
      path: match[1].trim(),
      purpose: match[2].trim(),
      content: match[3].trim(),
    });
  }

  // Also try alternate format with ** markers
  const altFileRegex = /\*\*FILE:\*\*\s*(.+)\n\*\*PURPOSE\*\*:?\s*(.+)\n```[\w]*\n([\s\S]*?)```/g;
  while ((match = altFileRegex.exec(aiResponse)) !== null) {
    files.push({
      path: match[1].trim(),
      purpose: match[2].trim(),
      content: match[3].trim(),
    });
  }

  return files;
}
