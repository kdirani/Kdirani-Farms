'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getUpcomingAlertsForUser, markAlertAsAdministered, type UpcomingAlert } from '@/actions/medication-alerts.actions';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface MedicationAlertsCardProps {
  userId: string;
}

export function MedicationAlertsCard({ userId }: MedicationAlertsCardProps) {
  const [alerts, setAlerts] = useState<UpcomingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<UpcomingAlert | null>(null);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = async () => {
    setLoading(true);
    const result = await getUpcomingAlertsForUser(userId, 10);
    if (result.success && result.data) {
      setAlerts(result.data);
    } else if (result.error) {
      toast.error('فشل في تحميل التنبيهات');
    }
    setLoading(false);
  };

  const handleMarkAsAdministered = async (alert: UpcomingAlert) => {
    setSelectedAlert(alert);
    setNotes('');
    setDialogOpen(true);
  };

  const confirmMarkAsAdministered = async () => {
    if (!selectedAlert) return;
    
    setMarkingId(selectedAlert.alert_id);
    const result = await markAlertAsAdministered(selectedAlert.alert_id, notes || undefined);
    
    if (result.success) {
      toast.success('تم تحديث حالة التنبيه بنجاح');
      setDialogOpen(false);
      setSelectedAlert(null);
      setNotes('');
      loadAlerts(); // إعادة تحميل التنبيهات
    } else {
      toast.error(result.error || 'فشل في تحديث التنبيه');
    }
    
    setMarkingId(null);
  };

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

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            لا توجد تنبيهات قادمة
          </CardTitle>
          <CardDescription className="text-green-700">
            جميع الأدوية محدثة! لا توجد تنبيهات قادمة في الوقت الحالي.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const overdueCount = alerts.filter(a => a.priority === 'متأخر').length;
  const todayCount = alerts.filter(a => a.priority === 'اليوم').length;

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Bell className="h-5 w-5" />
            تنبيهات الأدوية ({alerts.length})
            {overdueCount > 0 && (
              <Badge variant="destructive" className="mr-2">
                🚨 {overdueCount} متأخر
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-orange-700">
            {overdueCount > 0 
              ? `لديك ${overdueCount} تنبيه${overdueCount > 1 ? 'ات' : ''} متأخر${overdueCount > 1 ? 'ة' : ''}`
              : todayCount > 0 
                ? `لديك ${todayCount} تنبيه${todayCount > 1 ? 'ات' : ''} لليوم`
                : 'التنبيهات القادمة لأدوية القطيع'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`p-4 rounded-lg border-l-4 transition-all ${getPriorityColor(alert.priority)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getPriorityBadge(alert.priority) as any}>
                      {alert.priority === 'متأخر' && '🚨'} {alert.priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {alert.farm_name}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-lg">💊 {alert.medicine_name}</h4>
                  
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
                </div>
                
                <Button
                  size="sm"
                  variant={alert.priority === 'متأخر' ? 'default' : 'outline'}
                  onClick={() => handleMarkAsAdministered(alert)}
                  disabled={markingId === alert.alert_id}
                  className="shrink-0"
                >
                  {markingId === alert.alert_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                      تم الإعطاء
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 ml-2" />
              )}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
