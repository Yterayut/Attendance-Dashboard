import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });

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