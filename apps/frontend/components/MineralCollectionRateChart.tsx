'use client';

import { BaseTimelineChart } from './BaseTimelineChart';
import type { TrackerEvent, Player } from 'sc2ts';

interface MineralCollectionRateChartProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
  syncedTime?: number | null;
  onTimeChange?: (time: number | null) => void;
}

export function MineralCollectionRateChart(props: MineralCollectionRateChartProps) {
  return (
    <BaseTimelineChart
      {...props}
      title="Mineral Collection Rate Timeline"
      yAxisLabel="Collection Rate"
      dataKey="rate"
      extractValue={(stats) => stats.m_scoreValueMineralsCollectionRate}
    />
  );
}
