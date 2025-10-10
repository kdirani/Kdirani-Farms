'use client';

import { useState } from 'react';
import { AdminMedicationAlert, markAlertAsAdministered, unmarkAlertAsAdministered } from '@/actions/medication-alerts.actions';
import { Farm } from '@/actions/farm.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, CheckCircle, XCircle, Calendar, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MedicationAlertsTableProps {
  alerts: AdminMedicationAlert[];
  farms: Farm[];
}

export function MedicationAlertsTable({ alerts: initialAlerts, farms }: MedicationAlertsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredAlerts = initialAlerts.filter((alert) => {
    const matchesSearch = 
      alert.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.farm_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFarm = selectedFarm === 'all' || alert.farm_id === selectedFarm;
    
    return matchesSearch && matchesFarm;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('تم تحديث البيانات');
    }, 500);
  };

  const handleToggleAdministered = async (alertId: string, currentStatus: boolean) => {
    try {
      const result = currentStatus 
        ? await unmarkAlertAsAdministered(alertId)
        : await markAlertAsAdministered(alertId);

      if (result.success) {
        toast.success(currentStatus ? 'تم إلغاء تحديد الدواء' : 'تم تحديد الدواء كمُعطى');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل في تحديث الحالة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'متأخر':
        return <Badge variant="destructive">{priority}</Badge>;
      case 'اليوم':
        return <Badge className="bg-orange-500">{priority}</Badge>;
      case 'غداً':
        return <Badge className="bg-yellow-500">{priority}</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (isAdministered: boolean) => {
    return isAdministered ? (
      <Badge className="bg-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        تم الإعطاء
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="h-3 w-3 mr-1" />
        لم يتم
      </Badge>
    );
  };

  // إحصائيات سريعة
  const stats = {
    total: filteredAlerts.length,
    administered: filteredAlerts.filter(a => a.is_administered).length,
    pending: filteredAlerts.filter(a => !a.is_administered).length,
    overdue: filteredAlerts.filter(a => !a.is_administered && a.priority === 'متأخر').length,
  };

  return (
    <div className="space-y-4">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">إجمالي التنبيهات</div>
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium">تم الإعطاء</div>
          <div className="text-2xl font-bold text-green-700">{stats.administered}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600 font-medium">قيد الانتظار</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 font-medium">متأخر</div>
          <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
        </div>
      </div>

      {/* أدوات التصفية والبحث */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
          {/* حقل البحث */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="البحث عن دواء أو مزرعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* تصفية حسب المزرعة */}
          <div className="w-full md:w-64">
            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المزارع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المزارع</SelectItem>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* زر التحديث */}
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* الجدول */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المزرعة</TableHead>
              <TableHead>الدواء</TableHead>
              <TableHead className="text-center">اليوم المجدول</TableHead>
              <TableHead className="text-center">التاريخ المجدول</TableHead>
              <TableHead className="text-center">الأولوية</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">تاريخ الإعطاء</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  لم يتم العثور على تنبيهات
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.farm_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Pill className="h-4 w-4 mr-2 text-blue-600" />
                      {alert.medicine_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">اليوم {alert.scheduled_day}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center text-sm">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      {formatDate(new Date(alert.scheduled_date))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getPriorityBadge(alert.priority)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(alert.is_administered)}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {alert.administered_at 
                      ? formatDate(new Date(alert.administered_at))
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={alert.is_administered ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleAdministered(alert.id, alert.is_administered)}
                    >
                      {alert.is_administered ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          إلغاء
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          تأكيد الإعطاء
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ملاحظة في الأسفل */}
      {filteredAlerts.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          عرض {filteredAlerts.length} تنبيه من أصل {initialAlerts.length}
        </div>
      )}
    </div>
  );
}
