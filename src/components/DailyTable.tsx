import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Calendar, Users } from 'lucide-react';

interface DailyTableProps {
  data: Array<{
    date: string;
    employee: string;
    status: 'present' | 'leave' | 'not_reported';
    checkIn?: string | null;
    checkOut?: string | null;
  }>;
  period: string;
  isLoading: boolean;
}

export function DailyTable({ data, period, isLoading }: DailyTableProps) {
  // Group data by date
  const dailyStats = useMemo(() => {
    const grouped = data.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          present: 0,
          leave: 0,
          notReported: 0,
          total: 0,
        };
      }
      
      acc[date][record.status === 'present' ? 'present' : 
                record.status === 'leave' ? 'leave' : 'notReported']++;
      acc[date].total++;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);

  const getStatusBadge = (status: string, count: number) => {
    const variants = {
      present: { color: 'bg-green-50 text-green-700 border-green-200', label: 'เข้างาน' },
      leave: { color: 'bg-red-50 text-red-700 border-red-200', label: 'ลา' },
      notReported: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'ไม่รายงาน' },
    };
    
    const variant = variants[status as keyof typeof variants];
    if (!variant || count === 0) return null;
    
    return (
      <Badge className={`${variant.color} border text-xs`}>
        {count} {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dailyStats.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ข้อมูลรายวัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 mb-2">ไม่มีข้อมูลการเข้างาน</h3>
            <p className="text-sm text-gray-400">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-0 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          ข้อมูลรายวัน ({period === 'day' ? 'รายวัน' : period === 'month' ? 'รายเดือน' : 'รายปี'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="text-gray-700">วันที่</TableHead>
                <TableHead className="text-gray-700">เข้างาน</TableHead>
                <TableHead className="text-gray-700">ลา</TableHead>
                <TableHead className="text-gray-700">ไม่รายงาน</TableHead>
                <TableHead className="text-gray-700">รวม</TableHead>
                <TableHead className="text-gray-700">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyStats.map((day: any) => (
                <TableRow key={day.date} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">
                    {formatDate(day.date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600">{day.present}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600">{day.leave}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-600">{day.notReported}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">{day.total}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadge('present', day.present)}
                      {getStatusBadge('leave', day.leave)}
                      {getStatusBadge('notReported', day.notReported)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}