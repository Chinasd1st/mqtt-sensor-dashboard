import { X, Save, RotateCcw, Globe, Sliders, Activity, Thermometer, Droplets, CloudFog, Wind, Battery, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useDashboardStore, defaultThresholds } from '../store/useDashboardStore';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { getSeasonalClo } from '../pmv';

const Accordion = ({ title, icon, children, defaultOpen = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
};

export const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { 
    thresholds, 
    updateThresholds, 
    offsets, 
    updateOffsets, 
    samplingInterval, 
    setSamplingInterval,
    language,
    setLanguage,
    clo,
    setClo,
    temperatureUnit,
    setTemperatureUnit,
    tvocUnit,
    setTvocUnit
  } = useDashboardStore();

  const [localThresholds, setLocalThresholds] = useState({
    co2: { 
      warning: thresholds?.co2?.warning ?? defaultThresholds.co2.warning, 
      critical: thresholds?.co2?.critical ?? defaultThresholds.co2.critical, 
      emergency: thresholds?.co2?.emergency ?? defaultThresholds.co2.emergency 
    },
    pm25: { 
      warning: thresholds?.pm25?.warning ?? defaultThresholds.pm25.warning, 
      critical: thresholds?.pm25?.critical ?? defaultThresholds.pm25.critical, 
      emergency: thresholds?.pm25?.emergency ?? defaultThresholds.pm25.emergency 
    },
    pm10: { 
      warning: thresholds?.pm10?.warning ?? defaultThresholds.pm10.warning, 
      critical: thresholds?.pm10?.critical ?? defaultThresholds.pm10.critical, 
      emergency: thresholds?.pm10?.emergency ?? defaultThresholds.pm10.emergency 
    },
    tvoc: { 
      warning: thresholds?.tvoc?.warning ?? defaultThresholds.tvoc.warning, 
      critical: thresholds?.tvoc?.critical ?? defaultThresholds.tvoc.critical, 
      emergency: thresholds?.tvoc?.emergency ?? defaultThresholds.tvoc.emergency 
    },
    temperature: { 
      warningHigh: thresholds?.temperature?.warningHigh ?? defaultThresholds.temperature.warningHigh, 
      criticalHigh: thresholds?.temperature?.criticalHigh ?? defaultThresholds.temperature.criticalHigh, 
      emergencyHigh: thresholds?.temperature?.emergencyHigh ?? defaultThresholds.temperature.emergencyHigh, 
      warningLow: thresholds?.temperature?.warningLow ?? defaultThresholds.temperature.warningLow, 
      criticalLow: thresholds?.temperature?.criticalLow ?? defaultThresholds.temperature.criticalLow, 
      emergencyLow: thresholds?.temperature?.emergencyLow ?? defaultThresholds.temperature.emergencyLow 
    },
    humidity: { 
      warningHigh: thresholds?.humidity?.warningHigh ?? defaultThresholds.humidity.warningHigh, 
      criticalHigh: thresholds?.humidity?.criticalHigh ?? defaultThresholds.humidity.criticalHigh, 
      emergencyHigh: thresholds?.humidity?.emergencyHigh ?? defaultThresholds.humidity.emergencyHigh, 
      warningLow: thresholds?.humidity?.warningLow ?? defaultThresholds.humidity.warningLow, 
      criticalLow: thresholds?.humidity?.criticalLow ?? defaultThresholds.humidity.criticalLow, 
      emergencyLow: thresholds?.humidity?.emergencyLow ?? defaultThresholds.humidity.emergencyLow 
    },
    battery: { 
      warning: thresholds?.battery?.warning ?? defaultThresholds.battery.warning, 
      critical: thresholds?.battery?.critical ?? defaultThresholds.battery.critical, 
      emergency: thresholds?.battery?.emergency ?? defaultThresholds.battery.emergency 
    },
  });
  const [localOffsets, setLocalOffsets] = useState({
    temperature: offsets?.temperature || 0,
    humidity: offsets?.humidity || 0,
    co2: offsets?.co2 || 0,
    pm25: offsets?.pm25 || 0,
    pm10: offsets?.pm10 || 0,
  });
  const [localInterval, setLocalInterval] = useState(samplingInterval);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [localClo, setLocalClo] = useState<number | undefined>(clo);
  const [localTempUnit, setLocalTempUnit] = useState(temperatureUnit);
  const [localTvocUnit, setLocalTvocUnit] = useState(tvocUnit);

  const handleTempUnitChange = (newUnit: 'C' | 'F') => {
    if (newUnit === localTempUnit) return;
    const convert = (val: number) => newUnit === 'F' ? Math.round((val * 1.8 + 32) * 10) / 10 : Math.round(((val - 32) / 1.8) * 10) / 10;
    
    setLocalThresholds(prev => ({
      ...prev,
      temperature: {
        warningHigh: convert(prev.temperature.warningHigh),
        criticalHigh: convert(prev.temperature.criticalHigh),
        emergencyHigh: convert(prev.temperature.emergencyHigh),
        warningLow: convert(prev.temperature.warningLow),
        criticalLow: convert(prev.temperature.criticalLow),
        emergencyLow: convert(prev.temperature.emergencyLow),
      }
    }));
    setLocalTempUnit(newUnit);
  };

  const handleTvocUnitChange = (newUnit: 'ppb' | 'µg/m³') => {
    if (newUnit === localTvocUnit) return;
    const TVOC_FACTOR = 4.57;
    const factor = newUnit === 'µg/m³' ? TVOC_FACTOR : (1 / TVOC_FACTOR);
    setLocalThresholds(prev => ({
      ...prev,
      tvoc: {
        warning: Math.round(prev.tvoc.warning * factor),
        critical: Math.round(prev.tvoc.critical * factor),
        emergency: Math.round(prev.tvoc.emergency * factor),
      }
    }));
    setLocalTvocUnit(newUnit);
  };

  const handleSave = () => {
    updateThresholds(localThresholds);
    updateOffsets(localOffsets);
    setSamplingInterval(localInterval);
    setClo(localClo);
    setTemperatureUnit(localTempUnit);
    setTvocUnit(localTvocUnit);
    if (localLanguage !== language) {
      setLanguage(localLanguage);
    }
    toast.success('Settings saved successfully');
    onClose();
  };

  const handleRestoreDefaults = () => {
    setLocalThresholds(defaultThresholds);
    setLocalOffsets({ temperature: 0, humidity: 0, co2: 0, pm25: 0, pm10: 0 });
    setLocalInterval(10);
    setLocalClo(undefined);
    setLocalTempUnit('C');
    setLocalTvocUnit('ppb');
    toast.success('Restored all defaults');
  };

  const tempMin = localTempUnit === 'C' ? 0 : 32;
  const tempMax = localTempUnit === 'C' ? 50 : 122;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] h-[95vh] max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('system_settings')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {/* Air Pollutants */}
          <Accordion title={t('air_pollutants_thresholds')} icon={<Wind className="w-4 h-4" />} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CO2 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 min-h-[180px]">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <CloudFog className="w-4 h-4" /> CO₂ (ppm)
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-amber-500 font-medium">{t('warning')}</span>
                    <input type="number" min={0} step={100} value={localThresholds.co2.warning} onChange={(e) => setLocalThresholds({...localThresholds, co2: {...localThresholds.co2, warning: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-orange-500 font-medium">{t('critical')}</span>
                    <input type="number" min={0} step={100} value={localThresholds.co2.critical} onChange={(e) => setLocalThresholds({...localThresholds, co2: {...localThresholds.co2, critical: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-red-500 font-medium">{t('emergency')}</span>
                    <input type="number" min={0} step={100} value={localThresholds.co2.emergency} onChange={(e) => setLocalThresholds({...localThresholds, co2: {...localThresholds.co2, emergency: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* PM2.5 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 min-h-[180px]">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Wind className="w-4 h-4" /> PM2.5 (µg/m³)
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-amber-500 font-medium">{t('warning')}</span>
                    <input type="number" min={0} step={5} value={localThresholds.pm25.warning} onChange={(e) => setLocalThresholds({...localThresholds, pm25: {...localThresholds.pm25, warning: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-orange-500 font-medium">{t('critical')}</span>
                    <input type="number" min={0} step={5} value={localThresholds.pm25.critical} onChange={(e) => setLocalThresholds({...localThresholds, pm25: {...localThresholds.pm25, critical: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-red-500 font-medium">{t('emergency')}</span>
                    <input type="number" min={0} step={5} value={localThresholds.pm25.emergency} onChange={(e) => setLocalThresholds({...localThresholds, pm25: {...localThresholds.pm25, emergency: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* PM10 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 min-h-[180px]">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Wind className="w-4 h-4" /> PM10 (µg/m³)
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-amber-500 font-medium">{t('warning')}</span>
                    <input type="number" min={0} step={5} value={localThresholds.pm10.warning} onChange={(e) => setLocalThresholds({...localThresholds, pm10: {...localThresholds.pm10, warning: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-orange-500 font-medium">{t('critical')}</span>
                    <input type="number" min={0} step={5} value={localThresholds.pm10.critical} onChange={(e) => setLocalThresholds({...localThresholds, pm10: {...localThresholds.pm10, critical: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-red-500 font-medium">{t('emergency')}</span>
                    <input type="number" min={0} step={5} value={localThresholds.pm10.emergency} onChange={(e) => setLocalThresholds({...localThresholds, pm10: {...localThresholds.pm10, emergency: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* TVOC */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 min-h-[180px]">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Activity className="w-4 h-4" /> TVOC ({localTvocUnit})
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-amber-500 font-medium">{t('warning')}</span>
                    <input type="number" min={0} step={10} value={localThresholds.tvoc.warning} onChange={(e) => setLocalThresholds({...localThresholds, tvoc: {...localThresholds.tvoc, warning: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-orange-500 font-medium">{t('critical')}</span>
                    <input type="number" min={0} step={10} value={localThresholds.tvoc.critical} onChange={(e) => setLocalThresholds({...localThresholds, tvoc: {...localThresholds.tvoc, critical: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-red-500 font-medium">{t('emergency')}</span>
                    <input type="number" min={0} step={10} value={localThresholds.tvoc.emergency} onChange={(e) => setLocalThresholds({...localThresholds, tvoc: {...localThresholds.tvoc, emergency: Number(e.target.value)}})} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          {/* Temperature & Humidity */}
          <Accordion title={t('comfort_range')} icon={<Thermometer className="w-4 h-4" />}>
            <div className="space-y-8">
              {/* Temperature */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <Thermometer className="w-4 h-4" /> {t('temperature')} ({localTempUnit === 'C' ? '°C' : '°F'})
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {localThresholds.temperature.warningLow}{localTempUnit === 'C' ? '°C' : '°F'} - {localThresholds.temperature.warningHigh}{localTempUnit === 'C' ? '°C' : '°F'}
                  </div>
                </div>
                
                <div className="px-2">
                  <Slider
                    range
                    aria-label="Temperature Comfort Range"
                    className="w-full"
                    styles={{
                      track: { backgroundColor: 'transparent', height: 8 },
                      rail: { background: 'linear-gradient(to right, #3b82f6, #10b981, #f59e0b, #ef4444)', height: 8, opacity: 0.8 },
                      handle: { 
                        borderColor: '#6366f1', 
                        borderWidth: 2,
                        backgroundColor: '#ffffff', 
                        width: 24, 
                        height: 24, 
                        marginTop: -8,
                        opacity: 1,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }
                    }}
                    min={tempMin}
                    max={tempMax}
                    value={[localThresholds.temperature.warningLow, localThresholds.temperature.warningHigh]}
                    onChange={(val) => {
                      if (Array.isArray(val)) {
                        setLocalThresholds({
                          ...localThresholds, 
                          temperature: {
                            ...localThresholds.temperature,
                            warningLow: val[0],
                            warningHigh: val[1]
                          }
                        })
                      }
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{tempMin}{localTempUnit === 'C' ? '°C' : '°F'}</span>
                  <span>{tempMax}{localTempUnit === 'C' ? '°C' : '°F'}</span>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  {t('slider_hint')}
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase">{t('low_thresholds')}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                      <input type="number" step={0.5} value={localThresholds.temperature.warningLow} onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, warningLow: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                      <input type="number" step={0.5} value={localThresholds.temperature.criticalLow} onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, criticalLow: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-red-500 font-medium">{t('emergency')}</span>
                      <input type="number" step={0.5} value={localThresholds.temperature.emergencyLow} onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, emergencyLow: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase">{t('high_thresholds')}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                      <input type="number" step={0.5} value={localThresholds.temperature.warningHigh} onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, warningHigh: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                      <input type="number" step={0.5} value={localThresholds.temperature.criticalHigh} onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, criticalHigh: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-red-500 font-medium">{t('emergency')}</span>
                      <input type="number" step={0.5} value={localThresholds.temperature.emergencyHigh} onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, emergencyHigh: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Humidity */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <Droplets className="w-4 h-4" /> {t('humidity')} (%)
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {localThresholds.humidity.warningLow}% - {localThresholds.humidity.warningHigh}%
                  </div>
                </div>
                
                <div className="px-2">
                  <Slider
                    range
                    aria-label="Humidity Comfort Range"
                    className="w-full"
                    styles={{
                      track: { backgroundColor: 'transparent', height: 8 },
                      rail: { background: 'linear-gradient(to right, #f59e0b, #10b981, #3b82f6)', height: 8, opacity: 0.8 },
                      handle: { 
                        borderColor: '#6366f1', 
                        borderWidth: 2,
                        backgroundColor: '#ffffff', 
                        width: 24, 
                        height: 24, 
                        marginTop: -8,
                        opacity: 1,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }
                    }}
                    min={0}
                    max={100}
                    value={[localThresholds.humidity.warningLow, localThresholds.humidity.warningHigh]}
                    onChange={(val) => {
                      if (Array.isArray(val)) {
                        setLocalThresholds({
                          ...localThresholds, 
                          humidity: {
                            ...localThresholds.humidity,
                            warningLow: val[0],
                            warningHigh: val[1]
                          }
                        })
                      }
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  {t('slider_hint')}
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase">{t('low_thresholds')}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                      <input type="number" min={0} step={1} value={localThresholds.humidity.warningLow} onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, warningLow: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                      <input type="number" min={0} step={1} value={localThresholds.humidity.criticalLow} onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, criticalLow: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-red-500 font-medium">{t('emergency')}</span>
                      <input type="number" min={0} step={1} value={localThresholds.humidity.emergencyLow} onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, emergencyLow: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase">{t('high_thresholds')}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                      <input type="number" min={0} step={1} value={localThresholds.humidity.warningHigh} onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, warningHigh: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                      <input type="number" min={0} step={1} value={localThresholds.humidity.criticalHigh} onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, criticalHigh: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-red-500 font-medium">{t('emergency')}</span>
                      <input type="number" min={0} step={1} value={localThresholds.humidity.emergencyHigh} onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, emergencyHigh: Number(e.target.value)}})} className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          {/* Others */}
          <Accordion title={t('other_settings')} icon={<Sliders className="w-4 h-4" />}>
            <div className="space-y-6">
              {/* Battery Thresholds */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Battery className="w-4 h-4" /> {t('battery')} (%)
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-amber-500 font-medium">{t('warning')}</span>
                    <input type="number" min={0} max={100} step={1} value={localThresholds.battery.warning} onChange={(e) => setLocalThresholds({...localThresholds, battery: {...localThresholds.battery, warning: Number(e.target.value)}})} className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-orange-500 font-medium">{t('critical')}</span>
                    <input type="number" min={0} max={100} step={1} value={localThresholds.battery.critical} onChange={(e) => setLocalThresholds({...localThresholds, battery: {...localThresholds.battery, critical: Number(e.target.value)}})} className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-500 font-medium">{t('emergency')}</span>
                    <input type="number" min={0} max={100} step={1} value={localThresholds.battery.emergency} onChange={(e) => setLocalThresholds({...localThresholds, battery: {...localThresholds.battery, emergency: Number(e.target.value)}})} className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* Calibration */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <RotateCcw className="w-4 h-4" /> {t('sensor_calibration')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">{t('temp_offset')}</span>
                    <input type="number" step="0.1" value={localOffsets.temperature} onChange={(e) => setLocalOffsets({...localOffsets, temperature: Number(e.target.value)})} className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">{t('humidity_offset')}</span>
                    <input type="number" step="0.1" value={localOffsets.humidity} onChange={(e) => setLocalOffsets({...localOffsets, humidity: Number(e.target.value)})} className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">{t('pm10_offset')}</span>
                    <input type="number" step="0.1" value={localOffsets.pm10} onChange={(e) => setLocalOffsets({...localOffsets, pm10: Number(e.target.value)})} className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono" />
                  </div>
                </div>
              </div>

              {/* System */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase">{t('language')}</div>
                  <select value={localLanguage} onChange={(e) => setLocalLanguage(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium">
                    <option value="zh">简体中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>{t('clo')}</span>
                    {localClo === undefined && (
                      <span className="text-[10px] text-indigo-500 font-mono">{t('current')}: {getSeasonalClo().toFixed(2)} clo</span>
                    )}
                  </div>
                  <select value={localClo === undefined ? 'auto' : localClo.toString()} onChange={(e) => setLocalClo(e.target.value === 'auto' ? undefined : Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium">
                    <option value="auto">{t('auto_clo')}</option>
                    <option value="0.5">0.5 ({t('summer')})</option>
                    <option value="0.75">0.75 ({t('spring_autumn')})</option>
                    <option value="1.0">1.0 ({t('winter')})</option>
                    <option value="1.5">1.5 ({t('heavy_winter')})</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase">{t('units')}</div>
                  <div className="flex gap-2">
                    <select value={localTempUnit} onChange={(e) => handleTempUnitChange(e.target.value as 'C' | 'F')} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium">
                      <option value="C">{t('celsius')}</option>
                      <option value="F">{t('fahrenheit')}</option>
                    </select>
                    <select value={localTvocUnit} onChange={(e) => handleTvocUnitChange(e.target.value as 'ppb' | 'µg/m³')} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium">
                      <option value="ppb">ppb</option>
                      <option value="µg/m³">µg/m³</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">{t('sampling_interval')}</div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input type="range" min="5" max="60" step="5" value={localInterval} onChange={(e) => setLocalInterval(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                      <span className="text-xs font-mono font-bold w-8 text-right">{localInterval}s</span>
                    </div>
                    <div className="flex gap-2">
                      {[5, 10, 30, 60].map(val => (
                        <button
                          key={val}
                          onClick={() => setLocalInterval(val)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            localInterval === val 
                              ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          {val}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <button 
            onClick={handleRestoreDefaults}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> {t('restore_defaults')}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              {t('cancel')}
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" /> {t('save_changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

