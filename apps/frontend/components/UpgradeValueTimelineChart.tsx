'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getPlayerColor, formatGameTime } from '@repo/sc2-utils/player-colors';
import type { TrackerEvent, Player } from 'sc2ts';

// PlayerStats structure from SC2 replay tracker events
interface PlayerStats {
  m_scoreValueMineralsUsedInProgress: number;
  m_scoreValueVespeneUsedInProgress: number;
  m_scoreValueMineralsUsedCurrentTechnology: number;
  m_scoreValueVespeneUsedCurrentTechnology: number;
  [key: string]: unknown;
}

interface PlayerStatsEvent extends TrackerEvent {
  _event: 'NNet.Replay.Tracker.SPlayerStatsEvent';
  m_playerId: number;
  m_stats: PlayerStats;
}

// Type guard for PlayerStatsEvent
function isPlayerStatsEvent(event: TrackerEvent): event is PlayerStatsEvent {
  return event._event === 'NNet.Replay.Tracker.SPlayerStatsEvent';
}

interface UpgradeValueTimelineChartProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
  syncedTime?: number | null;
  onTimeChange?: (time: number | null) => void;
}

export function UpgradeValueTimelineChart({
  trackerEvents,
  players,
  syncedTime,
  onTimeChange,
}: UpgradeValueTimelineChartProps) {

  // Memoize expensive data transformations
  const { chartData, timeTicks, maxTime, player1Name, player2Name } = useMemo(() => {
    // Filter player stats events using type guard
    const playerStatsEvents = trackerEvents.filter(isPlayerStatsEvent);

    // Group by player and time, keeping only the last value for each time point
    const playerData: Record<string, Map<number, number>> = {};

    for (const event of playerStatsEvents) {
      const timeInSeconds = Math.floor(event._gameloop / 22.4);
      const playerIndex = event.m_playerId - 1;
      const playerName = players[playerIndex]?.name || `Player ${event.m_playerId}`;

      if (!playerData[playerName]) {
        playerData[playerName] = new Map();
      }

      // Calculate total upgrade value (all upgrades)
      const upgradeValue = event.m_stats.m_scoreValueMineralsUsedCurrentTechnology +
                          event.m_stats.m_scoreValueVespeneUsedCurrentTechnology;

      // Keep the maximum value for this time point (should be monotonically increasing)
      const currentValue = playerData[playerName].get(timeInSeconds) || 0;
      playerData[playerName].set(timeInSeconds, Math.max(currentValue, upgradeValue));
    }

    // Find max time across all players
    let max = 0;
    for (const timeMap of Object.values(playerData)) {
      const playerMax = Math.max(...Array.from(timeMap.keys()));
      max = Math.max(max, playerMax);
    }

    // Create continuous data points
    type ChartDataPoint = { time: number; [key: string]: number };
    const data: ChartDataPoint[] = [];

    const lastKnownValues: Record<string, number> = {};

    for (let time = 0; time <= max; time++) {
      const dataPoint: ChartDataPoint = { time };

      for (const [playerName, timeMap] of Object.entries(playerData)) {
        const value = timeMap.get(time);
        if (value !== undefined) {
          lastKnownValues[playerName] = value;
        }
        dataPoint[`${playerName}_upgrade`] = lastKnownValues[playerName] || 0;
      }

      data.push(dataPoint);
    }

    // Generate ticks every 60 seconds
    const ticks = [];
    for (let i = 0; i <= max; i += 60) {
      ticks.push(i);
    }

    const p1Name = players[0]?.name || 'Player 1';
    const p2Name = players[1]?.name || 'Player 2';

    return {
      chartData: data,
      timeTicks: ticks,
      maxTime: max,
      player1Name: p1Name,
      player2Name: p2Name,
    };
  }, [trackerEvents, players]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Upgrade Value Timeline</h3>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={(state) => {
              if (state && state.activeLabel !== undefined && onTimeChange) {
                onTimeChange(Number(state.activeLabel));
              }
            }}
            onMouseLeave={() => {
              if (onTimeChange) {
                onTimeChange(null);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              tickFormatter={formatGameTime}
              ticks={timeTicks}
              domain={[0, maxTime]}
              type="number"
            />
            <YAxis
              label={{ value: 'Upgrade Value (Resources)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              labelFormatter={(value) => `Time: ${formatGameTime(Number(value))}`}
              formatter={(value, name) => [value, String(name).replace('_upgrade', '')]}
            />
            <Legend />
            {syncedTime !== null && syncedTime !== undefined && (
              <ReferenceLine x={syncedTime} stroke="rgb(100 116 139)" strokeWidth={2} strokeDasharray="3 3" />
            )}
            <Line
              type="monotone"
              dataKey={`${player1Name}_upgrade`}
              stroke={getPlayerColor(0)}
              name={player1Name}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={`${player2Name}_upgrade`}
              stroke={getPlayerColor(1)}
              name={player2Name}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
