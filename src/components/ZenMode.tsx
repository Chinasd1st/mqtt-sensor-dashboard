import { Sun, Moon, Monitor, Minimize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '../store/useDashboardStore';
import { useIdleDetection } from '../hooks/useIdleDetection';
import { getCO2Status, getPM25Status, getTempStatus, getHumidityStatus, getTVOCStatus } from '../utils/thresholds';
import { calculatePMV } from '../pmv';
import { CloudFog, Wind, Thermometer, Droplets, Activity, Battery } from 'lucide-react';

export const ZenMode = () => {
  const { t } = useTranslation();
  const { 
    zenMode, 
    setZenMode, 
    sensorData, 
    theme, 
    setTheme, 
    thresholds 
  } = useDashboardStore();
  const isIdle = useIdleDetection(30000);

  const getSensorConfig = (key: string) => {
    switch(key) {
      case 'co2': return { 
        title: 'CO₂', value: sensorData?.co2?.value, unit: 'ppm', 
        status: getCO2Status(sensorData?.co2?.value || 0, thresholds.co2), 
        icon: <CloudFog className="w-full h-full" />,
        decimals: 0
      };
      case 'pm25': return { 
        title: 'PM2.5', value: sensorData?.pm25?.value, unit: 'µg/m³', 
        status: getPM25Status(sensorData?.pm25?.value || 0, thresholds.pm25), 
        icon: <Wind className="w-full h-full" />,
        decimals: 0
      };
      case 'temperature': return { 
        title: 'Temperature', value: sensorData?.temperature?.value, unit: '°C', 
        status: getTempStatus(sensorData?.temperature?.value || 0), 
        icon: <Thermometer className="w-full h-full" />,
        decimals: 1
      };
      case 'humidity': return { 
        title: 'Humidity', value: sensorData?.humidity?.value, unit: '%', 
        status: getHumidityStatus(sensorData?.humidity?.value || 0), 
        icon: <Droplets className="w-full h-full" />,
        decimals: 1
      };
      case 'tvoc': return { 
        title: 'TVOC', value: sensorData?.tvoc?.value, unit: 'ppb', 
        status: getTVOCStatus(sensorData?.tvoc?.value || 0, thresholds.tvoc), 
        icon: <Activity className="w-full h-full" />,
        decimals: 0
      };
      case 'pmv': {
        const pmvData = calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0);
        return { 
          title: 'PMV', value: pmvData.pmv, unit: '', 
          status: { ...pmvData, label: pmvData.status }, 
          icon: <Activity className="w-full h-full" />,
          decimals: 2,
          prefix: '~',
          extra: `PPD: ${pmvData.ppd}%`
        };
      }
      case 'battery': return { 
        title: 'Battery', value: sensorData?.battery?.value, unit: '%', 
        status: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-400/10', label: 'Normal' }, 
        icon: <Battery className="w-full h-full" />,
        decimals: 0
      };
      default: return null;
    }
  };

  const activeSensors = zenMode.focus ? [zenMode.focus] : zenMode.sensors;
  const gridCols = activeSensors.length === 1 ? 'grid-cols-1' :
                   activeSensors.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                   activeSensors.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                   activeSensors.length === 4 ? 'grid-cols-2' :
                   'grid-cols-2 md:grid-cols-3';

  return (
    <div className={`fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-all duration-1000 flex flex-col ${isIdle ? 'brightness-50 grayscale' : ''}`}>
      <div className="absolute top-6 right-6 z-50 flex gap-4 opacity-0 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => {
            const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
            setTheme(next);
          }}
          className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
        >
          {theme === 'light' ? <Sun className="w-6 h-6" /> : theme === 'dark' ? <Moon className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </button>
        <button 
          onClick={() => setZenMode({ active: false })}
          className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
        >
          <Minimize className="w-6 h-6" />
        </button>
      </div>
      
      <div className={`flex-1 grid ${gridCols} gap-1 p-1`}>
        {activeSensors.map(key => {
          const config = getSensorConfig(key);
          if (!config) return null;
          const isFocused = zenMode.focus === key;
          
          return (
            <div 
              key={key} 
              onClick={() => setZenMode({ focus: isFocused ? null : key })}
              className={`flex flex-col items-center justify-center p-8 rounded-3xl ${config.status.bg} bg-opacity-20 dark:bg-opacity-10 m-2 transition-all duration-500 cursor-pointer hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-4 mb-4 opacity-70">
                <div className={`w-8 h-8 ${config.status.color}`}>{config.icon}</div>
                <span className="text-xl font-bold uppercase tracking-widest">{config.title}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-bold font-mono tracking-tighter ${config.status.color} ${activeSensors.length === 1 ? 'text-[10rem] md:text-[16rem] leading-none' : zenMode.sensors.length <= 2 ? 'text-8xl md:text-[12rem] leading-none' : zenMode.sensors.length <= 4 ? 'text-6xl md:text-[8rem] leading-none' : 'text-5xl md:text-8xl'}`}>
                  {config.prefix}{config.value !== undefined ? config.value.toFixed(config.decimals) : '--'}
                </span>
                {config.extra ? (
                  <div className={`flex flex-col items-start ${config.status.color} opacity-60 ml-2`}>
                    <span className="text-xl font-bold uppercase tracking-wider leading-none">PPD</span>
                    <span className="text-3xl font-mono font-bold leading-none">{config.extra.replace('PPD: ', '')}</span>
                  </div>
                ) : (
                  <span className={`${config.unit.length > 10 ? 'text-xl md:text-2xl' : 'text-4xl'} font-medium opacity-60 ${config.status.color}`}>{config.unit}</span>
                )}
              </div>
              <div className={`mt-4 px-4 py-1 rounded-full text-lg font-bold ${config.status.bg} ${config.status.color}`}>
                {t(config.status.label)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
