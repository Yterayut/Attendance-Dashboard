# 🚀 Cloudflare Pages Deployment Guide

## ✅ Pre-deployment Checklist

- [x] โปรเจกต์ build ได้สำเร็จ (`npm run build`)
- [x] มีไฟล์ `public/_redirects` สำหรับ SPA routing
- [x] Environment variable `VITE_API_URL` ตั้งค่าแล้ว
- [x] Git repository พร้อมแล้ว

## 📋 Step-by-Step Deployment

### 1. Push โค้ดขึ้น GitHub

```bash
# เพิ่มไฟล์ทั้งหมด (ยกเว้น .env)
git add .

# Commit
git commit -m "feat: attendance dashboard ready for production"

# สร้าง main branch
git branch -M main

# เชื่อมต่อกับ GitHub repository
git remote add origin https://github.com/Yterayut/Attendance-Dashboard.git

# Push ขึ้น GitHub
git push -u origin main
```

### 2. ตั้งค่า Cloudflare Pages

1. เข้า **Cloudflare Dashboard** → **Pages** → **Create a project**
2. เลือก **Connect to Git** 
3. เลือก repository: `Yterayut/Attendance-Dashboard`
4. ตั้งค่า Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### 3. ตั้งค่า Environment Variables

ใน **Environment variables** section เพิ่ม:

```
Variable Name: VITE_API_URL
Value: https://script.google.com/macros/s/AKfycbzrpdSy01NrsQBvaQys2mJEcbqzhyAIlZECJqCYkZ3SYMGxRt3bwADvdJSSIu8BXqMp/exec
```

**⚠️ สำคัญ**: เพิ่มใน **Production** และ **Preview** environments

### 4. Deploy

1. กด **Save and Deploy**
2. รอ build เสร็จ (~2-3 นาที)
3. ได้ URL เช่น `https://attendance-dashboard-xxx.pages.dev`

## 🔧 Production URLs คาดหวัง

หลังจาก deploy แล้ว ควรได้:

- **Frontend**: `https://your-project.pages.dev`
- **API Calls**:
  - `https://your-project.pages.dev` → calls → `https://script.google.com/.../exec?route=summary&date=...`
  - `https://your-project.pages.dev` → calls → `https://script.google.com/.../exec?route=person&name=...`

## ✅ Testing Checklist

หลัง deploy ให้ทดสอบ:

- [ ] หน้าเว็บโหลดได้ปกติ
- [ ] เปลี่ยนแท็บ รายวัน/รายเดือน/รายบุคคล ได้
- [ ] Summary cards แสดงข้อมูลจาก API
- [ ] ตารางข้อมูลแสดงรายละเอียดพนักงาน
- [ ] เปิด DevTools → Network เห็น API calls
- [ ] ทดสอบบนมือถือ responsive ดี

## 🔧 Troubleshooting

### ปัญหา: 404 Error เมื่อรีเฟรชหน้า
- **แก้**: ตรวจสอบไฟล์ `public/_redirects` มีบรรทัด `/*    /index.html   200`

### ปัญหา: API ไม่มีข้อมูล
- **แก้**: ตรวจสอบ `VITE_API_URL` ใน Environment Variables
- **แก้**: ทดสอบ API โดยตรง: `curl "https://script.google.com/.../exec?route=summary&date=2024-08-24"`

### ปัญหา: CORS Error
- **แก้**: Google Apps Script ควรตั้งค่า `Access-Control-Allow-Origin: *` อยู่แล้ว
- **แก้**: ตรวจสอบ Apps Script deploy แบบ "Anyone" และใช้ URL `/exec`

## 📊 Build Information

- **Bundle Size**: ~1.45MB (gzipped ~436KB)
- **Main Dependencies**: React 19, Vite 7, Tailwind CSS, Radix UI
- **Build Time**: ~15 seconds
- **Features**: PDF Export, Charts, Thai Localization, Responsive Design

---

🎯 **Ready for Production!** ระบบ Attendance Dashboard พร้อม deploy ไป Cloudflare Pages แล้ว