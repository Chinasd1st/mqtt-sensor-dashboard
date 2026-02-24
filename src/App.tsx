import { useEffect, useState, useRef, useMemo } from 'react';
import mqtt from 'mqtt';
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
  X
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

// Configuration
const BROKER_URL = "ws://192.168.1.105:9001/mqtt";
const TOPIC = "qingping/582D3400ED5C/up";

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

// ASHRAE 55 PMV Calculation (Simplified Fanger Model)
const calculatePMV = (ta: number, rh: number): { pmv: number, status: string, color: string, bg: string } => {
  if (ta === undefined || rh === undefined) return { pmv: 0, status: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-100' };

  const vel = 0.1; // m/s (Still air)
  const met = 1.1; // met (Light office activity)
  const clo = ta > 24 ? 0.5 : 1.0; // Dynamic clothing: Summer (0.5) vs Winter (1.0) assumption

  // Water vapor pressure (Pa)
  const pa = (rh / 100) * Math.exp(16.6536 - 4030.183 / (ta + 235));

  const icl = 0.155 * clo; // Thermal insulation of clothing in m2K/W
  const m = met * 58.15; // Metabolic rate in W/m2
  const w = 0; // External work in W/m2
  const mw = m - w; // Internal heat production

  // Iterative calculation for clothing surface temperature (tcl)
  let tcl = ta;
  let hc = 12.1 * Math.sqrt(vel);
  
  for (let i = 0; i < 10; i++) {
    let hcf = 12.1 * Math.sqrt(vel);
    const tcl2 = tcl + 273.15;
    const ta2 = ta + 273.15;
    const tr2 = ta + 273.15; // Assumption: Mean Radiant Temp = Air Temp

    // Heat transfer coefficient by forced convection
    hc = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
    if (hcf > hc) hc = hcf;

    const t1 = 3.96 * Math.pow(10, -8) * 0.95 * (Math.pow(tcl2, 4) - Math.pow(tr2, 4));
    const t2 = hc * (tcl - ta);
    
    const tclNew = 35.7 - 0.028 * mw - icl * (t1 + t2);
    if (Math.abs(tclNew - tcl) < 0.01) break;
    tcl = (tclNew + tcl) / 2;
  }

  const tcl2 = tcl + 273.15;
  const tr2 = ta + 273.15;
  const t1 = 3.96 * Math.pow(10, -8) * 0.95 * (Math.pow(tcl2, 4) - Math.pow(tr2, 4));
  const t2 = hc * (tcl - ta);
  
  const loss = t1 + t2;
  const ts = 0.303 * Math.exp(-0.036 * m) + 0.028;
  
  // Heat loss components
  const hl1 = 3.05 * 0.001 * (5733 - 6.99 * mw - pa);
  const hl2 = 0.42 * (mw - 58.15);
  const hl3 = 1.7 * 0.00001 * m * (5867 - pa);
  const hl4 = 0.0014 * m * (34 - ta);
  
  const pmvVal = ts * (mw - hl1 - hl2 - hl3 - hl4 - loss);
  const pmv = Math.round(pmvVal * 10) / 10; // Round to 1 decimal

  // Status determination based on ASHRAE 55
  let status = 'Comfortable';
  let color = 'text-emerald-600 dark:text-emerald-400';
  let bg = 'bg-emerald-500/10 dark:bg-emerald-400/10';

  if (pmv > 0.5) {
    if (pmv > 3) { status = 'Hot'; color = 'text-rose-600 dark:text-rose-400'; bg = 'bg-rose-500/10 dark:bg-rose-400/10'; }
    else if (pmv > 2) { status = 'Warm'; color = 'text-red-600 dark:text-red-400'; bg = 'bg-red-500/10 dark:bg-red-400/10'; }
    else if (pmv > 1) { status = 'Slightly Warm'; color = 'text-orange-600 dark:text-orange-400'; bg = 'bg-orange-500/10 dark:bg-orange-400/10'; }
    else { status = 'Neutral (+)'; color = 'text-emerald-600 dark:text-emerald-400'; bg = 'bg-emerald-500/10 dark:bg-emerald-400/10'; }
  } else if (pmv < -0.5) {
    if (pmv < -3) { status = 'Cold'; color = 'text-blue-800 dark:text-blue-300'; bg = 'bg-blue-800/10 dark:bg-blue-300/10'; }
    else if (pmv < -2) { status = 'Cool'; color = 'text-blue-600 dark:text-blue-400'; bg = 'bg-blue-500/10 dark:bg-blue-400/10'; }
    else if (pmv < -1) { status = 'Slightly Cool'; color = 'text-cyan-600 dark:text-cyan-400'; bg = 'bg-cyan-500/10 dark:bg-cyan-400/10'; }
    else { status = 'Neutral (-)'; color = 'text-emerald-600 dark:text-emerald-400'; bg = 'bg-emerald-500/10 dark:bg-emerald-400/10'; }
  }

  return { pmv, status, color, bg };
};

const getPM25Status = (val: number) => {
  if (val <= 35) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: '优' };
  if (val <= 75) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-400/10', label: '良' };
  if (val <= 115) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: '轻度' };
  if (val <= 150) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: '中度' };
  if (val <= 250) return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-400/10', label: '重度' };
  return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-400/10', label: '严重' };
};

