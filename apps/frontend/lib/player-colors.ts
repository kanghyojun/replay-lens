// Player color utilities for consistent chart colors
export const PLAYER_COLORS = {
  player1: '#8884d8', // Blue
  player2: '#82ca9d', // Green
} as const;

export function getPlayerColor(playerIndex: number): string {
  return playerIndex === 0 ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;
}

export function getPlayerColorByName(players: Array<{ name: string }>, playerName: string): string {
  const index = players.findIndex(p => p.name === playerName);
  return getPlayerColor(index);
}

// Format seconds to MM:SS format
export function formatGameTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
