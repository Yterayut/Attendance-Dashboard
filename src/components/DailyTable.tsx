import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Calendar, Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';

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
  // Group employees by status for the selected date
  const employeesByStatus = useMemo(() => {
    const present: string[] = [];
    const leave: string[] = [];
    const notReported: string[] = [];
    
    data.forEach(record => {
      switch (record.status) {
        case 'present':
          present.push(record.employee);
          break;
        case 'leave':
          leave.push(record.employee);
          break;
        case 'not_reported':
          notReported.push(record.employee);
          break;
      }
    });
    
    return { present, leave, notReported };
  }, [data]);

  const StatusSection = ({ title, employees, icon, bgColor, textColor }: {
    title: string;
    employees: string[];
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
  }) => (
    <div className={`p-4 rounded-xl border ${bgColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={textColor}>{icon}</div>
        <h3 className={`font-semibold text-sm ${textColor}`}>
          {title} ({employees.filter(emp => emp !== '—').length} คน)
        </h3>
      </div>
      {employees.length > 0 ? (
        <div className="space-y-2">
          {employees.filter(emp => emp !== '—').map((employee, index) => (
            <div key={index} className={`px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-700/50 text-sm font-medium text-gray-800 dark:text-gray-200`}>
              {employee}
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-xs opacity-70 ${textColor}`}>ไม่มีรายชื่อ</div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
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

  if (data.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ข้อมูลรายวัน ({period === 'day' ? 'รายวัน' : period === 'month' ? 'รายเดือน' : 'รายปี'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-500 dark:text-gray-400 mb-2">ไม่มีข้อมูลการเข้างาน</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ข้อมูลรายวัน ({period === 'day' ? 'รายวัน' : period === 'month' ? 'รายเดือน' : 'รายปี'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusSection
            title="เข้างาน"
            employees={employeesByStatus.present}
            icon={<UserCheck className="h-4 w-4" />}
            bgColor="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-600/50"
            textColor="text-green-800 dark:text-white"
          />
          
          <StatusSection
            title="ลาป่วย/ลากิจ"
            employees={employeesByStatus.leave}
            icon={<UserX className="h-4 w-4" />}
            bgColor="bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-600/50"
            textColor="text-red-800 dark:text-white"
          />
          
          <StatusSection
            title="ไม่รายงาน"
            employees={employeesByStatus.notReported}
            icon={<AlertTriangle className="h-4 w-4" />}
            bgColor="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-600/50"
            textColor="text-yellow-800 dark:text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}