export const BROKER_URL = "ws://192.168.1.105:9001/mqtt";
export const TOPIC = "qingping/582D3400ED5C/up";

export const getPM25Status = (val: number) => {
  if (val <= 35) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'Excellent' };
  if (val <= 75) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'Good' };
  if (val <= 115) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'Light' };
  if (val <= 150) return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-400/10', label: 'Moderate' };
  if (val <= 250) return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-400/10', label: 'Heavy' };
  return { color: 'text-rose-700 dark:text-rose-500', bg: 'bg-rose-700/10 dark:bg-rose-500/10', label: 'Severe' };
};

export const getCO2Status = (val: number) => {
  if (val <= 1000) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'Fresh' };
  if (val <= 1500) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'Fair' };
  if (val <= 2000) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'Poor' };
  return { color: 'text-rose-700 dark:text-rose-500', bg: 'bg-rose-700/10 dark:bg-rose-500/10', label: 'High' };
};

export const getTempStatus = (val: number) => {
  if (val < 16) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'Cold' };
  if (val <= 28) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'Comfortable' };
  return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'Hot' };
};

export const getHumidityStatus = (val: number) => {
  if (val < 30) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: 'Dry' };
  if (val < 40) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'Slightly Dry' };
  if (val <= 70) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'Comfortable' };
  if (val <= 80) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'Slightly Humid' };
  return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: 'Humid' };
};

export const getTVOCStatus = (val: number) => {
  if (val <= 200) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: 'Excellent' };
  if (val <= 600) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10', label: 'Good' };
  return { color: 'text-rose-700 dark:text-rose-500', bg: 'bg-rose-700/10 dark:bg-rose-500/10', label: 'Poor' };
};
