import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, Search, TrendingUp } from 'lucide-react';
import { SummaryCards } from './SummaryCards';
import { DailyTable } from './DailyTable';
import { PersonView } from './PersonView';

// Mock data
const generateMockData = () => {
  const employees = [
    'อรรถพล สมบูรณ์', 'สุภาพร ใจดี', 'วิชัย เก่งกาจ', 'นิรันดร์ มั่นคง',
    'ปิยะนุช สว่างใส', 'ธีรพงษ์ ขยันขันแข็ง', 'มานิตา อยู่เย็น', 'สมศักดิ์ ดีงาม',
    'จิราภรณ์ แสงใส', 'ภาคิน ใจดี'
  ];

  const statuses = ['present', 'leave', 'not_reported'];
  const data = [];

  // Generate data for the last 365 days to have enough data for yearly view
  for (let i = 364; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    employees.forEach(employee => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      data.push({
        id: `${employee}-${date.toISOString().split('T')[0]}`,
        employee,
        date: date.toISOString().split('T')[0],
        status,
        checkIn: status === 'present' ? `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
        checkOut: status === 'present' ? `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
      });
    });
  }

  return data;
};

// Thai months
const thaiMonths = [
  { value: 0, label: 'มกราคม' },
  { value: 1, label: 'กุมภาพันธ์' },
  { value: 2, label: 'มีนาคม' },
  { value: 3, label: 'เมษายน' },
  { value: 4, label: 'พฤษภาคม' },
  { value: 5, label: 'มิถุนายน' },
  { value: 6, label: 'กรกฎาคม' },
  { value: 7, label: 'สิงหาคม' },
  { value: 8, label: 'กันยายน' },
  { value: 9, label: 'ตุลาคม' },
  { value: 10, label: 'พฤศจิกายน' },
  { value: 11, label: 'ธันวาคม' }
];

// Generate Buddhist years (current year ± 5 years)
const generateBuddhistYears = () => {
  const currentYear = new Date().getFullYear();
  const buddhistCurrentYear = currentYear + 543;
  const years = [];
  
  for (let i = -5; i <= 2; i++) {
    const year = buddhistCurrentYear + i;
    years.push({ value: year - 543, label: year.toString() });
  }
  
  return years.reverse();
};

