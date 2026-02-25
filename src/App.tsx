import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import mqtt from 'mqtt';
import throttle from 'lodash.throttle';
import toast, { Toaster } from 'react-hot-toast';
import { 
  CloudFog, 
  Wind, 
  Thermometer, 
  Droplets, 
  Activity, 
  Battery, 
  AlertCircle,
  Moon,
  Sun,
  Clock,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  Settings,
  Check,
  X,
  Monitor,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calculatePMV } from './pmv';
import { calculateAQI } from './utils/aqi';
import { useValueDelta } from './useValueDelta';
import { 
  BROKER_URL, 
  TOPIC, 
  getPM25Status, 
  getCO2Status, 
  getTempStatus, 
  getHumidityStatus, 
  getTVOCStatus 
} from './config';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SensorValue {
  value: number;
  status?: number;
}

interface SensorData {
  co2?: SensorValue;
  pm25?: SensorValue;
  pm10?: SensorValue;
  temperature?: SensorValue;
  humidity?: SensorValue;
  tvoc?: SensorValue;
  battery?: SensorValue;
  timestamp?: { value: number };
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface HistoryPoint {
  time: string;
  co2: number;
  pm25: number;
  temperature: number;
  humidity: number;
  tvoc: number;
  battery: number;
  pmv: number;
}

export default function App() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'auto') || 'auto';
    }
    return 'auto';
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [freshness, setFreshness] = useState<number>(0);
  
  // Zen Mode State
  const [zenMode, setZenMode] = useState(false);
  const [zenConfigOpen, setZenConfigOpen] = useState(false);
  const [zenSensors, setZenSensors] = useState<string[]>(['co2', 'pm25', 'temperature', 'humidity', 'tvoc', 'pmv']);
  const [zenFocus, setZenFocus] = useState<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const aqi = useMemo(() => {
    return calculateAQI(
      sensorData?.co2?.value || 0,
      sensorData?.pm25?.value || 0,
      sensorData?.tvoc?.value || 0
    );
  }, [sensorData]);

  // Clock & Freshness
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (lastUpdated) {
        setFreshness(Math.round((now.getTime() - lastUpdated.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { timestamp, message, type }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const throttledUpdate = useCallback(
    throttle((current: any) => {
      setSensorData(current);
      setLastUpdated(new Date());
      setFreshness(0);
      
      // Threshold Alerts
      if (current.co2?.value > 1200) {
        toast.error('High CO₂ (>1200ppm)! Ventilation recommended.', { id: 'co2-alert', duration: 8000 });
      }
      if (current.pm25?.value > 75) {
        toast.error('High PM2.5! Check air quality.', { id: 'pm25-alert', duration: 8000 });
      }
      if (current.tvoc?.value > 600) {
        toast.error('High TVOC levels detected!', { id: 'tvoc-alert', duration: 8000 });
      }

      setHistory(prev => {
        const pmvData = calculatePMV(current.temperature?.value || 0, current.humidity?.value || 0);
        const newPoint: HistoryPoint = {
          time: new Date().toLocaleTimeString(),
          co2: current.co2?.value || 0,
          pm25: current.pm25?.value || 0,
          temperature: current.temperature?.value || 0,
          humidity: current.humidity?.value || 0,
          tvoc: current.tvoc?.value || 0,
          battery: current.battery?.value || 0,
          pmv: pmvData.pmv
        };
        return [...prev, newPoint].slice(-120); // Keep last 120 points (30 mins)
      });
    }, 12000), // Throttle to 12 seconds
    []
  );

  const exportCSV = () => {
    if (history.length === 0) {
      toast.error('No history data to export');
      return;
    }
    
    const headers = ['Time,CO2,PM2.5,TVOC,Temperature,Humidity,Battery,PMV'];
    const rows = history.map(h => 
      `${h.time},${h.co2},${h.pm25},${h.tvoc},${h.temperature},${h.humidity},${h.battery},${h.pmv}`
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `iaq_export_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (clientRef.current) return;

    addLog(`Connecting to ${BROKER_URL}...`, 'info');
    setConnectionStatus('connecting');

    const mqttClient = mqtt.connect(BROKER_URL, {
      clientId: `mqtt_dashboard_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
    });

    mqttClient.on('connect', () => {
      setConnectionStatus('connected');
      addLog('Connected to MQTT Broker', 'success');
      mqttClient.subscribe(TOPIC, (err) => {
        if (!err) {
          addLog(`Subscribed to topic: ${TOPIC}`, 'success');
        } else {
          addLog(`Subscription error: ${err.message}`, 'error');
        }
      });
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = message.toString();
        const data = JSON.parse(payload);
        
        console.log('MQTT Message:', data);

        // Only process type "12" (Real-time/Latest reading)
        if (data.type === "12" && data.sensorData && Array.isArray(data.sensorData) && data.sensorData.length > 0) {
          throttledUpdate(data.sensorData[0]);
        }
      } catch (e) {
        addLog(`JSON Parse Error: ${(e as Error).message}`, 'error');
      }
    });

    mqttClient.on('error', (err) => {
      setConnectionStatus('error');
      addLog(`Connection error: ${err.message}`, 'error');
      // Do not end client here to allow reconnection
    });

    mqttClient.on('close', () => {
      if (connectionStatus === 'connected') {
        setConnectionStatus('disconnected');
        addLog('Connection closed', 'info');
      }
    });

    setClient(mqttClient);
    clientRef.current = mqttClient;

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  // Chart Options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#e2e8f0' : '#1e293b',
        bodyColor: isDark ? '#e2e8f0' : '#1e293b',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        titleFont: {
          family: "'JetBrains Mono', monospace",
        },
        bodyFont: {
          family: "'JetBrains Mono', monospace",
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            size: 10,
            family: "'JetBrains Mono', monospace",
          }
        },
        border: {
          display: false
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hitRadius: 10,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      }
    }
  }), [isDark]);

  // Zen Mode Logic
  const toggleZenSensor = (key: string) => {
    if (zenSensors.includes(key)) {
      if (zenSensors.length > 1) { // Prevent removing last one
        setZenSensors(prev => prev.filter(k => k !== key));
      }
    } else {
      if (zenSensors.length < 6) {
        setZenSensors(prev => [...prev, key]);
      }
    }
  };

  const getSensorConfig = (key: string) => {
    switch(key) {
      case 'co2': return { 
        title: 'CO₂', value: sensorData?.co2?.value, unit: 'ppm', 
        status: getCO2Status(sensorData?.co2?.value || 0), 
        icon: <CloudFog className="w-full h-full" />,
        decimals: 0
      };
      case 'pm25': return { 
        title: 'PM2.5', value: sensorData?.pm25?.value, unit: 'µg/m³', 
        status: getPM25Status(sensorData?.pm25?.value || 0), 
        icon: <Wind className="w-full h-full" />,
        decimals: 0
      };
      case 'temperature': return { 
        title: 'Temperature', value: sensorData?.temperature?.value, unit: '°C', 
        status: getTempStatus(sensorData?.temperature?.value || 0), 
        icon: <Thermometer className="w-full h-full" />,
        decimals: 1
      };
      case 'humidity': return { 
        title: 'Humidity', value: sensorData?.humidity?.value, unit: '%', 
        status: getHumidityStatus(sensorData?.humidity?.value || 0), 
        icon: <Droplets className="w-full h-full" />,
        decimals: 1
      };
      case 'tvoc': return { 
        title: 'TVOC', value: sensorData?.tvoc?.value, unit: 'ppb', 
        status: getTVOCStatus(sensorData?.tvoc?.value || 0), 
        icon: <Activity className="w-full h-full" />,
        decimals: 0
      };
      case 'pmv': {
        const pmvData = calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0);
        return { 
          title: 'PMV', value: pmvData.pmv, unit: '', 
          status: { ...pmvData, label: pmvData.status }, 
          icon: <Activity className="w-full h-full" />,
          decimals: 2,
          prefix: '~',
          extra: `PPD: ${pmvData.ppd}%`
        };
      }
      case 'battery': return { 
        title: 'Battery', value: sensorData?.battery?.value, unit: '%', 
        status: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-400/10', label: 'Normal' }, 
        icon: <Battery className="w-full h-full" />,
        decimals: 0
      };
      default: return null;
    }
  };

  // Zen Mode View
  if (zenMode) {
    const activeSensors = zenFocus ? [zenFocus] : zenSensors;
    const gridCols = activeSensors.length === 1 ? 'grid-cols-1' :
                     activeSensors.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                     activeSensors.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     activeSensors.length === 4 ? 'grid-cols-2' :
                     'grid-cols-2 md:grid-cols-3';

    return (
      <div className={`fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-all duration-1000 flex flex-col ${isIdle ? 'brightness-50 grayscale' : ''}`}>
        <div className="absolute top-6 right-6 z-50 flex gap-4 opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => {
              const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
              setTheme(next);
            }}
            className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
          >
            {theme === 'light' ? <Sun className="w-6 h-6" /> : theme === 'dark' ? <Moon className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setZenMode(false)}
            className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
          >
            <Minimize className="w-6 h-6" />
          </button>
        </div>
        
        <div className={`flex-1 grid ${gridCols} gap-1 p-1`}>
          {activeSensors.map(key => {
            const config = getSensorConfig(key);
            if (!config) return null;
            const isFocused = zenFocus === key;
            
            return (
              <div 
                key={key} 
                onClick={() => setZenFocus(isFocused ? null : key)}
                className={`flex flex-col items-center justify-center p-8 rounded-3xl ${config.status.bg} bg-opacity-20 dark:bg-opacity-10 m-2 transition-all duration-500 cursor-pointer hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-4 mb-4 opacity-70">
                  <div className={`w-8 h-8 ${config.status.color}`}>{config.icon}</div>
                  <span className="text-xl font-bold uppercase tracking-widest">{config.title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-bold font-mono tracking-tighter ${config.status.color} ${activeSensors.length === 1 ? 'text-[10rem] md:text-[16rem] leading-none' : zenSensors.length <= 2 ? 'text-8xl md:text-[12rem] leading-none' : zenSensors.length <= 4 ? 'text-6xl md:text-[8rem] leading-none' : 'text-5xl md:text-8xl'}`}>
                    {config.prefix}{config.value !== undefined ? config.value.toFixed(config.decimals) : '--'}
                  </span>
                  {config.extra ? (
                    <div className={`flex flex-col items-start ${config.status.color} opacity-60 ml-2`}>
                      <span className="text-xl font-bold uppercase tracking-wider leading-none">PPD</span>
                      <span className="text-3xl font-mono font-bold leading-none">{config.extra.replace('PPD: ', '')}</span>
                    </div>
                  ) : (
                    <span className={`${config.unit.length > 10 ? 'text-xl md:text-2xl' : 'text-4xl'} font-medium opacity-60 ${config.status.color}`}>{config.unit}</span>
                  )}
                </div>
                <div className={`mt-4 px-4 py-1 rounded-full text-lg font-bold ${config.status.bg} ${config.status.color}`}>
                  {config.status.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Toaster position="top-center" toastOptions={{
        className: 'dark:bg-slate-800 dark:text-white',
        style: {
          background: isDark ? '#1e293b' : '#fff',
          color: isDark ? '#fff' : '#000',
        },
      }} />
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm transition-colors relative">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              MQTT Sensor Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time environmental monitoring</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
            
            {/* Clock & Status */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-xl font-mono font-bold text-slate-700 dark:text-slate-200">
                <Clock className="w-5 h-5 text-slate-400" />
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Last Update: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                {lastUpdated && (
                  <span className={`ml-2 ${freshness > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    ({freshness}s ago)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Zen Config */}
              <div className="relative">
                <button 
                  onClick={() => setZenConfigOpen(!zenConfigOpen)}
                  className={`p-2.5 rounded-xl transition-colors ${zenConfigOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {zenConfigOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-20">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Zen Mode Sensors</div>
                    <div className="space-y-1">
                      {['co2', 'pm25', 'temperature', 'humidity', 'tvoc', 'pmv', 'battery'].map(key => (
                        <button
                          key={key}
                          onClick={() => toggleZenSensor(key)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span className="capitalize">{key}</span>
                          {zenSensors.includes(key) && <Check className="w-4 h-4 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Zen Toggle */}
              <button 
                onClick={() => setZenMode(true)}
                className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                title="Enter Zen Mode"
              >
                <Maximize className="w-5 h-5" />
              </button>

              {/* Export Button */}
              <button 
                onClick={exportCSV}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Export CSV"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Theme"
                >
                  {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>
                
                {themeMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-1 z-20">
                    <button onClick={() => { setTheme('light'); setThemeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      <Sun className="w-4 h-4" /> Light
                    </button>
                    <button onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                    <button onClick={() => { setTheme('auto'); setThemeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'auto' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      <Monitor className="w-4 h-4" /> Auto
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{getStatusText()}</span>
                <span className="text-xs text-slate-400 border-l border-slate-200 dark:border-slate-600 pl-3 ml-1 font-mono">
                  {BROKER_URL.replace('ws://', '')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Sensor Grid */}
        <div className="space-y-8">
          
          {/* AQI Banner */}
          <div className={`p-4 rounded-2xl ${aqi.bg} text-center mb-6 flex items-center justify-center gap-4 transition-colors duration-500`}>
             <div className="flex flex-col items-center">
                <span className={`text-3xl font-bold ${aqi.color}`}>{aqi.level}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">AQI Score: {aqi.score}</span>
             </div>
          </div>

          {/* Hero Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <SensorCard 
              title="CO₂" 
              value={sensorData?.co2?.value} 
              unit="ppm" 
              icon={<CloudFog className="w-full h-full" />}
              status={getCO2Status(sensorData?.co2?.value || 0)}
              history={history}
              dataKey="co2"
              color="#10b981"
              bgColor="rgba(16, 185, 129, 0.1)"
              options={chartOptions}
              trend="inverse"
              isHero={true}
            />

            <SensorCard 
              title="PM2.5" 
              value={sensorData?.pm25?.value} 
              unit="µg/m³" 
              icon={<Wind className="w-full h-full" />}
              status={getPM25Status(sensorData?.pm25?.value || 0)}
              history={history}
              dataKey="pm25"
              color="#6366f1"
              bgColor="rgba(99, 102, 241, 0.1)"
              options={chartOptions}
              trend="inverse"
              isHero={true}
            />

            <SensorCard 
              title="TVOC" 
              value={sensorData?.tvoc?.value} 
              unit="ppb" 
              icon={<Activity className="w-full h-full" />}
              status={getTVOCStatus(sensorData?.tvoc?.value || 0)}
              history={history}
              dataKey="tvoc"
              color="#a855f7"
              bgColor="rgba(168, 85, 247, 0.1)"
              options={chartOptions}
              trend="inverse"
              isHero={true}
            />

            <SensorCard 
              title="PMV" 
              value={calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0).pmv} 
              unit=""
              prefix="~"
              extra={`PPD: ${calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0).ppd}%`}
              icon={<Activity className="w-full h-full" />}
              status={{
                ...calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0),
                label: calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0).status
              }}
              history={history}
              dataKey="pmv"
              color="#8b5cf6"
              bgColor="rgba(139, 92, 246, 0.1)"
              options={chartOptions}
              decimals={2}
              trend="inverse"
              isHero={true}
            />
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex justify-center">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              {showDetails ? 'Show Less' : 'Show More'}
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Secondary Row */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${showDetails ? 'block' : 'hidden md:grid'}`}>
            <SensorCard 
              title="Temperature" 
              value={sensorData?.temperature?.value} 
              unit="°C" 
              icon={<Thermometer className="w-full h-full" />}
              status={getTempStatus(sensorData?.temperature?.value || 0)}
              history={history}
              dataKey="temperature"
              color="#f97316"
              bgColor="rgba(249, 115, 22, 0.1)"
              options={chartOptions}
              decimals={1}
              trend="temperature"
            />

            <SensorCard 
              title="Humidity" 
              value={sensorData?.humidity?.value} 
              unit="%" 
              icon={<Droplets className="w-full h-full" />}
              status={getHumidityStatus(sensorData?.humidity?.value || 0)}
              history={history}
              dataKey="humidity"
              color="#3b82f6"
              bgColor="rgba(59, 130, 246, 0.1)"
              options={chartOptions}
              decimals={1}
              trend="humidity"
            />

            <SensorCard 
              title="Battery" 
              value={sensorData?.battery?.value} 
              unit="%" 
              icon={<Battery className="w-full h-full" />}
              status={{ color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-400/10', label: 'Normal' }}
              history={history}
              dataKey="battery"
              color="#22c55e"
              bgColor="rgba(34, 197, 94, 0.1)"
              options={chartOptions}
              trend="standard"
            />
          </div>

        </div>

        {/* Logs Panel */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-lg ring-1 ring-white/10">
          <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-300 font-mono">System Logs</h3>
            <span className="text-xs text-slate-500 font-mono">Topic: {TOPIC}</span>
          </div>
          <div className="h-48 overflow-y-auto p-6 font-mono text-xs space-y-2 custom-scrollbar">
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
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Sensor Card Component
function SensorCard({ title, value, unit, icon, status, history, dataKey, color, bgColor, options, decimals = 0, trend = 'standard', showChart = true, prefix = '', extra = '', isHero = false }: any) {
  const { flash, delta } = useValueDelta(value);
  const chartRef = useRef<any>(null);

  // Initial chart data structure
  const [chartData] = useState({
    labels: history ? history.map((h: any) => h.time) : [],
    datasets: [{
      label: title,
      data: history ? history.map((h: any) => h[dataKey]) : [],
      borderColor: color,
      backgroundColor: bgColor,
      fill: true,
    }]
  });

  // Incremental chart update
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !history || history.length === 0) return;

    const last = history[history.length - 1];
    const lastChartTime = chart.data.labels[chart.data.labels.length - 1];

    // Prevent duplicate points (e.g. on mount)
    if (last.time === lastChartTime) return;
    
    // Add new data point
    chart.data.labels.push(last.time);
    chart.data.datasets[0].data.push(last[dataKey]);

    // Remove old points if exceeding limit (30)
    if (chart.data.labels.length > 30) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update('none'); // Update without animation
  }, [history, dataKey]);

  const getFlashClass = () => {
    if (!flash) return 'bg-white dark:bg-slate-900';
    
    if (trend === 'temperature') {
        return flash === 'up' ? 'bg-orange-500/10 dark:bg-orange-500/20' : 'bg-blue-500/10 dark:bg-blue-500/20';
    }
    if (trend === 'humidity') {
        return flash === 'up' ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-orange-500/10 dark:bg-orange-500/20';
    }
    if (trend === 'inverse') {
        return flash === 'up' ? 'bg-red-500/10 dark:bg-red-500/20' : 'bg-emerald-500/10 dark:bg-emerald-500/20';
    }
    // standard
    return flash === 'up' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20';
  };

  const getDeltaColor = () => {
    if (!delta) return '';
    const isUp = delta > 0;
    
    if (trend === 'temperature') {
        return isUp ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10';
    }
    if (trend === 'humidity') {
        return isUp ? 'text-blue-500 bg-blue-500/10' : 'text-orange-500 bg-orange-500/10';
    }
    if (trend === 'inverse') {
        return isUp ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10';
    }
    return isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10';
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500 group hover:scale-[1.02] hover:shadow-lg ${getFlashClass()} ${isHero ? 'p-6 md:p-8' : 'p-6'}`}>
       {/* Background Gradient */}
       <div className={`absolute inset-0 ${status.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

       {/* Header */}
       <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={`p-2.5 rounded-2xl ${status.bg} ${status.color}`}>
                <div className={isHero ? "w-6 h-6 md:w-8 md:h-8" : "w-5 h-5"}>{icon}</div>
             </div>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
          </div>
          {/* Delta Top Right */}
          {delta !== null && delta !== 0 && (
            <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${getDeltaColor()}`}>
              {delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(delta).toFixed(decimals === 0 ? 0 : decimals)}
            </div>
          )}
       </div>

       {/* Value Section */}
       <div className="relative z-10 flex flex-col items-center justify-center py-2">
          <div className="flex items-baseline gap-1">
             <span className={`font-bold font-mono tracking-tight ${status.color} ${isHero ? 'text-6xl md:text-7xl' : 'text-5xl'}`} aria-live="polite">
                {prefix}{value !== undefined ? value.toFixed(decimals) : '--'}
             </span>
             <span className={`font-medium text-slate-400 ${isHero ? 'text-xl' : 'text-lg'}`}>{unit}</span>
          </div>
          {extra && <span className="text-xs text-slate-400 font-medium mt-1">{extra}</span>}
          
          {/* Status Label Centered Below */}
          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
             {status.label}
          </div>
       </div>

       {/* Chart */}
       {showChart && (
        <div className="relative z-10 h-16 w-full mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
          <Line ref={chartRef} data={chartData} options={{...options, scales: { x: { display: false }, y: { display: false } }}} />
        </div>
      )}
    </div>
  );
}
