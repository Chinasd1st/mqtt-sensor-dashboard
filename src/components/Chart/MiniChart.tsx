import { useMemo, memo, useState } from 'react';
import { Line } from 'react-chartjs-2';

interface MiniChartProps {
  history: any[];
  dataKey: string;
  color: string;
  bgColor: string;
  title: string;
}

export const MiniChart = memo(({ history, dataKey, color, bgColor, title }: MiniChartProps) => {
  const chartData = useMemo(() => {
    const recentHistory = history.slice(-30);
    return {
      labels: recentHistory.map((h: any) => h.time),
      datasets: [{
        label: title,
        data: recentHistory.map((h: any) => h[dataKey]),
        borderColor: color,
        backgroundColor: bgColor,
        fill: true,
        pointBackgroundColor: color,
        pointBorderColor: color,
      }]
    };
  }, [history, dataKey, title, color, bgColor]);

  const [tooltip, setTooltip] = useState<{
    opacity: number;
    top: number;
    left: number;
    title: string;
    value: string;
  }>({ opacity: 0, top: 0, left: 0, title: '', value: '' });

  const customTooltip = (context: any) => {
    const tooltipModel = context.tooltip;
    const chart = context.chart;
    if (tooltipModel.opacity === 0) {
      setTooltip(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const chartWidth = chart.width;
    let left = tooltipModel.caretX;
    if (left < 40) left = 40;
    if (left > chartWidth - 40) left = chartWidth - 40;

    setTooltip({
      opacity: 1,
      left,
      top: tooltipModel.caretY,
      title: tooltipModel.title[0] || '',
      value: tooltipModel.body[0].lines[0] || ''
    });
  };

  return (
    <div className="relative z-10 h-16 w-full mt-4 opacity-50 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <Line 
        data={chartData} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: { display: false },
            tooltip: { 
              enabled: false,
              external: customTooltip
            }
          },
          elements: {
            point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
            line: { tension: 0.4, borderWidth: 2 }
          },
          scales: { 
            x: { display: false }, 
            y: { display: false } 
          },
          layout: {
            padding: { top: 10, bottom: 10 }
          }
        }} 
      />
      {tooltip.opacity > 0 && (
        <div 
          className="absolute pointer-events-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 rounded shadow-lg text-[10px] font-mono whitespace-nowrap z-[100] transform -translate-x-1/2 -translate-y-full mt-[-8px] transition-all duration-200 ease-out"
          style={{
            left: tooltip.left,
            top: tooltip.top,
            fontFamily: "'JetBrains Mono', monospace",
            opacity: tooltip.opacity
          }}
        >
          <div className="font-bold">{tooltip.title}</div>
          <div>{tooltip.value}</div>
        </div>
      )}
    </div>
  );
});
