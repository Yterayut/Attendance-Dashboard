import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Users } from 'lucide-react';

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
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800/40 dark:to-emerald-700/40',
      icon: CheckCircle,
      borderColor: 'border-emerald-200 dark:border-emerald-700/30',
      shadowColor: 'hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20',
    },
    {
      title: 'ลาป่วย/ลากิจ',
      value: summary.leave,
      total: summary.total,
      color: 'text-rose-700 dark:text-rose-300',
      bgColor: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
      iconBg: 'bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-800/40 dark:to-rose-700/40',
      icon: XCircle,
      borderColor: 'border-rose-200 dark:border-rose-700/30',
      shadowColor: 'hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20',
    },
    {
      title: 'ไม่รายงาน',
      value: summary.notReported,
      total: summary.total,
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800/40 dark:to-amber-700/40',
      icon: AlertTriangle,
      borderColor: 'border-amber-200 dark:border-amber-700/30',
      shadowColor: 'hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg border-0 rounded-3xl">
            <CardContent className="p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-transparent animate-pulse"></div>
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex items-baseline gap-3">
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-12 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-16 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => {
        const percentage = summary.total > 0 ? Math.round((card.value / summary.total) * 100) : 0;
        const Icon = card.icon;
        
        return (
          <Card 
            key={card.title} 
            className={`${card.bgColor} shadow-lg border-0 rounded-3xl hover:shadow-xl ${card.shadowColor} transition-all duration-300 hover:scale-105 ${card.borderColor} border border-opacity-20 backdrop-blur-sm`}
          >
            <CardContent className="p-8 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-current to-transparent"></div>
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{card.title}</p>
                  </div>
                  
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl font-bold ${card.color} leading-none`}>
                      {card.value}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                      /{summary.total}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      className={`${card.iconBg} ${card.color} border-0 text-sm font-semibold px-3 py-1 rounded-full shadow-sm`}
                    >
                      {percentage}%
                    </Badge>
                    {percentage > 0 && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 font-medium">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {card.title === 'เข้างาน' ? 'เป้าหมายดี' : card.title === 'ลาป่วย/ลากิจ' ? 'อยู่ในเกณฑ์' : 'ต้องติดตาม'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`p-4 ${card.iconBg} rounded-2xl shadow-lg backdrop-blur-sm border border-white/20`}>
                  <Icon className={`h-8 w-8 ${card.color} drop-shadow-sm`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}