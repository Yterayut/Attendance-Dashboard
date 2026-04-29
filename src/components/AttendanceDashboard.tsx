import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileDown,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DailyTable } from './DailyTable';
import { ThemeToggle } from './ThemeToggle';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const API = import.meta.env.VITE_API_URL as string;
const HISTORY_START = '2026-01-06';
const FALLBACK_ROSTER = ['เจ', 'กอล์ฟ', 'ปอง', 'เจ้าสัว', 'ปริม', 'จ๊าบ', 'รีน', 'เช็ค', 'เบนซ์', 'มอธ'];
const COLORS = { present: '#2563eb', leave: '#ef4444', not_reported: '#f59e0b' };

type Status = 'present' | 'leave' | 'not_reported';
type TabKey = 'summary' | 'details' | 'analytics';
type QuickFilter = 'today' | 'week' | 'month' | 'last30' | 'custom';

type AttendanceRecord = {
  date: string;
  team: string;
  name: string;
  status: Status;
  reason: string;
};

type RosterPerson = {
  name: string;
  lineDisplayName?: string;
};

function toISO(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfThaiWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(copy, diff);
}

function formatThaiDate(value: string) {
  return parseISODate(value).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: Status | 'all') {
  if (status === 'present') return 'เข้างาน';
  if (status === 'leave') return 'ลา';
  if (status === 'not_reported') return 'ไม่รายงาน';
  return 'ทั้งหมด';
}

function normalizeStatus(value: unknown): Status {
  const status = String(value || '').toLowerCase();
  if (status === 'leave') return 'leave';
  if (status === 'not_reported') return 'not_reported';
  return 'present';
}

function useDebouncedValue<T>(value: T, delay = 150) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function countByStatus(records: AttendanceRecord[]) {
  return records.reduce(
    (acc, record) => {
      acc[record.status] += 1;
      return acc;
    },
    { present: 0, leave: 0, not_reported: 0 } as Record<Status, number>,
  );
}

