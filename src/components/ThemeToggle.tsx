import { Sun, Moon, Monitor } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { useState } from 'react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useDashboardStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        title="Theme"
      >
        {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </button>
      
      {open && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-1 z-20">
          <button onClick={() => { setTheme('light'); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            <Sun className="w-4 h-4" /> Light
          </button>
          <button onClick={() => { setTheme('dark'); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            <Moon className="w-4 h-4" /> Dark
          </button>
          <button onClick={() => { setTheme('auto'); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'auto' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            <Monitor className="w-4 h-4" /> Auto
          </button>
        </div>
      )}
    </div>
  );
};
