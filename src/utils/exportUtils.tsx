import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// html2canvas and jsPDF are loaded lazily inside the PDF function

interface ExportData {
  date: string;
  employee: string;
  status: string;
  department?: string;
  checkIn?: string;
  checkOut?: string;
  reason?: string;
}

export const exportToExcel = (data: ExportData[], filename: string = 'attendance_report') => {
  // Prepare data for Excel
  const excelData = data.map(item => ({
    'วันที่': item.date,
    'ชื่อพนักงาน': item.employee,
    'สถานะ': item.status === 'present' ? 'เข้างาน' : 
              item.status === 'leave' ? 'ลา' : 'ไม่ระบุงาน',
    'แผนก': item.department || 'ไม่ระบุ',
    'เวลาเข้า': item.checkIn || '-',
    'เวลาออก': item.checkOut || '-',
    'หมายเหตุ': item.reason || '-'
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Add some styling
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // วันที่
    { wch: 20 }, // ชื่อพนักงาน
    { wch: 15 }, // สถานะ
    { wch: 15 }, // แผนก
    { wch: 15 }, // เวลาเข้า
    { wch: 15 }, // เวลาออก
    { wch: 25 }  // หมายเหตุ
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'รายงานการเข้างาน');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, finalFilename);
};

export const exportToPDF = async (elementId: string, filename: string = 'attendance_report') => {
  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);
    // Wait a bit for the DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let element = document.getElementById(elementId);
    
    // If specific element not found, try to find the main content
    if (!element) {
      // Try alternative selectors
      element = document.querySelector('[data-export="true"]') as HTMLElement ||
                document.querySelector('.space-y-6') as HTMLElement ||
                document.querySelector('main') as HTMLElement ||
                document.body;
    }

    if (!element) {
      throw new Error('No suitable element found for PDF export');
    }

    // Ensure element is visible and has content
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error('Element is not visible or has no content');
    }

    // Create canvas from the element with better options
    // html2canvas 1.4.x ไม่รองรับสีรูปแบบ oklch → override ตัวแปรสีใน clone เป็น HEX/RGB ชั่วคราว
    const renderWithHtml2Canvas = async () => html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      foreignObjectRendering: true,
      onclone: (doc) => {
        const style = doc.createElement('style');
        style.textContent = `
          :root { --background:#ffffff; --foreground:#0f172a; --card:#ffffff; --card-foreground:#0f172a; --popover:#ffffff; --popover-foreground:#0f172a; --primary:#1e293b; --primary-foreground:#ffffff; --secondary:#f1f5f9; --secondary-foreground:#0f172a; --muted:#e2e8f0; --muted-foreground:#64748b; --accent:#e2e8f0; --accent-foreground:#0f172a; --destructive:#ef4444; --destructive-foreground:#ffffff; --border:rgba(0,0,0,0.1); --input:#f8fafc; --ring:#94a3b8; }
          .dark { --background:#0b1220; --foreground:#e5e7eb; --card:#0b1220; --card-foreground:#e5e7eb; --popover:#0b1220; --popover-foreground:#e5e7eb; --primary:#e5e7eb; --primary-foreground:#111827; --secondary:#1f2937; --secondary-foreground:#e5e7eb; --muted:#1f2937; --muted-foreground:#9ca3af; --accent:#1f2937; --accent-foreground:#e5e7eb; --destructive:#b91c1c; --destructive-foreground:#ffffff; --border:#374151; --input:#374151; --ring:#6b7280; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* ปิด gradient ที่อาจประกอบด้วย oklch เพื่อกัน parser error ใน html2canvas */
          * { background-image: none !important; }
        `;
        doc.head.appendChild(style);

        // Sanitize any inline <style> rules within the cloned doc that still contain oklch()
        doc.querySelectorAll('style').forEach((el) => {
          try {
            const txt = el.textContent || '';
            if (txt.includes('oklch(')) {
              el.textContent = txt.replace(/oklch\([^)]*\)/g, '#1e293b');
            }
          } catch {}
        });

        // Replace external/linked stylesheets that might still include oklch()
        // by inlining a sanitized <style> (same-origin only; guard with try/catch)
        try {
          const sheets = Array.from((doc as any).styleSheets || []);
          sheets.forEach((ss: any) => {
            const owner = ss?.ownerNode as HTMLElement | null;
            if (!owner) return;
            let cssText = '';
            try {
              const rules = ss.cssRules as any;
              if (!rules) return;
              for (let i = 0; i < rules.length; i++) cssText += rules[i].cssText + '\n';
            } catch {
              // cross-origin or unreadable stylesheet; skip
              return;
            }
            if (cssText && cssText.includes('oklch(')) {
              const rep = cssText.replace(/oklch\([^)]*\)/g, '#1e293b');
              const s = doc.createElement('style');
              s.textContent = rep;
              owner.parentNode?.insertBefore(s, owner.nextSibling);
              owner.remove();
            }
          });
        } catch {}
      }
    });

    let canvas: HTMLCanvasElement;
    try {
      canvas = await renderWithHtml2Canvas();
    } catch (err: any) {
      // Fallback: ใช้ dom-to-image-more (SVG foreignObject) เมื่อเจอ oklch หรือ parser error อื่นๆ
      const message = String(err?.message || '');
      if (message.includes('oklch') || message.includes('unsupported')) {
        const { toPng } = await import('dom-to-image-more');
        const dataUrl = await toPng(element as HTMLElement, {
          bgcolor: '#ffffff',
          cacheBust: true,
          style: { backgroundImage: 'none' },
          filter: () => true,
        });
        // สร้างแคนวาสจาก dataUrl เพื่อใช้ขั้นตอนเดิมต่อได้
        const img = new Image();
        await new Promise((res, rej) => { img.onload = () => res(null as any); img.onerror = rej; img.src = dataUrl; });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
        canvas = c;
      } else {
        throw err;
      }
    }

    const imgData = canvas.toDataURL('image/png', 0.95);
    
    // Calculate dimensions for PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
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

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.pdf`;

    // Save PDF
    pdf.save(finalFilename);
    
    console.log('PDF exported successfully:', finalFilename);
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    
    // More specific error messages
    let errorMessage = 'เกิดข้อผิดพลาดในการ Export PDF กรุณาลองใหม่อีกครั้ง';
    
    if (error instanceof Error) {
      if (error.message.includes('Element not found') || error.message.includes('No suitable element')) {
        errorMessage = 'ไม่พบข้อมูลที่จะ Export กรุณาลองใหม่อีกครั้ง';
      } else if (error.message.includes('not visible')) {
        errorMessage = 'ข้อมูลยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่';
      }
    }
    
    alert(errorMessage);
  }
};

export const exportToCSV = (data: ExportData[], filename: string = 'attendance_report') => {
  const headers = ['วันที่','ชื่อพนักงาน','สถานะ','แผนก','เวลาเข้า','เวลาออก','หมายเหตุ'];
  const rows = data.map(item => [
    item.date,
    item.employee,
    item.status === 'present' ? 'เข้างาน' : item.status === 'leave' ? 'ลา' : 'ไม่ระบุงาน',
    item.department || 'ไม่ระบุ',
    item.checkIn || '-',
    item.checkOut || '-',
    (item.reason || '-').toString().replace(/\r?\n|\r/g,' '),
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(','))
    .join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const ts = new Date().toISOString().slice(0,19).replace(/:/g,'-');
  saveAs(blob, `${filename}_${ts}.csv`);
};

export const generateSummaryReport = (data: ExportData[]) => {
  const summary = {
    totalRecords: data.length,
    present: data.filter(item => item.status === 'present').length,
    leave: data.filter(item => item.status === 'leave').length,
    notReported: data.filter(item => item.status === 'not_reported').length,
    departments: [...new Set(data.map(item => item.department).filter(Boolean))],
    dateRange: {
      from: data.length > 0 ? data[0].date : '',
      to: data.length > 0 ? data[data.length - 1].date : ''
    }
  };

  return summary;
};
