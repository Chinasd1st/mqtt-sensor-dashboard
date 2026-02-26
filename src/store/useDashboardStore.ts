import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import { 
  ConnectionStatus, 
  SensorData, 
  HistoryPoint, 
  LogEntry, 
  AlertItem, 
  Theme, 
  Thresholds, 
  CalibrationOffsets,
  ZenModeConfig
} from '../types';

interface DashboardState {
  // MQTT & Data
  sensorData: SensorData | null;
  connectionStatus: ConnectionStatus;
  history: HistoryPoint[];
  logs: LogEntry[];
  alerts: AlertItem[];
  lastUpdated: Date | null;
  freshness: number;
  
  // UI State
  theme: Theme;
  zenMode: ZenModeConfig;
  dndMode: boolean;
  samplingInterval: number; // in seconds
  
  // Settings
  thresholds: Thresholds;
  offsets: CalibrationOffsets;
  language: string;
  
  // Actions
  setSensorData: (data: SensorData) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  addHistoryPoint: (point: HistoryPoint) => void;
  addLog: (message: string, type?: LogEntry['type']) => void;
  addAlert: (alert: AlertItem) => void;
  clearAlerts: () => void;
  setTheme: (theme: Theme) => void;
  setZenMode: (config: Partial<ZenModeConfig>) => void;
  setDndMode: (enabled: boolean) => void;
  setSamplingInterval: (interval: number) => void;
  updateThresholds: (thresholds: Partial<Thresholds>) => void;
  updateOffsets: (offsets: Partial<CalibrationOffsets>) => void;
  setLanguage: (lang: string) => void;
  setLastUpdated: (date: Date) => void;
  updateFreshness: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      sensorData: null,
      connectionStatus: 'disconnected',
      history: [],
      logs: [],
      alerts: [],
      lastUpdated: null,
      freshness: 0,
      theme: 'auto',
      zenMode: {
        active: false,
        sensors: ['co2', 'pm25', 'temperature', 'humidity', 'tvoc', 'pmv'],
        focus: null,
      },
      dndMode: false,
      samplingInterval: 15,
      thresholds: {
        co2: { warning: 1000, critical: 1500, emergency: 2500 },
        pm25: { warning: 35, critical: 75, emergency: 150 },
        tvoc: { warning: 300, critical: 600, emergency: 1000 },
        temperature: { warning: 30, critical: 35, emergency: 40 },
        humidity: { warning: 70, critical: 80, emergency: 90 },
        battery: { warning: 20, critical: 10, emergency: 5 },
      },
      offsets: {
        temperature: 0,
        humidity: 0,
        co2: 0,
        pm25: 0,
      },
      language: 'zh',

      setSensorData: (data) => set({ sensorData: data }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      addHistoryPoint: (point) => set((state) => ({
        history: [...state.history, point].slice(-120)
      })),
      addLog: (message, type = 'info') => set((state) => ({
        logs: [...state.logs.slice(-49), { 
          timestamp: new Date().toLocaleTimeString(), 
          message, 
          type 
        }]
      })),
      addAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts].slice(0, 50)
      })),
      setLastUpdated: (date: Date) => set({ lastUpdated: date, freshness: 0 }),
      updateFreshness: () => set((state) => ({
        freshness: state.lastUpdated ? Math.round((new Date().getTime() - new Date(state.lastUpdated).getTime()) / 1000) : 0
      })),
      clearAlerts: () => set({ alerts: [] }),
      setTheme: (theme) => set({ theme }),
      setZenMode: (config) => set((state) => ({
        zenMode: { ...state.zenMode, ...config }
      })),
      setDndMode: (enabled) => set({ dndMode: enabled }),
      setSamplingInterval: (interval) => set({ samplingInterval: interval }),
      updateThresholds: (newThresholds) => set((state) => ({
        thresholds: { ...state.thresholds, ...newThresholds }
      })),
      updateOffsets: (newOffsets) => set((state) => ({
        offsets: { ...state.offsets, ...newOffsets }
      })),
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        theme: state.theme,
        thresholds: state.thresholds,
        offsets: state.offsets,
        language: state.language,
        zenMode: state.zenMode,
        dndMode: state.dndMode,
        samplingInterval: state.samplingInterval,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        thresholds: {
          ...currentState.thresholds,
          ...(persistedState?.thresholds || {})
        },
        offsets: {
          ...currentState.offsets,
          ...(persistedState?.offsets || {})
        },
        zenMode: {
          ...currentState.zenMode,
          ...(persistedState?.zenMode || {})
        }
      }),
    }
  )
);
