'use client';

import { BaseTimelineChart } from './BaseTimelineChart';
import type { TrackerEvent, Player } from 'sc2ts';

interface WorkerTimelineChartProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
  syncedTime?: number | null;
  onTimeChange?: (time: number | null) => void;
}

export function WorkerTimelineChart(props: WorkerTimelineChartProps) {
  return (
    <BaseTimelineChart
      {...props}
      title="Worker Count Timeline"
      yAxisLabel="Workers"
      dataKey="workers"
      extractValue={(stats) => stats.m_scoreValueWorkersActiveCount}
    />
  );
}
