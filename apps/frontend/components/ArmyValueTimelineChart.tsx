'use client';

import { BaseTimelineChart } from './BaseTimelineChart';
import type { TrackerEvent, Player } from 'sc2ts';

interface ArmyValueTimelineChartProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
  syncedTime?: number | null;
  onTimeChange?: (time: number | null) => void;
}

export function ArmyValueTimelineChart(props: ArmyValueTimelineChartProps) {
  return (
    <BaseTimelineChart
      {...props}
      title="Army Value Timeline"
      yAxisLabel="Army Value (Resources)"
      dataKey="army"
      extractValue={(stats) =>
        stats.m_scoreValueMineralsUsedCurrentArmy + stats.m_scoreValueVespeneUsedCurrentArmy
      }
    />
  );
}
