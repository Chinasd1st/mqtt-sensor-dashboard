import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '../store/useDashboardStore';
import { Lightbulb, Wind, Fan, ThermometerSun, ThermometerSnowflake, Droplets, Droplet } from 'lucide-react';
import { useMemo } from 'react';

export const ActionSuggestions = () => {
  const { t } = useTranslation();
  const { sensorData, thresholds } = useDashboardStore();

  const suggestions = useMemo(() => {
    const actions = [];

    if (!sensorData) return actions;

    const co2 = sensorData.co2?.value || 0;
    const pm25 = sensorData.pm25?.value || 0;
    const pm10 = sensorData.pm10?.value || 0;
    const tvoc = sensorData.tvoc?.value || 0;
    const temp = sensorData.temperature?.value || 0;
    const hum = sensorData.humidity?.value || 0;

    // Air quality actions
    if (co2 > thresholds.co2.warning) {
      actions.push({ id: 'ventilate', icon: <Wind className="w-5 h-5" />, text: t('action_ventilate'), color: 'text-blue-500', bg: 'bg-blue-500/10' });
    }
    
    if (pm25 > thresholds.pm25.warning || pm10 > thresholds.pm10.warning) {
      actions.push({ id: 'purifier', icon: <Fan className="w-5 h-5" />, text: t('action_purifier'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' });
    }

    if (tvoc > thresholds.tvoc.warning) {
      actions.push({ id: 'remove_voc', icon: <Wind className="w-5 h-5" />, text: t('action_remove_voc'), color: 'text-purple-500', bg: 'bg-purple-500/10' });
    }

    // Temperature actions
    if (temp > thresholds.temperature.warningHigh) {
      actions.push({ id: 'ac', icon: <ThermometerSnowflake className="w-5 h-5" />, text: t('action_ac'), color: 'text-cyan-500', bg: 'bg-cyan-500/10' });
    } else if (temp < thresholds.temperature.warningLow) {
      actions.push({ id: 'heater', icon: <ThermometerSun className="w-5 h-5" />, text: t('action_heater'), color: 'text-orange-500', bg: 'bg-orange-500/10' });
    }

    // Humidity actions
    if (hum > thresholds.humidity.warningHigh) {
      actions.push({ id: 'dehumidifier', icon: <Droplet className="w-5 h-5" />, text: t('action_dehumidifier'), color: 'text-indigo-500', bg: 'bg-indigo-500/10' });
    } else if (hum < thresholds.humidity.warningLow) {
      actions.push({ id: 'humidifier', icon: <Droplets className="w-5 h-5" />, text: t('action_humidifier'), color: 'text-sky-500', bg: 'bg-sky-500/10' });
    }

    return actions;
  }, [sensorData, thresholds, t]);

  if (suggestions.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <Lightbulb className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('no_actions_needed')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
        <Lightbulb className="w-4 h-4" />
        {t('action_suggestions')}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((action) => (
          <div key={action.id} className={`flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`p-2 rounded-xl ${action.bg} ${action.color}`}>
              {action.icon}
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{action.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
