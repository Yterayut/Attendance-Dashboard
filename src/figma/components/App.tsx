// src/figma/components/App.tsx
import React from 'react';

// เปลือกหน้าจอจาก Figma — อยากเพิ่ม className/โครง wrapper ตาม Figma ได้เลย
export default function FigmaApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111]">
      {/* TODO: วาง header/side-nav จาก Figma ถ้ามี */}
      <div className="mx-auto max-w-5xl p-6">
        {children}
      </div>
    </div>
  );
}
