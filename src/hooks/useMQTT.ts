import { useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import throttle from 'lodash.throttle';
import toast from 'react-hot-toast';
import { useDashboardStore } from '../store/useDashboardStore';
import { BROKER_URL, TOPIC } from '../config';
import { calculatePMV } from '../pmv';
import { HistoryPoint } from '../types';

export const useMQTT = () => {
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const throttledUpdateRef = useRef<any>(null);
  const lastAlertsRef = useRef<Record<string, string>>({});
  const samplingInterval = useDashboardStore(state => state.samplingInterval);

  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("此浏览器不支持 Notification API");
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Create a stable throttled function that always uses the latest state
    throttledUpdateRef.current = throttle((current: any) => {
      const state = useDashboardStore.getState();
      const { offsets, thresholds, setSensorData, setLastUpdated, addAlert, addHistoryPoint } = state;

      // Apply offsets
      const calibratedData = {
        ...current,
        temperature: current.temperature ? { ...current.temperature, value: current.temperature.value + offsets.temperature } : undefined,
        humidity: current.humidity ? { ...current.humidity, value: current.humidity.value + offsets.humidity } : undefined,
        co2: current.co2 ? { ...current.co2, value: current.co2.value + offsets.co2 } : undefined,
        pm25: current.pm25 ? { ...current.pm25, value: current.pm25.value + offsets.pm25 } : undefined,
      };

      setSensorData(calibratedData);
      if (setLastUpdated) setLastUpdated(new Date());
      
      // Threshold Alerts Logic
      const checkThreshold = (val: number, t: { warning: number; critical: number; emergency: number }, type: string, inverted = false) => {
        let currentLevel = 'normal';
        if (inverted) {
          if (val <= t.emergency) currentLevel = 'emergency';
          else if (val <= t.critical) currentLevel = 'critical';
          else if (val <= t.warning) currentLevel = 'warning';
        } else {
          if (val >= t.emergency) currentLevel = 'emergency';
          else if (val >= t.critical) currentLevel = 'critical';
          else if (val >= t.warning) currentLevel = 'warning';
        }

        if (currentLevel !== 'normal' && lastAlertsRef.current[type] !== currentLevel) {
          lastAlertsRef.current[type] = currentLevel;
          const message = `${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}: ${type.toUpperCase()} ${currentLevel === 'emergency' ? `at ${val}!` : currentLevel === 'critical' ? `Critical (${val})` : `Warning (${val})`}`;
          
          addAlert({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level: currentLevel as any,
            message,
            type
          });
          
          if (currentLevel === 'emergency') {
            toast.error(message, { id: `alert-${type}-emergency` });
          } else if (currentLevel === 'critical') {
            toast.error(message, { id: `alert-${type}-critical` });
          } else {
            toast(message, { icon: '⚠️', id: `alert-${type}-warning` });
          }
          
          if ('Notification' in window && Notification.permission === 'granted') {
             new Notification(currentLevel.toUpperCase(), { body: message });
          }
        } else if (currentLevel === 'normal') {
          lastAlertsRef.current[type] = 'normal';
        }
      };

      if (calibratedData.co2) checkThreshold(calibratedData.co2.value, thresholds.co2 || { warning: 1000, critical: 1500, emergency: 2500 }, 'co2');
      if (calibratedData.pm25) checkThreshold(calibratedData.pm25.value, thresholds.pm25 || { warning: 35, critical: 75, emergency: 150 }, 'pm25');
      if (calibratedData.tvoc) checkThreshold(calibratedData.tvoc.value, thresholds.tvoc || { warning: 300, critical: 600, emergency: 1000 }, 'tvoc');
      if (calibratedData.temperature) checkThreshold(calibratedData.temperature.value, thresholds.temperature || { warning: 30, critical: 35, emergency: 40 }, 'temperature');
      if (calibratedData.humidity) checkThreshold(calibratedData.humidity.value, thresholds.humidity || { warning: 70, critical: 80, emergency: 90 }, 'humidity');
      if (calibratedData.battery) checkThreshold(calibratedData.battery.value, thresholds.battery || { warning: 20, critical: 10, emergency: 5 }, 'battery', true);

      const pmvData = calculatePMV(calibratedData.temperature?.value || 0, calibratedData.humidity?.value || 0);
      const newPoint: HistoryPoint = {
        time: new Date().toLocaleTimeString(),
        co2: calibratedData.co2?.value || 0,
        pm25: calibratedData.pm25?.value || 0,
        temperature: calibratedData.temperature?.value || 0,
        humidity: calibratedData.humidity?.value || 0,
        tvoc: calibratedData.tvoc?.value || 0,
        battery: calibratedData.battery?.value || 0,
        pmv: pmvData.pmv
      };
      addHistoryPoint(newPoint);
    }, samplingInterval * 1000);
  }, [samplingInterval]);

  useEffect(() => {
    if (clientRef.current) return;

    const { setConnectionStatus, addLog } = useDashboardStore.getState();

    addLog(`Connecting to ${BROKER_URL}...`, 'info');
    setConnectionStatus('connecting');

    const mqttClient = mqtt.connect(BROKER_URL, {
      clientId: `mqtt_dashboard_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
      keepalive: 60,
      resubscribe: true,
    });

    mqttClient.on('connect', () => {
      useDashboardStore.getState().setConnectionStatus('connected');
      useDashboardStore.getState().addLog('Connected to MQTT Broker', 'success');
      mqttClient.subscribe(TOPIC, (err) => {
        if (!err) {
          useDashboardStore.getState().addLog(`Subscribed to topic: ${TOPIC}`, 'success');
        } else {
          useDashboardStore.getState().addLog(`Subscription error: ${err.message}`, 'error');
        }
      });
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = message.toString();
        const data = JSON.parse(payload);
        if (data.type === '12' && data.sensorData && Array.isArray(data.sensorData) && data.sensorData.length > 0) {
          if (throttledUpdateRef.current) {
            throttledUpdateRef.current(data.sensorData[0]);
          }
        }
      } catch (e) {
        useDashboardStore.getState().addLog(`JSON Parse Error: ${(e as Error).message}`, 'error');
      }
    });

    mqttClient.on('error', (err) => {
      useDashboardStore.getState().setConnectionStatus('error');
      useDashboardStore.getState().addLog(`Connection error: ${err.message}`, 'error');
    });

    mqttClient.on('offline', () => {
      useDashboardStore.getState().setConnectionStatus('disconnected');
      useDashboardStore.getState().addLog('Client offline', 'error');
    });

    mqttClient.on('reconnect', () => {
      useDashboardStore.getState().setConnectionStatus('connecting');
      useDashboardStore.getState().addLog('Reconnecting...', 'info');
    });

    clientRef.current = mqttClient;

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, []);
};
