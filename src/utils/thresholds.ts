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

export const getTVOCStatus = (value: number, thresholds: Thresholds['tvoc'] = { warning: 300, critical: 600, emergency: 1000 }) => {
  if (value > thresholds.emergency) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'emergency' };
  if (value > thresholds.critical) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'poor' };
  if (value > thresholds.warning) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'moderate' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'excellent' };
};

export const getTempStatus = (value: number, thresholds: Thresholds['temperature'] = { warning: 30, critical: 35, emergency: 40 }) => {
  if (value > thresholds.emergency) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: 'hot' };
  if (value > thresholds.critical) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'hot' };
  if (value > thresholds.warning) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'warm' };
  if (value < 18) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'cold' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'comfortable' };
};

export const getHumidityStatus = (value: number, thresholds: Thresholds['humidity'] = { warning: 70, critical: 80, emergency: 90 }) => {
  if (value > thresholds.emergency) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'humid' };
  if (value > thresholds.critical) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'humid' };
  if (value > thresholds.warning) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'humid' };
  if (value < 30) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'dry' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'comfortable' };
};
