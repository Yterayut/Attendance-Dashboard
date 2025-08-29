import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Calendar, Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';

interface DaySummary {
  date: string;
  team: string;
  present: number;
  leave: number;
  notReported: number;
}

interface MonthlyDaysTableProps {
  data: DaySummary[];
  isLoading: boolean;
}

export function MonthlyDaysTable({ data, isLoading }: MonthlyDaysTableProps) {
  const formatThaiDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  const getStatusText = (present: number, leave: number, notReported: number) => {
    const parts = [];
    if (present > 0) parts.push(`${present} เข้างาน`);
    if (leave > 0) parts.push(`${leave} ลา`);
    if (notReported > 0) parts.push(`${notReported} ไม่ระบุงาน`);
    return parts.join(' ');
  };

  const totalSummary = useMemo(() => {
    return data.reduce((acc, day) => ({
      present: acc.present + day.present,
      leave: acc.leave + day.leave,
      notReported: acc.notReported + day.notReported,
      total: acc.total + day.present + day.leave + day.notReported
    }), { present: 0, leave: 0, notReported: 0, total: 0 });
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-md shadow-xl border-0 rounded-3xl border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/30 rounded-2xl">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-md shadow-xl border-0 rounded-3xl border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            ข้อมูลรายวัน (รายเดือน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-500 mb-2 text-lg font-medium">ไม่มีข้อมูลการเข้างาน</h3>
            <p className="text-sm text-slate-400">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-md shadow-xl border-0 rounded-3xl border border-white/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
          <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
            <Calendar className="h-5 w-5 text-emerald-600" />
          </div>
          ข้อมูลรายวัน (รายเดือน) - {data.length} วัน
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-slate-50/50 rounded-2xl mb-4 border border-slate-100">
          <div className="font-semibold text-slate-700">วันที่</div>
          <div className="font-semibold text-slate-700 text-center">เข้างาน</div>
          <div className="font-semibold text-slate-700 text-center">ลา</div>
          <div className="font-semibold text-slate-700 text-center">ไม่ระบุงาน</div>
          <div className="font-semibold text-slate-700 text-center">รวม</div>
          <div className="font-semibold text-slate-700">สถานะ</div>
        </div>

        {/* Data Rows */}
        <div className="space-y-3">
          {data.map((day, index) => {
            const total = day.present + day.leave + day.notReported;
            return (
              <div key={index} className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 p-4 hover:bg-white/60 transition-all duration-200">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-800">
                      {formatThaiDate(day.date)}
                    </div>
                    <Badge variant="outline" className="bg-white/50">
                      รวม {total} คน
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-2 bg-green-50/80 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UserCheck className="h-3 w-3 text-green-600" />
                        <span className="text-green-800 font-medium">เข้างาน</span>
                      </div>
                      <div className="text-green-700 font-bold text-lg">{day.present}</div>
                    </div>
                    
                    <div className="text-center p-2 bg-red-50/80 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UserX className="h-3 w-3 text-red-600" />
                        <span className="text-red-800 font-medium">ลา</span>
                      </div>
                      <div className="text-red-700 font-bold text-lg">{day.leave}</div>
                    </div>
                    
                    <div className="text-center p-2 bg-yellow-50/80 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">ไม่ระบุงาน</span>
                      </div>
                      <div className="text-yellow-700 font-bold text-lg">{day.notReported}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 bg-slate-50/50 rounded-lg p-2">
                    {getStatusText(day.present, day.leave, day.notReported)}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
                  <div className="font-medium text-slate-800">
                    {formatThaiDate(day.date)}
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700">{day.present}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UserX className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-700">{day.leave}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-700">{day.notReported}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="outline" className="bg-white/50">
                      {total}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-slate-600">
                    {getStatusText(day.present, day.leave, day.notReported)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        {data.length > 1 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
            <div className="text-center">
              <div className="text-sm text-emerald-700 mb-2 font-medium">สรุปรวม {data.length} วัน</div>
              <div className="flex justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-700">เข้างาน: {totalSummary.present}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserX className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700">ลา: {totalSummary.leave}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">ไม่ระบุงาน: {totalSummary.notReported}</span>
                </div>
                <div className="font-bold text-slate-700">รวม: {totalSummary.total}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}