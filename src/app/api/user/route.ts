import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

// GET /api/user — Get current user info
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  // No user ID header — authentication required
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
    console.error('Database unavailable:', dbError instanceof Error ? dbError.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get GitHub credential info (without exposing the token) — non-fatal
  const credential = await db.gitHubCredential.findFirst({
    where: { user_id: userId },
    select: {
      token_hint: true,
      scopes: true,
      validated_at: true,
    },
  }).catch(() => null);

  return NextResponse.json({
    user,
    github: credential ? {
      connected: true,
      tokenHint: credential.token_hint,
      scopes: credential.scopes,
      validatedAt: credential.validated_at,
    } : { connected: false },
  });
}
