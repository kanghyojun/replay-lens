'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ApiTestResult {
  success: boolean;
  data?: any;
  savedTo?: string;
  metadata?: {
    endpoint: string;
    timestamp: string;
    parameters: any;
  };
  error?: string;
  details?: string;
}

interface OAuthTokenResult {
  success: boolean;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  message?: string;
  error?: string;
  user?: {
    id: string;
    battletag: string;
  };
}

interface SC2ProfileResult {
  user: {
    id: string;
    battletag: string;
  };
  sc2Accounts: Array<{
    regionId: number;
    realmId: number;
    profileId: number;
    name: string;
    profileUrl: string;
    avatarUrl: string;
  }>;
  defaultAccount: {
    regionId: number;
    realmId: number;
    profileId: number;
    name: string;
    profileUrl: string;
    avatarUrl: string;
  } | null;
}

export default function ApiTesterPage() {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [userInfo, setUserInfo] = useState<{ id: string; battletag: string } | null>(null);

  // Form states
  const [accountId, setAccountId] = useState('');
  const [regionId, setRegionId] = useState('1');
  const [realmId, setRealmId] = useState('1');
  const [profileId, setProfileId] = useState('');
  const [ladderId, setLadderId] = useState('');

  // Game Data API states
  const [seasonId, setSeasonId] = useState('51');
  const [queueId, setQueueId] = useState('201');
  const [teamType, setTeamType] = useState('0');
  const [leagueId, setLeagueId] = useState('6');

  const checkUser = async () => {
    setIsLoading(true);
    try {
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/user`, {
        credentials: 'include',
      });

      const userData = await userResponse.json();

      if (!userData.user) {
        alert('Battle.net에 로그인되어 있지 않습니다. 메인 페이지에서 로그인해주세요.');
        return;
      }

      setUserInfo(userData.user);
      setAccountId(userData.user.id);
      setToken('authenticated'); // 토큰 대신 인증됨 표시
      alert(`로그인된 사용자: ${userData.user.battletag}\n계정 ID가 자동으로 입력되었습니다.`);

    } catch (error) {
      alert(`사용자 확인 중 오류: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMySC2Profile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/test-blizzard-simple?endpoint=my-profile`, {
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const account = result.data[result.data.length - 1]; // 마지막 계정 사용 (최근 플레이)
        setRegionId(account.regionId.toString());
        setRealmId(account.realmId.toString());
        setProfileId(account.profileId.toString());

        alert(`내 SC2 프로필 정보를 자동으로 입력했습니다!\n캐릭터: ${account.name}\n지역: ${account.regionId}\n파일: ${result.savedTo}`);
      } else {
        alert('SC2 프로필을 찾을 수 없습니다.');
      }
    } catch (error) {
      alert(`SC2 프로필 조회 중 오류: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testApi = async (endpoint: string, params: any) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        endpoint,
        ...params
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/test-blizzard-simple?${queryParams}`, {
        credentials: 'include',
      });

      const result: ApiTestResult = await response.json();
      setResults(prev => [result, ...prev]);

      if (!result.success) {
        alert(`API 테스트 실패: ${result.error}`);
      }
    } catch (error) {
      alert(`API 테스트 중 오류: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const communityEndpoints = [
    {
      name: 'Player Profile',
      key: 'profile',
      description: '플레이어 프로필 정보',
      params: ['accountId'],
      test: () => testApi('profile', { accountId }),
    },
    {
      name: 'Player Matches',
      key: 'matches',
      description: '플레이어 매치 히스토리',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('matches', { regionId, realmId, profileId }),
    },
    {
      name: 'Ladder Summary',
      key: 'ladder-summary',
      description: '래더 요약 정보',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('ladder-summary', { regionId, realmId, profileId }),
    },
    {
      name: 'Ladder Detail',
      key: 'ladder-detail',
      description: '특정 래더 상세 정보',
      params: ['regionId', 'realmId', 'profileId', 'ladderId'],
      test: () => testApi('ladder-detail', { regionId, realmId, profileId, ladderId }),
    },
    {
      name: 'Static Profile',
      key: 'static-profile',
      description: '정적 프로필 정보',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('static-profile', { regionId, realmId, profileId }),
    },
    {
      name: 'Metadata Profile',
      key: 'metadata-profile',
      description: '프로필 메타데이터',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('metadata-profile', { regionId, realmId, profileId }),
    },
    {
      name: 'Account Info',
      key: 'account',
      description: '계정 정보',
      params: ['accountId'],
      test: () => testApi('account', { accountId }),
    },
  ];

  const gameDataEndpoints = [
    {
      name: 'League Data',
      key: 'league-data',
      description: '리그 데이터',
      params: ['seasonId', 'queueId', 'teamType', 'leagueId'],
      test: () => testApi('league-data', { seasonId, queueId, teamType, leagueId }),
    },
    {
      name: 'Grandmaster Leaderboard',
      key: 'grandmaster-leaderboard',
      description: '그랜드마스터 순위표',
      params: ['regionId'],
      test: () => testApi('grandmaster-leaderboard', { regionId }),
    },
    {
      name: 'Season Data',
      key: 'season-data',
      description: '시즌 데이터',
      params: ['regionId'],
      test: () => testApi('season-data', { regionId }),
    },
    {
      name: 'Rewards',
      key: 'rewards',
      description: '보상 정보',
      params: ['regionId'],
      test: () => testApi('rewards', { regionId }),
    },
  ];

  const legacyEndpoints = [
    {
      name: 'Legacy Profile',
      key: 'legacy-profile',
      description: '레거시 프로필 정보',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('legacy-profile', { regionId, realmId, profileId }),
    },
    {
      name: 'Legacy Ladders',
      key: 'legacy-ladders',
      description: '레거시 래더 목록',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('legacy-ladders', { regionId, realmId, profileId }),
    },
    {
      name: 'Legacy Matches',
      key: 'legacy-matches',
      description: '레거시 매치 히스토리',
      params: ['regionId', 'realmId', 'profileId'],
      test: () => testApi('legacy-matches', { regionId, realmId, profileId }),
    },
    {
      name: 'Legacy Ladder',
      key: 'legacy-ladder',
      description: '레거시 래더 상세 정보',
      params: ['regionId', 'ladderId'],
      test: () => testApi('legacy-ladder', { regionId, ladderId }),
    },
    {
      name: 'Legacy Achievements',
      key: 'legacy-achievements',
      description: '레거시 업적 정보',
      params: ['regionId'],
      test: () => testApi('legacy-achievements', { regionId }),
    },
    {
      name: 'Legacy Rewards',
      key: 'legacy-rewards',
      description: '레거시 보상 정보',
      params: ['regionId'],
      test: () => testApi('legacy-rewards', { regionId }),
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Blizzard API 테스터</h1>

      {/* OAuth Token Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">인증 및 내 정보</h2>
        <div className="flex gap-4 items-center mb-4 flex-wrap">
          <Button
            onClick={checkUser}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '확인 중...' : '로그인 상태 확인'}
          </Button>
          <Button
            onClick={getMySC2Profile}
            disabled={isLoading || !token}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? '정보 가져오는 중...' : '내 SC2 정보 자동 입력'}
          </Button>
          {userInfo && (
            <span className="text-sm text-blue-600 font-semibold">
              {userInfo.battletag}
            </span>
          )}
          {token && (
            <span className="text-sm text-green-600 font-mono">
              토큰: {token.substring(0, 20)}...
            </span>
          )}
        </div>
        {!token && (
          <p className="text-sm text-amber-600">
            먼저 "로그인 상태 확인" 버튼을 클릭하여 인증을 확인해주세요. 로그인되지 않았다면 메인 페이지에서 Battle.net 로그인 후 시도해주세요.
          </p>
        )}
      </div>

      {/* API Parameters Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">API 파라미터</h2>

        {/* Community API Parameters */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Community APIs</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account ID</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="예: 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Region ID</label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="1">US (1)</option>
                <option value="2">EU (2)</option>
                <option value="3">KR/TW (3)</option>
                <option value="5">CN (5)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Realm ID</label>
              <input
                type="text"
                value={realmId}
                onChange={(e) => setRealmId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="예: 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profile ID</label>
              <input
                type="text"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="예: 12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ladder ID</label>
              <input
                type="text"
                value={ladderId}
                onChange={(e) => setLadderId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="예: 123456"
              />
            </div>
          </div>
        </div>

        {/* Game Data API Parameters */}
        <div>
          <h3 className="text-lg font-medium mb-3">Game Data APIs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Season ID</label>
              <input
                type="text"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="예: 51"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Queue ID</label>
              <select
                value={queueId}
                onChange={(e) => setQueueId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="201">1v1 Ranked (201)</option>
                <option value="202">2v2 Ranked (202)</option>
                <option value="203">3v3 Ranked (203)</option>
                <option value="204">4v4 Ranked (204)</option>
                <option value="206">Archon (206)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Team Type</label>
              <select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="0">Arranged (0)</option>
                <option value="1">Random (1)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">League ID</label>
              <select
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="0">Bronze (0)</option>
                <option value="1">Silver (1)</option>
                <option value="2">Gold (2)</option>
                <option value="3">Platinum (3)</option>
                <option value="4">Diamond (4)</option>
                <option value="5">Master (5)</option>
                <option value="6">Grandmaster (6)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints Section */}
      <div className="bg-white p-6 rounded-lg border mb-8">
        <h2 className="text-xl font-semibold mb-4">API 엔드포인트 테스트</h2>

        {/* Community APIs */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-blue-700">Community APIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityEndpoints.map((endpoint) => (
              <div key={endpoint.key} className="border p-4 rounded border-blue-200">
                <h4 className="font-semibold">{endpoint.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                <p className="text-xs text-gray-500 mb-3">
                  필요한 파라미터: {endpoint.params.join(', ')}
                </p>
                <Button
                  onClick={endpoint.test}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? '테스트 중...' : '테스트 실행'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Game Data APIs */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-green-700">Game Data APIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameDataEndpoints.map((endpoint) => (
              <div key={endpoint.key} className="border p-4 rounded border-green-200">
                <h4 className="font-semibold">{endpoint.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                <p className="text-xs text-gray-500 mb-3">
                  필요한 파라미터: {endpoint.params.join(', ')}
                </p>
                <Button
                  onClick={endpoint.test}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? '테스트 중...' : '테스트 실행'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Legacy APIs */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-purple-700">Legacy APIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {legacyEndpoints.map((endpoint) => (
              <div key={endpoint.key} className="border p-4 rounded border-purple-200">
                <h4 className="font-semibold">{endpoint.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                <p className="text-xs text-gray-500 mb-3">
                  필요한 파라미터: {endpoint.params.join(', ')}
                </p>
                <Button
                  onClick={endpoint.test}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? '테스트 중...' : '테스트 실행'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">테스트 결과</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">아직 테스트 결과가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`border-l-4 p-4 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.metadata?.endpoint} - {result.success ? '성공' : '실패'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {result.metadata?.timestamp}
                  </span>
                </div>

                {result.savedTo && (
                  <p className="text-sm text-green-600 mb-2">
                    📄 저장된 파일: {result.savedTo}
                  </p>
                )}

                {result.error && (
                  <p className="text-sm text-red-600 mb-2">
                    오류: {result.error}
                    {result.details && <span className="block text-xs">{result.details}</span>}
                  </p>
                )}

                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      데이터 미리보기 (클릭하여 펼치기)
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}