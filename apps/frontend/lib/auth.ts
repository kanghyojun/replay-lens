export interface User {
  id: string;
  battletag: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

export function loginWithBattleNet(returnTo?: string) {
  const returnPath = returnTo || window.location.pathname;
  window.location.href = `${BACKEND_URL}/api/auth/battlenet?returnTo=${encodeURIComponent(returnPath)}`;
}

export async function logout() {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
