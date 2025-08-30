import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  BellDot, 
  Clock,
  Users,
  TrendingUp,
  Activity,
  X,
  CheckCircle
} from 'lucide-react';
import { useRealTime } from '../hooks/useRealTime';

interface RealTimeStatusProps {
  onRefreshData: () => void;
  currentSummary: {
    present: number;
    leave: number;
    notReported: number;
    total: number;
  } | null;
}

export function RealTimeStatus({ onRefreshData, currentSummary }: RealTimeStatusProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const {
    realTimeData,
    notifications,
    unreadCount,
    startAutoRefresh,
    stopAutoRefresh,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission,
    addNotification // For demo purposes
  } = useRealTime({
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableNotifications: true,
    enableWebSocket: false // Can be enabled when backend supports WebSocket
  });

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  // Auto-refresh toggle
  const toggleAutoRefresh = () => {
    if (autoRefreshEnabled) {
      stopAutoRefresh();
      setAutoRefreshEnabled(false);
    } else {
      startAutoRefresh(() => {
        onRefreshData();
        // Simulate random attendance updates for demo
        if (Math.random() > 0.7) {
          const employees = ['เจ', 'กอล์ฟ', 'ปอง', 'เจ้าสัว', 'ปริม'];
          const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
          const actions = ['เข้างาน', 'ออกงาน'];
          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          
          addNotification({
            id: Date.now().toString(),
            type: randomAction === 'เข้างาน' ? 'attendance_in' : 'attendance_out',
            message: `${randomEmployee} ${randomAction} เวลา ${new Date().toLocaleTimeString('th-TH')}`,
            employee: randomEmployee,
            timestamp: new Date(),
            read: false
          });
        }
      });
      setAutoRefreshEnabled(true);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  const getStatusColor = () => {
    if (!realTimeData.isOnline) return 'bg-gray-500';
    switch (realTimeData.connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'reconnecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <>
      {/* Real-time Status Bar */}
      <Card className="bg-white/80 backdrop-blur-md shadow-lg border-0 rounded-2xl mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {realTimeData.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {realTimeData.isOnline ? 'เชื่อมต่อ' : 'ไม่มีเชื่อมต่อ'}
                </span>
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>อัพเดทล่าสุด: {formatLastUpdated(realTimeData.lastUpdated)}</span>
              </div>

              {/* Real-time Counter */}
              {currentSummary && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">
                      {currentSummary.present} คน
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-500">
                      {currentSummary.total > 0 ? Math.round((currentSummary.present / currentSummary.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-refresh Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRefresh}
                className={autoRefreshEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white/50'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
                {autoRefreshEnabled ? 'กำลังอัพเดท' : 'เริ่มอัพเดท'}
              </Button>

              {/* Manual Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshData}
                disabled={autoRefreshEnabled}
                className="bg-white/50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="relative bg-white/50">
                    {unreadCount > 0 ? (
                      <BellDot className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        การแจ้งเตือน
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            {unreadCount} ใหม่
                          </Badge>
                        )}
                      </DialogTitle>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            อ่านทั้งหมด
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={clearNotifications}>
                          <X className="h-3 w-3 mr-1" />
                          ล้าง
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-3 py-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>ไม่มีการแจ้งเตือน</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.read
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {notification.type === 'attendance_in' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                              )}
                              {notification.type === 'attendance_out' && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                              )}
                              {notification.type === 'leave_request' && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.timestamp.toLocaleString('th-TH')}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}