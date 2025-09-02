import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Calendar, CalendarDays, Filter, X, Download, Users, Building } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { th } from 'date-fns/locale';

const EMPLOYEES = ['เจ','กอล์ฟ','ปอง','เจ้าสัว','ปริม','จ๊าบ','รีน','เช็ค','เบนซ์'] as const;
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'] as const;
const STATUS_OPTIONS = [
  { value: 'present', label: 'เข้างาน', color: 'bg-green-100 text-green-800' },
  { value: 'leave', label: 'ลา', color: 'bg-red-100 text-red-800' },
  { value: 'not_reported', label: 'ไม่ระบุงาน', color: 'bg-yellow-100 text-yellow-800' }
] as const;

interface FilterState {
  dateRange: {
    from: string;
    to: string;
  };
  selectedEmployees: string[];
  selectedStatuses: string[];
  selectedDepartments: string[];
  searchTerm: string;
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterState) => void;
  onExport: (type: 'excel' | 'pdf' | 'csv') => void;
  isVisible: boolean;
}

export function AdvancedFilter({ onFilterChange, onExport, isVisible }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: '',
      to: ''
    },
    selectedEmployees: [],
    selectedStatuses: [],
    selectedDepartments: [],
    searchTerm: ''
  });

  const handleFilterUpdate = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const toggleEmployee = (employee: string) => {
    const updated = filters.selectedEmployees.includes(employee)
      ? filters.selectedEmployees.filter(e => e !== employee)
      : [...filters.selectedEmployees, employee];
    handleFilterUpdate({ selectedEmployees: updated });
  };

  const toggleStatus = (status: string) => {
    const updated = filters.selectedStatuses.includes(status)
      ? filters.selectedStatuses.filter(s => s !== status)
      : [...filters.selectedStatuses, status];
    handleFilterUpdate({ selectedStatuses: updated });
  };

  const toggleDepartment = (dept: string) => {
    const updated = filters.selectedDepartments.includes(dept)
      ? filters.selectedDepartments.filter(d => d !== dept)
      : [...filters.selectedDepartments, dept];
    handleFilterUpdate({ selectedDepartments: updated });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      dateRange: { from: '', to: '' },
      selectedEmployees: [],
      selectedStatuses: [],
      selectedDepartments: [],
      searchTerm: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.selectedEmployees.length > 0) count++;
    if (filters.selectedStatuses.length > 0) count++;
    if (filters.selectedDepartments.length > 0) count++;
    if (filters.searchTerm.trim()) count++;
    return count;
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-[var(--panel-bg)] backdrop-blur-md shadow-lg border-0 rounded-2xl mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--chip-bg)] text-[var(--on-surface)] border border-[var(--chip-border)] backdrop-blur-sm shadow-sm">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              ตัวกรองขั้นสูง
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-200">
                  {getActiveFilterCount()} ตัวกรอง
                </Badge>
              )}
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[var(--chip-bg)] text-[var(--on-surface)] dark:text-white dark:border-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  ตั้งค่าขั้นสูง
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>ตัวกรองและค้นหาขั้นสูง</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Date Range */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <label className="font-medium">ช่วงวันที่</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">จากวันที่</label>
                        <Input
                          type="date"
                          value={filters.dateRange.from}
                          onChange={(e) => handleFilterUpdate({ 
                            dateRange: { ...filters.dateRange, from: e.target.value } 
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">ถึงวันที่</label>
                        <Input
                          type="date"
                          value={filters.dateRange.to}
                          onChange={(e) => handleFilterUpdate({ 
                            dateRange: { ...filters.dateRange, to: e.target.value } 
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <label className="font-medium">ค้นหา</label>
                    </div>
                    <Input
                      placeholder="ค้นหาชื่อพนักงาน..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterUpdate({ searchTerm: e.target.value })}
                    />
                  </div>

                  {/* Multi-Select Employees */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <label className="font-medium">พนักงาน ({filters.selectedEmployees.length})</label>
                    </div>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {EMPLOYEES.map((emp) => (
                          <div key={emp} className="flex items-center space-x-2">
                            <Checkbox
                              id={`emp-${emp}`}
                              checked={filters.selectedEmployees.includes(emp)}
                              onCheckedChange={() => toggleEmployee(emp)}
                            />
                            <label htmlFor={`emp-${emp}`} className="text-sm cursor-pointer">
                              {emp}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status Filters */}
                  <div className="space-y-3">
                    <label className="font-medium">สถานะ ({filters.selectedStatuses.length})</label>
                    <div className="space-y-2">
                      {STATUS_OPTIONS.map((status) => (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status.value}`}
                            checked={filters.selectedStatuses.includes(status.value)}
                            onCheckedChange={() => toggleStatus(status.value)}
                          />
                          <label htmlFor={`status-${status.value}`} className="cursor-pointer">
                            <Badge className={status.color}>{status.label}</Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department Grouping */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <label className="font-medium">แผนก ({filters.selectedDepartments.length})</label>
                    </div>
                    <div className="space-y-2">
                      {DEPARTMENTS.map((dept) => (
                        <div key={dept} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept}`}
                            checked={filters.selectedDepartments.includes(dept)}
                            onCheckedChange={() => toggleDepartment(dept)}
                          />
                          <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer">
                            {dept}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-2" />
                    ล้างตัวกรองทั้งหมด
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    ปิด
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={clearAllFilters} className="bg-[var(--chip-bg)] text-[var(--on-surface)] dark:text-white dark:border-gray-600">
              <X className="h-4 w-4 mr-2" />
              ล้าง
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Active Filters Display */}
          {filters.dateRange.from && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
              จาก: {format(new Date(filters.dateRange.from), 'dd MMM yyyy', { locale: th })}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => handleFilterUpdate({ dateRange: { ...filters.dateRange, from: '' } })}
              />
            </Badge>
          )}
          {filters.dateRange.to && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
              ถึง: {format(new Date(filters.dateRange.to), 'dd MMM yyyy', { locale: th })}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => handleFilterUpdate({ dateRange: { ...filters.dateRange, to: '' } })}
              />
            </Badge>
          )}
          {filters.selectedEmployees.map(emp => (
            <Badge key={emp} variant="outline" className="bg-green-50 text-green-700">
              {emp}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleEmployee(emp)}
              />
            </Badge>
          ))}
          {filters.selectedStatuses.map(status => {
            const statusConfig = STATUS_OPTIONS.find(s => s.value === status);
            return statusConfig ? (
              <Badge key={status} className={statusConfig.color}>
                {statusConfig.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleStatus(status)}
                />
              </Badge>
            ) : null;
          })}
          {filters.selectedDepartments.map(dept => (
            <Badge key={dept} variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
              {dept}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleDepartment(dept)}
              />
            </Badge>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onExport('excel')}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onExport('csv')}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onExport('pdf')}
            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/40"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
