export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type Theme = 'light' | 'dark' | 'auto';

export interface SensorValue {
  value: number;
  status?: number;
}

export interface SensorData {
  co2?: SensorValue;
  pm25?: SensorValue;
  pm10?: SensorValue;
  temperature?: SensorValue;
  humidity?: SensorValue;
  tvoc?: SensorValue;
  battery?: SensorValue;
  timestamp?: { value: number };
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export interface HistoryPoint {
  time: string;
  co2: number;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  tvoc: number;
  battery: number;
  pmv: number;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  level: 'warning' | 'critical' | 'emergency';
  message: string;
  type: string;
}

export interface Thresholds {
  co2: { warning: number; critical: number; emergency: number };
  pm25: { warning: number; critical: number; emergency: number };
  pm10: { warning: number; critical: number; emergency: number };
  tvoc: { warning: number; critical: number; emergency: number };
  temperature: { 
    warningHigh: number; criticalHigh: number; emergencyHigh: number;
    warningLow: number; criticalLow: number; emergencyLow: number;
  };
  humidity: { 
    warningHigh: number; criticalHigh: number; emergencyHigh: number;
    warningLow: number; criticalLow: number; emergencyLow: number;
  };
  battery: { warning: number; critical: number; emergency: number };
}

export interface CalibrationOffsets {
  temperature: number;
  humidity: number;
  co2: number;
  pm25: number;
  pm10: number;
}

export interface ZenModeConfig {
  active: boolean;
  sensors: string[];
  focus: string | null;
}

export interface AppSettings {
  thresholds: Thresholds;
  offsets: CalibrationOffsets;
  samplingRate: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  clo?: number; // User selected clo value
}
