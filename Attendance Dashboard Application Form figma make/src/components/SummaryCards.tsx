import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  summary: {
    present: number;
    leave: number;
    notReported: number;
    total: number;
  };
  isLoading: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const cards = [
    {
      title: 'เข้างาน',
      value: summary.present,
      total: summary.total,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: CheckCircle,
      borderColor: 'border-green-100',
    },
    {
      title: 'ลาป่วย/ลากิจ',
      value: summary.leave,
      total: summary.total,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: XCircle,
      borderColor: 'border-red-100',
    },
    {
      title: 'ไม่รายงาน',
      value: summary.notReported,
      total: summary.total,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: AlertCircle,
      borderColor: 'border-yellow-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white shadow-sm border-0 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const percentage = summary.total > 0 ? Math.round((card.value / summary.total) * 100) : 0;
        const Icon = card.icon;
        
        return (
          <Card 
            key={card.title} 
            className={`bg-white shadow-sm border-0 rounded-2xl hover:shadow-md transition-shadow duration-200 ${card.borderColor} border-l-4`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl ${card.color}`}>
                      {card.value}
                    </span>
                    <span className="text-sm text-gray-500">
                      /{summary.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${card.bgColor} ${card.color} border-0 text-xs`}
                    >
                      {percentage}%
                    </Badge>
                    {percentage > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {card.title === 'เข้างาน' ? 'ดี' : card.title === 'ลาป่วย/ลากิจ' ? 'ปกติ' : 'ต้องติดตาม'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`p-3 ${card.bgColor} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}