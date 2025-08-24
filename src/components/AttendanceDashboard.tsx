
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Clock, Users } from 'lucide-react';
import { SummaryCards } from './SummaryCards';
import { DailyTable } from './DailyTable';
import { PersonView } from './PersonView';

const API = import.meta.env.VITE_API_URL as string;

// --- Helpers ---
function toISO(d: Date){ const tz = new Date(d.getTime()-d.getTimezoneOffset()*60000); return tz.toISOString().slice(0,10); }
function endOfMonthStr(y:number,m0:number){ const end = new Date(y, m0+1, 0); const tz=new Date(end.getTime()-end.getTimezoneOffset()*60000); return tz.toISOString().slice(0,10); }

// Hardcoded employee list (สำหรับ dropdown บุคคล)
const EMPLOYEES = ['เจ','กอล์ฟ','ปอง','เจ้าสัว','ปริม','จ๊าบ','รีน','เช็ค','เบนซ์'] as const;
type EmpName = typeof EMPLOYEES[number];

type DaySummary = { date:string; team:string; present:number; leave:number; notReported:number };
type PersonItem = { date:string; team:string; name:string; status:'present'|'leave'|'not_reported'; reason:string };

export default function AttendanceDashboard() {
  // ===== Filters / states (คงโครงจาก Figma) =====
  const [tab, setTab] = useState<'day'|'month'|'person'>('day');
  const [isLoading, setIsLoading] = useState(false);

  // รายวัน (เปลี่ยนเป็นวันที่มีข้อมูล)
  const [selectedDate, setSelectedDate] = useState('2025-08-23');

  // รายเดือน (ช่วงเดือน)
  const now = new Date();
  const [selectedMonthYear, setSelectedMonthYear] = useState(now.getFullYear());
  const [selectedFromMonth, setSelectedFromMonth] = useState(now.getMonth());
  const [selectedToMonth, setSelectedToMonth] = useState(now.getMonth());

  // บุคคล
  const [selectedEmployee, setSelectedEmployee] = useState<EmpName>('เจ');
  const [personRange, setPersonRange] = useState<'day'|'month'|'year'>('month');
  const [personOn, setPersonOn] = useState<string>(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);

  // ===== Data buckets =====
  const [daySummary, setDaySummary] = useState<DaySummary|null>(null);
  const [monthDays, setMonthDays] = useState<DaySummary[]>([]);
  const [personItems, setPersonItems] = useState<PersonItem[]>([]);

  // ===== Effects: fetch APIs =====
  // Day
  useEffect(()=>{
    if (tab!=='day') return;
    setIsLoading(true);
    fetch(`${API}?route=summary&date=${selectedDate}`)
      .then(r=>r.json())
      .then(j=>setDaySummary(j.data || null))
      .catch(()=>setDaySummary(null))
      .finally(()=>setIsLoading(false));
  },[API, tab, selectedDate]);

  // Month range
  useEffect(()=>{
    if (tab!=='month') return;
    setIsLoading(true);
    const from = `${selectedMonthYear}-${String(selectedFromMonth+1).padStart(2,'0')}-01`;
    const to = endOfMonthStr(selectedMonthYear, selectedToMonth);
    fetch(`${API}?route=summary_range&from=${from}&to=${to}`)
      .then(r=>r.json())
      .then(j=>setMonthDays(Array.isArray(j.data)? j.data: []))
      .catch(()=>setMonthDays([]))
      .finally(()=>setIsLoading(false));
  },[API, tab, selectedMonthYear, selectedFromMonth, selectedToMonth]);

  // Person
  useEffect(()=>{
    if (tab!=='person') return;
    setIsLoading(true);
    const url = `${API}?route=person&name=${encodeURIComponent(selectedEmployee)}&range=${personRange}&on=${encodeURIComponent(personOn)}`;
    fetch(url)
      .then(r=>r.json())
      .then(j=>setPersonItems(j?.data?.items ?? []))
      .catch(()=>setPersonItems([]))
      .finally(()=>setIsLoading(false));
  },[API, tab, selectedEmployee, personRange, personOn]);

  // ===== Adapters to Figma child components =====
  // SummaryCards: ใช้กับทั้งรายวันและรายเดือน (เลือกชุดที่กำลังแสดง)
  const summaryForCards = useMemo(()=>{
    if (tab==='day') {
      const s = daySummary;
      return { present: s?.present||0, leave: s?.leave||0, notReported: s?.notReported||0, total: (s?.present||0)+(s?.leave||0)+(s?.notReported||0) };
    }
    // month: รวมทั้งช่วง
    const agg = monthDays.reduce((a,d)=>{
      a.present+=d.present; a.leave+=d.leave; a.notReported+=d.notReported; return a;
    },{present:0,leave:0,notReported:0});
    return { ...agg, total: agg.present+agg.leave+agg.notReported };
  },[tab, daySummary, monthDays]);

  // DailyTable: ต้องการ array ของ records {date, employee, status}
  // เราแปลงจาก summary ให้เป็น record ปลอมตามจำนวน เพื่อให้ badge/count ถูกต้อง
  const dailyTableData = useMemo(()=>{
    if (tab==='day' && daySummary) {
      const recs:any[] = [];
      for (let i=0;i<daySummary.present;i++) recs.push({date: daySummary.date, employee: '—', status:'present'});
      for (let i=0;i<daySummary.leave;i++) recs.push({date: daySummary.date, employee: '—', status:'leave'});
      for (let i=0;i<daySummary.notReported;i++) recs.push({date: daySummary.date, employee: '—', status:'not_reported'});
      return recs;
    }
    if (tab==='month') {
      const recs:any[] = [];
      monthDays.forEach(d=>{
        for (let i=0;i<d.present;i++) recs.push({date:d.date, employee:'—', status:'present'});
        for (let i=0;i<d.leave;i++) recs.push({date:d.date, employee:'—', status:'leave'});
        for (let i=0;i<d.notReported;i++) recs.push({date:d.date, employee:'—', status:'not_reported'});
      });
      return recs;
    }
    // person tab uses PersonView
    return [];
  },[tab, daySummary, monthDays]);

  // PersonView requires allData listเพื่อทำ dropdown รายชื่อ
  const allDataForPerson = useMemo(()=>{
    // ใช้รายชื่อคงที่ เพื่อให้มีรายการใน dropdown
    return EMPLOYEES.map(n=>({date:selectedDate, employee:n, status:'present' as const}));
  },[selectedDate]);

  // Filter info text
  const filterInfo = useMemo(()=>{
    if (tab==='day') {
      return { period: 'วัน', displayText: new Date(selectedDate).toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric', weekday:'long'}) };
    }
    if (tab==='month') {
      const from = new Date(selectedMonthYear, selectedFromMonth, 1);
      const to = new Date(selectedMonthYear, selectedToMonth, 1);
      return { period: 'เดือน', displayText: `${from.toLocaleDateString('th-TH',{month:'long'})} – ${to.toLocaleDateString('th-TH',{month:'long', year:'numeric'})}` };
    }
    return { period: personRange==='day'?'วัน':personRange==='month'?'เดือน':'ปี', displayText: personOn };
  },[tab, selectedDate, selectedMonthYear, selectedFromMonth, selectedToMonth, personRange, personOn]);

  const thaiMonths = [
    { value: 0, label: 'มกราคม' },{ value: 1, label: 'กุมภาพันธ์' },{ value: 2, label: 'มีนาคม' },
    { value: 3, label: 'เมษายน' },{ value: 4, label: 'พฤษภาคม' },{ value: 5, label: 'มิถุนายน' },
    { value: 6, label: 'กรกฎาคม' },{ value: 7, label: 'สิงหาคม' },{ value: 8, label: 'กันยายน' },
    { value: 9, label: 'ตุลาคม' },{ value:10, label: 'พฤศจิกายน' },{ value:11, label: 'ธันวาคม' },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/20">
          <Users className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ระบบบริหารการเข้างาน
          </h1>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Asia/Bangkok • {new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}</span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v)=>setTab(v as any)}>
        <div className="flex justify-center mb-8">
          <TabsList className="bg-white/60 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-2">
            <TabsTrigger 
              value="day" 
              className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              📅 รายวัน
            </TabsTrigger>
            <TabsTrigger 
              value="month" 
              className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              📊 รายเดือน
            </TabsTrigger>
            <TabsTrigger 
              value="person" 
              className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              👤 รายบุคคล
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SUMMARY CARDS */}
        <SummaryCards 
          summary={summaryForCards}
          isLoading={isLoading}
        />

        {/* DAY TAB */}
        <TabsContent value="day" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-md shadow-xl border-0 rounded-3xl border border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                เลือกวันที่
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e)=>setSelectedDate(e.target.value)} 
                className="w-64 h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-indigo-400 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm" 
              />
            </CardContent>
          </Card>

          <DailyTable 
            data={dailyTableData}
            period="day"
            isLoading={isLoading}
          />
        </TabsContent>

        {/* MONTH TAB */}
        <TabsContent value="month" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-md shadow-xl border-0 rounded-3xl border border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                เลือกช่วงเดือน
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">ปี</label>
                <Input 
                  type="number" 
                  value={selectedMonthYear} 
                  onChange={e=>setSelectedMonthYear(parseInt(e.target.value||`${now.getFullYear()}`))} 
                  className="h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-emerald-400 bg-white/50 backdrop-blur-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">จากเดือน</label>
                <Select value={String(selectedFromMonth)} onValueChange={(v)=>setSelectedFromMonth(parseInt(v))}>
                  <SelectTrigger className="h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 bg-white/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    {thaiMonths.map(m=>(<SelectItem key={m.value} value={String(m.value)} className="rounded-lg">{m.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">ถึงเดือน</label>
                <Select value={String(selectedToMonth)} onValueChange={(v)=>setSelectedToMonth(parseInt(v))}>
                  <SelectTrigger className="h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 bg-white/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    {thaiMonths.map(m=>(<SelectItem key={m.value} value={String(m.value)} className="rounded-lg">{m.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <DailyTable 
            data={dailyTableData}
            period="month"
            isLoading={isLoading}
          />
        </TabsContent>

        {/* PERSON TAB */}
        <TabsContent value="person" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-md shadow-xl border-0 rounded-3xl border border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                เลือกบุคคลและช่วงเวลา
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">ชื่อพนักงาน</label>
                <Select value={selectedEmployee} onValueChange={(v)=>setSelectedEmployee(v as EmpName)}>
                  <SelectTrigger className="h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-purple-400 bg-white/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    {EMPLOYEES.map(n=>(<SelectItem key={n} value={n} className="rounded-lg">👤 {n}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">ช่วงเวลา</label>
                <Select value={personRange} onValueChange={(v)=>setPersonRange(v as any)}>
                  <SelectTrigger className="h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-purple-400 bg-white/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    <SelectItem value="day" className="rounded-lg">📅 รายวัน</SelectItem>
                    <SelectItem value="month" className="rounded-lg">📊 รายเดือน</SelectItem>
                    <SelectItem value="year" className="rounded-lg">📈 รายปี</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">ค่าอ้างอิง</label>
                <Input 
                  value={personOn} 
                  onChange={e=>setPersonOn(e.target.value)} 
                  placeholder="เดือน: 2025-08"
                  className="h-12 text-lg border-2 border-slate-200 rounded-2xl focus:border-purple-400 focus:ring-purple-400 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </CardContent>
          </Card>

          <PersonView 
            data={personItems.map(i=>({ date:i.date, employee:i.name, status:i.status }))}
            allData={allDataForPerson}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee as any}
            filterInfo={{ period: personRange, displayText: personOn }}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
