import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user fallback when no database connection
const DEMO_USER = {
  id: 'demo-user-1',
  email: 'demo@gitdeploy.ai',
  name: 'Alex Chen',
  github_username: 'alexchen',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  plan: 'pro',
  created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
};

// GET /api/user — Get current user info
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    // If no user ID provided, return demo user in demo mode
    if (!userId) {
      return NextResponse.json({
        user: DEMO_USER,
        github: {
          connected: true,
          tokenHint: 'ghp_****xxxx',
          scopes: ['repo', 'workflow'],
          validatedAt: new Date().toISOString(),
        },
        demo: true,
      });
    }

    let user;
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          github_username: true,
          avatar_url: true,
          plan: true,
          created_at: true,
        },
      });
    } catch (dbError) {
      // Database not available — fall back to demo user
      console.warn('Database unavailable, using demo user:', dbError instanceof Error ? dbError.message : 'Unknown error');
      return NextResponse.json({
        user: DEMO_USER,
        github: {
          connected: true,
          tokenHint: 'ghp_****xxxx',
          scopes: ['repo', 'workflow'],
          validatedAt: new Date().toISOString(),
        },
        demo: true,
      });
    }

    if (!user) {
      // No user found in DB — return demo user instead of 404
      return NextResponse.json({
        user: DEMO_USER,
        github: { connected: false },
        demo: true,
      });
    }

    // Get GitHub credential info (without exposing the token)
    let credential;
    try {
      credential = await db.gitHubCredential.findFirst({
        where: { user_id: userId },
        select: {
          token_hint: true,
          scopes: true,
          validated_at: true,
        },
      });
    } catch {
      // Ignore credential lookup errors
    }

    return NextResponse.json({
      user,
      github: credential ? {
        connected: true,
        tokenHint: credential.token_hint,
        scopes: credential.scopes,
        validatedAt: credential.validated_at,
      } : { connected: false },
    });
  } catch (error) {
    console.error('Get user error:', error);
    // Return demo user instead of 500 error
    return NextResponse.json({
      user: DEMO_USER,
      github: { connected: false },
      demo: true,
    });
  }
}
