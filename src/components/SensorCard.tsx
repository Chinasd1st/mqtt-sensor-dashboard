import { memo, ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown } from 'lucide-react';
import VanillaTilt from 'vanilla-tilt';
import { useValueDelta } from '../useValueDelta';
import { MiniChart } from './Chart/MiniChart';
import { formatValue } from '../utils/formatters';

interface SensorCardProps {
  title: string;
  value: number | undefined;
  unit: string;
  icon: ReactNode;
  status: { color: string; bg: string; label: string };
  history: any[];
  dataKey: string;
  decimals?: number;
  trend?: 'standard' | 'inverse' | 'temperature' | 'humidity';
  showChart?: boolean;
  prefix?: string;
  extra?: string;
  isHero?: boolean;
}

export const SensorCard = memo(({ 
  title, value, unit, icon, status, history, dataKey, 
  decimals = 0, trend = 'standard', showChart = true, prefix = '', extra = '', isHero = false 
}: SensorCardProps) => {
  const { t } = useTranslation();
  const { flash, delta } = useValueDelta(value);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      VanillaTilt.init(cardRef.current, {
        max: 5,
        speed: 400,
        glare: true,
        "max-glare": 0.1,
        scale: 1.02,
      });
    }
    return () => {
      if (cardRef.current && (cardRef.current as any).vanillaTilt) {
        (cardRef.current as any).vanillaTilt.destroy();
      }
    };
  }, []);

  const getFlashClass = () => {
    if (!flash) return 'bg-white dark:bg-slate-900';
    
    if (trend === 'temperature') {
        return flash === 'up' ? 'bg-orange-500/10 dark:bg-orange-500/20' : 'bg-blue-500/10 dark:bg-blue-500/20';
    }
    if (trend === 'humidity') {
        return flash === 'up' ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-orange-500/10 dark:bg-orange-500/20';
    }
    if (trend === 'inverse') {
        return flash === 'up' ? 'bg-red-500/10 dark:bg-red-500/20' : 'bg-emerald-500/10 dark:bg-emerald-500/20';
    }
    return flash === 'up' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20';
  };

  const getDeltaColor = () => {
    if (!delta) return '';
    const isUp = delta > 0;
    
    if (trend === 'temperature') {
        return isUp ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10';
    }
    if (trend === 'humidity') {
        return isUp ? 'text-blue-500 bg-blue-500/10' : 'text-orange-500 bg-orange-500/10';
    }
    if (trend === 'inverse') {
        return isUp ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10';
    }
    return isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10';
  };

  const getHexColor = (colorClass: string) => {
    if (colorClass.includes('red')) return '#ef4444';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('amber')) return '#f59e0b';
    if (colorClass.includes('emerald') || colorClass.includes('green')) return '#10b981';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('indigo')) return '#6366f1';
    if (colorClass.includes('purple')) return '#a855f7';
    return '#8b5cf6';
  };

  const chartColor = getHexColor(status.color);
  const chartBgColor = chartColor + '1a';

  return (
    <div ref={cardRef} className={`relative overflow-hidden rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500 group hover:shadow-lg ${getFlashClass()} ${isHero ? 'p-6 md:p-8' : 'p-6'}`}>
       <div className={`absolute inset-0 ${status.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

       <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={`p-2.5 rounded-2xl ${status.bg} ${status.color}`}>
                <div className={isHero ? "w-6 h-6 md:w-8 md:h-8" : "w-5 h-5"}>{icon}</div>
             </div>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
          </div>
          {delta !== null && delta !== 0 && (
            <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${getDeltaColor()}`}>
              {delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(delta).toFixed(decimals === 0 ? 0 : decimals)}
            </div>
          )}
       </div>

       <div className="relative z-10 flex flex-col items-center justify-center py-2">
          <div className="flex items-baseline gap-1">
             <span className={`font-bold font-mono tracking-tight ${status.color} ${isHero ? 'text-6xl md:text-7xl' : 'text-5xl'}`} aria-live="polite">
                {prefix}{formatValue(value, decimals)}
             </span>
             <span className={`font-medium text-slate-400 ${isHero ? 'text-xl' : 'text-lg'}`}>{unit}</span>
          </div>
          {extra && <span className="text-xs text-slate-400 font-medium mt-1">{extra}</span>}
          
          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
             {t(status.label)}
          </div>
       </div>

       {showChart && (
        <MiniChart 
          history={history} 
          dataKey={dataKey} 
          color={chartColor} 
          bgColor={chartBgColor} 
          title={title} 
        />
      )}
    </div>
  );
});
