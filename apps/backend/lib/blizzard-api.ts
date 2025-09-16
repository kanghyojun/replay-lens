interface BlizzardTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PlayerProfile {
  regionId: number;
  realmId: number;
  profileId: number;
  name: string;
  profileUrl: string;
  avatarUrl: string;
}

interface SC2Match {
  map: string;
  type: string;
  decision: string;
  speed: string;
  date: number;
}

interface SC2MatchesResponse {
  matches: SC2Match[];
}

class BlizzardAPI {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.BATTLENET_CLIENT_ID!;
    this.clientSecret = process.env.BATTLENET_CLIENT_SECRET!;
    this.baseUrl = process.env.BATTLENET_API_URL || 'https://us.api.blizzard.com';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenUrl = 'https://oauth.battle.net/token';
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data: BlizzardTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

    return this.accessToken;
  }

  async getPlayerProfile(accountId: string): Promise<PlayerProfile[]> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/sc2/player/${accountId}?locale=en_US`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get player profile: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPlayerMatches(regionId: number, realmId: number, profileId: number): Promise<SC2Match[]> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/sc2/legacy/profile/${regionId}/${realmId}/${profileId}/matches?locale=en_US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to get player matches: ${response.statusText}`);
    }

    const data: SC2MatchesResponse = await response.json();
    console.log(data);
    return data.matches || [];
  }

  getRegionName(regionId: number): string {
    const regions: { [key: number]: string } = {
      1: 'US',
      2: 'EU',
      3: 'KR/TW',
      5: 'CN',
    };
    return regions[regionId] || 'Unknown';
  }
}

export const blizzardAPI = new BlizzardAPI();
export type { PlayerProfile, SC2Match };
