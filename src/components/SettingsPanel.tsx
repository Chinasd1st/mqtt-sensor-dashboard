import { X, Save, RotateCcw, Globe, Sliders, Activity, Thermometer, Droplets, CloudFog, Wind, Battery } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
    setLanguage
  } = useDashboardStore();

  const [localThresholds, setLocalThresholds] = useState({
    co2: thresholds?.co2 || { warning: 1000, critical: 1500, emergency: 2500 },
    pm25: thresholds?.pm25 || { warning: 35, critical: 75, emergency: 150 },
    tvoc: thresholds?.tvoc || { warning: 300, critical: 600, emergency: 1000 },
    temperature: thresholds?.temperature || { warning: 30, critical: 35, emergency: 40 },
    humidity: thresholds?.humidity || { warning: 70, critical: 80, emergency: 90 },
    battery: thresholds?.battery || { warning: 20, critical: 10, emergency: 5 },
  });
  const [localOffsets, setLocalOffsets] = useState({
    temperature: offsets?.temperature || 0,
    humidity: offsets?.humidity || 0,
    co2: offsets?.co2 || 0,
    pm25: offsets?.pm25 || 0,
  });
  const [localInterval, setLocalInterval] = useState(samplingInterval);
  const [localLanguage, setLocalLanguage] = useState(language);

  const handleSave = () => {
    updateThresholds(localThresholds);
    updateOffsets(localOffsets);
    setSamplingInterval(localInterval);
    if (localLanguage !== language) {
      setLanguage(localLanguage);
    }
    toast.success('Settings saved successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('system_settings')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Thresholds */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              {t('alert_thresholds')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CO2 Thresholds */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CloudFog className="w-4 h-4" /> CO₂ (ppm)
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.co2.warning}
                      onChange={(e) => setLocalThresholds({...localThresholds, co2: {...localThresholds.co2, warning: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.co2.critical}
                      onChange={(e) => setLocalThresholds({...localThresholds, co2: {...localThresholds.co2, critical: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* TVOC Thresholds */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Activity className="w-4 h-4" /> TVOC (ppb)
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.tvoc.warning}
                      onChange={(e) => setLocalThresholds({...localThresholds, tvoc: {...localThresholds.tvoc, warning: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.tvoc.critical}
                      onChange={(e) => setLocalThresholds({...localThresholds, tvoc: {...localThresholds.tvoc, critical: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Temperature Thresholds */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Thermometer className="w-4 h-4" /> {t('temperature')} (°C)
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.temperature.warning}
                      onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, warning: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.temperature.critical}
                      onChange={(e) => setLocalThresholds({...localThresholds, temperature: {...localThresholds.temperature, critical: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Humidity Thresholds */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Droplets className="w-4 h-4" /> {t('humidity')} (%)
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.humidity.warning}
                      onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, warning: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.humidity.critical}
                      onChange={(e) => setLocalThresholds({...localThresholds, humidity: {...localThresholds.humidity, critical: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Battery Thresholds */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Battery className="w-4 h-4" /> {t('battery')} (%)
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-amber-500 font-medium">{t('warning')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.battery.warning}
                      onChange={(e) => setLocalThresholds({...localThresholds, battery: {...localThresholds.battery, warning: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-orange-500 font-medium">{t('critical')}</span>
                    <input 
                      type="number" 
                      value={localThresholds.battery.critical}
                      onChange={(e) => setLocalThresholds({...localThresholds, battery: {...localThresholds.battery, critical: Number(e.target.value)}})}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Calibration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <RotateCcw className="w-4 h-4" />
              {t('sensor_calibration')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Thermometer className="w-4 h-4" /> {t('temp_offset')}
                </div>
                <input 
                  type="number" 
                  step="0.1"
                  value={localOffsets.temperature}
                  onChange={(e) => setLocalOffsets({...localOffsets, temperature: Number(e.target.value)})}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Droplets className="w-4 h-4" /> {t('humidity_offset')}
                </div>
                <input 
                  type="number" 
                  step="0.1"
                  value={localOffsets.humidity}
                  onChange={(e) => setLocalOffsets({...localOffsets, humidity: Number(e.target.value)})}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </section>

          {/* Sampling & Language */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                <Globe className="w-4 h-4" /> {t('language')}
              </div>
              <select 
                value={localLanguage}
                onChange={(e) => setLocalLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="w-4 h-4" /> {t('sampling_interval')}
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="5"
                  value={localInterval}
                  onChange={(e) => setLocalInterval(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-sm font-mono font-bold w-12 text-center">{localInterval}s</span>
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
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
  );
};
