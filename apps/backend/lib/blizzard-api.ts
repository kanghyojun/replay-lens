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

// LadderTeam interface - currently unused but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  private async fetchAPI(endpoint: string): Promise<Response> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${endpoint}`;

    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  private async fetchJSON<T = unknown>(endpoint: string): Promise<T> {
    const response = await this.fetchAPI(endpoint);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPlayerProfile(accountId: string): Promise<PlayerProfile[]> {
    return this.fetchJSON<PlayerProfile[]>(`/sc2/player/${accountId}?locale=en_US`);
  }

  async getPlayerMatches(regionId: number, realmId: number, profileId: number): Promise<SC2Match[]> {
    const data = await this.fetchJSON<SC2MatchesResponse>(
      `/sc2/legacy/profile/${regionId}/${realmId}/${profileId}/matches?locale=en_US`
    );
    return data.matches || [];
  }

  async getLadderSummary(regionId: number, realmId: number, profileId: number): Promise<LadderSummary> {
    return this.fetchJSON<LadderSummary>(
      `/sc2/profile/${regionId}/${realmId}/${profileId}/ladder/summary?locale=en_US`
    );
  }

  async getLadderDetail(regionId: number, realmId: number, profileId: number, ladderId: string): Promise<LadderDetail> {
    return this.fetchJSON<LadderDetail>(
      `/sc2/profile/${regionId}/${realmId}/${profileId}/ladder/${ladderId}?locale=en_US`
    );
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

  getRegionString(regionId: number): string {
    const regions: { [key: number]: string } = {
      1: 'us',
      2: 'eu',
      3: 'ko',
      5: 'cn',
    };
    return regions[regionId] || 'us';
  }

  // === Legacy APIs ===
  async getLegacyProfile(regionId: number, realmId: number, profileId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/legacy/profile/${regionId}/${realmId}/${profileId}?locale=en_US`);
  }

  async getLegacyLadders(regionId: number, realmId: number, profileId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/legacy/profile/${regionId}/${realmId}/${profileId}/ladders?locale=en_US`);
  }

  async getLegacyMatches(regionId: number, realmId: number, profileId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/legacy/profile/${regionId}/${realmId}/${profileId}/matches?locale=en_US`);
  }

  async getLegacyLadder(regionId: number, ladderId: string): Promise<unknown> {
    return this.fetchJSON(`/sc2/legacy/ladder/${regionId}/${ladderId}?locale=en_US`);
  }

  async getLegacyAchievements(regionId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/legacy/data/achievements/${regionId}?locale=en_US`);
  }

  async getLegacyRewards(regionId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/legacy/data/rewards/${regionId}?locale=en_US`);
  }

  // === Game Data APIs ===
  async getLeagueData(seasonId: number, queueId: number, teamType: number, leagueId: number): Promise<unknown> {
    return this.fetchJSON(`/data/sc2/league/${seasonId}/${queueId}/${teamType}/${leagueId}?locale=en_US`);
  }

  async getGrandmasterLeaderboard(regionId: number): Promise<unknown> {
    return this.fetchJSON(`/data/sc2/ladder/grandmaster/${regionId}?locale=en_US`);
  }

  async getSeasonData(regionId: number): Promise<unknown> {
    const regionString = this.getRegionString(regionId);
    return this.fetchJSON(`/sc2/ladder/season/${regionId}?region=${regionString}&locale=en_US`);
  }

  async getRewards(regionId: number): Promise<unknown> {
    return this.fetchJSON(`/data/sc2/rewards/${regionId}?locale=en_US`);
  }

  // === Community APIs (추가) ===
  async getStaticProfile(regionId: number, realmId: number, profileId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/static/profile/${regionId}/${realmId}/${profileId}?locale=en_US`);
  }

  async getMetadataProfile(regionId: number, realmId: number, profileId: number): Promise<unknown> {
    return this.fetchJSON(`/sc2/metadata/profile/${regionId}/${realmId}/${profileId}?locale=en_US`);
  }

  async getAccount(accountId: string): Promise<unknown> {
    return this.fetchJSON(`/sc2/player/${accountId}?locale=en_US`);
  }
}

export const blizzardAPI = new BlizzardAPI();
export type { PlayerProfile, SC2Match, LadderSummary, LadderDetail };