export function AttendanceDashboard() {
  const [mockData] = useState(generateMockData());
  const [filterPeriod, setFilterPeriod] = useState('month');
  
  // Separate states for different period types
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Month range states
  const [selectedFromMonth, setSelectedFromMonth] = useState(new Date().getMonth());
  const [selectedToMonth, setSelectedToMonth] = useState(new Date().getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear());
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buddhistYears = generateBuddhistYears();

  // Get current date in Bangkok timezone
  const bangkokDate = new Date().toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // Filter data based on selected period and appropriate date/month/year
  const filteredData = useMemo(() => {
    return mockData.filter(record => {
      const recordDate = new Date(record.date);
      
      switch (filterPeriod) {
        case 'day':
          const targetDate = new Date(selectedDate);
          return recordDate.toDateString() === targetDate.toDateString();
          
        case 'month':
          const recordMonth = recordDate.getMonth();
          const recordYear = recordDate.getFullYear();
          
          // Check if the record is in the selected year
          if (recordYear !== selectedMonthYear) return false;
          
          // Handle month range (fromMonth could be greater than toMonth for cross-year ranges)
          if (selectedFromMonth <= selectedToMonth) {
            // Normal range within same year (e.g., Jan to Jun)
            return recordMonth >= selectedFromMonth && recordMonth <= selectedToMonth;
          } else {
            // Cross-year range (e.g., Oct to Mar) - but since we're in same year, this shouldn't happen
            // For now, we'll treat it as if toMonth is in next year, but since we filter by year, 
            // we'll just include from fromMonth to end of year
            return recordMonth >= selectedFromMonth || recordMonth <= selectedToMonth;
          }
                 
        case 'year':
          return recordDate.getFullYear() === selectedYear;
          
        default:
          return true;
      }
    });
  }, [mockData, filterPeriod, selectedDate, selectedFromMonth, selectedToMonth, selectedMonthYear, selectedYear]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const present = filteredData.filter(r => r.status === 'present').length;
    const leave = filteredData.filter(r => r.status === 'leave').length;
    const notReported = filteredData.filter(r => r.status === 'not_reported').length;
    
    return { present, leave, notReported, total: present + leave + notReported };
  }, [filteredData]);

  // Get current filter info for display
  const filterInfo = useMemo(() => {
    switch (filterPeriod) {
      case 'day':
        return {
          period: 'รายวัน',
          displayText: new Date(selectedDate).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        };
      case 'month':
        const fromMonthName = thaiMonths[selectedFromMonth].label;
        const toMonthName = thaiMonths[selectedToMonth].label;
        const yearBuddhist = selectedMonthYear + 543;
        
        if (selectedFromMonth === selectedToMonth) {
          return {
            period: 'รายเดือน',
            displayText: `${fromMonthName} ${yearBuddhist}`
          };
        } else {
          return {
            period: 'ช่วงเดือน',
            displayText: `${fromMonthName} ถึง ${toMonthName} ${yearBuddhist}`
          };
        }
      case 'year':
        return {
          period: 'รายปี',
          displayText: `${selectedYear + 543}`
        };
      default:
        return { period: '', displayText: '' };
    }
  }, [filterPeriod, selectedDate, selectedFromMonth, selectedToMonth, selectedMonthYear, selectedYear]);

  // Reset to current date/month/year when period changes
  const handlePeriodChange = (newPeriod: string) => {
    setFilterPeriod(newPeriod);
    const now = new Date();
    
    switch (newPeriod) {
      case 'day':
        setSelectedDate(now.toISOString().split('T')[0]);
        break;
      case 'month':
        setSelectedFromMonth(now.getMonth());
        setSelectedToMonth(now.getMonth());
        setSelectedMonthYear(now.getFullYear());
        break;
      case 'year':
        setSelectedYear(now.getFullYear());
        break;
    }
  };

  // Handle month range validation
  const handleFromMonthChange = (month: number) => {
    setSelectedFromMonth(month);
    // If from month becomes greater than to month, adjust to month
    if (month > selectedToMonth) {
      setSelectedToMonth(month);
    }
  };

  const handleToMonthChange = (month: number) => {
    setSelectedToMonth(month);
    // If to month becomes less than from month, adjust from month
    if (month < selectedFromMonth) {
      setSelectedFromMonth(month);
    }
  };

  // Render date selector based on period
  const renderDateSelector = () => {
    switch (filterPeriod) {
      case 'day':
        return (
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-2">วันที่</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border-gray-200"
            />
          </div>
        );
        
      case 'month':
        return (
          <>
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-2">จากเดือน</label>
              <Select 
                value={selectedFromMonth.toString()} 
                onValueChange={(value) => handleFromMonthChange(parseInt(value))}
              >
                <SelectTrigger className="rounded-lg border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {thaiMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-2">ถึงเดือน</label>
              <Select 
                value={selectedToMonth.toString()} 
                onValueChange={(value) => handleToMonthChange(parseInt(value))}
              >
                <SelectTrigger className="rounded-lg border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {thaiMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-2">ปี (พ.ศ.)</label>
              <Select 
                value={selectedMonthYear.toString()} 
                onValueChange={(value) => setSelectedMonthYear(parseInt(value))}
              >
                <SelectTrigger className="rounded-lg border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buddhistYears.map((year) => (
                    <SelectItem key={year.value} value={year.value.toString()}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'year':
        return (
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-2">ปี (พ.ศ.)</label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buddhistYears.map((year) => (
                  <SelectItem key={year.value} value={year.value.toString()}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">ทีมพัฒนา (Dev Team)</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{bangkokDate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>เวลา: {new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-2">ช่วงเวลา</label>
                  <Select value={filterPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">รายวัน</SelectItem>
                      <SelectItem value="month">รายเดือน</SelectItem>
                      <SelectItem value="year">รายปี</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {renderDateSelector()}
              </div>
              
              {/* Quick month range buttons for common ranges */}
              {filterPeriod === 'month' && (
                <div className="flex flex-wrap gap-2">
                  <label className="text-sm text-gray-700 w-full mb-1">ช่วงเดือนทั่วไป:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFromMonth(0); // Jan
                      setSelectedToMonth(2);   // Mar
                    }}
                    className="text-xs"
                  >
                    ไตรมาส 1 (ม.ค.-มี.ค.)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFromMonth(3); // Apr
                      setSelectedToMonth(5);   // Jun
                    }}
                    className="text-xs"
                  >
                    ไตรมาส 2 (เม.ย.-มิ.ย.)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFromMonth(6); // Jul
                      setSelectedToMonth(8);   // Sep
                    }}
                    className="text-xs"
                  >
                    ไตรมาส 3 (ก.ค.-ก.ย.)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFromMonth(9);  // Oct
                      setSelectedToMonth(11);   // Dec
                    }}
                    className="text-xs"
                  >
                    ไตรมาส 4 (ต.ค.-ธ.ค.)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFromMonth(0);  // Jan
                      setSelectedToMonth(5);    // Jun
                    }}
                    className="text-xs"
                  >
                    ครึ่งปีแรก (ม.ค.-มิ.ย.)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFromMonth(6);  // Jul
                      setSelectedToMonth(11);   // Dec
                    }}
                    className="text-xs"
                  >
                    ครึ่งปีหลัง (ก.ค.-ธ.ค.)
                  </Button>
                </div>
              )}
            </div>
            
            {/* Display current selection info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Calendar className="h-4 w-4" />
                <span>แสดงข้อมูล{filterInfo.period}: {filterInfo.displayText}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <SummaryCards summary={summary} isLoading={isLoading} />

        {/* Main Content */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg">
            <TabsTrigger value="daily" className="rounded-md">ข้อมูลรายวัน</TabsTrigger>
            <TabsTrigger value="person" className="rounded-md">ข้อมูลบุคคล</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <DailyTable 
              data={filteredData} 
              period={filterPeriod}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="person" className="space-y-4">
            <PersonView 
              data={filteredData}
              allData={mockData}
              selectedEmployee={selectedEmployee}
              setSelectedEmployee={setSelectedEmployee}
              filterInfo={filterInfo}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}