function rankBy(records: AttendanceRecord[], status: Status) {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    if (record.status === status) counts.set(record.name, (counts.get(record.name) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'))
    .slice(0, 10);
}

function exportRows(records: AttendanceRecord[]) {
  return records.map((record) => ({
    date: record.date,
    employee: record.name,
    status: record.status,
    department: record.team,
    reason: record.reason || '-',
  }));
}

export default function AttendanceDashboard() {
  const todayISO = toISO(new Date());
  const [tab, setTab] = useState<TabKey>('summary');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('custom');
  const [dateFrom, setDateFrom] = useState(HISTORY_START);
  const [dateTo, setDateTo] = useState(todayISO);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebouncedValue(searchInput);
  const [roster, setRoster] = useState<RosterPerson[]>(() => FALLBACK_ROSTER.map((name) => ({ name })));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch(`${API}?route=roster`)
      .then((res) => res.json())
      .then((json) => {
        const data = Array.isArray(json?.data) ? json.data : [];
        const people = data
          .map((person: any) => ({
            name: String(person.name || '').trim(),
            lineDisplayName: String(person.lineDisplayName || '').trim(),
          }))
          .filter((person: RosterPerson) => person.name);
        if (people.length) setRoster(people);
      })
      .catch(() => setRoster(FALLBACK_ROSTER.map((name) => ({ name }))));
  }, []);

  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    fetch(`${API}?route=records_range&from=${dateFrom}&to=${dateTo}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const data = Array.isArray(json?.data) ? json.data : [];
        setRecords(
          data.map((record: any) => ({
            date: String(record.date || '').slice(0, 10),
            team: String(record.team || 'Dev'),
            name: String(record.name || '').trim(),
            status: normalizeStatus(record.status),
            reason: String(record.reason || ''),
          })).filter((record: AttendanceRecord) => record.date && record.name),
        );
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError('โหลดข้อมูลไม่สำเร็จ');
          setRecords([]);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [dateFrom, dateTo, reloadKey]);

  const teams = useMemo(() => {
    return Array.from(new Set(records.map((record) => record.team).filter(Boolean))).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (teamFilter !== 'all' && record.team !== teamFilter) return false;
      if (employeeFilter !== 'all' && record.name !== employeeFilter) return false;
      if (!keyword) return true;
      return [record.name, record.reason, record.team, record.date]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [records, statusFilter, teamFilter, employeeFilter, searchTerm]);

  const summary = useMemo(() => {
    const counts = countByStatus(filteredRecords);
    const total = counts.present + counts.leave + counts.not_reported;
    return {
      totalEmployees: roster.length,
      present: counts.present,
      leave: counts.leave,
      notReported: counts.not_reported,
      total,
      attendanceRate: total ? Math.round((counts.present / total) * 1000) / 10 : 0,
    };
  }, [filteredRecords, roster.length]);

  const notReportedRecords = useMemo(() => {
    return filteredRecords.filter((record) => record.status === 'not_reported');
  }, [filteredRecords]);

  const dailyTableData = useMemo(() => {
    return filteredRecords.map((record) => ({
      date: record.date,
      employee: dateFrom === dateTo ? record.name : `${formatThaiDate(record.date)} · ${record.name}`,
      status: record.status,
      reason: record.reason,
    }));
  }, [filteredRecords, dateFrom, dateTo]);

  const statusPieData = useMemo(() => ([
    { name: 'present', label: 'เข้างาน', value: summary.present },
    { name: 'leave', label: 'ลา', value: summary.leave },
    { name: 'not_reported', label: 'ไม่รายงาน', value: summary.notReported },
  ]), [summary]);

  const employeeChartData = useMemo(() => {
    return roster.map((person) => {
      const personRecords = filteredRecords.filter((record) => record.name === person.name);
      const counts = countByStatus(personRecords);
      return {
        name: person.name,
        present: counts.present,
        leave: counts.leave,
        not_reported: counts.not_reported,
      };
    });
  }, [filteredRecords, roster]);

  const trendData = useMemo(() => {
    const byDate = new Map<string, Record<Status, number>>();
    filteredRecords.forEach((record) => {
      if (!byDate.has(record.date)) byDate.set(record.date, { present: 0, leave: 0, not_reported: 0 });
      byDate.get(record.date)![record.status] += 1;
    });
    return Array.from(byDate.entries())
      .map(([date, counts]) => ({ date, label: formatThaiDate(date), ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const rankings = useMemo(() => ({
    notReported: rankBy(filteredRecords, 'not_reported'),
    leave: rankBy(filteredRecords, 'leave'),
    present: rankBy(filteredRecords, 'present'),
  }), [filteredRecords]);

  const fileBaseName = `attendance_${dateFrom}_to_${dateTo}`;

  const applyQuickFilter = (value: QuickFilter) => {
    setQuickFilter(value);
    const now = new Date();
    if (value === 'custom') return;
    if (value === 'today') {
      const today = toISO(now);
      setDateFrom(today);
      setDateTo(today);
    } else if (value === 'week') {
      setDateFrom(toISO(startOfThaiWeek(now)));
      setDateTo(toISO(now));
    } else if (value === 'month') {
      setDateFrom(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
      setDateTo(toISO(now));
    } else if (value === 'last30') {
      setDateFrom(toISO(addDays(now, -29)));
      setDateTo(toISO(now));
    }
  };

  const handleDateFrom = (value: string) => {
    setQuickFilter('custom');
    setDateFrom(value);
    if (value > dateTo) setDateTo(value);
  };

  const handleDateTo = (value: string) => {
    setQuickFilter('custom');
    setDateTo(value);
    if (value < dateFrom) setDateFrom(value);
  };

  const handleExportExcel = async () => {
    if (tab === 'details') {
      exportToExcel(exportRows(filteredRecords), fileBaseName);
      return;
    }

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    if (tab === 'summary') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
        from: dateFrom,
        to: dateTo,
        totalEmployees: summary.totalEmployees,
        present: summary.present,
        leave: summary.leave,
        notReported: summary.notReported,
        attendanceRate: `${summary.attendanceRate}%`,
      }]), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(notReportedRecords), 'Not Reported');
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employeeChartData), 'By Employee');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendData), 'Trend');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows(filteredRecords)), 'Filtered Records');
    }
    XLSX.writeFile(wb, `${fileBaseName}_${tab}.xlsx`);
  };

  const handleExportPDF = () => {
    exportToPDF('attendance-dashboard-export', `${fileBaseName}_${tab}`);
  };

  const metricCards = [
    { title: 'จำนวนพนักงาน', value: summary.totalEmployees, icon: Users, tone: 'text-slate-700 dark:text-slate-100' },
    { title: 'มาแล้ว', value: summary.present, icon: CheckCircle2, tone: 'text-blue-700 dark:text-blue-300' },
    { title: 'ลา', value: summary.leave, icon: XCircle, tone: 'text-red-700 dark:text-red-300' },
    { title: 'ไม่รายงาน', value: summary.notReported, icon: AlertTriangle, tone: 'text-amber-700 dark:text-amber-300' },
    { title: 'อัตราเข้าโดยรวม', value: `${summary.attendanceRate}%`, icon: BarChart3, tone: 'text-emerald-700 dark:text-emerald-300' },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5" id="attendance-dashboard-export" data-export="true">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950 dark:text-white">Attendance Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">ระบบติดตามการมาทำงาน/ลางาน</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => setReloadKey((value) => value + 1)}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={handleExportPDF}>
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </header>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900 md:w-[560px]">
            <TabsTrigger value="summary" className="rounded-lg py-2">Summary</TabsTrigger>
            <TabsTrigger value="details" className="rounded-lg py-2">Daily Details</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg py-2">Analytics</TabsTrigger>
          </TabsList>

          <FilterPanel
            quickFilter={quickFilter}
            onQuickFilter={applyQuickFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFrom={handleDateFrom}
            onDateTo={handleDateTo}
            teamFilter={teamFilter}
            teams={teams}
            onTeamFilter={setTeamFilter}
            statusFilter={statusFilter}
            onStatusFilter={(value) => setStatusFilter(value as Status | 'all')}
            employeeFilter={employeeFilter}
            roster={roster}
            onEmployeeFilter={setEmployeeFilter}
            searchInput={searchInput}
            onSearchInput={setSearchInput}
          />

          {error && (
            <Card className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <CardContent className="p-4">{error}</CardContent>
            </Card>
          )}

          <TabsContent value="summary" className="space-y-5">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {metricCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.title} className="border-0 bg-white shadow-sm dark:bg-slate-900">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                        <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{isLoading ? '...' : card.value}</p>
                      </div>
                      <Icon className={`h-7 w-7 ${card.tone}`} />
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  คนไม่แจ้งในช่วงที่เลือก
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notReportedRecords.length ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {notReportedRecords.map((record, index) => (
                      <div key={`${record.date}-${record.name}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/40">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-900 dark:text-white">{record.name}</span>
                          <Badge variant="outline">{formatThaiDate(record.date)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{record.reason || 'ไม่แจ้ง/ไม่รายงาน'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">ไม่พบคนไม่แจ้งใน filter ปัจจุบัน</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-5">
            <DailyTable data={dailyTableData} period={dateFrom === dateTo ? 'day' : 'month'} isLoading={isLoading} />
            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">รายการตาม filter ({filteredRecords.length})</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">วันที่</th>
                      <th className="py-2 pr-4">ทีม</th>
                      <th className="py-2 pr-4">ชื่อ</th>
                      <th className="py-2 pr-4">สถานะ</th>
                      <th className="py-2 pr-4">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => (
                      <tr key={`${record.date}-${record.name}-${record.status}-${index}`} className="border-b last:border-0 dark:border-slate-800">
                        <td className="py-2 pr-4">{record.date}</td>
                        <td className="py-2 pr-4">{record.team}</td>
                        <td className="py-2 pr-4 font-medium text-slate-900 dark:text-white">{record.name}</td>
                        <td className="py-2 pr-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{record.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
              <Card className="border-0 bg-white shadow-sm dark:bg-slate-900 xl:col-span-3">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">การเข้า-ลา-ไม่รายงานต่อพนักงาน</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" name="present" fill={COLORS.present} />
                      <Bar dataKey="leave" name="leave" fill={COLORS.leave} />
                      <Bar dataKey="not_reported" name="not_reported" fill={COLORS.not_reported} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-sm dark:bg-slate-900 xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">สัดส่วน present / leave / not_reported</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} label>
                        {statusPieData.map((entry) => (
                          <Cell key={entry.name} fill={COLORS[entry.name as Status]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <RankingCard title="คนที่ไม่รายงานมากสุด" data={rankings.notReported} tone="amber" />
              <RankingCard title="คนที่ลามากสุด" data={rankings.leave} tone="red" />
              <RankingCard title="คนที่มาเยอะสุด" data={rankings.present} tone="blue" />
            </div>

            <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Trend รายวัน/รายเดือน</CardTitle>
              </CardHeader>
              <CardContent className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" minTickGap={24} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''} />
                    <Legend />
                    <Line type="monotone" dataKey="present" name="present" stroke={COLORS.present} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="leave" name="leave" stroke={COLORS.leave} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="not_reported" name="not_reported" stroke={COLORS.not_reported} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilterPanel({
  quickFilter,
  onQuickFilter,
  dateFrom,
  dateTo,
  onDateFrom,
  onDateTo,
  teamFilter,
  teams,
  onTeamFilter,
  statusFilter,
  onStatusFilter,
  employeeFilter,
  roster,
  onEmployeeFilter,
  searchInput,
  onSearchInput,
}: {
  quickFilter: QuickFilter;
  onQuickFilter: (value: QuickFilter) => void;
  dateFrom: string;
  dateTo: string;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
  teamFilter: string;
  teams: string[];
  onTeamFilter: (value: string) => void;
  statusFilter: Status | 'all';
  onStatusFilter: (value: string) => void;
  employeeFilter: string;
  roster: RosterPerson[];
  onEmployeeFilter: (value: string) => void;
  searchInput: string;
  onSearchInput: (value: string) => void;
}) {
  const quickButtons: Array<{ value: QuickFilter; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Quick Filters:</span>
          {quickButtons.map((button) => (
            <Button
              key={button.value}
              variant={quickFilter === button.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onQuickFilter(button.value)}
            >
              {button.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <CalendarDays className="h-4 w-4" />
              วันที่เริ่มต้น
            </span>
            <Input type="date" value={dateFrom} min={HISTORY_START} onChange={(event) => onDateFrom(event.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <CalendarDays className="h-4 w-4" />
              วันที่สิ้นสุด
            </span>
            <Input type="date" value={dateTo} min={dateFrom} onChange={(event) => onDateTo(event.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">ทีม</span>
            <Select value={teamFilter} onValueChange={onTeamFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {teams.map((team) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">สถานะ</span>
            <Select value={statusFilter} onValueChange={onStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="present">present</SelectItem>
                <SelectItem value="leave">leave</SelectItem>
                <SelectItem value="not_reported">not_reported</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1 xl:col-span-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">ชื่อพนักงาน</span>
            <Select value={employeeFilter} onValueChange={onEmployeeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {roster.map((person) => <SelectItem key={person.name} value={person.name}>{person.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1 xl:col-span-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">ค้นหา</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                value={searchInput}
                placeholder="ค้นหาชื่อ เหตุผล ทีม หรือวันที่"
                onChange={(event) => onSearchInput(event.target.value)}
              />
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const className = status === 'present'
    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200'
    : status === 'leave'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200';

  return <Badge variant="outline" className={className}>{statusLabel(status)}</Badge>;
}

function RankingCard({ title, data, tone }: { title: string; data: Array<{ name: string; count: number }>; tone: 'amber' | 'red' | 'blue' }) {
  const toneClass = tone === 'amber'
    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200'
    : tone === 'red'
      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'
      : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200';

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-base text-slate-900 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.length ? data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${toneClass}`}>{index + 1}</span>
              <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{item.count}</span>
          </div>
        )) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">ไม่มีข้อมูลตาม filter ปัจจุบัน</p>
        )}
      </CardContent>
    </Card>
  );
}
