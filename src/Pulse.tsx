import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { getMetrics, MetricEvent } from './api.ts';

echarts.use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

function buildOption(data: MetricEvent[]) {
  const keys = [...new Set(data.map((e) => e.key))].sort();
  const dates = [...new Set(data.map((e) => e.date))].sort().reverse();

  const series = keys.map((key) => {
    const byDate = Object.fromEntries(
      data.filter((e) => e.key === key).map((e) => [e.date, e.count]),
    );
    return {
      type: 'bar' as const,
      name: key,
      data: dates.map((d) => byDate[d] ?? 0),
    };
  });

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 90, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'value' as const, name: 'Count' },
    yAxis: { type: 'category' as const, data: dates },
    series,
  };
}

export default function Pulse() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current!);
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    getMetrics()
      .then(({ data }) => chart.setOption(buildOption(data)))
      .catch(() => setError('Failed to load metrics'));

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);

  if (error) return <div style={{ color: 'var(--tg-theme-text-color)', padding: '4vw' }}>{error}</div>;

  return (
    <div style={{
      margin: '4vw',
      padding: '4vw',
      background: 'var(--tg-theme-secondary-bg-color)',
      borderRadius: '4vw',
    }}>
      <div ref={chartRef} style={{ width: '100%', height: '70vh' }} />
    </div>
  );
}
