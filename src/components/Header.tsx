import { 
  Activity, 
  Clock, 
  Settings, 
  Maximize, 
  Download, 
  Bell, 
  BellOff, 
  History,
  Check
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ThemeToggle } from './ThemeToggle';
import { BROKER_URL } from '../config';
import { getStatusColor } from '../utils/formatters';
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

export const Header = ({ onExport, onOpenSettings }: { onExport: () => void, onOpenSettings: () => void }) => {
  const { t } = useTranslation();
  const { 
    connectionStatus, 
    lastUpdated, 
    freshness, 
    dndMode, 
    setDndMode, 
    alerts, 
    clearAlerts,
    zenMode,
    setZenMode
  } = useDashboardStore();
  
  const [showAlertHistory, setShowAlertHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm transition-colors relative">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
          <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            {t('dashboard_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">{t('monitoring_system')} v2.0</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-end gap-3 md:gap-4">
        {/* Status & Time Group */}
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}
              {lastUpdated && (
                <span className={`ml-1 ${freshness > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  ({freshness}s)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)} animate-pulse`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t(connectionStatus)}</span>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDndMode(!dndMode)}
            className={`p-2.5 rounded-xl transition-colors ${dndMode ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            title={t('do_not_disturb')}
          >
            {dndMode ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowAlertHistory(!showAlertHistory)}
              className={`p-2.5 rounded-xl transition-colors ${showAlertHistory ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title={t('alert_history')}
            >
              <History className="w-5 h-5" />
              {alerts.length > 0 && !showAlertHistory && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
            {showAlertHistory && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-white">{t('alert_history')}</h3>
                  <button 
                    onClick={() => clearAlerts()}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {t('clear_all')}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {t('no_recent_alerts')}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {alerts.map(alert => (
                        <div key={alert.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold uppercase ${
                              alert.level === 'emergency' ? 'text-red-500' :
                              alert.level === 'critical' ? 'text-orange-500' : 'text-amber-500'
                            }`}>
                              {t(alert.level)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{alert.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={t('settings')}
          >
            <Settings className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setZenMode({ active: true })}
            className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            title={t('zen_mode')}
          >
            <Maximize className="w-5 h-5" />
          </button>

          <button 
            onClick={onExport}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={t('export_csv')}
          >
            <Download className="w-5 h-5" />
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
