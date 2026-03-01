import { Thresholds } from '../types';

export const getCO2Status = (value: number, thresholds: Thresholds['co2'] = { warning: 1000, critical: 1500, emergency: 2500 }) => {
  if (value > thresholds.emergency) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'emergency' };
  if (value > thresholds.critical) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'poor' };
  if (value > thresholds.warning) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'moderate' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'excellent' };
};

export const getPM25Status = (value: number, thresholds: Thresholds['pm25'] = { warning: 35, critical: 75, emergency: 150 }) => {
  if (value > thresholds.emergency) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'emergency' };
  if (value > thresholds.critical) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'poor' };
  if (value > thresholds.warning) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'moderate' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'excellent' };
};

export const getPM10Status = (value: number, thresholds: Thresholds['pm10'] = { warning: 50, critical: 150, emergency: 250 }) => {
  if (value > thresholds.emergency) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'emergency' };
  if (value > thresholds.critical) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'poor' };
  if (value > thresholds.warning) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'moderate' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'excellent' };
};

export const getTVOCStatus = (value: number, thresholds: Thresholds['tvoc'] = { warning: 300, critical: 600, emergency: 1000 }) => {
  if (value > thresholds.emergency) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'emergency' };
  if (value > thresholds.critical) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'poor' };
  if (value > thresholds.warning) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'moderate' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'excellent' };
};

export const getTempStatus = (value: number, thresholds: Thresholds['temperature'] = { warningHigh: 30, criticalHigh: 35, emergencyHigh: 40, warningLow: 15, criticalLow: 10, emergencyLow: 5 }) => {
  if (value >= thresholds.emergencyHigh) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'hot' };
  if (value >= thresholds.criticalHigh) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'hot' };
  if (value >= thresholds.warningHigh) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'warm' };
  
  if (value <= thresholds.emergencyLow) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'cold' };
  if (value <= thresholds.criticalLow) return { color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'cold' };
  if (value <= thresholds.warningLow) return { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-400/10', label: 'cool' };

  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'comfortable' };
};

export const getHumidityStatus = (value: number, thresholds: Thresholds['humidity'] = { warningHigh: 70, criticalHigh: 80, emergencyHigh: 90, warningLow: 30, criticalLow: 20, emergencyLow: 10 }) => {
  if (value >= thresholds.emergencyHigh) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'humid' };
  if (value >= thresholds.criticalHigh) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'humid' };
  if (value >= thresholds.warningHigh) return { color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'humid' };
  
  if (value <= thresholds.emergencyLow) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'dry' };
  if (value <= thresholds.criticalLow) return { color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'dry' };
  if (value <= thresholds.warningLow) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'dry' };

  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'comfortable' };
};
