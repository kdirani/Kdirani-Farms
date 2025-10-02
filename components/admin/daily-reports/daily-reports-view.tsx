'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  Egg,
  Activity,
  TrendingUp,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyReport {
  id: string;
  warehouse_id: string;
  report_date: string;
  report_time: string;
  production_eggs_healthy: number;
  production_eggs_deformed: number;
  production_eggs: number;
  production_egg_rate: number;
  eggs_sold: number;
  eggs_gift: number;
  previous_eggs_balance: number;
  current_eggs_balance: number;
  carton_consumption: number;
  chicks_before: number;
  chicks_dead: number;
  chicks_after: number;
  feed_daily_kg: number;
  feed_monthly_kg: number;
  feed_ratio: number;
  production_droppings: number;
  notes: string | null;
  checked: boolean;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DailyReportsViewProps {
  reports: DailyReport[];
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  pagination?: Pagination;
}

export function DailyReportsView({ reports, warehouses, selectedWarehouseId, pagination }: DailyReportsViewProps) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleWarehouseChange = (warehouseId: string) => {
    router.push(`/admin/daily-reports?warehouse=${warehouseId}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/daily-reports?warehouse=${selectedWarehouseId}&page=${page}`);
  };

  const toggleExpand = (reportId: string) => {
    setExpandedRow(expandedRow === reportId ? null : reportId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedWarehouseId} onValueChange={handleWarehouseChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {pagination && (
          <div className="text-sm text-muted-foreground">
            Showing {reports.length} of {pagination.total} reports
          </div>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No daily reports found for this warehouse
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Egg Production</TableHead>
                  <TableHead className="text-right">Eggs Sold</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Chicks (B/D/A)</TableHead>
                  <TableHead className="text-right">Feed (kg)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <React.Fragment key={report.id}>
                    <TableRow>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {format(new Date(report.report_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {report.report_time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-semibold">{report.production_eggs.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {report.production_egg_rate}% rate
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {report.eggs_sold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {report.current_eggs_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs">
                          {report.chicks_before} / {report.chicks_dead} / {report.chicks_after}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {report.feed_daily_kg.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {report.checked ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Checked
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpand(report.id)}
                        >
                          {expandedRow === report.id ? 'Hide' : 'Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRow === report.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Egg className="h-4 w-4" />
                                  Egg Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Healthy:</span>
                                  <span className="font-medium">{report.production_eggs_healthy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Deformed:</span>
                                  <span className="font-medium">{report.production_eggs_deformed}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Gift:</span>
                                  <span className="font-medium">{report.eggs_gift}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Previous Balance:</span>
                                  <span className="font-medium">{report.previous_eggs_balance}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  Flock Status
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Before:</span>
                                  <span className="font-medium">{report.chicks_before}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Dead:</span>
                                  <span className="font-medium text-destructive">{report.chicks_dead}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">After:</span>
                                  <span className="font-medium">{report.chicks_after}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Mortality Rate:</span>
                                  <span className="font-medium">
                                    {report.chicks_before > 0 
                                      ? ((report.chicks_dead / report.chicks_before) * 100).toFixed(2) 
                                      : 0}%
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Feed Consumption
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Daily (kg):</span>
                                  <span className="font-medium">{report.feed_daily_kg}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Monthly (kg):</span>
                                  <span className="font-medium">{report.feed_monthly_kg}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Feed Ratio:</span>
                                  <span className="font-medium">{report.feed_ratio}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Other
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Carton Used:</span>
                                  <span className="font-medium">{report.carton_consumption}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Droppings (kg):</span>
                                  <span className="font-medium">{report.production_droppings}</span>
                                </div>
                                {report.notes && (
                                  <div className="pt-2">
                                    <span className="text-muted-foreground">Notes:</span>
                                    <p className="text-xs mt-1">{report.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
