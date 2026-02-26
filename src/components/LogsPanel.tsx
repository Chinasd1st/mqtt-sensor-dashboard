import { useRef, useEffect } from 'react';
import { TOPIC } from '../config';
import { useDashboardStore } from '../store/useDashboardStore';

export const LogsPanel = () => {
  const { logs } = useDashboardStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-lg ring-1 ring-white/10">
      <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-300 font-mono">System Logs</h3>
        <span className="text-xs text-slate-500 font-mono">Topic: {TOPIC}</span>
      </div>
      <div ref={containerRef} className="h-48 overflow-y-auto p-6 font-mono text-xs space-y-2 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for connection...</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="flex gap-3">
            <span className="text-slate-500 shrink-0">{log.timestamp}</span>
            <span className={`${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-emerald-400' : 
              'text-slate-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
