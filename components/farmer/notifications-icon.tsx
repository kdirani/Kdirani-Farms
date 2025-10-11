'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getUpcomingAlertsForUser, markAlertAsAdministered, type UpcomingAlert } from '@/actions/medication-alerts.actions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface NotificationsIconProps {
  userId: string;
}

// Pure functions خارج المكون لتجنب إعادة إنشائها
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'متأخر':
      return 'bg-red-50 border-red-500';
    case 'اليوم':
      return 'bg-orange-50 border-orange-500';
    case 'غداً':
      return 'bg-yellow-50 border-yellow-500';
    default:
      return 'bg-blue-50 border-blue-500';
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

export function NotificationsIcon({ userId }: NotificationsIconProps) {
  const [alerts, setAlerts] = useState<UpcomingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<UpcomingAlert | null>(null);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // استخدام useCallback لتجنب إعادة إنشاء الدالة
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    const result = await getUpcomingAlertsForUser(userId, 20);
    if (result.success && result.data) {
      setAlerts(result.data);
    } else if (result.error) {
      console.error('خطأ في تحميل التنبيهات:', result.error);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkAsAdministered = useCallback((alert: UpcomingAlert) => {
    setSelectedAlert(alert);
    setNotes('');
    setDialogOpen(true);
  }, []);

  const confirmMarkAsAdministered = useCallback(async () => {
    if (!selectedAlert) return;
    
    setMarkingId(selectedAlert.alert_id);
    const result = await markAlertAsAdministered(selectedAlert.alert_id, notes || undefined);
    
    if (result.success) {
      toast.success('تم تحديث حالة التنبيه بنجاح');
      setDialogOpen(false);
      setSelectedAlert(null);
      setNotes('');
      loadAlerts();
    } else {
      toast.error(result.error || 'فشل في تحديث التنبيه');
    }
    
    setMarkingId(null);
  }, [selectedAlert, notes, loadAlerts]);

  // استخدام useMemo للقيم المحسوبة لتجنب إعادة الحساب
  const urgentCount = useMemo(() => 
    alerts.filter(alert => alert.priority === 'متأخر' || alert.priority === 'اليوم').length,
    [alerts]
  );
  
  const overdueCount = useMemo(() => 
    alerts.filter(a => a.priority === 'متأخر').length,
    [alerts]
  );
  
  const todayCount = useMemo(() => 
    alerts.filter(a => a.priority === 'اليوم').length,
    [alerts]
  );

  return (
    <>
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
      <DropdownMenuContent align="start" className="w-96 [direction:rtl]">
        <DropdownMenuLabel className="flex items-center gap-2 text-right">
          <Bell className="h-5 w-5" />
          تنبيهات الأدوية
          {alerts.length > 0 && (
            <>
              <Badge variant="outline" className="ml-auto">
                {alerts.length}
              </Badge>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="mr-1">
                  🚨 {overdueCount} متأخر
                </Badge>
              )}
            </>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[500px] overflow-y-auto">
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
                <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priority)}`}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getPriorityBadge(alert.priority) as any}>
                        {alert.priority === 'متأخر' && '🚨'} {alert.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {alert.farm_name}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-base">💊 {alert.medicine_name}</h4>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>📅 {new Date(alert.scheduled_date).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    
                    {alert.days_until !== 0 && (
                      <p className="text-sm font-medium">
                        {alert.days_until > 0 
                          ? `بعد ${alert.days_until} يوم` 
                          : `متأخر ${Math.abs(alert.days_until)} يوم`}
                      </p>
                    )}
                    
                    <Button
                      size="sm"
                      variant={alert.priority === 'متأخر' ? 'default' : 'outline'}
                      onClick={() => handleMarkAsAdministered(alert)}
                      disabled={markingId === alert.alert_id}
                      className="w-full"
                    >
                      {markingId === alert.alert_id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          جاري التحديث...
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 ml-2" />
                          تم الإعطاء
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-[450px] w-full">
        <DialogHeader>
          <DialogTitle>تأكيد إعطاء الدواء</DialogTitle>
          <DialogDescription>
            هل تم إعطاء الدواء للقطيع؟
          </DialogDescription>
        </DialogHeader>
        
        {selectedAlert && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">{selectedAlert.medicine_name}</h4>
              <p className="text-sm text-muted-foreground">
                المزرعة: {selectedAlert.farm_name}
              </p>
              <p className="text-sm text-muted-foreground">
                التاريخ المجدول: {new Date(selectedAlert.scheduled_date).toLocaleDateString('ar-EG')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات حول إعطاء الدواء..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={markingId !== null}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={confirmMarkAsAdministered}
            disabled={markingId !== null}
          >
            {markingId !== null ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                جاري التحديث...
              </div>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 ml-2" />
                تأكيد
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

