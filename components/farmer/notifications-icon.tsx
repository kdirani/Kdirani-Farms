'use client';

import { useEffect, useState } from 'react';
import { Bell, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUpcomingAlertsForUser, markAlertAsAdministered, type UpcomingAlert } from '@/actions/medication-alerts.actions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface NotificationsIconProps {
  userId: string;
}

export function NotificationsIcon({ userId }: NotificationsIconProps) {
  const [alerts, setAlerts] = useState<UpcomingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = async () => {
    setLoading(true);
    const result = await getUpcomingAlertsForUser(userId, 5); // أول 5 تنبيهات فقط
    if (result.success && result.data) {
      setAlerts(result.data);
    } else if (result.error) {
      console.error('خطأ في تحميل التنبيهات:', result.error);
    }
    setLoading(false);
  };

  const handleMarkAsAdministered = async (alert: UpcomingAlert) => {
    setMarkingId(alert.alert_id);
    const result = await markAlertAsAdministered(alert.alert_id, 'تم الإعطاء من الهيدر');
    
    if (result.success) {
      toast.success('تم تحديث حالة التنبيه بنجاح');
      loadAlerts(); // إعادة تحميل التنبيهات
    } else {
      toast.error(result.error || 'فشل في تحديث التنبيه');
    }
    
    setMarkingId(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'متأخر':
        return 'text-red-600';
      case 'اليوم':
        return 'text-orange-600';
      case 'غداً':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'متأخر':
        return 'destructive';
      case 'اليوم':
        return 'default';
      case 'غداً':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // حساب عدد التنبيهات العاجلة
  const urgentCount = alerts.filter(alert => alert.priority === 'متأخر' || alert.priority === 'اليوم').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {urgentCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -left-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {urgentCount}
            </Badge>
          )}
          <span className="sr-only">التنبيهات</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 [direction:rtl]">
        <DropdownMenuLabel className="flex items-center gap-2 text-right">
          <Bell className="h-4 w-4" />
          تنبيهات الأدوية
          {alerts.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {alerts.length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2 w-full">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              جاري التحميل...
            </div>
          </DropdownMenuItem>
        ) : alerts.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              لا توجد تنبيهات
            </div>
          </DropdownMenuItem>
        ) : (
          alerts.map((alert) => (
            <div key={alert.alert_id} className="p-2">
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-row-reverse justify-end">
                    <Badge variant={getPriorityBadge(alert.priority) as any} className="text-xs">
                      {alert.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.farm_name}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-sm mb-1 text-right">💊 {alert.medicine_name}</h4>
                  
                  <p className="text-xs text-muted-foreground mb-2 text-right">
                    📅 {formatDate(new Date(alert.scheduled_date))}
                    {alert.days_until !== 0 && (
                      <span className="ml-2">
                        {alert.days_until > 0 
                          ? `(بعد ${alert.days_until} يوم)` 
                          : `(متأخر ${Math.abs(alert.days_until)} يوم)`}
                      </span>
                    )}
                  </p>
                  
                  <Button
                    size="sm"
                    variant={alert.priority === 'متأخر' ? 'default' : 'outline'}
                    onClick={() => handleMarkAsAdministered(alert)}
                    disabled={markingId === alert.alert_id}
                    className="w-full text-xs"
                  >
                    {markingId === alert.alert_id ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                        جاري التحديث...
                      </div>
                    ) : (
                      'تم الإعطاء ✓'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        
        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a 
                href="/farmer" 
                className="flex items-center gap-2 cursor-pointer text-center justify-center"
              >
                عرض جميع التنبيهات
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