const getCO2Status = (val: number) => {
  if (val <= 1000) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: '清新' };
  if (val <= 1500) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-400/10', label: '一般' };
  if (val <= 2000) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: '较差' };
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: '超标' };
};

const getTempStatus = (val: number) => {
  if (val < 16) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: '偏冷' };
  if (val <= 28) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: '舒适' };
  return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: '偏热' };
};

const getHumidityStatus = (val: number) => {
  if (val < 30) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-400/10', label: '干燥' };
  if (val < 40) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-400/10', label: '略干' };
  if (val <= 70) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: '舒适' };
  if (val <= 80) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-400/10', label: '略湿' };
  return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10', label: '潮湿' };
};

const getTVOCStatus = (val: number) => {
  if (val <= 200) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', label: '优' };
  if (val <= 600) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-400/10', label: '良' };
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', label: '差' };
};

export default function App() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Zen Mode State
  const [zenMode, setZenMode] = useState(false);
  const [zenConfigOpen, setZenConfigOpen] = useState(false);
  const [zenSensors, setZenSensors] = useState<string[]>(['co2', 'pm25', 'temperature', 'humidity', 'tvoc', 'pmv', 'battery']);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { timestamp, message, type }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    addLog(`Connecting to ${BROKER_URL}...`, 'info');
    setConnectionStatus('connecting');

    const mqttClient = mqtt.connect(BROKER_URL, {
      clientId: `mqtt_dashboard_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
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
          const current = data.sensorData[0];
          setSensorData(current);
          setLastUpdated(new Date());
          
          // Update history
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
            const newHistory = [...prev, newPoint];
            return newHistory.slice(-30); // Keep last 30 points
          });

        }
      } catch (e) {
        addLog(`JSON Parse Error: ${(e as Error).message}`, 'error');
      }
    });

    mqttClient.on('error', (err) => {
      setConnectionStatus('error');
      addLog(`Connection error: ${err.message}`, 'error');
      mqttClient.end();
    });

    mqttClient.on('close', () => {
      if (connectionStatus === 'connected') {
        setConnectionStatus('disconnected');
        addLog('Connection closed', 'info');
      }
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) {
        mqttClient.end();
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
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#e2e8f0' : '#1e293b',
        bodyColor: darkMode ? '#e2e8f0' : '#1e293b',
        borderColor: darkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b',
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
  }), [darkMode]);

  const createChartData = (label: string, dataKey: keyof HistoryPoint, color: string, bgColor: string) => ({
    labels: history.map(h => h.time),
    datasets: [
      {
        label,
        data: history.map(h => h[dataKey]),
        borderColor: color,
        backgroundColor: bgColor,
        fill: true,
      },
    ],
  });

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
          decimals: 1
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
    const gridCols = zenSensors.length === 1 ? 'grid-cols-1' :
                     zenSensors.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                     zenSensors.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     zenSensors.length === 4 ? 'grid-cols-2' :
                     'grid-cols-2 md:grid-cols-3';

    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
        <div className="absolute top-6 right-6 z-50 flex gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setZenMode(false)}
            className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
          >
            <Minimize className="w-6 h-6" />
          </button>
        </div>
        
        <div className={`flex-1 grid ${gridCols} gap-1 p-1`}>
          {zenSensors.map(key => {
            const config = getSensorConfig(key);
            if (!config) return null;
            return (
              <div key={key} className={`flex flex-col items-center justify-center p-8 rounded-3xl ${config.status.bg} bg-opacity-20 dark:bg-opacity-10 m-2 transition-all duration-500`}>
                <div className="flex items-center gap-4 mb-4 opacity-70">
                  <div className={`w-8 h-8 ${config.status.color}`}>{config.icon}</div>
                  <span className="text-xl font-bold uppercase tracking-widest">{config.title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-bold font-mono tracking-tighter ${config.status.color} ${zenSensors.length <= 2 ? 'text-8xl md:text-[12rem] leading-none' : zenSensors.length <= 4 ? 'text-6xl md:text-[8rem] leading-none' : 'text-5xl md:text-8xl'}`}>
                    {config.value !== undefined ? config.value.toFixed(config.decimals) : '--'}
                  </span>
                  <span className={`text-4xl font-medium opacity-60 ${config.status.color}`}>{config.unit}</span>
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

              {/* Dark Mode */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <SensorCard 
            title="CO₂" 
            value={sensorData?.co2?.value} 
            unit="ppm" 
            icon={<CloudFog className="w-6 h-6" />}
            status={getCO2Status(sensorData?.co2?.value || 0)}
            chartData={createChartData('CO₂', 'co2', '#10b981', 'rgba(16, 185, 129, 0.1)')}
            options={chartOptions}
            inversePolarity={true}
          />

          <SensorCard 
            title="PM2.5" 
            value={sensorData?.pm25?.value} 
            unit="µg/m³" 
            icon={<Wind className="w-6 h-6" />}
            status={getPM25Status(sensorData?.pm25?.value || 0)}
            chartData={createChartData('PM2.5', 'pm25', '#6366f1', 'rgba(99, 102, 241, 0.1)')}
            options={chartOptions}
            inversePolarity={true}
          />

          <SensorCard 
            title="Temperature" 
            value={sensorData?.temperature?.value} 
            unit="°C" 
            icon={<Thermometer className="w-6 h-6" />}
            status={getTempStatus(sensorData?.temperature?.value || 0)}
            chartData={createChartData('Temp', 'temperature', '#f97316', 'rgba(249, 115, 22, 0.1)')}
            options={chartOptions}
            decimals={1}
          />

          <SensorCard 
            title="Humidity" 
            value={sensorData?.humidity?.value} 
            unit="%" 
            icon={<Droplets className="w-6 h-6" />}
            status={getHumidityStatus(sensorData?.humidity?.value || 0)}
            chartData={createChartData('Humidity', 'humidity', '#3b82f6', 'rgba(59, 130, 246, 0.1)')}
            options={chartOptions}
            decimals={1}
          />

          <SensorCard 
            title="TVOC" 
            value={sensorData?.tvoc?.value} 
            unit="ppb" 
            icon={<Activity className="w-6 h-6" />}
            status={getTVOCStatus(sensorData?.tvoc?.value || 0)}
            chartData={createChartData('TVOC', 'tvoc', '#a855f7', 'rgba(168, 85, 247, 0.1)')}
            options={chartOptions}
            inversePolarity={true}
          />

          <SensorCard 
            title="Thermal Comfort (PMV)" 
            value={calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0).pmv} 
            unit="" 
            icon={<Activity className="w-6 h-6" />}
            status={{
              ...calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0),
              label: calculatePMV(sensorData?.temperature?.value || 0, sensorData?.humidity?.value || 0).status
            }}
            chartData={createChartData('PMV', 'pmv', '#8b5cf6', 'rgba(139, 92, 246, 0.1)')}
            options={chartOptions}
            decimals={1}
          />

          <SensorCard 
            title="Battery" 
            value={sensorData?.battery?.value} 
            unit="%" 
            icon={<Battery className="w-6 h-6" />}
            status={{ color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-400/10', label: 'Normal' }}
            chartData={createChartData('Battery', 'battery', '#22c55e', 'rgba(34, 197, 94, 0.1)')}
            options={chartOptions}
            inversePolarity={false}
          />

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
function SensorCard({ title, value, unit, icon, status, chartData, options, decimals = 0, inversePolarity = false, showChart = true }: any) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (prevValueRef.current !== null && prevValueRef.current !== value) {
        const diff = value - prevValueRef.current;
        setDelta(diff);
        
        if (diff > 0) {
          setFlash(inversePolarity ? 'bad' : 'good');
        } else {
          setFlash(inversePolarity ? 'good' : 'bad');
        }

        const timer = setTimeout(() => setFlash(null), 800);
        return () => clearTimeout(timer);
      }
      prevValueRef.current = value;
    }
  }, [value, inversePolarity]);

  // Subtle flash classes (background tint)
  const flashClass = flash === 'good' 
    ? 'bg-emerald-500/5 dark:bg-emerald-500/10' 
    : flash === 'bad' 
      ? 'bg-red-500/5 dark:bg-red-500/10' 
      : 'bg-white dark:bg-slate-900';

  return (
    <div className={`p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500 ${flashClass}`}>
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3.5 rounded-2xl ${status.bg}`}>
          <div className={status.color}>{icon}</div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{title}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
      
      <div className="flex items-end gap-3 mb-6 h-12">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-5xl font-bold font-mono tracking-tight ${status.color}`}>
            {value !== undefined ? value.toFixed(decimals) : '--'}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{unit}</span>
          
          {/* Delta Indicator */}
          {delta !== null && delta !== 0 && (
            <div className={`ml-2 flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${delta > 0 ? (inversePolarity ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10') : (inversePolarity ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10')}`}>
              {delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(delta).toFixed(decimals === 0 ? 0 : decimals)}
            </div>
          )}
        </div>
      </div>

      {showChart && (
        <div className="h-24 w-full -mx-2">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
