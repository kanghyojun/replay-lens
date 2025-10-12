'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getPlayerColor, formatGameTime } from '@repo/sc2-utils/player-colors';
import type { TrackerEvent, Player } from 'sc2ts';

// PlayerStats structure from SC2 replay tracker events
interface PlayerStats {
  m_scoreValueMineralsCollectionRate: number;
  m_scoreValueVespeneCollectionRate: number;
  m_scoreValueWorkersActiveCount: number;
  m_scoreValueMineralsUsedCurrentArmy: number;
  m_scoreValueVespeneUsedCurrentArmy: number;
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

interface BaseTimelineChartProps {
  title: string;
  trackerEvents: TrackerEvent[];
  players: Player[];
  syncedTime?: number | null;
  onTimeChange?: (time: number | null) => void;
  yAxisLabel: string;
  dataKey: string;
  extractValue: (stats: PlayerStats) => number;
}

export function BaseTimelineChart({
  title,
  trackerEvents,
  players,
  syncedTime,
  onTimeChange,
  yAxisLabel,
  dataKey,
  extractValue,
}: BaseTimelineChartProps) {
  // Memoize expensive data transformations
  const { chartData, timeTicks, maxTime, player1Name, player2Name } = useMemo(() => {
    // Filter player stats events using type guard
    const playerStatsEvents = trackerEvents.filter(isPlayerStatsEvent);

    // Transform data for recharts
    type ChartDataPoint = { time: number; [key: string]: number };
    const data = playerStatsEvents.reduce<ChartDataPoint[]>((acc, event) => {
      const timeInSeconds = Math.floor(event._gameloop / 22.4);
      const playerIndex = event.m_playerId - 1;
      const playerName = players[playerIndex]?.name || `Player ${event.m_playerId}`;

      // Find or create time entry
      let timeEntry = acc.find(entry => entry.time === timeInSeconds);
      if (!timeEntry) {
        timeEntry = { time: timeInSeconds };
        acc.push(timeEntry);
      }

      // Add player data using custom extractor
      timeEntry[`${playerName}_${dataKey}`] = extractValue(event.m_stats);

      return acc;
    }, []);

    // Sort by time
    data.sort((a, b) => a.time - b.time);

    // Generate ticks every 60 seconds
    const max = data.length > 0 ? Math.max(...data.map(d => d.time)) : 0;
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
  }, [trackerEvents, players, dataKey, extractValue]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
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
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              labelFormatter={(value) => `Time: ${formatGameTime(Number(value))}`}
              formatter={(value, name) => [value, String(name).replace(`_${dataKey}`, '')]}
            />
            <Legend />
            {syncedTime !== null && syncedTime !== undefined && (
              <ReferenceLine x={syncedTime} stroke="rgb(100 116 139)" strokeWidth={2} strokeDasharray="3 3" />
            )}
            <Line
              type="monotone"
              dataKey={`${player1Name}_${dataKey}`}
              stroke={getPlayerColor(0)}
              name={player1Name}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={`${player2Name}_${dataKey}`}
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
