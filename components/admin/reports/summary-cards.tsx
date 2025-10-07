'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Egg, TrendingUp, Wheat, Trash2, Bird, BarChart3 } from 'lucide-react';

interface SummaryCardsProps {
  stats: {
    total_eggs_produced: number;
    total_eggs_sold: number;
    total_feed_consumed: number;
    total_droppings_sold: number;
    total_mortality: number;
    average_daily_production: number;
    total_reports: number;
  };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      title: 'إجمالي البيض المُنتَج',
      value: stats.total_eggs_produced.toLocaleString(),
      icon: Egg,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'إجمالي البيض المباع',
      value: stats.total_eggs_sold.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'إجمالي الأعلاف المستهلكة',
      value: `${stats.total_feed_consumed.toLocaleString()} كغم`,
      icon: Wheat,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'إجمالي السواد المباع',
      value: `${stats.total_droppings_sold.toLocaleString()} كغم`,
      icon: Trash2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'إجمالي الطيور النافقة',
      value: stats.total_mortality.toLocaleString(),
      icon: Bird,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'متوسط الإنتاج اليومي',
      value: stats.average_daily_production.toLocaleString(),
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                من {stats.total_reports} تقرير
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
