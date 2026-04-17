import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt, getTokenHint } from '@/lib/encryption';
import { getAuthenticatedUser } from '@/lib/github-api';

// ✅ [VERIFIED] POST /api/auth/github — Validate and store GitHub token
export async function POST(request: NextRequest) {
  try {
    const { token, email, name } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Validate token by calling GitHub API
    // ✅ [VERIFIED] GET /user endpoint
    const result = await getAuthenticatedUser(token);
    const userData = result.data as Record<string, unknown>;

    // Parse scopes from response header
    const scopesHeader = result.headers['x-oauth-scopes'] || '';
    const scopes = scopesHeader
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Check required scopes
    const requiredScopes = ['repo', 'workflow'];
    const missingScopes = requiredScopes.filter(
      (scope) => !scopes.some((s: string) => s === scope || s === 'repo' && scope === 'repo')
    );

    if (missingScopes.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required scopes: ${missingScopes.join(', ')}. Regenerate your token with these scopes.`,
          missingScopes,
          currentScopes: scopes,
        },
        { status: 403 }
      );
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name || (userData.name as string) || (userData.login as string),
          github_username: userData.login as string,
          avatar_url: userData.avatar_url as string,
        },
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          github_username: userData.login as string,
          avatar_url: userData.avatar_url as string,
        },
      });
    }

    // Encrypt and store token
    const encrypted = encrypt(token);

    // Upsert credential
    await db.gitHubCredential.upsert({
      where: { id: `${user.id}-github` },
      update: {
        encrypted_token: encrypted.encrypted,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        token_hint: getTokenHint(token),
        scopes: scopes.join(','),
        validated_at: new Date(),
        user_id: user.id,
      },
      create: {
        id: `${user.id}-github`,
        user_id: user.id,
        encrypted_token: encrypted.encrypted,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        token_hint: getTokenHint(token),
        scopes: scopes.join(','),
        validated_at: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        user_id: user.id,
        action: 'GITHUB_TOKEN_CONNECTED',
        entity_type: 'GitHubCredential',
        metadata: JSON.stringify({
          login: userData.login,
          scopes,
          public_repos: userData.public_repos,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        github_username: userData.login,
        avatar_url: userData.avatar_url,
        plan: user.plan,
      },
      github: {
        login: userData.login,
        avatar_url: userData.avatar_url,
        public_repos: userData.public_repos,
        plan: (userData.plan as Record<string, unknown>)?.name || 'free',
        scopes,
      },
      tokenHint: getTokenHint(token),
    });
  } catch (error) {
    console.error('GitHub auth error:', error);
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — Remove GitHub token
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await db.gitHubCredential.deleteMany({
      where: { user_id: userId },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        action: 'GITHUB_TOKEN_DISCONNECTED',
        entity_type: 'GitHubCredential',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect token' },
      { status: 500 }
    );
  }
}
