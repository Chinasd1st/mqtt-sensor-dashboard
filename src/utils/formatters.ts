export const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

export const formatValue = (value: number | undefined, decimals: number = 0) => {
  if (value === undefined) return '--';
  return value.toFixed(decimals);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected': return 'bg-emerald-500';
    case 'connecting': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
