import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set as setIDB } from 'idb-keyval';
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
  clo?: number;
  isCachedData: boolean;
  temperatureUnit: 'C' | 'F';
  tvocUnit: 'ppb' | 'µg/m³';
  
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
  setClo: (clo?: number) => void;
  setTemperatureUnit: (unit: 'C' | 'F') => void;
  setTvocUnit: (unit: 'ppb' | 'µg/m³') => void;
  setLastUpdated: (date: Date) => void;
  updateFreshness: () => void;
  loadCachedData: () => Promise<void>;
}

export const defaultThresholds: Thresholds = {
  co2: { warning: 1000, critical: 1500, emergency: 2500 },
  pm25: { warning: 35, critical: 75, emergency: 150 },
  pm10: { warning: 50, critical: 150, emergency: 250 },
  tvoc: { warning: 300, critical: 600, emergency: 1000 },
  temperature: { 
    warningHigh: 30, criticalHigh: 35, emergencyHigh: 40,
    warningLow: 15, criticalLow: 10, emergencyLow: 5
  },
  humidity: { 
    warningHigh: 70, criticalHigh: 80, emergencyHigh: 90,
    warningLow: 30, criticalLow: 20, emergencyLow: 10
  },
  battery: { warning: 20, critical: 10, emergency: 5 },
};

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
        sensors: ['co2', 'pm25', 'pm10', 'temperature', 'humidity', 'tvoc', 'pmv'],
        focus: null,
      },
      dndMode: false,
      samplingInterval: 15,
      thresholds: defaultThresholds,
      offsets: {
        temperature: 0,
        humidity: 0,
        co2: 0,
        pm25: 0,
        pm10: 0,
      },
      language: 'zh',
      clo: undefined,
      isCachedData: false,
      temperatureUnit: 'C',
      tvocUnit: 'ppb',

      setSensorData: (data) => {
        set({ sensorData: data, isCachedData: false });
        setIDB('cachedSensorData', data).catch(console.error);
      },
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      addHistoryPoint: (point) => set((state) => {
        const newHistory = [...state.history, point].slice(-120);
        setIDB('cachedHistory', newHistory).catch(console.error);
        return { history: newHistory, isCachedData: false };
      }),
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
      setClo: (clo) => set({ clo }),
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setTvocUnit: (unit) => set({ tvocUnit: unit }),
      loadCachedData: async () => {
        try {
          const [cachedData, cachedHistory] = await Promise.all([
            get('cachedSensorData'),
            get('cachedHistory')
          ]);
          
          set((state) => {
            if (state.connectionStatus !== 'connected' && !state.sensorData) {
              return {
                ...(cachedData ? { sensorData: cachedData, isCachedData: true } : {}),
                ...(cachedHistory ? { history: cachedHistory, isCachedData: true } : {})
              };
            }
            return state;
          });
        } catch (error) {
          console.error('Failed to load cached data:', error);
        }
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
        clo: state.clo,
        temperatureUnit: state.temperatureUnit,
        tvocUnit: state.tvocUnit,
      }),
      merge: (persistedState: any, currentState) => {
        const mergedThresholds = { ...currentState.thresholds };
        if (persistedState?.thresholds) {
          for (const key in persistedState.thresholds) {
            mergedThresholds[key as keyof Thresholds] = {
              ...currentState.thresholds[key as keyof Thresholds],
              ...persistedState.thresholds[key]
            } as any;
          }
        }

        return {
          ...currentState,
          ...persistedState,
          thresholds: mergedThresholds,
          offsets: {
            ...currentState.offsets,
            ...(persistedState?.offsets || {})
          },
          zenMode: {
            ...currentState.zenMode,
            ...(persistedState?.zenMode || {})
          }
        };
      },
    }
  )
);
