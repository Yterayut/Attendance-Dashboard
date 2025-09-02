import { useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { User, Clock, Calendar, BarChart3, Search, Download, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportToCSV } from '../utils/exportUtils';

interface PersonViewProps {
  data: Array<{
    date: string;
    employee: string;
    status: 'present' | 'leave' | 'not_reported';
    checkIn?: string | null;
    checkOut?: string | null;
  }>;
  allData: Array<{
    date: string;
    employee: string;
    status: 'present' | 'leave' | 'not_reported';
    checkIn?: string | null;
    checkOut?: string | null;
  }>;
  selectedEmployee: string;
  setSelectedEmployee: (value: string) => void;
  filterInfo: {
    period: string;
    displayText: string;
  };
  isLoading: boolean;
}

export function PersonView({ 
  data, 
  allData, 
  selectedEmployee, 
  setSelectedEmployee,
  filterInfo,
  isLoading 
}: PersonViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // Get unique employees list
  const employees = useMemo(() => {
    return Array.from(new Set(allData.map(r => r.employee))).sort();
  }, [allData]);

  // Get employee statistics based on filtered data
  const employeeStats = useMemo(() => {
    if (!selectedEmployee) return null;
    
    const employeeData = data.filter(r => r.employee === selectedEmployee);
    const present = employeeData.filter(r => r.status === 'present').length;
    const leave = employeeData.filter(r => r.status === 'leave').length;
    const notReported = employeeData.filter(r => r.status === 'not_reported').length;
    
    return {
      employee: selectedEmployee,
      present,
      leave,
      notReported,
      total: employeeData.length,
      records: employeeData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [selectedEmployee, data]);

  // Generate monthly chart data based on filtered data
  const chartData = useMemo(() => {
    if (!selectedEmployee) return [];
    
    const employeeData = data.filter(r => r.employee === selectedEmployee);
    const monthlyData: Record<string, { month: string; present: number; total: number }> = {};
    
    employeeData.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, present: 0, total: 0 };
      }
      
      monthlyData[monthKey].total++;
      if (record.status === 'present') {
        monthlyData[monthKey].present++;
      }
    });
    
    return Object.values(monthlyData)
      .map(data => ({
        ...data,
        percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [selectedEmployee, data]);

  // Export to PDF function
  const exportToPDF = async () => {
    if (!reportRef.current || !selectedEmployee) return;

    try {
      // Dynamically import the libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Create canvas from the report element
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        height: reportRef.current.scrollHeight,
        width: reportRef.current.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Calculate dimensions to fit the page
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = `รายงานการเข้างาน_${selectedEmployee}_${filterInfo.displayText}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: { color: 'bg-green-50 text-green-700 border-green-200', label: 'เข้างาน' },
      leave: { color: 'bg-red-50 text-red-700 border-red-200', label: 'ลา' },
      not_reported: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'ไม่รายงาน' },
    };
    
    const variant = variants[status as keyof typeof variants];
    
    return (
      <Badge className={`${variant.color} border text-xs`}>
        {variant.label}
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
      <div className="space-y-6">
        <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Selection */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm text-gray-700 dark:text-gray-300">เลือกพนักงาน</label>
              {selectedEmployee && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={async () => exportToPDF()}
                    size="sm"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => {
                      const rows = (data || []).filter(r => r.employee === selectedEmployee).map(r => ({
                        date: r.date,
                        employee: r.employee,
                        status: r.status,
                        department: 'IT',
                        checkIn: r.checkIn || undefined,
                        checkOut: r.checkOut || undefined,
                        reason: '-'
                      }));
                      exportToCSV(rows, `person_${selectedEmployee}`);
                    }}
                    size="sm"
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
            
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <SelectValue placeholder="กรุณาเลือกพนักงาน..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee} value={employee}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="dark:text-white">{employee}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedEmployee && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-700/30">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <User className="h-4 w-4" />
                  <span>พนักงานที่เลือก: <span className="">{selectedEmployee}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>ข้อมูล{filterInfo.period}: {filterInfo.displayText}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Details */}
      {selectedEmployee && employeeStats ? (
        <div ref={reportRef} className="space-y-6">
          {/* PDF Header (only visible in PDF) */}
          <div className="hidden print:block bg-white p-6 rounded-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl text-gray-900 mb-2">รายงานการเข้างาน</h1>
              <div className="text-lg text-gray-700 mb-1">ทีมพัฒนา (Dev Team)</div>
              <div className="text-md text-gray-600">พนักงาน: {selectedEmployee}</div>
              <div className="text-sm text-gray-500">ข้อมูล{filterInfo.period}: {filterInfo.displayText}</div>
              <div className="text-xs text-gray-400 mt-2">
                สร้างรายงาน: {new Date().toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                สถิติการเข้างาน: {selectedEmployee}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filterInfo.period}: {filterInfo.displayText}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300">เข้างาน</span>
                  </div>
                  <div className="text-2xl text-green-600 dark:text-green-400">{employeeStats.present}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {employeeStats.total > 0 ? Math.round((employeeStats.present / employeeStats.total) * 100) : 0}%
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="text-sm text-red-700 dark:text-red-300">ลาป่วย/ลากิจ</span>
                  </div>
                  <div className="text-2xl text-red-600 dark:text-red-400">{employeeStats.leave}</div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    {employeeStats.total > 0 ? Math.round((employeeStats.leave / employeeStats.total) * 100) : 0}%
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-100 dark:border-yellow-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">ไม่รายงาน</span>
                  </div>
                  <div className="text-2xl text-yellow-600 dark:text-yellow-400">{employeeStats.notReported}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    {employeeStats.total > 0 ? Math.round((employeeStats.notReported / employeeStats.total) * 100) : 0}%
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-300">รวมทั้งหมด</span>
                  </div>
                  <div className="text-2xl text-blue-600 dark:text-blue-400">{employeeStats.total}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">วัน</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Chart */}
          {chartData.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  กราฟสถิติการเข้างานรายเดือน (6 เดือนล่าสุด)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        labelFormatter={(value) => `เดือน: ${value}`}
                        formatter={(value, name) => [
                          `${value}%`, 
                          name === 'percentage' ? 'อัตราการเข้างาน' : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                ประวัติการเข้างานในช่วงเวลาที่เลือก
                {employeeStats.records.length > 30 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    แสดง 30 รายการล่าสุด
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {employeeStats.records.slice(0, 30).map((record) => (
                  <div 
                    key={`${record.date}-${record.employee}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.date)}
                      </div>
                      {getStatusBadge(record.status)}
                    </div>
                    
                    {record.status === 'present' && record.checkIn && record.checkOut && (
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>เข้า: {record.checkIn}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>ออก: {record.checkOut}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {employeeStats.records.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">ไม่มีข้อมูลการเข้างานในช่วงเวลาที่เลือก</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty state when no employee selected */
        <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 rounded-2xl">
          <CardContent className="p-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-500 mb-2">กรุณาเลือกพนักงานที่ต้องการดูข้อมูล</h3>
              <p className="text-sm text-gray-400">
                ใช้ dropdown ด้านบนเพื่อเลือกพนักงานและดูข้อมูลการเข้างาน สถิติ และประวัติตามช่วงเวลาที่กำหนด
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>ข้อมูลจะแสดงตาม{filterInfo.period}: {filterInfo.displayText}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
