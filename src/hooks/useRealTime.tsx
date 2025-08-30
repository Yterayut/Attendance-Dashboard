import { useState, useEffect, useRef } from 'react';

interface RealTimeConfig {
  refreshInterval: number; // in milliseconds
  enableNotifications: boolean;
  enableWebSocket: boolean;
  websocketUrl?: string;
}

interface RealTimeData {
  lastUpdated: Date;
  isOnline: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface NotificationData {
  id: string;
  type: 'attendance_in' | 'attendance_out' | 'leave_request' | 'system';
  message: string;
  employee?: string;
  timestamp: Date;
  read: boolean;
}

export function useRealTime(config: RealTimeConfig = {
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  enableNotifications: true,
  enableWebSocket: false
}) {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    lastUpdated: new Date(),
    isOnline: navigator.onLine,
    connectionStatus: 'disconnected'
  });

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Auto-refresh data functionality
  const startAutoRefresh = (callback: () => void) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (realTimeData.isOnline) {
        callback();
        setRealTimeData(prev => ({
          ...prev,
          lastUpdated: new Date()
        }));
      }
    }, config.refreshInterval);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // WebSocket functionality
  const connectWebSocket = () => {
    if (!config.enableWebSocket || !config.websocketUrl) return;

    try {
      websocketRef.current = new WebSocket(config.websocketUrl);

      websocketRef.current.onopen = () => {
        setRealTimeData(prev => ({
          ...prev,
          connectionStatus: 'connected'
        }));
        console.log('WebSocket connected');
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocketRef.current.onclose = () => {
        setRealTimeData(prev => ({
          ...prev,
          connectionStatus: 'disconnected'
        }));
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (config.enableWebSocket) {
            setRealTimeData(prev => ({
              ...prev,
              connectionStatus: 'reconnecting'
            }));
            connectWebSocket();
          }
        }, 5000);
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setRealTimeData(prev => ({
          ...prev,
          connectionStatus: 'disconnected'
        }));
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'attendance_update') {
      // Handle attendance updates
      addNotification({
        id: Date.now().toString(),
        type: data.action === 'check_in' ? 'attendance_in' : 'attendance_out',
        message: `${data.employee} ${data.action === 'check_in' ? 'เข้างาน' : 'ออกงาน'} เวลา ${new Date().toLocaleTimeString('th-TH')}`,
        employee: data.employee,
        timestamp: new Date(),
        read: false
      });
    } else if (data.type === 'leave_request') {
      addNotification({
        id: Date.now().toString(),
        type: 'leave_request',
        message: `${data.employee} ส่งคำขอลา: ${data.reason}`,
        employee: data.employee,
        timestamp: new Date(),
        read: false
      });
    }
  };

  // Notification management
  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only latest 50
    setUnreadCount(prev => prev + 1);

    // Browser notification if enabled
    if (config.enableNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('ระบบเข้างาน - อัพเดท', {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setRealTimeData(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setRealTimeData(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // WebSocket connection effect
  useEffect(() => {
    if (config.enableWebSocket) {
      connectWebSocket();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [config.enableWebSocket, config.websocketUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return {
    realTimeData,
    notifications,
    unreadCount,
    startAutoRefresh,
    stopAutoRefresh,
    connectWebSocket,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission,
    addNotification // For testing purposes
  };
}