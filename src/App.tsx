import { useEffect, useState, useMemo, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  CloudFog, 
  Wind, 
  Thermometer, 
  Droplets, 
  Activity, 
  Battery, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { calculatePMV } from './pmv';
import { calculateAQI } from './utils/aqi';
import { useDashboardStore } from './store/useDashboardStore';
import { useMQTT } from './hooks/useMQTT';
import { Header } from './components/Header';
import { SensorCard } from './components/SensorCard';
import { ZenMode } from './components/ZenMode';
import { LogsPanel } from './components/LogsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ActionSuggestions } from './components/ActionSuggestions';
import { 
  getPM25Status, 
  getPM10Status,
  getCO2Status, 
  getTempStatus, 
  getHumidityStatus, 
  getTVOCStatus 
} from './utils/thresholds';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function App() {
  const { t } = useTranslation();
  const { sensorData, history, theme, zenMode, thresholds, alerts, dndMode, updateFreshness, loadCachedData, clo, temperatureUnit, tvocUnit } = useDashboardStore();
  useMQTT();
  
  const [showDetails, setShowDetails] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  useEffect(() => {
    const timer = setInterval(updateFreshness, 1000);
    return () => clearInterval(timer);
  }, [updateFreshness]);

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

  const aqi = useMemo(() => calculateAQI(
    sensorData?.co2?.value || 0,
    sensorData?.pm25?.value || 0,
    sensorData?.tvoc?.value || 0
  ), [sensorData]);

  const aqiRef = useRef<HTMLDivElement>(null);
  const lastAlertIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (aqiRef.current) {
      import('vanilla-tilt').then(VanillaTilt => {
        VanillaTilt.default.init(aqiRef.current!, {
          max: 5,
          speed: 400,
          glare: true,
          "max-glare": 0.1,
          scale: 1.02,
        });
      });
    }
    return () => {
      if (aqiRef.current && (aqiRef.current as any).vanillaTilt) {
        (aqiRef.current as any).vanillaTilt.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (alerts.length > 0 && !dndMode) {
      const latest = alerts[0];
      if (lastAlertIdRef.current === latest.id) return;
      lastAlertIdRef.current = latest.id;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      
      if (latest.level === 'emergency') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.type = 'square';
      } else if (latest.level === 'critical') {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        osc.type = 'sawtooth';
      } else {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.type = 'sine';
      }
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }
  }, [alerts, dndMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const convertedHistory = useMemo(() => {
    return history.map(h => ({
      ...h,
      temperature: temperatureUnit === 'F' && h.temperature !== undefined ? (h.temperature * 9/5) + 32 : h.temperature,
      tvoc: tvocUnit === 'µg/m³' && h.tvoc !== undefined ? h.tvoc * 4.5 : h.tvoc
    }));
  }, [history, temperatureUnit, tvocUnit]);

  const exportCSV = () => {
    if (convertedHistory.length === 0) return;
    const csv = ['Time,CO2,PM2.5,TVOC,Temp,Hum,Bat,PMV', ...convertedHistory.map(h => `${h.time},${h.co2},${h.pm25},${h.tvoc},${h.temperature},${h.humidity},${h.battery},${h.pmv}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `iaq_${new Date().getTime()}.csv`; a.click();
  };

  if (zenMode.active) return <ZenMode />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Toaster position="top-center" toastOptions={{ style: { background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000', borderRadius: '1rem' } }} />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Header onExport={exportCSV} onOpenSettings={() => setSettingsOpen(true)} />
        <div ref={aqiRef} className={`p-6 rounded-3xl ${aqi.bg} text-center mb-6 flex flex-col items-center justify-center gap-2 border border-white/10`}>
           <span className={`text-4xl font-black tracking-tighter ${aqi.color} uppercase`}>{t(aqi.level.toLowerCase())}</span>
           <span className="text-sm text-slate-500 dark:text-slate-400 font-mono font-bold">AQI {aqi.score}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SensorCard title="CO₂" value={sensorData?.co2?.value} unit="ppm" icon={<CloudFog className="w-full h-full" />} status={getCO2Status(sensorData?.co2?.value || 0, thresholds.co2)} history={convertedHistory} dataKey="co2" trend="inverse" isHero />
          <SensorCard title="PM2.5" value={sensorData?.pm25?.value} unit="µg/m³" icon={<Wind className="w-full h-full" />} status={getPM25Status(sensorData?.pm25?.value || 0, thresholds.pm25)} history={convertedHistory} dataKey="pm25" trend="inverse" isHero />
          <SensorCard title="PM10" value={sensorData?.pm10?.value} unit="µg/m³" icon={<Wind className="w-full h-full" />} status={getPM10Status(sensorData?.pm10?.value || 0, thresholds.pm10)} history={convertedHistory} dataKey="pm10" trend="inverse" isHero />
          <SensorCard title="TVOC" value={sensorData?.tvoc?.value ? (tvocUnit === 'µg/m³' ? sensorData.tvoc.value * 4.5 : sensorData.tvoc.value) : undefined} unit={tvocUnit} icon={<Activity className="w-full h-full" />} status={getTVOCStatus(sensorData?.tvoc?.value || 0, thresholds.tvoc)} history={convertedHistory} dataKey="tvoc" trend="inverse" isHero />
          <SensorCard title="PMV" value={calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0, { clo }).pmv} unit="" prefix="" extra={`PPD: ${calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0, { clo }).ppd}%`} icon={<Activity className="w-full h-full" />} status={{...calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0, { clo }), label: calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0, { clo }).status}} history={convertedHistory} dataKey="pmv" decimals={2} trend="temperature" isHero />
        </div>
        <div className="md:hidden flex justify-center">
          <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">{showDetails ? t('show_less') : t('show_more')}</button>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${showDetails ? 'block' : 'hidden md:grid'}`}>
          <SensorCard title={t('temperature')} value={sensorData?.temperature?.value ? (temperatureUnit === 'F' ? (sensorData.temperature.value * 9/5) + 32 : sensorData.temperature.value) : undefined} unit={`°${temperatureUnit}`} icon={<Thermometer className="w-full h-full" />} status={getTempStatus(sensorData?.temperature?.value || 0, thresholds.temperature)} history={convertedHistory} dataKey="temperature" decimals={1} trend="temperature" />
          <SensorCard title={t('humidity')} value={sensorData?.humidity?.value} unit="%" icon={<Droplets className="w-full h-full" />} status={getHumidityStatus(sensorData?.humidity?.value || 0, thresholds.humidity)} history={convertedHistory} dataKey="humidity" decimals={1} trend="humidity" />
          <SensorCard title={t('battery')} value={sensorData?.battery?.value} unit="%" icon={<Battery className="w-full h-full" />} status={{ color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-400/10', label: 'normal' }} history={convertedHistory} dataKey="battery" trend="standard" />
        </div>
        <ActionSuggestions />
        <LogsPanel />
      </div>
    </div>
  );
}
