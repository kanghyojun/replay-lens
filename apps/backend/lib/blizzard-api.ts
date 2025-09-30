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

interface LadderTeam {
  teamMembers: Array<{
    character: {
      id: string;
      realm: number;
      displayName: string;
      clanName?: string;
      clanTag?: string;
      profilePath: string;
    };
    favoriteRace: string;
    wins: number;
    losses: number;
    highestRank: number;
    previousRank: number;
    points: number;
    mmr: number;
    joinTimestamp: number;
  }>;
  localizedGameMode: string;
  type: number;
  teamType: number;
}

interface LadderSummary {
  showCaseEntries: Array<{
    ladderId: string;
    team: {
      localizedGameMode: string;
      members: Array<{
        favoriteRace: string;
        name: string;
        playerId: string;
        region: number;
      }>;
    };
    leagueName: string;
    localizedDivisionName: string;
    rank: number;
    wins: number;
    losses: number;
    mmr?: number; // MMR이 없을 수 있음
  }>;
  placementMatches: Array<{
    localizedGameMode: string;
    members: Array<{
      name: string;
      playerId: string;
      region: number;
    }>;
    gamesRemaining: number;
  }>;
  allLadderMemberships: Array<{
    ladderId: string;
    localizedGameMode: string;
    rank: number;
  }>;
}

interface LadderDetail {
  ladderTeams: Array<{
    teamMembers: Array<{
      character: {
        id: string;
        realm: number;
        displayName: string;
        clanName?: string;
        clanTag?: string;
        profilePath: string;
      };
      favoriteRace: string;
      wins: number;
      losses: number;
      highestRank: number;
      previousRank: number;
      points: number;
      mmr: number;
      joinTimestamp: number;
    }>;
    rank: number;
    mmr: number;
    wins: number;
    losses: number;
  }>;
  league: {
    leagueKey: {
      seasonId: number;
      queueId: number;
      teamType: number;
      leagueId: number;
    };
    tierName?: string;
    divisionName?: string;
  };
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

  async getAccessToken(): Promise<string> {
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

  async getLadderSummary(regionId: number, realmId: number, profileId: number): Promise<LadderSummary> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/sc2/profile/${regionId}/${realmId}/${profileId}/ladder/summary?locale=en_US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get ladder summary: ${response.statusText}`);
    }

    const data: LadderSummary = await response.json();
    return data;
  }

  async getLadderDetail(regionId: number, realmId: number, profileId: number, ladderId: string): Promise<LadderDetail> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/sc2/profile/${regionId}/${realmId}/${profileId}/ladder/${ladderId}?locale=en_US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get ladder detail: ${response.statusText}`);
    }

    const data: LadderDetail = await response.json();
    return data;
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
export type { PlayerProfile, SC2Match, LadderSummary, LadderDetail };
