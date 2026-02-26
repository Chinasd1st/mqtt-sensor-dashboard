import { useMemo, memo } from 'react';
import { Line } from 'react-chartjs-2';
import { useDashboardStore } from '../../store/useDashboardStore';

export const HistoryChart = memo(({ dataKey, title, color, bgColor }: { dataKey: string, title: string, color: string, bgColor: string }) => {
  const { history, theme } = useDashboardStore();
  
  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  const chartData = useMemo(() => ({
    labels: history.map(h => h.time),
    datasets: [{
      label: title,
      data: history.map(h => (h as any)[dataKey]),
      borderColor: color,
      backgroundColor: bgColor,
      fill: true,
    }]
  }), [history, dataKey, title, color, bgColor]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#e2e8f0' : '#1e293b',
        bodyColor: isDark ? '#e2e8f0' : '#1e293b',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: "'JetBrains Mono', monospace" },
        bodyFont: { family: "'JetBrains Mono', monospace" },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10, family: "'JetBrains Mono', monospace" },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        }
      },
      y: {
        display: true,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10, family: "'JetBrains Mono', monospace" }
        },
        border: { display: false }
      }
    },
    elements: {
      point: { radius: 0, hitRadius: 10 },
      line: { tension: 0.4, borderWidth: 2 }
    }
  }), [isDark]);

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
});
