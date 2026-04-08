import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { DataZoomInsideComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getMetrics, MetricEvent } from './api.ts';

echarts.use([BarChart, DataZoomInsideComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

const KEY_LABELS: Record<string, string> = {
  call_order: 'Звонок пассажиру',
  call_trip: 'Звонок водителю',
};

const POSTS_SERIES = [
  { key: 'order',        name: 'Заказы',           stack: 'orders', color: '#4caf50' },
  { key: 'parsed_order', name: 'Заказы P',   stack: 'orders', color: '#a5d6a7' },
  { key: 'trip',         name: 'Поездки',           stack: 'trips',  color: '#1976d2' },
  { key: 'parsed_trip',  name: 'Поездки P',  stack: 'trips',  color: '#90caf9' },
];

const USERS_LABELS: Record<string, string> = {
  user: 'Пользователи',
};

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildChartOption(data: MetricEvent[], title: string, labels: Record<string, string>) {
  const text = cssVar('--tg-theme-text-color') || '#000000';
  const hint = cssVar('--tg-theme-hint-color') || '#999999';
  const bg   = cssVar('--tg-theme-bg-color')   || '#ffffff';

  const keys = [...new Set(data.map((e) => e.key))].sort().reverse();
  const dates = [...new Set(data.map((e) => e.date))].sort().reverse();

  const series = keys.map((key) => {
    const byDate = Object.fromEntries(
      data.filter((e) => e.key === key).map((e) => [e.date, e.count]),
    );
    return {
      type: 'bar' as const,
      label: { show: true, position: 'right' as const, color: text },
      name: labels[key] ?? key,
      data: dates.map((d) => byDate[d] ?? 0),
    };
  });

  return {
    textStyle: { color: text },
    title: { text: title, left: 'center', textStyle: { color: text } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: bg,
      borderColor: hint,
      textStyle: { color: text },
    },
    legend: { bottom: 0, textStyle: { color: text } },
    grid: { left: 10, right: 40, top: 40, bottom: 50, containLabel: true },
    xAxis: {
      type: 'value' as const,
      name: 'Count',
      nameTextStyle: { color: hint },
      axisLabel: { color: hint },
      axisLine: { lineStyle: { color: hint } },
      splitLine: { lineStyle: { color: hint, opacity: 0.2 } },
    },
    yAxis: {
      type: 'category' as const,
      data: dates.map((d) => format(parseISO(d), 'd MMM EEEEEE', { locale: ru })),
      axisLabel: { color: text },
      axisLine: { lineStyle: { color: hint } },
    },
    dataZoom: [{
      type: 'inside',
      yAxisIndex: 0,
      start: 0,
      end: dates.length > 0 ? Math.min(100, Math.round((7 / dates.length) * 100)) : 100,
    }],
    series,
  };
}

function buildPostsChartOption(data: MetricEvent[]) {
  const text = cssVar('--tg-theme-text-color') || '#000000';
  const hint = cssVar('--tg-theme-hint-color') || '#999999';
  const bg   = cssVar('--tg-theme-bg-color')   || '#ffffff';

  const dates = [...new Set(data.map((e) => e.date))].sort().reverse();

  const series = POSTS_SERIES.map(({ key, name, stack, color }) => {
    const byDate = Object.fromEntries(
      data.filter((e) => e.key === key).map((e) => [e.date, e.count]),
    );
    return {
      type: 'bar' as const,
      name,
      stack,
      itemStyle: { color },
      label: { show: false },
      data: dates.map((d) => byDate[d] ?? 0),
    };
  });

  return {
    textStyle: { color: text },
    title: { text: 'Заказы и поездки', left: 'center', textStyle: { color: text } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: bg,
      borderColor: hint,
      textStyle: { color: text },
    },
    legend: { bottom: 0, textStyle: { color: text } },
    grid: { left: 10, right: 40, top: 40, bottom: 50, containLabel: true },
    xAxis: {
      type: 'value' as const,
      nameTextStyle: { color: hint },
      axisLabel: { color: hint },
      axisLine: { lineStyle: { color: hint } },
      splitLine: { lineStyle: { color: hint, opacity: 0.2 } },
    },
    yAxis: {
      type: 'category' as const,
      data: dates.map((d) => format(parseISO(d), 'd MMM EEEEEE', { locale: ru })),
      axisLabel: { color: text },
      axisLine: { lineStyle: { color: hint } },
    },
    dataZoom: [{
      type: 'inside',
      yAxisIndex: 0,
      start: 0,
      end: dates.length > 0 ? Math.min(100, Math.round((7 / dates.length) * 100)) : 100,
    }],
    series,
  };
}

const cardStyle = {
  margin: '4vw',
  padding: '4vw',
  background: 'var(--tg-theme-secondary-bg-color)',
  borderRadius: '4vw',
};

export default function Pulse() {
  const callRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<HTMLDivElement>(null);
  const usersRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callRef.current || !postsRef.current || !usersRef.current) return;
    const callChart = echarts.init(callRef.current);
    const postsChart = echarts.init(postsRef.current);
    const usersChart = echarts.init(usersRef.current);

    let disposed = false;
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!disposed) {
          callChart.resize();
          postsChart.resize();
          usersChart.resize();
        }
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    getMetrics()
      .then(({ data }) => {
        callChart.setOption(buildChartOption(data.call_metrics, 'Звонки', KEY_LABELS));
        postsChart.setOption(buildPostsChartOption(data.posts_metrics));
        usersChart.setOption(buildChartOption(data.users_metrics, 'Пользователи', USERS_LABELS));
      })
      .catch((err) => {
        console.error('Failed to load metrics:', err);
        setError('Failed to load metrics');
      });

    return () => {
      disposed = true;
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      callChart.dispose();
      postsChart.dispose();
      usersChart.dispose();
    };
  }, []);

  if (error) return <div style={{ color: 'var(--tg-theme-text-color)', padding: '4vw' }}>{error}</div>;

  return (
    <div>
      <div style={cardStyle}>
        <div ref={callRef} style={{ width: '100%', height: '50vh' }} />
      </div>
      <div style={cardStyle}>
        <div ref={postsRef} style={{ width: '100%', height: '50vh' }} />
      </div>
      <div style={cardStyle}>
        <div ref={usersRef} style={{ width: '100%', height: '50vh' }} />
      </div>
    </div>
  );
}
