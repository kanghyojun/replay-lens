import { NextRequest } from 'next/server';
import { Strategy as BnetStrategy } from 'passport-bnet';

export interface BattleNetProfile {
  id: string;
  battletag: string;
  provider: string;
}

export interface User {
  id: string;
  battletag: string;
  provider: string;
  accessToken?: string;
  refreshToken?: string;
}

// Create a NextJS-compatible wrapper for passport-bnet strategy
export class NextJSBnetStrategy {
  private strategy: BnetStrategy;

  constructor() {
    this.strategy = new BnetStrategy(
      {
        clientID: process.env.BNET_CLIENT_ID || '',
        clientSecret: process.env.BNET_CLIENT_SECRET || '',
        callbackURL: process.env.BNET_CALLBACK_URL || '',
        region: process.env.BNET_REGION || 'us',
      },
      this.verify.bind(this)
    );
  }

  private async verify(
    accessToken: string,
    refreshToken: string,
    profile: BattleNetProfile,
    done: (error: unknown, user?: User | null) => void
  ) {
    try {
      const user: User = {
        id: profile.id,
        battletag: profile.battletag,
        provider: profile.provider,
        accessToken,
        refreshToken,
      };
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }

  // Extract authorization code from NextJS request and exchange for tokens
  async authenticate(req: NextRequest): Promise<{ user?: User; error?: string }> {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return { error: 'No authorization code provided' };
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth.battle.net/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.BNET_CLIENT_ID}:${process.env.BNET_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.BNET_CALLBACK_URL || '',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return { error: 'Failed to exchange authorization code for token' };
      }

      const tokenData = await tokenResponse.json();

      // Get user info using access token
      const userResponse = await fetch('https://oauth.battle.net/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User info fetch failed:', errorText);
        return { error: 'Failed to get user information' };
      }

      const userData = await userResponse.json();

      // Create user object matching passport-bnet format
      const user: User = {
        id: userData.sub,
        battletag: userData.battletag,
        provider: 'bnet',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      };

      return { user };
    } catch (error) {
      console.error('Authentication error:', error);
      return { error: 'Authentication failed' };
    }
  }

  // Generate authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: process.env.BNET_CLIENT_ID || '',
      redirect_uri: process.env.BNET_CALLBACK_URL || '',
      response_type: 'code',
      scope: 'openid',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://oauth.battle.net/authorize?${params.toString()}`;
  }
}

// Singleton instance
export const bnetStrategy = new NextJSBnetStrategy();
